/**
 * burger_order.html 장바구니 다중 메뉴 일괄 결제 E2E
 * - 메뉴 페이지를 오가며 장바구니 누적
 * - 동일 항목 수량 변경/합계
 * - 1회 결제 → 통합 쇼핑 이력 1건 + 메뉴별 주방 주문 N건
 * - 통합 취소/정산 복구
 * - 일부 조리 시작 시 통합 취소 잠금, 전체 완성 후 통합 수령
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jfif': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon', '.otf': 'font/otf'
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
    page.on('dialog', async d => {
      console.log(`  [dialog:${label}] ${d.message().replace(/\n/g, ' / ').slice(0, 110)}`);
      await d.accept();
    });
  };

  try {
    const shop = await context.newPage();
    track('burger_order', shop);
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('햄버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(900);

    // 데이터 초기화 및 가격 기본값
    await shop.evaluate(() => {
      const uid = '99';
      const nid = window.MockData.normalizeSettlementUserId(uid);
      ['burger_order_history', 'burger_inventory', 'burger_inventory_log', 'burger_help_requests',
       'burger_worker_logs', 'burger_menu_prices', 'kimp_shop_history', 'kimp_settlement_transactions',
       'burger_cart_' + uid, 'user_settlement_log_' + nid].forEach(k => localStorage.removeItem(k));
      window.MockData.setUserInitialSettlementBalance(uid, 50000);
    });
    await shop.reload({ waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(700);

    // ── 1) 햄버거 세트 2개 담기 ──
    await shop.click('.qty button[aria-label="수량 증가"]');
    assert((await shop.textContent('#qty-val')).trim() === '2', '현재 상품 수량 2개 선택');
    await shop.click('#btn-add-cart');
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#cart-count-pill')).includes('2개'), '햄버거 세트 2개 장바구니 담기');
    assert((await shop.textContent('#cart-total')).includes('6,000'), '장바구니 합계 6,000원');

    // 페이지를 이동해도 카트 유지
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('치즈버거')}&type=single`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(600);
    assert((await shop.textContent('#cart-count-pill')).includes('2개'), '상품 페이지 이동 후에도 장바구니 유지');
    assert((await shop.textContent('#top-cart-count')).trim() === '2', '상단 배지에 기존 수량 표시');
    await shop.click('#top-cart-btn');
    assert(await shop.isVisible('#cart-modal'), '상단 장바구니 버튼으로 내역 열기');
    assert((await shop.textContent('#modal-cart-body')).includes('햄버거 세트'), '열린 창에서 기존 품목 확인');
    await shop.click('#cart-modal .modal-x');
    await shop.click('#btn-add-cart');
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#cart-count-pill')).includes('3개'), '치즈버거 단품 1개 추가');
    assert((await shop.textContent('#cart-total')).includes('9,000'), '서로 다른 메뉴 합계 9,000원');

    // 세 번째 메뉴 추가
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('새우버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(600);
    await shop.click('#btn-add-cart');
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#cart-count-pill')).includes('4개'), '새우버거 세트 1개 추가');
    assert((await shop.textContent('#cart-total')).includes('13,000'), '3종 4개 합계 13,000원');
    assert(await shop.isVisible('#cart-modal'), '담기 직후 장바구니 상세 창 자동 표시');
    assert((await shop.textContent('#modal-cart-body')).includes('햄버거 세트')
      && (await shop.textContent('#modal-cart-body')).includes('치즈버거 단품')
      && (await shop.textContent('#modal-cart-body')).includes('새우버거 세트'),
      '상세 창에서 담긴 품목 3종 확인');
    assert((await shop.textContent('#top-cart-count')).trim() === '4', '상단 장바구니 수량 배지 4');

    // 상세 창에서 개별 삭제 후 다시 담기
    const shrimpLine = shop.locator('#modal-cart-body .cart-line').filter({ hasText: '새우버거 세트' });
    await shrimpLine.locator('button:has-text("삭제")').click();
    await shop.waitForTimeout(250);
    assert(!(await shop.textContent('#modal-cart-body')).includes('새우버거 세트'), '상세 창에서 개별 상품 삭제');
    assert((await shop.textContent('#modal-cart-total')).includes('9,000'), '삭제 후 합계 9,000원');
    assert((await shop.textContent('#top-cart-count')).trim() === '3', '삭제 후 상단 배지 3');
    await shop.click('#cart-modal .modal-x');
    await shop.click('#btn-add-cart');
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#modal-cart-total')).includes('13,000'), '삭제한 상품 다시 담기');

    // 치즈버거 단품 수량 +1 (총 5개, 16,000원)
    const cheeseLine = shop.locator('#modal-cart-body .cart-line').filter({ hasText: '치즈버거 단품' });
    await cheeseLine.locator('.cart-qty button').nth(1).click();
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#cart-count-pill')).includes('5개'), '장바구니에서 수량 변경: 총 5개');
    assert((await shop.textContent('#cart-total')).includes('16,000'), '수량 변경 후 합계 16,000원');

    const cartStored = await shop.evaluate(() => window.MockData.getBurgerCartSummary('99'));
    assert(cartStored.lines.length === 3 && cartStored.count === 5 && cartStored.total === 16000,
      `저장된 카트: ${cartStored.lines.length}종 / ${cartStored.count}개 / ${cartStored.total}원`);

    // ── 2) 장바구니 전체를 정산금액으로 한 번 결제 ──
    await shop.click('#modal-cart-foot button:has-text("장바구니 전체 결제")');
    await shop.waitForTimeout(250);
    const confirmText = await shop.textContent('#confirm-body');
    assert(confirmText.includes('햄버거 세트') && confirmText.includes('치즈버거 단품') && confirmText.includes('새우버거 세트'),
      '결제 확인에 장바구니 3종 모두 표시');
    assert(confirmText.includes('16,000'), '통합 결제금액 16,000원 표시');
    await shop.click('#confirm-modal button:has-text("결제 진행")');
    await shop.waitForTimeout(250);
    await shop.click('.pay-choice[data-method="settlement"]');
    await shop.click('#pay-submit');
    await shop.waitForTimeout(800);

    const checkout = await shop.evaluate(() => ({
      orders: window.MockData.getBurgerOrders(),
      cart: window.MockData.getBurgerCartSummary('99'),
      shop: window.MockData.getShopHistoryRaw(),
      logs: window.MockData.getSettlementLogs('99'),
      balance: window.MockData.getUserSettlementBalance('99')
    }));
    assert(checkout.orders.length === 3, '메뉴 3종이 주방 주문 3건으로 분리 접수');
    assert(new Set(checkout.orders.map(o => o.groupNo)).size === 1, '주방 주문 3건이 동일한 통합 주문번호 공유');
    assert(checkout.orders.reduce((s, o) => s + o.qty, 0) === 5, '주방 주문 총수량 5개');
    assert(checkout.orders.reduce((s, o) => s + o.total, 0) === 16000, '주방 주문 합계 16,000원');
    assert(checkout.shop.length === 1 && checkout.shop[0].items.length === 3,
      '나의 쇼핑에는 통합 주문 1건(상세 3종) 생성');
    assert(checkout.shop[0].price === 16000 && checkout.shop[0].qty === 5,
      '통합 쇼핑 이력 금액/수량 정확');
    assert(checkout.logs.filter(l => l.amount === -16000).length === 1,
      '정산금액은 한 번만 16,000원 차감');
    assert(checkout.balance === 34000, `정산 잔액 50,000 → ${checkout.balance.toLocaleString()}`);
    assert(checkout.cart.lines.length === 0, '결제 후 장바구니 자동 비움');
    assert((await shop.textContent('#cart-body')).includes('비어 있습니다'), '화면 장바구니도 빈 상태로 갱신');

    // bmanager에 3건 표시
    const mgr = await context.newPage();
    track('bmanager', mgr);
    await mgr.goto(`${baseUrl}/bmanager.html`, { waitUntil: 'domcontentloaded' });
    await mgr.waitForTimeout(900);
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(300);
    const managerText = await mgr.textContent('#orders-list');
    ['햄버거', '치즈버거', '새우버거'].forEach(m => assert(managerText.includes(m), `관리자 주문에 ${m} 표시`));
    assert((await mgr.$$('#orders-list button:has-text("조리 지시")')).length === 3,
      '관리자가 메뉴별 3개 조리 작업을 개별 처리 가능');

    // ── 3) 조리 전 통합 취소 → 3건 취소 + 결제 1회 복구 ──
    await shop.click('#os-actions button:has-text("주문 취소")');
    await shop.waitForTimeout(800);
    const cancelled = await shop.evaluate(() => ({
      orders: window.MockData.getBurgerOrders(),
      shop: window.MockData.getShopHistoryRaw()[0],
      balance: window.MockData.getUserSettlementBalance('99'),
      logs: window.MockData.getSettlementLogs('99')
    }));
    assert(cancelled.orders.every(o => o.status === 'cancelled'), '통합 주문의 주방 주문 3건 모두 취소');
    assert(cancelled.shop.status === 'cancelled', '통합 쇼핑 이력 취소');
    assert(cancelled.balance === 50000, `통합 취소 후 정산금액 1회 복구: ${cancelled.balance.toLocaleString()}`);
    assert(cancelled.logs.filter(l => l.amount === -16000).length === 0, '취소 후 16,000원 차감 로그 제거');

    // ── 4) 두 메뉴를 다시 담아 현장결제 → 그룹 조리/완성/수령 ──
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('햄버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(600);
    await shop.click('#btn-add-cart');
    await shop.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('치즈버거')}&type=single`, { waitUntil: 'domcontentloaded' });
    await shop.waitForTimeout(600);
    await shop.click('#btn-add-cart');
    await shop.waitForTimeout(250);
    assert((await shop.textContent('#cart-total')).includes('6,000'), '두 번째 카트 합계 6,000원');
    await shop.click('#modal-cart-foot button:has-text("장바구니 전체 결제")');
    await shop.click('#confirm-modal button:has-text("결제 진행")');
    await shop.waitForTimeout(250);
    await shop.click('.pay-choice[data-method="offline"]');
    await shop.click('#pay-submit');
    await shop.waitForTimeout(200);
    assert(await shop.isVisible('#offline-qr-modal'), '현장결제 선택 시 QR 데모 화면 표시');
    const beforeQrCount = await shop.evaluate(() =>
      window.MockData.getBurgerOrders().filter(o => o.status === 'ordered').length);
    assert(beforeQrCount === 0, 'QR을 찍기 전에는 현장결제 주문을 생성하지 않음');
    await shop.click('#offline-qr-reader');
    await shop.waitForTimeout(700);

    const second = await shop.evaluate(() => {
      const orders = window.MockData.getBurgerOrders().filter(o => o.status === 'ordered');
      const record = window.MockData.getShopHistoryRaw().find(r => r.id === orders[0].shopRecordId);
      return {
        orders,
        record,
        recordId: orders[0].shopRecordId,
        activeCount: window.MockData.getBurgerActiveOrders()
          .filter(o => o.shopRecordId === orders[0].shopRecordId).length,
        balance: window.MockData.getUserSettlementBalance('99')
      };
    });
    assert(second.orders.length === 2, '두 번째 통합 주문: 현장 결제 대기 주문 2건 생성');
    assert(second.orders.every(o => o.paymentStatus === 'offline_waiting'
      && o.paymentQrVerifiedAt && o.paymentQrType === 'burgerqueen_counter'),
      'QR 데모 인증 후 주방 주문을 현장 결제 대기 상태로 생성');
    assert(second.record.kitchenStatus === 'payment_waiting'
      && second.record.paymentDisplayLabel === '현장 결제중', '쇼핑 이력에 현장 결제중 표시');
    assert(second.activeCount === 0, '결제 완료 전에는 작업자용 진행 주문에도 노출하지 않음');
    assert(second.balance === 50000, '현장 결제 주문은 정산 자산을 차감하지 않음');

    // 마이페이지에도 현장 결제중 표시
    const mypage = await context.newPage();
    track('mypage2', mypage);
    await mypage.goto(`${baseUrl}/mypage2.html`, { waitUntil: 'domcontentloaded' });
    await mypage.waitForTimeout(900);
    const mypageText = await mypage.textContent('#shop-history-container');
    assert(mypageText.includes('현장 결제중'), '마이페이지 나의 쇼핑에 현장 결제중 표시');
    assert(!mypageText.includes('-₩ 6,000'), '현장 결제 금액을 정산 자산 차감처럼 표시하지 않음');

    // 관리자 화면에는 별도 현장 결제중 목록으로 표시되고 진행 중 주문에는 아직 나오지 않음
    await mgr.waitForTimeout(3200);
    const offlineText = await mgr.textContent('#dash-offline-payments');
    assert(offlineText.includes('최현일') && offlineText.includes('결제 요청'), '관리자 현장 결제중에 사용자와 결제 요청 시간 표시');
    assert((await mgr.$$('#dash-offline-payments button:has-text("결제 완료")')).length === 1,
      '통합 주문 단위 결제 완료 버튼 표시');
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(300);
    assert((await mgr.$$('#orders-list button:has-text("조리 지시")')).length === 0,
      '결제 완료 전에는 진행 중 주문에 나타나지 않음');

    // 마이페이지 QR을 찍으면 현장 결제가 완료되고 그때 주문이 접수됨
    await mypage.click('#shop-history-container button:has-text("QR 찍고 현장결제")');
    assert(await mypage.isVisible('#mypage-offline-qr-modal'), '마이페이지 현장결제 QR 데모 화면 표시');
    await mypage.click('#mypage-qr-demo');
    await mypage.waitForTimeout(900);

    const paidState = await mypage.evaluate(recordId => ({
      orders: window.MockData.getBurgerOrdersByShopRecord(recordId),
      activeCount: window.MockData.getBurgerActiveOrders().filter(o => o.shopRecordId === recordId).length,
      record: window.MockData.getShopHistoryRaw().find(r => r.id === recordId),
      balance: window.MockData.getUserSettlementBalance('99')
    }), second.recordId);
    assert(paidState.orders.every(o => o.paymentStatus === 'paid' && o.paymentCompletedAt
      && o.paymentConfirmationMethod === 'qr_demo' && o.paymentQrVerifiedAt),
      '마이페이지 QR 클릭 시 현장 결제 완료 시각과 QR 인증 기록 저장');
    assert(paidState.record.paymentDisplayLabel === '현장 결제 완료'
      && paidState.record.kitchenStatus === 'queued', 'QR 결제 후 쇼핑 이력을 결제 완료·조리 대기로 동기화');
    assert(paidState.activeCount === 2, 'QR 현장결제 완료 후에만 작업자용 진행 주문에 노출');
    assert(paidState.balance === 50000, 'QR 현장결제 완료 후에도 정산 자산 유지');

    await mgr.waitForTimeout(3200);
    await mgr.click('li[data-tab="orders"]');
    await mgr.waitForTimeout(300);
    assert((await mgr.$$('#orders-list button:has-text("조리 지시")')).length === 2,
      'QR 현장결제 완료 후 관리자 진행 중 주문에 메뉴 2건 표시');

    // 첫 메뉴만 조리 시작
    await mgr.click('#orders-list button:has-text("조리 지시")');
    await mgr.waitForTimeout(500);
    const partial = await mgr.evaluate(recordId => ({
      statuses: window.MockData.getBurgerOrdersByShopRecord(recordId).map(o => o.status),
      cancel: window.MockData.cancelBurgerOrderGroup(recordId, '테스트 취소')
    }), second.recordId);
    assert(partial.statuses.includes('cooking') && partial.statuses.includes('ordered'), '한 메뉴 조리 중, 다른 메뉴 대기 상태');
    assert(!partial.cancel.ok && partial.cancel.error === 'cooking', '일부라도 조리 시작하면 통합 취소 차단');

    await shop.waitForTimeout(2800);
    assert((await shop.textContent('#os-body')).includes('취소가 불가'), '고객 화면에도 조리 시작 후 취소 불가 표시');
    assert(!(await shop.textContent('#os-actions')).includes('주문 취소'), '통합 취소 버튼 제거');

    // 첫 메뉴 완성
    await mgr.click('#orders-list button:has-text("완성 처리")');
    await mgr.waitForTimeout(450);
    // 남은 메뉴 조리 시작 후 완성
    await mgr.click('#orders-list button:has-text("조리 지시")');
    await mgr.waitForTimeout(450);
    await mgr.click('#orders-list button:has-text("완성 처리")');
    await mgr.waitForTimeout(600);

    const ready = await mgr.evaluate(recordId => ({
      orders: window.MockData.getBurgerOrdersByShopRecord(recordId),
      record: window.MockData.getShopHistoryRaw().find(r => r.id === recordId)
    }), second.recordId);
    assert(ready.orders.every(o => o.status === 'done'), '그룹 내 주방 주문 2건 모두 완성');
    assert(ready.record.kitchenStatus === 'ready', '통합 쇼핑 이력은 전체 완성 후 준비 완료');

    await shop.waitForTimeout(2800);
    assert((await shop.textContent('#os-pill')).includes('준비 완료'), '고객 화면 통합 주문 준비 완료');
    await shop.click('#os-actions button:has-text("수령 완료")');
    await shop.waitForTimeout(700);
    const received = await shop.evaluate(recordId => ({
      orders: window.MockData.getBurgerOrdersByShopRecord(recordId),
      record: window.MockData.getShopHistoryRaw().find(r => r.id === recordId)
    }), second.recordId);
    assert(received.orders.every(o => o.status === 'received'), '통합 수령 시 주방 주문 2건 모두 수령 완료');
    assert(received.record.status === 'completed' && received.record.kitchenStatus === 'received',
      '통합 쇼핑 이력 수령 완료');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: 장바구니 다중 메뉴 일괄 결제·그룹 주문 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
