/**
 * bmanager.html 메뉴·가격: 3초 폴링이 입력 중인 텍스트필드를 되돌리지 않는지 검증
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '최현일', email: 'tt2t2am1118@naver.com', role: 'ROLE_MANAGER' }));
    sessionStorage.setItem('user-id', '99');
    class FakeAudioContext {
      constructor() { this.currentTime = 0; this.destination = {}; }
      createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });

  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', async d => { await d.accept(); });

  try {
    await page.goto(`${baseUrl}/bmanager.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.evaluate(() => localStorage.removeItem('burger_menu_prices'));
    await page.click('li[data-tab="menu"]');
    await page.waitForTimeout(400);

    // 입력 후 폴링 주기(3초)를 넘겨도 값이 유지되어야 한다
    await page.fill('#pt-햄버거', '3500');
    await page.fill('#ps-햄버거', '2500');
    await page.waitForTimeout(4200);
    assert(await page.inputValue('#pt-햄버거') === '3500', '4초 후에도 세트가 입력값 유지 (3500)');
    assert(await page.inputValue('#ps-햄버거') === '2500', '4초 후에도 단품가 입력값 유지 (2500)');

    // 다른 메뉴 입력도 동시에 유지
    await page.fill('#pt-치즈버거', '4800');
    await page.waitForTimeout(3600);
    assert(await page.inputValue('#pt-치즈버거') === '4800', '다른 메뉴 입력도 유지 (4800)');
    assert(await page.inputValue('#pt-햄버거') === '3500', '먼저 입력한 값도 그대로 유지');

    // 저장 → 실제 반영
    await page.click('#price-tbody tr:has-text("햄버거") button:has-text("저장")');
    await page.waitForTimeout(500);
    const saved = await page.evaluate(() => window.MockData.getBurgerMenuPrices()['햄버거']);
    assert(saved.single === 2500 && saved.set === 3500, `저장 반영: 단품 ${saved.single} / 세트 ${saved.set}`);
    assert((await page.textContent('#price-preview')).includes('3,500'), '미리보기 카드에 변경가 반영');
    await page.waitForTimeout(3500);
    assert(await page.inputValue('#pt-햄버거') === '3500', '저장 후 폴링에도 값 유지');

    // 기본가 복원
    await page.click('button:has-text("기본가 복원")');
    await page.waitForTimeout(600);
    const reset = await page.evaluate(() => window.MockData.getBurgerMenuPrices()['햄버거']);
    assert(reset.single === 2000 && reset.set === 3000, `기본가 복원: 단품 ${reset.single} / 세트 ${reset.set}`);
    assert(await page.inputValue('#pt-햄버거') === '3000', '복원 시에는 표가 기본값으로 새로 그려짐');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: 메뉴·가격 입력이 폴링에 덮어써지지 않음');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
