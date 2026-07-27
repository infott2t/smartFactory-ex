const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(8765, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: '2', name: 'tester', email: 'tester@example.com' }));
    sessionStorage.setItem('user-id', '2');
    if (!localStorage.getItem('__bulgogi_to_mypage_test_ready')) {
      localStorage.removeItem('kimp_shop_history');
      localStorage.removeItem('bulgogi_order_history');
      localStorage.setItem('bulgogi_settlement_balance', '100000');
      localStorage.setItem('__bulgogi_to_mypage_test_ready', '1');
    }
  });

  await page.goto('http://127.0.0.1:8765/bulgogi_order.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-check').first().check();
  await page.locator('#order-button').click();
  await page.locator('#demo-scan-button').click();
  await page.locator('#order-yes-button').click();
  await page.locator('#summary-confirm-button').click();
  await page.locator('[data-payment-method="settlement"]').click();
  await page.locator('#payment-submit-button').click();
  await page.waitForTimeout(200);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kimp_shop_history') || '[]')[0]);
  await page.goto('http://127.0.0.1:8765/mypage2.html?tab=shopping', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const rendered = await page.evaluate(() => {
    const container = document.querySelector('#shop-history-container');
    const img = container && container.querySelector('img');
    return {
      text: container ? container.innerText : '',
      img: img ? img.getAttribute('src') : null,
      count: container ? container.querySelectorAll('.history-item').length : 0,
    };
  });

  console.log(JSON.stringify({ stored, rendered }, null, 2));
  await browser.close();
  server.close();
})().catch(async error => {
  console.error(error);
  server.close();
  process.exit(1);
});
