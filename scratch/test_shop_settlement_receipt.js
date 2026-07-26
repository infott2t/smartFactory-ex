const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.addInitScript(() => {
        sessionStorage.setItem('user', JSON.stringify({ id: '2', name: 'tester' }));
    });

    await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.removeItem('kimp_settlement_transactions');
        localStorage.setItem('uton_shop_history', JSON.stringify([{
            id: 'ready-order',
            userId: '2',
            workId: 2,
            productId: '20002',
            productName: '칼칼 간장 비빔면',
            qty: 1,
            price: 3000,
            status: 'pending',
            kitchenStatus: 'ready',
            orderNo: 563,
            orderDate: '2026-07-26',
            orderTime: '08:55:38'
        }]));
    });

    await page.goto('http://127.0.0.1:8765/mypage2.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const beforeAsset = await page.evaluate(() => document.querySelector('#total-earnings-display')?.textContent);

    await page.goto('http://127.0.0.1:8765/explore2.html?tab=shopping', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.locator('#shopping-container button.res-check-in-btn').click();
    await page.waitForTimeout(300);

    const settlement = await page.evaluate(() => ({
        state: window.FactoryStore.getState().settlementTransactions,
        stored: JSON.parse(localStorage.getItem('kimp_settlement_transactions') || '[]'),
        order: window.FactoryStore.getShopOrders().find(order => order.id === 'ready-order')
    }));

    await page.goto('http://127.0.0.1:8765/mypage2.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const afterAsset = await page.evaluate(() => document.querySelector('#total-earnings-display')?.textContent);

    console.log(JSON.stringify({ beforeAsset, afterAsset, settlement }, null, 2));
    await browser.close();
})();
