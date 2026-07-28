const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.css': 'text/css; charset=utf-8' };
const menus = {
  '치즈버거': 'burger_set_cheese.png',
  '불고기버거': 'burger_set_bulgogi.png',
  '햄버거': 'burger_set_hamburger.png',
  '새우버거': 'burger_set_shrimp.png'
};

function assert(value, message) {
  if (!value) throw new Error('ASSERT FAILED: ' + message);
  console.log('  ok - ' + message);
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const file = path.join(root, pathname === '/' ? 'index.html' : pathname.replace(/^\//, ''));
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404); res.end(); return; }
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
  const context = await browser.newContext();
  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '이미지 테스트', role: 'ROLE_USER' }));
    sessionStorage.setItem('user-id', '99');
  });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
    }
    if (/\/images\/burger_set_.*\.png$/.test(url.pathname)) {
      await new Promise(resolve => setTimeout(resolve, 700));
    }
    return route.continue();
  });

  const page = await context.newPage();
  const errors = [];
  const requestedImages = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => {
    if (/\/images\/.*\.(png|jpg|jpeg|gif)$/i.test(new URL(request.url()).pathname)) requestedImages.push(request.url());
  });

  try {
    for (const [menu, expectedFile] of Object.entries(menus)) {
      requestedImages.length = 0;
      await page.goto(`${baseUrl}/burger_order.html?menu=${encodeURIComponent(menu)}&type=set`, { waitUntil: 'domcontentloaded' });

      const loading = await page.$eval('#p-img', img => ({
        src: img.getAttribute('src'),
        opacity: getComputedStyle(img).opacity,
        busy: img.getAttribute('aria-busy')
      }));
      assert(loading.src && loading.src.includes(expectedFile), `${menu}: 처음부터 선택 이미지 경로 사용`);
      assert(loading.opacity === '0' && loading.busy === 'true', `${menu}: 이미지 준비 전 화면에 노출하지 않음`);
      assert(!requestedImages.some(url => url.includes('burger_500.png')), `${menu}: 잘못된 기본 아이콘 요청 없음`);

      await page.waitForFunction(() => {
        const img = document.getElementById('p-img');
        return img && img.getAttribute('aria-busy') === 'false' && img.complete && img.naturalWidth > 0;
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('p-img')).opacity === '1');
      const ready = await page.$eval('#p-img', img => ({
        src: img.currentSrc || img.src,
        opacity: getComputedStyle(img).opacity,
        width: img.naturalWidth
      }));
      assert(ready.src.includes(expectedFile) && ready.width > 0, `${menu}: 선택 이미지 로드 완료`);
      assert(ready.opacity === '1', `${menu}: 로드 완료 후 한 번에 표시`);
    }
    assert(errors.length === 0, '콘솔/페이지 오류 없음');
    console.log('\nPASS: 상품 이미지 무깜박임 전환 정상 동작');
  } catch (error) {
    console.error('\nFAIL: ' + error.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
