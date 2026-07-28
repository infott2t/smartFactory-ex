/**
 * 버거팩토리 실제 근무 E2E
 *  bmanager.html 주문 접수 → burger-real.html 조리·완성 → 재고 차감 → 손익 반영
 *  + 현재 인원 현황, 도움 요청(요청→관리자 완료), 재고 입고
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({
      id: 99, name: '최현일', email: 'tt2t2am1118@naver.com', role: 'ROLE_MANAGER'
    }));
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
  const track = (label, page) => {
    page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
    page.on('dialog', async d => { console.log(`  [dialog:${label}] ${d.message().replace(/\n/g, ' / ')}`); await d.accept(); });
  };

  try {
    // ── 관리자 콘솔 ──
    const mgr = await context.newPage();
    track('bmanager', mgr);
    await mgr.goto(`${baseUrl}/bmanager.html`, { waitUntil: 'domcontentloaded' });
    await mgr.waitForTimeout(900);

    assert(await mgr.isHidden('#access-denied'), 'bmanager 매니저 접근 허용');
    for (const tab of ['orders', 'staff', 'stock', 'finance', 'help']) {
      assert(await mgr.$(`li[data-tab="${tab}"]`) !== null, `사이드바 메뉴 존재: ${tab}`);
    }

    // 초기화 후 알림 감시 상태 재설정
    await mgr.evaluate(() => {
      ['burger_order_history', 'burger_inventory', 'burger_inventory_log',
       'burger_staff_status', 'burger_help_requests', 'burger_worker_logs'].forEach(k => localStorage.removeItem(k));
      window.__toasts = [];
      const orig = window.showToast;
      window.showToast = function (t, m) { window.__toasts.push(String(t) + ' | ' + String(m)); return orig(t, m); };
    });
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(300);

    const bunBefore = await mgr.evaluate(() => window.MockData.getBurgerInventoryItem('bun').stock);
    assert(bunBefore === 200, `초기 재고 로드: 버거번 ${bunBefore}개`);

    // 단품 치즈버거 접수 (감자튀김 3분 타이머를 피하기 위해 단품 사용)
    await mgr.selectOption('#new-menu', '치즈버거');
    await mgr.fill('#new-table', '테이블 7');
    await mgr.click('#btn-create-order');
    await mgr.waitForTimeout(400);
    const created = await mgr.evaluate(() => window.MockData.getBurgerOrders());
    assert(created.length === 1 && created[0].status === 'ordered', '주문 1건 접수 (status=ordered)');
    assert(created[0].total === 3000, `단품 금액 계산(관리자 가격표 기준): ${created[0].total}원`);
    const orderNo = created[0].no;

    // ── 작업자 단말 ──
    const wrk = await context.newPage();
    track('burger-real', wrk);
    await wrk.goto(`${baseUrl}/burger-real.html`, { waitUntil: 'domcontentloaded' });
    await wrk.waitForTimeout(900);

    // 체험 요소 제거 확인
    const bodyText = await wrk.textContent('body');
    assert(!bodyText.includes('가상체험'), '가상체험 표기 없음');
    assert(bodyText.includes('실제 근무'), '실제 근무 배지 표시');
    assert(await wrk.$('#btnFinish') === null, '체험 완료 버튼 제거');
    assert(await wrk.$('#btnSkip') === null, '3분 건너뛰기(데모) 버튼 제거');
    assert(await wrk.$('#progressBar') === null, '3분 타이머 진행바 제거');
    assert(/^\d\d:\d\d:\d\d$/.test((await wrk.textContent('#timerDisplay')).trim()),
      '헤더가 누적 근무시간 표시: ' + (await wrk.textContent('#timerDisplay')).trim());

    // 주문 수신 → 조리 → 완성
    assert((await wrk.textContent('#orderList')).includes('치즈버거'), '관리자가 접수한 주문이 작업자 단말에 표시');
    await wrk.click('#orderList button:has-text("조리 시작")');
    await wrk.waitForTimeout(400);
    let o = await wrk.evaluate(() => window.MockData.getBurgerOrders()[0]);
    assert(o.status === 'cooking' && o.assignedName === '최현일', `조리 착수 반영 (담당 ${o.assignedName})`);
    assert(await wrk.isVisible('#cookArea'), '조리 화면 표시');

    await wrk.click('#burgerDoneWrap button');           // 조립 완료
    await wrk.waitForTimeout(250);
    assert(await wrk.isEnabled('#btnComplete'), '조립 완료 후 [주문 완성] 활성화');
    await wrk.click('#btnComplete');
    await wrk.waitForTimeout(500);

    o = await wrk.evaluate(() => window.MockData.getBurgerOrders()[0]);
    assert(o.status === 'done', '주문 완성 처리');
    assert(o.materialCost > 0, `자재원가 기록: ${o.materialCost}원`);
    const bunAfter = await wrk.evaluate(() => window.MockData.getBurgerInventoryItem('bun').stock);
    assert(bunAfter === bunBefore - 1, `재고 자동 차감: 버거번 ${bunBefore} → ${bunAfter}`);
    const cheeseAfter = await wrk.evaluate(() => window.MockData.getBurgerInventoryItem('cheese').stock);
    assert(cheeseAfter === 179, `BOM대로 치즈 차감: ${cheeseAfter}장`);

    // ── 관리자: KPI · 손익 · 재고 · 인원 반영 ──
    await mgr.waitForTimeout(3500);
    assert((await mgr.textContent('#kpi-done')).includes('1'), '관리자 KPI 오늘 완성 1건');
    assert((await mgr.textContent('#kpi-sales')).includes('3,000'), '관리자 KPI 오늘 매출 ₩3,000');

    await mgr.click('li[data-tab="finance"]');
    await mgr.waitForTimeout(400);
    const finText = await mgr.textContent('#fin-cards');
    assert(finText.includes('3,000'), '손익관리 매출 반영');
    assert((await mgr.textContent('#fin-tbody')).includes(orderNo), '완성 주문 내역에 주문번호 표시');
    assert((await mgr.textContent('#fin-bars')).includes('치즈버거'), '메뉴별 판매 그래프 표시');

    await mgr.click('li[data-tab="stock"]');
    await mgr.waitForTimeout(400);
    assert((await mgr.textContent('#stock-log-tbody')).includes('소진'), '입출고 이력에 소진 기록');
    const bunRestockBefore = await mgr.evaluate(() => window.MockData.getBurgerInventoryItem('bun').stock);
    await mgr.fill('#in-bun', '50');
    await mgr.click('#stock-tbody button:has-text("입고")');
    await mgr.waitForTimeout(500);
    const bunRestocked = await mgr.evaluate(() => window.MockData.getBurgerInventoryItem('bun').stock);
    assert(bunRestocked === bunRestockBefore + 50, `입고 처리: ${bunRestockBefore} → ${bunRestocked}`);
    assert((await mgr.textContent('#stock-log-tbody')).includes('입고'), '입출고 이력에 입고 기록');

    await mgr.click('li[data-tab="staff"]');
    await mgr.waitForTimeout(400);
    const staffText = await mgr.textContent('#staff-cards');
    assert(staffText.includes('최현일'), '현재 인원에 근무자 표시');
    assert(staffText.includes('근무중'), '근무 상태 표시');
    assert((await mgr.textContent('#staff-tbody')).includes('최현일'), '근무 상세 표에 근무자 표시');

    // ── 도움 요청 ──
    await mgr.evaluate(() => { window.__toasts = []; });
    await wrk.click('.tab-btn[data-tab="panelRest"]');
    await wrk.waitForTimeout(250);
    await wrk.click('#btnHelp');
    await wrk.waitForTimeout(400);
    const pend = await wrk.evaluate(() => window.MockData.getBurgerHelpPending());
    assert(pend.length === 1 && pend[0].workerName === '최현일', '도움 요청 1건 접수');
    assert((await wrk.textContent('#helpActive')).includes('관리자 확인 대기'), '작업자 화면 요청 중 상태');

    await mgr.waitForTimeout(3600);
    const toasts = await mgr.evaluate(() => window.__toasts || []);
    assert(toasts.some(t => t.includes('도움 요청')), '관리자 콘솔 도움 요청 알림: ' + (toasts.find(t => t.includes('도움 요청')) || ''));
    assert((await mgr.textContent('#badge-help')).trim() === '1', '사이드바 도움 요청 배지 1건');

    await mgr.click('li[data-tab="help"]');
    await mgr.waitForTimeout(350);
    assert((await mgr.textContent('#help-list')).includes('최현일'), '도움 요청 탭에 요청 카드 표시');
    await mgr.click('#help-list button:has-text("완료")');
    await mgr.waitForTimeout(500);
    const resolved = await mgr.evaluate(() => window.MockData.getBurgerHelpRequests()[0]);
    assert(resolved.status === 'resolved' && String(resolved.resolvedBy).includes('매니저'),
      `완료 처리 기록 (${resolved.resolvedBy}, ${resolved.durationSec}초)`);
    assert((await mgr.textContent('#help-log-tbody')).includes('해결 완료'), '도움 요청 로그 테이블 기록');

    await wrk.waitForTimeout(1800);
    assert((await wrk.textContent('#panelRest')).includes('도움 요청하기'), '작업자 화면 요청 전 상태로 복귀');
    assert((await wrk.textContent('#logList')).includes('완료 처리'), '작업자 로그에 관리자 완료 처리 기록');

    // 작업자 활동 로그가 관리자 대시보드에 공유되는지
    await mgr.click('li[data-tab="dashboard"]');
    await mgr.waitForTimeout(400);
    const dashLogs = await mgr.textContent('#dash-logs');
    assert(dashLogs.includes('도움요청'), '관리자 대시보드에 작업자 활동 로그 공유');

    // 주문 취소 경로
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(250);
    await mgr.selectOption('#new-menu', '감자튀김');
    await mgr.click('#btn-create-order');
    await mgr.waitForTimeout(350);
    await mgr.selectOption('#order-filter', 'active');
    await mgr.waitForTimeout(250);
    await mgr.click('#orders-list button:has-text("취소")');
    await mgr.waitForTimeout(400);
    const cancelled = await mgr.evaluate(() => window.MockData.getBurgerOrders().filter(o => o.status === 'cancelled'));
    assert(cancelled.length === 1, '주문 취소 처리');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: burger-real ↔ bmanager 실제 운영 플로우 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
