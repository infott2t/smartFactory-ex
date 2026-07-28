/**
 * 버거 고객 주문 E2E
 *  bmanager 가격 설정 → work_detail 상품카드 → burger_order 상세/세트·단품 → 정산금액 결제
 *  → bmanager 주문관리(조리/완성) → 마이페이지·탐색 나의 쇼핑 · 정산 로그 → 수령/취소
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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jfif': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.otf': 'font/otf'
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
    page.on('dialog', async d => { console.log(`  [dialog:${label}] ${d.message().replace(/\n/g, ' / ').slice(0, 90)}`); await d.accept(); });
  };

  try {
    // ── 1) 관리자 콘솔: 초기화 + 가격 설정 ──
    const mgr = await context.newPage();
    track('bmanager', mgr);
    await mgr.goto(`${baseUrl}/bmanager.html`, { waitUntil: 'domcontentloaded' });
    await mgr.waitForTimeout(900);
    await mgr.evaluate(() => {
      ['burger_order_history', 'burger_inventory', 'burger_inventory_log', 'burger_staff_status',
       'burger_help_requests', 'burger_worker_logs', 'burger_menu_prices',
       'kimp_shop_history', 'kimp_settlement_transactions'].forEach(k => localStorage.removeItem(k));
      const nid = window.MockData.normalizeSettlementUserId('99');
      localStorage.removeItem('user_settlement_log_' + nid);
      window.MockData.setUserInitialSettlementBalance('99', 50000);
    });
    await mgr.reload({ waitUntil: 'domcontentloaded' });
    await mgr.waitForTimeout(800);

    const bal0 = await mgr.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(bal0 === 50000, `정산금액 초기값 ${bal0}원`);

    await mgr.click('li[data-tab="menu"]');
    await mgr.waitForTimeout(350);
    const priceRows = await mgr.textContent('#price-tbody');
    ['치즈버거', '불고기버거', '햄버거', '새우버거'].forEach(m =>
      assert(priceRows.includes(m), `메뉴·가격 관리에 ${m} 표시`));
    const defaults = await mgr.evaluate(() => window.MockData.getBurgerMenuPrices());
    assert(defaults['치즈버거'].set === 4000 && defaults['불고기버거'].set === 4000
      && defaults['햄버거'].set === 3000 && defaults['새우버거'].set === 4000,
      `기본 세트가: 치즈 ${defaults['치즈버거'].set} / 불고기 ${defaults['불고기버거'].set} / 햄버거 ${defaults['햄버거'].set} / 새우 ${defaults['새우버거'].set}`);

    // 가격 변경 (치즈버거 세트 4000 → 4500)
    await mgr.fill('#pt-치즈버거', '4500');
    await mgr.click('#price-tbody tr:has-text("치즈버거") button:has-text("저장")');
    await mgr.waitForTimeout(400);
    const changed = await mgr.evaluate(() => window.MockData.getBurgerMenuPrices()['치즈버거'].set);
    assert(changed === 4500, `관리자 가격 변경 반영: 치즈버거 세트 ${changed}원`);

    // ── 2) work_detail.html?id=7 상품 카드 ──
    const wd = await context.newPage();
    track('work_detail', wd);
    await wd.goto(`${baseUrl}/work_detail.html?id=7`, { waitUntil: 'domcontentloaded' });
    await wd.waitForTimeout(1200);
    const wdText = await wd.textContent('#product-list-container');
    ['치즈버거 세트', '불고기버거 세트', '햄버거 세트', '새우버거 세트'].forEach(n =>
      assert(wdText.includes(n), `상품 카드 표시: ${n}`));
    assert(wdText.includes('세트 4,500원'), '변경된 치즈버거 세트가 상품 카드에 반영');
    assert(wdText.includes('세트 3,000원'), '햄버거 세트 3,000원 표시');
    const hrefs = await wd.$$eval('#product-list-container a', els => els.map(e => e.getAttribute('href')));
    assert(hrefs.every(h => h.startsWith('burger_order.html?menu=')), '상품 클릭 시 주문 상세 페이지로 이동: ' + hrefs[0]);
    assert(hrefs.some(h => h.includes('type=set')), '기본 선택이 세트(type=set)');
    await wd.close();

    // ── 3) 주문 상세 페이지 (햄버거 세트 선택 상태) ──
    const shop = await context.newPage();
    track('burger_order', shop);
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('햄버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(900);
    assert((await shop.textContent('#p-name')).includes('햄버거 세트'), '햄버거 세트가 선택된 상태로 진입');
    assert((await shop.textContent('#p-price')).includes('3,000'), '세트 가격 ₩3,000 표시');
    assert((await shop.getAttribute('#p-img', 'src')).includes('burger'), '큰 썸네일 표시');
    assert(await shop.evaluate(() => document.getElementById('opt-set').classList.contains('active')), '세트 옵션이 선택되어 있음');
    assert((await shop.textContent('#d-components')).includes('감자튀김'), '상품 상세: 세트 구성 표시');
    assert((await shop.textContent('#d-allergy')).length > 1, '상품 상세: 알레르기 정보 표시');
    assert((await shop.$$('#other-menus a')).length === 4, '다른 메뉴 4종 링크 표시');

    await shop.click('#opt-single');
    await shop.waitForTimeout(200);
    assert((await shop.textContent('#bar-total')).includes('2,000'), '단품 선택 시 ₩2,000 으로 변경');
    await shop.click('#opt-set');
    await shop.waitForTimeout(200);
    assert((await shop.textContent('#bar-total')).includes('3,000'), '세트 재선택 시 ₩3,000');

    // ── 4) 정산금액 결제 ──
    await shop.click('#btn-order');
    await shop.waitForTimeout(300);
    assert(await shop.isVisible('#confirm-modal'), '주문 확인 모달 표시');
    await shop.click('#confirm-modal button:has-text("결제 진행")');
    await shop.waitForTimeout(300);
    assert(await shop.isVisible('#pay-modal'), '결제 모달 표시');
    assert(await shop.isEnabled('.pay-choice[data-method="settlement"]'), '정산금액 결제 선택 가능 (잔액 충분)');
    await shop.click('.pay-choice[data-method="settlement"]');
    await shop.click('#pay-submit');
    await shop.waitForTimeout(700);

    let order = await shop.evaluate(() => window.MockData.getBurgerOrders().filter(o => o.shopRecordId)[0]);
    assert(order && order.status === 'ordered', '주문이 주방(bmanager) 대기 목록으로 접수됨');
    assert(order.paymentMethod === 'online_settlement' && order.total === 3000,
      `정산금액 결제 · 금액 ${order.total}원`);
    const bal1 = await shop.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(bal1 === 47000, `나의 정산금액 차감: 50,000 → ${bal1.toLocaleString()}`);
    const logs1 = await shop.evaluate(() => window.MockData.getSettlementLogs('99'));
    assert(logs1.some(l => l.amount === -3000), '정산 로그에 -3,000원 결제 기록');
    const shopRec = await shop.evaluate(() => window.MockData.getShopHistoryRaw()[0]);
    assert(shopRec && shopRec.productName === '햄버거 세트' && shopRec.workId === 7,
      `나의 쇼핑 미러 레코드 생성: ${shopRec.productName}`);
    assert((await shop.textContent('#os-body')).includes(order.no), '주문 현황 카드에 주문번호 표시');
    assert((await shop.textContent('#os-actions')).includes('주문 취소'), '조리 전에는 주문 취소 가능');

    // ── 5) 관리자 주문관리 → 조리 지시 ──
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(3600);
    const cardText = await mgr.textContent('#orders-list');
    assert(cardText.includes('햄버거') && cardText.includes('세트'), '관리자 콘솔에 고객 주문 표시');
    assert(cardText.includes('정산금액 결제') && cardText.includes('최현일'), '결제수단·주문자 표시');
    await mgr.click('#orders-list button:has-text("조리 지시")');
    await mgr.waitForTimeout(600);
    order = await mgr.evaluate(() => window.MockData.getBurgerOrders().filter(o => o.shopRecordId)[0]);
    assert(order.status === 'cooking', '조리 지시 반영');

    await shop.waitForTimeout(2800);
    assert((await shop.textContent('#os-body')).includes('취소가 불가'), '고객 화면: 조리 시작 후 취소 불가 안내');
    assert(!(await shop.textContent('#os-actions')).includes('주문 취소'), '조리 중에는 취소 버튼 없음');
    const midRec = await shop.evaluate(() => window.MockData.getShopHistoryRaw()[0]);
    assert(midRec.kitchenStatus === 'preparing', '나의 쇼핑 상태가 조리 중으로 동기화');

    // ── 6) 완성 처리 → 알림 → 수령 ──
    await mgr.click('#orders-list button:has-text("완성 처리")');
    await mgr.waitForTimeout(700);
    await shop.waitForTimeout(2800);
    assert((await shop.textContent('#os-pill')).includes('준비 완료'), '고객 화면: 준비 완료 상태');
    assert((await shop.textContent('#os-body')).includes('조리가 완료'), '준비 완료 알림 문구 표시');
    assert((await shop.textContent('#toast-wrap')).includes('조리가 완료'), '준비 완료 토스트 알림');
    const readyRec = await shop.evaluate(() => window.MockData.getShopHistoryRaw()[0]);
    assert(readyRec.kitchenStatus === 'ready', '나의 쇼핑 상태 준비 완료로 동기화');

    // 마이페이지 · 탐색 · 정산 로그 확인
    const my = await context.newPage();
    track('mypage2', my);
    await my.goto(`${baseUrl}/mypage2.html`, { waitUntil: 'domcontentloaded' });
    await my.waitForTimeout(1400);
    const myShop = await my.textContent('#shop-history-container');
    assert(myShop.includes('햄버거 세트'), '마이페이지 나의 쇼핑에 주문 표시');
    assert(myShop.includes('준비 완료'), '마이페이지에 준비 완료 배지');
    const myBal = await my.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(myBal === 47000, `마이페이지 기준 정산금액 ${myBal.toLocaleString()}원`);
    await my.close();

    const ex2 = await context.newPage();
    track('explore2', ex2);
    await ex2.goto(`${baseUrl}/explore2.html`, { waitUntil: 'domcontentloaded' });
    await ex2.waitForTimeout(1200);
    await ex2.click('.tab-item[data-target="shopping"]');
    await ex2.waitForTimeout(700);
    assert((await ex2.textContent('body')).includes('햄버거 세트'), 'explore2 나의 쇼핑에 주문 표시');
    await ex2.close();

    const slog = await context.newPage();
    track('settlement_log', slog);
    await slog.goto(`${baseUrl}/settlement_log.html`, { waitUntil: 'domcontentloaded' });
    await slog.waitForTimeout(1200);
    const slogText = await slog.textContent('body');
    assert(slogText.includes('햄버거 세트') || slogText.includes('BurgerQueen'),
      'settlement_log.html 에 정산 결제 내역 표시');
    assert(slogText.includes('3,000'), '정산 로그에 결제 금액 표시');
    await slog.close();

    // 수령 완료
    await shop.click('#os-actions button:has-text("수령 완료")');
    await shop.waitForTimeout(800);
    order = await shop.evaluate(() => window.MockData.getBurgerOrders().filter(o => o.shopRecordId)[0]);
    assert(order.status === 'received', '수령 완료 처리');
    const doneRec = await shop.evaluate(() => window.MockData.getShopHistoryRaw()[0]);
    assert(doneRec.status === 'completed', '나의 쇼핑 상태 수령 완료');

    // ── 7) 주문 취소 → 정산금액 복구 ──
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('치즈버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(900);
    assert((await shop.textContent('#p-price')).includes('4,500'), '변경된 치즈버거 세트 가격이 주문 화면에 반영');
    await shop.click('#btn-order');
    await shop.waitForTimeout(300);
    await shop.click('#confirm-modal button:has-text("결제 진행")');
    await shop.waitForTimeout(300);
    await shop.click('.pay-choice[data-method="settlement"]');
    await shop.click('#pay-submit');
    await shop.waitForTimeout(700);
    const bal2 = await shop.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(bal2 === 42500, `두 번째 주문 결제 후 정산금액 ${bal2.toLocaleString()}원`);

    await shop.click('#os-actions button:has-text("주문 취소")');
    await shop.waitForTimeout(900);
    const cancelled = await shop.evaluate(() => window.MockData.getBurgerOrders()
      .filter(o => o.status === 'cancelled' && o.shopRecordId));
    assert(cancelled.length === 1, '주문 취소 처리 (주방 주문)');
    const bal3 = await shop.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(bal3 === 47000, `취소 후 정산금액 복구: ${bal3.toLocaleString()}원`);

    // ── 8) 정산금액 부족 → 현장 결제만 ──
    await shop.evaluate(() => window.MockData.setUserInitialSettlementBalance('99', 1000));
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('새우버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(900);
    assert((await shop.textContent('#pay-hint')).includes('현장 결제만'), '잔액 부족 시 현장 결제만 안내');
    await shop.click('#btn-order');
    await shop.waitForTimeout(250);
    await shop.click('#confirm-modal button:has-text("결제 진행")');
    await shop.waitForTimeout(300);
    assert(!(await shop.isEnabled('.pay-choice[data-method="settlement"]')), '정산금액 결제 선택 불가');
    assert(await shop.isEnabled('.pay-choice[data-method="offline"]'), '현장 결제는 선택 가능');
    const balBeforeOffline = await shop.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    await shop.click('.pay-choice[data-method="offline"]');
    await shop.click('#pay-submit');
    await shop.waitForTimeout(700);
    const offlineOrder = await shop.evaluate(() => window.MockData.getBurgerOrders()
      .filter(o => o.paymentMethod === 'offline')[0]);
    assert(offlineOrder && offlineOrder.status === 'ordered', '현장 결제 주문도 주방으로 접수');
    const balOffline = await shop.evaluate(() => window.MockData.getUserSettlementBalance('99'));
    assert(balOffline === balBeforeOffline, `현장 결제는 정산금액 차감 없음 (${balBeforeOffline} → ${balOffline})`);

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: 버거 고객 주문 · 결제 · 주문관리 연계 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
