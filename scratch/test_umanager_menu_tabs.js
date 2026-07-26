const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(root, safePath === path.sep ? 'index.html' : safePath);
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function seedManagerData() {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '관리자', role: 'ROLE_MANAGER' }));
  localStorage.setItem('app_reservations_db', JSON.stringify([{
    id: 'uton-slot-test',
    userId: 99,
    userName: '슬롯 테스트',
    workId: 2,
    date: '2026-07-27',
    slot: 1,
    role: 'general',
    workStatus: 'reserved'
  }, {
    id: 'uton-completed-today',
    userId: 100,
    userName: '오늘 완료 근무자',
    workId: 2,
    date: todayKey,
    slot: 0,
    role: 'general',
    workStatus: 'completed',
    workCompletedAt: now.toISOString(),
    actualWorkSeconds: 5400,
    earnedPay: 17028
  }, {
    id: 'uton-early-left-yesterday',
    userId: 102,
    userName: '어제 조퇴 근무자',
    workId: 2,
    date: yesterdayKey,
    slot: 2,
    role: 'general',
    workStatus: 'early_left',
    workCompletedAt: yesterday.toISOString(),
    earlyLeaveCompletedAt: yesterday.toISOString(),
    actualWorkSeconds: 3600,
    earnedPay: 8000
  }, {
    id: 'kimp-completed-today',
    userId: 101,
    userName: '김치 근무자',
    workId: 1,
    date: todayKey,
    slot: 0,
    role: 'general',
    workStatus: 'completed',
    workCompletedAt: now.toISOString(),
    actualWorkSeconds: 7200,
    earnedPay: 999999
  }]));
  localStorage.setItem('uton_shop_history', JSON.stringify([{
    id: 'finance-udon-completed',
    orderNo: '901',
    userId: '2',
    workId: 2,
    productId: '20001',
    productName: '정통 가쓰오 우동',
    menuType: 'udon',
    qty: 1,
    unitPrice: 3000,
    price: 3000,
    status: 'completed',
    kitchenStatus: 'received',
    orderedAt: now.toISOString(),
    completedAt: now.toISOString()
  }, {
    id: 'finance-bibim-completed',
    orderNo: '902',
    userId: '2',
    workId: 2,
    productId: '20002',
    productName: '감칠맛 간장 비빔면',
    menuType: 'bibim',
    qty: 2,
    unitPrice: 3000,
    price: 6000,
    status: 'completed',
    kitchenStatus: 'received',
    orderedAt: now.toISOString(),
    completedAt: now.toISOString()
  }, {
    id: 'finance-yesterday-completed',
    orderNo: '900',
    userId: '2',
    workId: 2,
    productId: '20001',
    productName: '정통 가쓰오 우동',
    menuType: 'udon',
    qty: 1,
    unitPrice: 3000,
    price: 3000,
    status: 'completed',
    kitchenStatus: 'received',
    orderDate: yesterdayKey,
    orderedAt: yesterday.toISOString(),
    completedAt: yesterday.toISOString()
  }, {
    id: 'finance-pending-order',
    orderNo: '903',
    userId: '2',
    workId: 2,
    productId: '20001',
    productName: '정통 가쓰오 우동',
    menuType: 'udon',
    qty: 1,
    unitPrice: 3000,
    price: 3000,
    status: 'pending',
    kitchenStatus: 'queued',
    orderedAt: now.toISOString()
  }]));
}

