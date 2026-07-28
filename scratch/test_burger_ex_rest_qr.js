/**
 * burger-ex.html 휴식·QR: 퇴실 QR → 휴식(초단위 집계) → 입장 QR → 복귀
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
  page.on('dialog', async d => { await d.accept(); });

  try {
    await page.goto(`${baseUrl}/burger-ex.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.click('.tab-btn[data-tab="panelRest"]');
    await page.waitForTimeout(250);

    // 기존 요소 제거 확인
    assert(await page.$('#btnRest') === null, '휴식 시작/종료 버튼(btnRest) 제거됨');
    assert(await page.$('#qrStatus') === null, 'QR 체크인/아웃 표시(qrStatus) 제거됨');
    assert(!(await page.textContent('#panelRest')).includes('체크인'), '휴식·QR 탭에 체크인/아웃 문구 없음');

    // 휴식 전 상태
    assert((await page.textContent('#qrTitle')).includes('퇴실 QR'), '초기 QR 안내: 퇴실 QR 스캔');
    assert((await page.textContent('#restGuide')).includes('작업장 밖'), '퇴실 안내 문구 표시');
    assert(await page.isHidden('#restLive'), '휴식 타이머 패널 숨김');
    assert(!(await page.evaluate(() => document.getElementById('restBanner').classList.contains('active'))),
      '상단 휴식 배너 비활성');

    // 퇴실 QR 스캔 → 휴식 시작
    await page.click('#qrSim');
    await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.getElementById('restBanner').classList.contains('active')),
      '퇴실 QR 스캔 후 상단 휴식 배너 활성');
    assert((await page.textContent('#qrTitle')).includes('입장 QR'), 'QR 안내가 입장 QR로 전환');
    assert((await page.textContent('#restGuide')).includes('입장 QR'), '복귀 안내 문구로 전환');
    assert(await page.isVisible('#restLive'), '휴식 시간 패널 표시');
    let logs = await page.textContent('#logList');
    assert(logs.includes('퇴실 QR 스캔') && logs.includes('휴식 시작'), '로그: 퇴실 QR 스캔 · 휴식 시작');

    // 초 단위 증가 확인
    const t1 = await page.textContent('#restLiveTimer');
    await page.waitForTimeout(2600);
    const t2 = await page.textContent('#restLiveTimer');
    const toSec = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
    assert(/^\d\d:\d\d$/.test(t2), '휴식 타이머 mm:ss 형식: ' + t2);
    assert(toSec(t2) - toSec(t1) >= 2, `휴식 시간이 초 단위로 증가 (${t1} → ${t2})`);
    assert((await page.textContent('#restBannerTimer')) === t2, '상단 배너 타이머도 동일하게 갱신');

    await page.click('.tab-btn[data-tab="panelMore"]');
    await page.waitForTimeout(1100);
    const statRest = await page.textContent('#statRest');
    assert(/^\d\d:\d\d$/.test(statRest) && toSec(statRest) >= 2, '더보기 휴식시간도 초 단위 표시: ' + statRest);

    // 입장 QR 스캔 → 휴식 종료
    await page.click('.tab-btn[data-tab="panelRest"]');
    await page.waitForTimeout(150);
    await page.click('#qrSim');
    await page.waitForTimeout(300);
    assert(!(await page.evaluate(() => document.getElementById('restBanner').classList.contains('active'))),
      '입장 QR 스캔 후 휴식 배너 해제');
    assert((await page.textContent('#qrTitle')).includes('퇴실 QR'), 'QR 안내가 다시 퇴실 QR로 복귀');
    assert(await page.isHidden('#restLive'), '휴식 타이머 패널 숨김으로 복귀');
    logs = await page.textContent('#logList');
    assert(logs.includes('입장 QR 스캔') && logs.includes('휴식 종료'), '로그: 입장 QR 스캔 · 휴식 종료(소요시간)');

    // 누적 유지 확인
    const accum = await page.evaluate(() => document.getElementById('restLiveTimer').textContent);
    assert(toSec(accum) >= 2, '휴식 종료 후에도 누적 휴식시간 유지: ' + accum);

    // 도움 요청 기능은 그대로 동작
    await page.click('#btnHelp');
    await page.waitForTimeout(250);
    assert(await page.isVisible('#helpActive'), '도움 요청 기능 정상 유지');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: burger-ex 휴식은 QR 스캔으로만 시작/종료되며 초 단위로 집계됨');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
