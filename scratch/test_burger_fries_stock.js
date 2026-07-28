/**
 * burger-real.html 감자튀김: [상품 있음] 으로 튀김 없이 즉시 완료 / [튀기기] 는 3분 타이머
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon'
};

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  console.log('  ok - ' + msg);
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(root, safePath === path.sep ? 'index.html' : safePath);
      if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '최현일', email: 'tt2t2am1118@naver.com', role: 'ROLE_MANAGER' }));
    sessionStorage.setItem('user-id', '99');
  });

  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', async d => { await d.accept(); });

  try {
    await page.goto(`${baseUrl}/burger-real.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // 세트 주문 2건 생성 (하나는 상품 있음, 하나는 튀기기)
    await page.evaluate(() => {
      localStorage.removeItem('burger_order_history');
      window.MockData.createBurgerOrder({ menu: '치즈버거', isSet: true, drink: '콜라', tableId: '테이블 1' });
      window.MockData.createBurgerOrder({ menu: '감자튀김', tableId: '테이블 2' });
    });
    await page.waitForTimeout(3300);

    // ── 1) 세트 주문: 상품 있음으로 감자튀김 즉시 완료 ──
    await page.click('#orderList button:has-text("조리 시작")');
    await page.waitForTimeout(400);
    assert(await page.isVisible('#btnFriesStock'), '조리 화면에 [상품 있음] 버튼 노출');
    assert(await page.isVisible('#btnFries'), '[튀기기] 버튼도 함께 노출');
    assert((await page.textContent('#sideTasks')).includes('튀겨둔 감자'), '튀김 완료분 안내 문구 표시');

    await page.click('#btnFriesStock');
    await page.waitForTimeout(400);
    assert(await page.evaluate(() => document.getElementById('friesStatus').textContent).then(t => t.includes('튀겨둔 감자 사용')),
      '상품 있음 선택 시 즉시 완료 처리 (튀김 대기 없음)');
    assert(await page.$('#btnFries') === null, '완료 후 튀기기 버튼 사라짐');
    assert((await page.textContent('#logList')).includes('튀겨둔 상품 사용'), '업무 로그에 기록');

    // 나머지 작업 마무리 후 주문 완성
    await page.click('#burgerDoneWrap button');
    await page.waitForTimeout(200);
    await page.click('#sideTasks button:has-text("담기")');
    await page.waitForTimeout(300);
    assert(await page.isEnabled('#btnComplete'), '감자튀김을 튀기지 않고도 주문 완성 가능');
    await page.click('#btnComplete');
    await page.waitForTimeout(500);
    const done = await page.evaluate(() => window.MockData.getBurgerOrders().filter(o => o.status === 'done')[0]);
    assert(done && done.friesFromStock === true, '주문에 튀김 완료분 사용 이력 기록');

    // ── 2) 감자튀김 단품: 튀기기는 3분 타이머 유지 ──
    await page.click('.tab-btn[data-tab="panelOrder"]');
    await page.waitForTimeout(300);
    await page.click('#orderList button:has-text("조리 시작")');
    await page.waitForTimeout(400);
    await page.click('#btnFries');
    await page.waitForTimeout(1500);
    const status = await page.textContent('#friesStatus');
    assert(status.includes('튀기는 중') && /0[12]:5\d/.test(status), '튀기기 선택 시 3분 타이머 동작: ' + status.trim());
    assert(!(await page.isEnabled('#btnFriesStock')), '튀기는 중에는 [상품 있음] 비활성');

    // 매뉴얼 안내
    await page.click('.tab-btn[data-tab="panelManual"]');
    await page.waitForTimeout(300);
    assert((await page.textContent('#manualAccordions')).includes('상품 있음'), '매뉴얼 감자튀김 항목에 상품 있음 안내 추가');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: 감자튀김 [상품 있음] 경로 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
