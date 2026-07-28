const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8'
};

function assert(value, message) {
  if (!value) throw new Error('ASSERT FAILED: ' + message);
  console.log('  ok - ' + message);
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const file = path.resolve(root, relative);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
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
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({
      id: 99, name: '주문상세 테스트', email: 'detail@example.com', role: 'ROLE_USER'
    }));
    sessionStorage.setItem('user-id', '99');
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    const resource = route.request().resourceType();
    return route.fulfill({
      status: 200,
      contentType: resource === 'script' ? 'application/javascript' : 'text/css',
      body: ''
    });
  });

  const errors = [];
  function track(label, page) {
    page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`${label}: ${message.text()}`); });
  }

  try {
    const seed = await context.newPage();
    track('seed', seed);
    await seed.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent('햄버거')}&type=set`, { waitUntil: 'domcontentloaded' });
    await seed.waitForTimeout(350);
    const seeded = await seed.evaluate(() => {
      ['burger_order_history', 'kimp_shop_history'].forEach(key => localStorage.removeItem(key));
      const result = window.MockData.createBurgerCartOrder({
        items: [
          { menu: '햄버거', isSet: true, drink: '콜라', qty: 2 },
          { menu: '치즈버거', isSet: false, drink: null, qty: 1 },
          { menu: '새우버거', isSet: true, drink: '사이다', qty: 1 }
        ],
        userId: '99', userName: '주문상세 테스트', tableId: '픽업 카운터',
        paymentMethod: 'online_settlement', paymentStatus: 'paid'
      });
      window.FactoryStore.dispatch({ type: 'ADD_SHOP_ORDER', payload: result.record });
      return { id: result.record.id, orderNo: result.record.orderNo, total: result.record.price };
    });
    assert(seeded.total === 13000, '3종 통합 주문 13,000원 생성');
    await seed.close();

    const mypage = await context.newPage();
    track('mypage2', mypage);
    await mypage.goto(`${baseUrl}/mypage2.html`, { waitUntil: 'domcontentloaded' });
    await mypage.waitForFunction(() => document.querySelector('#shop-history-container .history-item'));

    const myButtons = mypage.locator('#shop-history-container .history-item .res-btn-box button');
    assert(await myButtons.count() === 2, 'mypage2 카드에 자세히와 주문 취소 버튼 함께 표시');
    assert((await myButtons.nth(0).textContent()).includes('자세히'), 'mypage2 자세히 버튼이 왼쪽 첫 번째');
    assert((await myButtons.nth(1).textContent()).includes('주문 취소'), 'mypage2 주문 취소 버튼이 오른쪽 두 번째');
    const myDetailStyle = await myButtons.nth(0).evaluate(button => {
      const style = getComputedStyle(button);
      return { background: style.backgroundColor, color: style.color, radius: style.borderRadius, weight: style.fontWeight };
    });
    assert(myDetailStyle.background.includes('253, 132, 237') && myDetailStyle.color === 'rgb(240, 171, 252)'
      && myDetailStyle.radius === '10px' && Number(myDetailStyle.weight) >= 700,
      'mypage2 자세히 버튼 CSS가 클릭 전 적용');

    await myButtons.nth(0).click();
    assert(await mypage.isVisible('#shop-order-detail-modal'), 'mypage2 주문 전체 내역 모달 열림');
    const myDetail = await mypage.textContent('#shop-detail-body');
    ['햄버거 세트', '치즈버거 단품', '새우버거 세트', '콜라', '사이다', '총 4개', '₩13,000']
      .forEach(text => assert(myDetail.includes(text), `mypage2 상세에 ${text} 표시`));
    assert(myDetail.includes(seeded.orderNo), 'mypage2 상세에 통합 주문번호 표시');
    assert((await mypage.locator('.shop-detail-line').count()) === 3, 'mypage2 상세에 주문 상품 3종 개별 표시');
    await mypage.keyboard.press('Escape');
    assert(!(await mypage.isVisible('#shop-order-detail-modal')), 'mypage2 상세 모달 ESC 닫기');

    const explore = await context.newPage();
    track('explore2', explore);
    await explore.goto(`${baseUrl}/explore2.html?tab=shopping`, { waitUntil: 'domcontentloaded' });
    await explore.waitForFunction(() => document.querySelector('#shopping-container .shop-order-detail-trigger.compact'));
    const detailButton = explore.locator('#shopping-container .shop-order-detail-trigger.compact').first();
    const sameNameBlock = await detailButton.evaluate(button => button.parentElement.textContent);
    assert(sameNameBlock.includes('햄버거 세트 외 2종') && sameNameBlock.includes('자세히'),
      'explore2 상품명 바로 옆에 자세히 버튼 표시');
    const exploreDetailStyle = await detailButton.evaluate(button => {
      const style = getComputedStyle(button);
      return { background: style.backgroundColor, color: style.color, radius: style.borderRadius, weight: style.fontWeight };
    });
    assert(exploreDetailStyle.background.includes('253, 132, 237') && exploreDetailStyle.color === 'rgb(240, 171, 252)'
      && exploreDetailStyle.radius === '8px' && Number(exploreDetailStyle.weight) >= 700,
      'explore2 자세히 버튼 CSS가 클릭 전 적용');

    const beforeUrl = explore.url();
    await detailButton.click();
    assert(explore.url() === beforeUrl, 'explore2 자세히 클릭이 카드 페이지 이동과 충돌하지 않음');
    assert(await explore.isVisible('#shop-order-detail-modal'), 'explore2 주문 전체 내역 모달 열림');
    const exploreDetail = await explore.textContent('#shop-detail-body');
    ['햄버거 세트', '치즈버거 단품', '새우버거 세트', '콜라', '사이다', '총 4개', '₩13,000']
      .forEach(text => assert(exploreDetail.includes(text), `explore2 상세에 ${text} 표시`));
    assert((await explore.locator('.shop-detail-line').count()) === 3, 'explore2 상세에 주문 상품 3종 개별 표시');
    await explore.click('.shop-detail-done');
    assert(!(await explore.isVisible('#shop-order-detail-modal')), 'explore2 확인 버튼으로 모달 닫기');

    assert(errors.length === 0, '콘솔/페이지 오류 없음');
    console.log('\nPASS: mypage2 · explore2 주문 전체 내역 상세 정상 동작');
  } catch (error) {
    console.error('\nFAIL: ' + error.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
