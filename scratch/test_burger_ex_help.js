/**
 * burger-ex.html [휴식·QR] 탭 도움 요청(가상체험) 동작 검증
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon'
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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: 2, name: '김작업', email: 'worker@test.com', role: 'ROLE_USER' }));
    sessionStorage.setItem('user-id', '2');
  });

  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', async d => { console.log('  [dialog] ' + d.message().replace(/\n/g, ' / ')); await d.accept(); });

  try {
    await page.goto(`${baseUrl}/burger-ex.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    await page.click('.tab-btn[data-tab="panelRest"]');
    await page.waitForTimeout(200);
    assert(await page.isVisible('#btnHelp'), '휴식·QR 탭에 [도움 요청하기] 버튼 노출');
    assert(await page.isHidden('#helpActive'), '초기에는 요청 상태 영역 숨김');

    // 요청
    await page.click('#btnHelp');
    await page.waitForTimeout(300);
    assert(await page.isVisible('#helpActive'), '요청 후 상태 영역 표시');
    assert(await page.isHidden('#helpIdle'), '요청 후 요청 버튼 영역 숨김');
    let st = await page.textContent('#helpStatus');
    assert(st.includes('도움 요청 중'), '상태: 매니저 확인 대기 → ' + st.replace(/\s+/g, ' ').trim().slice(0, 50));
    let logs = await page.textContent('#logList');
    assert(logs.includes('도움 요청 전송'), '업무 로그에 요청 기록');

    // 매니저 확인 응답 시뮬레이션 (4초)
    await page.waitForTimeout(4600);
    st = await page.textContent('#helpStatus');
    assert(st.includes('매니저가 요청을 확인'), '매니저 확인 응답 시뮬레이션 동작');
    logs = await page.textContent('#logList');
    assert(logs.includes('매니저가 도움 요청을 확인'), '업무 로그에 매니저 확인 기록');
    assert(/경과 00:0\d/.test(st), '경과 시간 갱신: ' + st.match(/경과 \d\d:\d\d/)[0]);

    // 완료
    await page.click('#btnHelpDone');
    await page.waitForTimeout(300);
    assert(await page.isVisible('#btnHelp') && await page.isHidden('#helpActive'), '완료 후 초기 상태로 복귀');
    logs = await page.textContent('#logList');
    assert(logs.includes('도움 요청 해결 완료'), '업무 로그에 해결 완료(소요시간) 기록');

    // 재요청 후 취소
    await page.click('#btnHelp');
    await page.waitForTimeout(200);
    assert(await page.isVisible('#helpActive'), '재요청 가능');
    await page.click('#btnHelpCancel');
    await page.waitForTimeout(200);
    assert(await page.isVisible('#btnHelp'), '요청 취소 후 초기 상태 복귀');
    logs = await page.textContent('#logList');
    assert(logs.includes('도움 요청 취소'), '업무 로그에 취소 기록');

    // 취소했으면 매니저 확인 응답이 나중에 뜨지 않아야 함
    await page.waitForTimeout(4500);
    assert(await page.isHidden('#helpActive'), '취소 후 예약된 확인 응답이 상태를 되살리지 않음');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: burger-ex 도움 요청(가상체험) 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
