/**
 * test.html 상품 주문의 정산결제/현장결제 분리 검증
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
function assert(condition, message) {
  if (!condition) throw new Error('ASSERT FAILED: ' + message);
  console.log('  ok - ' + message);
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const filePath = path.join(root, pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]/, ''));
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        const type = ext === '.html' ? 'text/html; charset=utf-8'
          : (ext === '.js' ? 'application/javascript; charset=utf-8' : 'application/octet-stream');
        res.writeHead(200, { 'Content-Type': type });
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
  const page = await browser.newPage();
  const errors = [];
  page.on('dialog', dialog => dialog.accept());
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    await page.goto(`${baseUrl}/test.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      localStorage.removeItem('kimp_shop_history');
      localStorage.removeItem('uton_shop_history');
      localStorage.removeItem('kimp_settlement_transactions');
      localStorage.removeItem('burger_order_history');
      localStorage.removeItem('bulgogi_order_history');
      window.FactoryStore.dispatch({ type: 'SYNC_FROM_STORAGE' });
    });

    const userId = await page.inputValue('#user-select');
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#order-payment-method', 'online_settlement');
    await page.click('button:has-text("담은 상품 전체 주문하기")');
    await page.waitForTimeout(250);

    const online = await page.evaluate(id => {
      const orders = window.FactoryStore.getShopOrders({ userId: id });
      const state = window.FactoryStore.getState();
      return {
        order: orders[0],
        transactionCount: (state.settlementTransactions || []).filter(item =>
          item && String(item.userId) === String(id) && item.type === 'shop_spend').length
      };
    }, userId);
    assert(online.order.paymentMethod === 'online_settlement' && online.order.paymentStatus === 'paid',
      '정산결제 주문은 paid 상태로 생성');
    assert(online.transactionCount === 1, '정산결제 주문은 정산 자산 차감 거래 생성');

    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#order-payment-method', 'offline');
    await page.click('button:has-text("담은 상품 전체 주문하기")');
    await page.waitForTimeout(250);

    const offline = await page.evaluate(id => {
      const orders = window.FactoryStore.getShopOrders({ userId: id });
      const state = window.FactoryStore.getState();
      return {
        order: orders.find(item => item.paymentMethod === 'offline'),
        transactionCount: (state.settlementTransactions || []).filter(item =>
          item && String(item.userId) === String(id) && item.type === 'shop_spend').length
      };
    }, userId);
    assert(offline.order.paymentStatus === 'offline_waiting'
      && offline.order.kitchenStatus === 'payment_waiting', '현장결제 주문은 결제 대기 상태로 생성');
    assert(offline.order.paymentDisplayLabel === '현장 결제중'
      && offline.order.shouldShowSpendAmount === false, '현장결제 주문은 현장 결제중으로 표시');
    assert(offline.transactionCount === 1, '현장결제 주문은 추가 정산 자산 차감 거래를 만들지 않음');

    // BurgerQueen 테스트 상품: explore2 QR 결제 → bmanager 진행 주문 연결
    const managerId = await page.evaluate(() => {
      const manager = window.FactoryStore.getUsers().find(user => user.role === 'ROLE_MANAGER');
      return String(manager.id);
    });

    // K-Meat 실제 메뉴: 복수 메뉴 정산결제 + 현장결제 QR 접수
    await page.selectOption('#user-select', managerId);
    await page.selectOption('#work-select', '6');
    await page.waitForTimeout(150);
    const kmeatMenuText = await page.locator('#product-select').textContent();
    ['돼지고기 삼겹살 1인분', '돼지고기 목살 1인분', '항정살 1인분', '돼지갈비 1인분',
      '된장찌개 단품', '김치찌개 단품', '물냉면 단품', '비빔냉면 단품', '계란찜 단품', '공기밥']
      .forEach(name => assert(kmeatMenuText.includes(name), `test.html K-Meat 실제 메뉴 표시: ${name}`));

    await page.selectOption('#product-select', 'samgyeopsal');
    await page.fill('#order-qty', '2');
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#product-select', 'doenjang');
    await page.fill('#order-qty', '1');
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#order-payment-method', 'online_settlement');
    await page.click('button:has-text("담은 상품 전체 주문하기")');
    await page.waitForTimeout(250);

    const kmeatOnline = await page.evaluate(id => {
      const shop = window.FactoryStore.getShopOrders({ userId: id, workId: 6 })
        .find(item => item.paymentMethod === 'online_settlement');
      const raw = shop ? window.MockData.getKmeatOrders().find(item => item.orderNo === shop.orderNo) : null;
      return { shop, raw };
    }, managerId);
    assert(kmeatOnline.shop && kmeatOnline.shop.price === 36000
      && kmeatOnline.shop.paymentStatus === 'paid', 'K-Meat 복수 메뉴 정산결제 합계 저장');
    assert(kmeatOnline.raw && kmeatOnline.raw.items.length === 2
      && kmeatOnline.raw.items[0].quantity === 2, 'K-Meat 관리자 원주문에 복수 메뉴·수량 저장');

    await page.selectOption('#product-select', 'moksal');
    await page.fill('#order-qty', '1');
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#product-select', 'rice');
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#order-payment-method', 'offline');
    await page.click('button:has-text("담은 상품 전체 주문하기")');
    await page.waitForTimeout(250);

    const kmeatOffline = await page.evaluate(id => {
      const shop = window.FactoryStore.getShopOrders({ userId: id, workId: 6 })
        .find(item => item.paymentMethod === 'offline' && item.paymentStatus === 'offline_waiting');
      const raw = shop ? window.MockData.getKmeatOrders().find(item => item.orderNo === shop.orderNo) : null;
      return { shop, raw };
    }, managerId);
    assert(kmeatOffline.shop && kmeatOffline.shop.price === 15000
      && kmeatOffline.shop.kitchenStatus === 'payment_waiting', 'K-Meat 복수 메뉴 현장결제 대기 저장');
    assert(kmeatOffline.raw && kmeatOffline.raw.kitchenStage === 'payment_waiting',
      'K-Meat 현장결제 전 관리자 진행 주문 접수 보류');

    await page.goto(`${baseUrl}/explore2.html?tab=shopping`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const kmeatCard = page.locator('#shopping-container .task-item')
      .filter({ hasText: kmeatOffline.shop.productName });
    await kmeatCard.locator('button:has-text("QR 찍고 현장결제")').click();
    await page.click('#explore-qr-demo');
    await page.waitForTimeout(800);
    const kmeatPaid = await page.evaluate(orderNo =>
      window.MockData.getKmeatOrders().find(item => item.orderNo === orderNo), kmeatOffline.shop.orderNo);
    assert(kmeatPaid.paymentStatus === 'paid' && kmeatPaid.kitchenStage === 'ordered',
      'K-Meat QR 현장결제 완료 후 관리자 주문 접수');

    await page.goto(`${baseUrl}/kmanager.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    assert((await page.textContent('#dashboard-new-orders')).includes(kmeatOffline.shop.orderNo),
      'K-Meat 현장결제 완료 주문이 관리자 진행 목록에 표시');

    await page.goto(`${baseUrl}/test.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.selectOption('#user-select', managerId);
    await page.selectOption('#work-select', '7');
    await page.waitForTimeout(150);
    await page.click('button:has-text("주문에 담기")');
    await page.selectOption('#order-payment-method', 'offline');
    await page.click('button:has-text("담은 상품 전체 주문하기")');
    await page.waitForTimeout(250);

    const burgerPending = await page.evaluate(id => {
      const record = window.FactoryStore.getShopOrders({ userId: id, workId: 7 })
        .find(item => item.paymentStatus === 'offline_waiting');
      const kitchen = record ? window.MockData.getBurgerOrdersByShopRecord(record.id) : [];
      return { record, kitchen };
    }, managerId);
    assert(burgerPending.record && burgerPending.kitchen.length === 1,
      'test.html BurgerQueen 현장결제 주문은 주방 결제 대기 주문도 생성');
    assert(burgerPending.kitchen.every(item => item.paymentStatus === 'offline_waiting'),
      'BurgerQueen 주방 주문은 QR 결제 전 대기 상태');

    await page.goto(`${baseUrl}/explore2.html?tab=shopping`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const burgerCard = page.locator('#shopping-container .task-item')
      .filter({ hasText: burgerPending.record.productName });
    assert(await burgerCard.locator('button:has-text("QR 찍고 현장결제")').count() === 1,
      'explore2 나의 쇼핑에 현장결제 QR 버튼 표시');
    await burgerCard.locator('button:has-text("QR 찍고 현장결제")').click();
    assert(await page.isVisible('#explore-offline-qr-modal'), 'explore2 현장결제 QR 데모 화면 표시');
    await page.click('#explore-qr-demo');
    await page.waitForTimeout(800);

    const burgerPaid = await page.evaluate(recordId => ({
      shop: window.FactoryStore.getShopOrders().find(item => String(item.id) === String(recordId)),
      kitchen: window.MockData.getBurgerOrdersByShopRecord(recordId),
      active: window.MockData.getBurgerActiveOrders().filter(item => String(item.shopRecordId) === String(recordId))
    }), burgerPending.record.id);
    assert(burgerPaid.shop.paymentStatus === 'paid' && burgerPaid.shop.kitchenStatus === 'queued',
      'explore2 QR 클릭 시 현장결제 완료·조리 대기로 전환');
    assert(burgerPaid.kitchen.length === 1 && burgerPaid.active.length === 1,
      'QR 결제 완료 후에만 BurgerQueen 진행 주문 활성화');

    await page.goto(`${baseUrl}/bmanager.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.click('li[data-tab="orders"]');
    await page.waitForTimeout(250);
    assert((await page.textContent('#orders-list')).includes('치즈버거')
      && await page.locator('#orders-list button:has-text("조리 지시")').count() === 1,
      'QR 결제 완료 BurgerQueen 주문이 bmanager 진행 주문에 표시');

    assert(errors.length === 0, '콘솔/페이지 오류 없음');
    console.log('\nPASS: test.html 결제 방식 분리 정상 동작');
  } catch (error) {
    console.error('\nFAIL: ' + error.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
