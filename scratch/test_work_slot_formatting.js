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

const reservation = {
  id: 'uton-slot-format-test',
  userId: 99,
  userName: '슬롯 테스트',
  workId: 2,
  workName: '우동만들기',
  brandName: 'Uton',
  iconUrl: './images/Uton_150x150.png',
  date: '2099-07-27',
  slot: 1,
  role: 'general',
  ratio: 1.1,
  workStatus: 'reserved'
};

async function seedPage(page) {
  await page.addInitScript(item => {
    sessionStorage.setItem('user-id', String(item.userId));
    sessionStorage.setItem('user', JSON.stringify({
      id: item.userId,
      name: item.userName,
      email: 'slot-test@example.com',
      role: 'ROLE_MANAGER'
    }));
    sessionStorage.setItem('kimp_worker_profile', JSON.stringify({
      userId: item.userId,
      userName: item.userName,
      workedHours: 12,
      healthCertificateStatus: 'approved'
    }));
    localStorage.setItem('app_reservations_db', JSON.stringify([item]));
  }, reservation);
}

(async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    const managerPage = await browser.newPage();
    managerPage.on('pageerror', error => errors.push(`manager: ${error.message}`));
    await seedPage(managerPage);
    await managerPage.goto(`${baseUrl}/umanager.html`, { waitUntil: 'domcontentloaded' });
    await managerPage.waitForSelector('#view-dashboard.active');
    await managerPage.evaluate(() => window.switchTab('staff'));
    const managerText = await managerPage.locator('#view-staff').innerText();

    const mypage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mypage.on('pageerror', error => errors.push(`mypage: ${error.message}`));
    await seedPage(mypage);
    await mypage.goto(`${baseUrl}/mypage2.html`, { waitUntil: 'domcontentloaded' });
    await mypage.waitForSelector('#reservations-container');
    const mypageText = await mypage.locator('#reservations-container').innerText();

    const explore = await browser.newPage({ viewport: { width: 390, height: 844 } });
    explore.on('pageerror', error => errors.push(`explore: ${error.message}`));
    await seedPage(explore);
    await explore.goto(`${baseUrl}/explore2.html?tab=reservation`, { waitUntil: 'domcontentloaded' });
    await explore.waitForSelector('#reservation-container');
    const exploreText = await explore.locator('#reservation-container').innerText();

    const slotValues = await explore.evaluate(() => ({
      kimchiSlot1: window.MockData.formatWorkSlotTime(1, 1),
      utonSlot1: window.MockData.formatWorkSlotTime(2, 1)
    }));

    const expected = '13:00 ~ 14:30';
    if (!managerText.includes(expected)) throw new Error(`umanager slot mismatch: ${managerText}`);
    if (!mypageText.includes(expected)) throw new Error(`mypage2 slot mismatch: ${mypageText}`);
    if (!exploreText.includes(expected)) throw new Error(`explore2 slot mismatch: ${exploreText}`);
    if (slotValues.kimchiSlot1 !== '13:00 ~ 15:00') throw new Error(`Kimchi slot should remain 2h: ${JSON.stringify(slotValues)}`);
    if (slotValues.utonSlot1 !== expected) throw new Error(`Uton slot should be 1.5h: ${JSON.stringify(slotValues)}`);
    if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);

    console.log(JSON.stringify({ managerText, mypageText, exploreText, slotValues }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
