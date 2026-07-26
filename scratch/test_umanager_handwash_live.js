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

(async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '관리자', role: 'ROLE_MANAGER' }));
    window.__beepCount = 0;
    class FakeAudioContext {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
      }
      createOscillator() {
        return {
          type: '',
          frequency: { setValueAtTime() {} },
          connect() {},
          start() { window.__beepCount += 1; },
          stop() {}
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime() {} },
          connect() {}
        };
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });

  try {
    const manager = await context.newPage();
    const worker = await context.newPage();
    manager.on('dialog', dialog => dialog.dismiss());
    worker.on('dialog', dialog => dialog.dismiss());

    await manager.goto(`${baseUrl}/umanager.html`, { waitUntil: 'domcontentloaded' });
    const refreshButtonText = await manager.locator('button', { hasText: '새로고침' }).count();

    await worker.goto(`${baseUrl}/uton_before.html`, { waitUntil: 'domcontentloaded' });
    await worker.evaluate(() => {
      const now = new Date().toISOString();
      localStorage.setItem('app_reservations_db', JSON.stringify([{
        id: 'live_handwash_test',
        userId: 'live-user',
        userName: '실시간손인증',
        workId: 2,
        date: '2026-07-26',
        slot: '08:00',
        handPhotoStatus: 'reviewing',
        handPhotoCapturedAt: now,
        handPhotoUrl: './images/udon_product.png',
        checkInSteps: { sanitizer: true, handPhoto: false }
      }]));
    });

    await manager.waitForFunction(() => {
      const text = document.querySelector('#handwash-cards-container')?.innerText || '';
      return text.includes('실시간손인증') && text.includes('승인 대기');
    }, null, { timeout: 5000 });

    const result = await manager.evaluate(() => ({
      hasRefreshButton: Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('새로고침')),
      badge: document.querySelector('#wash-badge-count')?.textContent,
      beepCount: window.__beepCount,
      cardText: document.querySelector('#handwash-cards-container')?.innerText || ''
    }));

    console.log(JSON.stringify({ refreshButtonText, result }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