(async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.addInitScript(seedManagerData);
    page.on('dialog', dialog => dialog.accept());

  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/umanager.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#view-dashboard.active');

    const initial = await page.evaluate(() => ({
      title: document.querySelector('#page-title')?.textContent.trim(),
      dashboardActive: document.querySelector('#view-dashboard')?.classList.contains('active'),
      kpiDisplay: getComputedStyle(document.querySelector('#dashboard-kpis')).display,
      removedPanelText: document.body.innerText.includes('스마트 해면기') || document.body.innerText.includes('육수기 제어')
    }));

    const tabs = ['help-requests', 'handwash', 'orders', 'finance', 'staff', 'devices', 'inventory'];
    const states = {};
    for (const tab of tabs) {
      await page.evaluate(tabName => window.switchTab(tabName), tab);
      states[tab] = await page.evaluate(tabName => {
        const view = document.querySelector(`#view-${tabName}`);
        return {
          active: view?.classList.contains('active') || false,
          title: document.querySelector('#page-title')?.textContent.trim(),
          kpiDisplay: getComputedStyle(document.querySelector('#dashboard-kpis')).display,
          text: view?.innerText.trim().slice(0, 2000) || ''
        };
      }, tab);
    }

    if (!initial.dashboardActive || initial.kpiDisplay === 'none') throw new Error('Dashboard should be initial active view');
    if (initial.removedPanelText) throw new Error('Removed noodle/broth control panel text is still visible');
    for (const [tab, state] of Object.entries(states)) {
      if (!state.active) throw new Error(`${tab} view did not become active`);
      if (state.kpiDisplay !== 'none') throw new Error(`${tab} should hide dashboard KPI grid`);
      if (!state.text) throw new Error(`${tab} view is empty`);
    }
    if (!states.staff.text.includes('13:00 ~ 14:30')) {
      throw new Error(`Uton staff reservation slot should use 1.5h workId slots: ${states.staff.text}`);
    }
    if (states.handwash.text.includes('최수아')) {
      throw new Error(`Handwash tab should not show default non-working sample user: ${states.handwash.text}`);
    }
    if (!states.finance.text.includes('오늘 수익·비용')) {
      throw new Error(`Finance tab title missing: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('₩9,000') || !states.finance.text.includes('수령 완료 주문 2건')) {
      throw new Error(`Finance tab should count only completed Uton orders: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('최대 가능 매출') || !states.finance.text.includes('₩432,000')) {
      throw new Error(`Finance tab should show maximum possible sales: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('최대 가능 이익') || !states.finance.text.includes('₩11,176')) {
      throw new Error(`Finance tab should show maximum possible profit after costs: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('총 144개')) {
      throw new Error(`Finance tab should show max sales quantity basis: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('₩17,028') || states.finance.text.includes('₩999,999')) {
      throw new Error(`Finance tab should count only Uton completed labor cost: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('(2인 풀근무 ₩136,224)')) {
      throw new Error(`Finance tab should show full-day two-person labor cost in parentheses: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('전기') || !states.finance.text.includes('가스')) {
      throw new Error(`Finance tab should show electricity and gas costs: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('임대료') || !states.finance.text.includes('₩133,333')) {
      throw new Error(`Finance tab should include daily rent cost: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('누적 매출') || !states.finance.text.includes('₩12,000')) {
      throw new Error(`Finance tab should show cumulative sales across dates: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('누적 비용') || !states.finance.text.includes('₩338,628')) {
      throw new Error(`Finance tab should include rent in cumulative cost: ${states.finance.text}`);
    }
    if (!states.finance.text.includes('일별 손익 게시판') || !states.finance.text.includes('누적 순이익')) {
      throw new Error(`Finance tab should show daily profit board with cumulative net: ${states.finance.text}`);
    }
    if (!states.devices.text.includes('가스레인지') || !states.devices.text.includes('운영 가능 대수: 2대')) {
      throw new Error(`Devices tab should show gas range count: ${states.devices.text}`);
    }
    await page.evaluate(() => window.switchTab('orders'));
    await page.fill('#uton-order-interval-input', '15');
    await page.fill('#uton-order-max-input', '4');
    await page.evaluate(() => window.saveUtonOrderLimitSettings());
    const savedOrderLimit = await page.evaluate(() => ({
      stored: JSON.parse(localStorage.getItem('uton_order_settings') || '{}'),
      ordersText: document.querySelector('#view-orders')?.innerText || ''
    }));
    if (savedOrderLimit.stored.intervalMinutes !== 15 || savedOrderLimit.stored.maxQtyPerInterval !== 4) {
      throw new Error(`Order limit settings were not saved: ${JSON.stringify(savedOrderLimit)}`);
    }
    if (!savedOrderLimit.ordersText.includes('15분당 4개')) {
      throw new Error(`Orders tab should render saved order limit: ${savedOrderLimit.ordersText}`);
    }
    await page.evaluate(() => window.switchTab('finance'));
    const changedFinanceText = await page.evaluate(() => document.querySelector('#view-finance')?.innerText || '');
    if (!changedFinanceText.includes('15분마다 우동 4개 + 비빔면 4개')) {
      throw new Error(`Finance max sales should follow saved order limit: ${changedFinanceText}`);
    }

    const detailPage = await browser.newPage();
    detailPage.on('dialog', dialog => dialog.accept());
    detailPage.on('pageerror', error => errors.push(`detail: ${error.message}`));
    await detailPage.addInitScript(() => {
      sessionStorage.setItem('user-id', '2');
      sessionStorage.setItem('user', JSON.stringify({ id: 2, name: '최수아', email: 'capegon21@gmail.com' }));
      localStorage.setItem('uton_order_settings', JSON.stringify({ intervalMinutes: 15, maxQtyPerInterval: 4 }));
      localStorage.setItem('uton_shop_history', JSON.stringify([{
        id: 'recent-limit-order',
        orderNo: '991',
        userId: 'someone-else',
        workId: 2,
        productId: '20001',
        productName: '정통 가쓰오 우동',
        qty: 1,
        price: 3000,
        status: 'pending',
        kitchenStatus: 'queued',
        orderedAt: new Date().toISOString()
      }]));
    });
    await detailPage.goto(`${baseUrl}/kimp_detail.html?productId=20002&workId=2`, { waitUntil: 'domcontentloaded' });
    await detailPage.waitForSelector('#order-confirm-overlay', { state: 'attached' });
    await detailPage.evaluate(() => {
      window.updateOrderLimitCopy();
      window.updateLimitUI(false, 0);
    });
    const detailLimitBeforeScan = await detailPage.evaluate(() => ({
      description: document.querySelector('#order-limit-description')?.innerText || '',
      status: document.querySelector('#modal-10min-status')?.innerText || '',
      demo: document.querySelector('#demo-order-limit-full-btn')?.innerText || '',
      workId: typeof window.getCurrentOrderWorkId === 'function' ? window.getCurrentOrderWorkId() : null,
      localOrders: localStorage.getItem('uton_shop_history'),
      currentOrders: typeof window.getCurrentWorkShopHistory === 'function' ? window.getCurrentWorkShopHistory() : [],
      recentStats: typeof window.getRecentOrderLimitStats === 'function' ? window.getRecentOrderLimitStats() : null
    }));
    if (!detailLimitBeforeScan.description.includes('1~3개') || !detailLimitBeforeScan.description.includes('15분당 4개')) {
      throw new Error(`Product detail order copy should follow saved limit: ${JSON.stringify(detailLimitBeforeScan)}`);
    }
    if (!detailLimitBeforeScan.status.includes('15분에 주문 1건') || !detailLimitBeforeScan.demo.includes('4건')) {
      throw new Error(`Product detail order status should follow saved limit: ${JSON.stringify(detailLimitBeforeScan)}`);
    }
    await detailPage.evaluate(() => window.scanOrderQR());
    const qtyOptionCount = await detailPage.locator('#order-qty-select option').count();
    if (qtyOptionCount !== 3) {
      throw new Error(`Product detail should allow 3 remaining quantity options after QR scan, got ${qtyOptionCount}`);
    }
    await detailPage.close();
    if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.addInitScript(seedManagerData);
    await mobilePage.goto(`${baseUrl}/umanager.html`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#view-dashboard.active');
    await mobilePage.locator('.menu-toggle-btn').click();
    const opened = await mobilePage.evaluate(() => ({
      sidebarOpen: document.querySelector('#sidebar')?.classList.contains('mobile-open') || false,
      backdropActive: document.querySelector('#sidebar-backdrop')?.classList.contains('active') || false
    }));
    await mobilePage.locator('#sidebar-backdrop').click({ position: { x: 320, y: 420 } });
    await mobilePage.waitForTimeout(400);
    const closed = await mobilePage.evaluate(() => ({
      sidebarOpen: document.querySelector('#sidebar')?.classList.contains('mobile-open') || false,
      backdropActive: document.querySelector('#sidebar-backdrop')?.classList.contains('active') || false,
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      offenders: Array.from(document.body.querySelectorAll('*'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className : '',
            width: Math.round(rect.width),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            text: (el.textContent || '').trim().slice(0, 60)
          };
        })
        .filter(item => item.right > window.innerWidth + 1 || item.left < -1)
        .slice(0, 12)
    }));

    if (!opened.sidebarOpen || !opened.backdropActive) throw new Error('Mobile sidebar did not open with backdrop');
    if (closed.sidebarOpen || closed.backdropActive) throw new Error('Mobile sidebar did not close after outside tap');
    if (closed.bodyScrollWidth > closed.viewportWidth + 1) {
      throw new Error(`Mobile dashboard overflows horizontally: ${closed.bodyScrollWidth} > ${closed.viewportWidth}; offenders=${JSON.stringify(closed.offenders)}`);
    }
    await mobilePage.evaluate(() => window.switchTab('finance'));
    await mobilePage.waitForTimeout(100);
    const mobileFinance = await mobilePage.evaluate(() => ({
      active: document.querySelector('#view-finance')?.classList.contains('active') || false,
      text: document.querySelector('#view-finance')?.innerText.trim().slice(0, 260) || '',
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }));
    if (!mobileFinance.active || !mobileFinance.text.includes('오늘 수익·비용')) {
      throw new Error(`Mobile finance view did not render: ${JSON.stringify(mobileFinance)}`);
    }
    if (mobileFinance.bodyScrollWidth > mobileFinance.viewportWidth + 1) {
      throw new Error(`Mobile finance view overflows horizontally: ${JSON.stringify(mobileFinance)}`);
    }
    await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mobilePage.waitForTimeout(100);
    const stickyHeader = await mobilePage.evaluate(() => {
      const header = document.querySelector('.header-bar');
      const toggle = document.querySelector('.menu-toggle-btn');
      const headerRect = header.getBoundingClientRect();
      const toggleRect = toggle.getBoundingClientRect();
      const quickActionsRect = document.querySelector('#quick-actions').getBoundingClientRect();
      const actionInsideHeader = Boolean(header.querySelector('#quick-actions, .btn-action'));
      return {
        headerPosition: getComputedStyle(header).position,
        headerTop: Math.round(headerRect.top),
        headerHeight: Math.round(headerRect.height),
        quickActionsTop: Math.round(quickActionsRect.top),
        actionInsideHeader,
        toggleVisible: toggleRect.top >= 0 && toggleRect.bottom <= window.innerHeight
      };
    });
    if (stickyHeader.headerPosition !== 'sticky') throw new Error(`Mobile header should be sticky: ${stickyHeader.headerPosition}`);
    if (stickyHeader.actionInsideHeader) throw new Error('Quick action buttons should not be inside sticky header');
    if (stickyHeader.headerHeight > 90) throw new Error(`Mobile sticky header is too tall: ${stickyHeader.headerHeight}`);
    if (!stickyHeader.toggleVisible) throw new Error(`Mobile menu toggle should stay visible after scroll: ${JSON.stringify(stickyHeader)}`);

    console.log(JSON.stringify({ initial, states, mobile: { opened, closed, mobileFinance, stickyHeader } }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
