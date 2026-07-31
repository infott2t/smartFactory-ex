const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8768;
const SERVE_ROOT = path.resolve(__dirname, '..', '..');
const APP_URL = `http://127.0.0.1:${PORT}/smartFactory-ex/`;
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function createStaticServer() {
  return http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, APP_URL).pathname);
      const relativePath = pathname.replace(/^\/+/, '');
      let absolutePath = path.resolve(SERVE_ROOT, relativePath || 'index.html');

      if (!absolutePath.toLowerCase().startsWith(SERVE_ROOT.toLowerCase())) {
        response.writeHead(403);
        response.end('forbidden');
        return;
      }

      const stat = await fs.stat(absolutePath);
      if (stat.isDirectory()) {
        absolutePath = path.join(absolutePath, 'index.html');
      }

      const content = await fs.readFile(absolutePath);
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': CONTENT_TYPES[path.extname(absolutePath).toLowerCase()] || 'application/octet-stream'
      });
      response.end(content);
    } catch (error) {
      response.writeHead(404);
      response.end('not found');
    }
  });
}

(async () => {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();
    const localFailures = [];

    page.on('response', (response) => {
      if (response.url().startsWith(APP_URL) && response.status() >= 400) {
        localFailures.push({ status: response.status(), url: response.url() });
      }
    });

    await page.goto(APP_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration && registration.active);
    }, null, { timeout: 15000 });
    await page.reload({ waitUntil: 'load', timeout: 30000 });
    const indexInstallEntryCount = await page.locator('[data-pwa-install-container]').count();
    const indexCta = page.locator('#loginBtn');
    const indexCtaTagName = await indexCta.evaluate((element) => element.tagName);
    await Promise.all([
      page.waitForURL(`${APP_URL}main.html`, { timeout: 10000 }),
      indexCta.click()
    ]);
    const indexCtaNavigated = page.url() === `${APP_URL}main.html`;
    await page.goto(APP_URL, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => {
      sessionStorage.setItem('user', JSON.stringify({
        id: 'pwa-test-user',
        name: 'PWA Test',
        email: 'pwa@example.com',
        role: 'ROLE_WORKER'
      }));
    });
    await page.goto(`${APP_URL}about.html?tab=github`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(400);

    const state = await page.evaluate(async () => {
      const manifest = document.querySelector('link[rel="manifest"]');
      const pwaScript = Array.from(document.scripts).find((script) => script.src.includes('/js/pwa.js'));
      const registration = await navigator.serviceWorker.getRegistration();
      const banner = document.querySelector('[data-pwa-install-container]');
      const installButton = document.querySelector('[data-pwa-install]');
      const activeTab = document.querySelector('.tab-item.active');
      const buttonRect = installButton ? installButton.getBoundingClientRect() : null;

      return {
        activeTabText: activeTab ? activeTab.textContent.trim() : null,
        bannerHidden: banner ? banner.hidden : null,
        buttonText: installButton ? installButton.textContent.trim().replace(/\s+/g, ' ') : null,
        buttonWithinViewport: buttonRect
          ? buttonRect.left >= 0 && buttonRect.right <= window.innerWidth
          : false,
        controlled: Boolean(navigator.serviceWorker.controller),
        installFunction: typeof window.promptPwaInstall,
        manifestHref: manifest ? manifest.href : null,
        persistentInstallEntry: banner ? banner.hasAttribute('data-pwa-install-persistent') : false,
        pwaScript: pwaScript ? pwaScript.src : null,
        serviceWorkerScript: registration && registration.active ? registration.active.scriptURL : null,
        serviceWorkerScope: registration ? registration.scope : null
      };
    });

    await page.evaluate(() => {
      const installEvent = new Event('beforeinstallprompt', { cancelable: true });
      installEvent.prompt = () => {
        window.__testPwaPromptCalled = true;
      };
      installEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(installEvent);
    });
    let confirmMessage = null;
    page.once('dialog', async (dialog) => {
      confirmMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.locator('[data-pwa-install]').click();
    const declineStoppedPrompt = await page.evaluate(() => window.__testPwaPromptCalled !== true);

    page.once('dialog', async (dialog) => {
      confirmMessage = dialog.message();
      await dialog.accept();
    });
    await page.locator('[data-pwa-install]').click();
    await page.waitForFunction(() => window.__testPwaPromptCalled === true);
    const directPromptTriggered = await page.evaluate(() => window.__testPwaPromptCalled === true);

    const requiredAssets = [
      'manifest.json',
      'sw.js?v=20260731-pwa-v8',
      'icons/icon-192x192.png',
      'icons/icon-512x512.png'
    ];
    const assetStatuses = {};

    for (const asset of requiredAssets) {
      const response = await context.request.get(new URL(asset, APP_URL).toString());
      assetStatuses[asset] = response.status();
    }

    const expectedBase = APP_URL;
    const assertions = {
      assetsOk: Object.values(assetStatuses).every((status) => status === 200),
      githubTabSelected: state.activeTabText === 'Github 주소',
      bannerVisible: state.bannerHidden === false,
      buttonLabelOk: state.buttonText === 'PWA 앱 설치하기',
      buttonWithinViewport: state.buttonWithinViewport,
      controlled: state.controlled,
      confirmMessageOk: confirmMessage === '스마트 팩토리 PWA 앱을 설치하시겠습니까?',
      declineStoppedPrompt,
      directPromptTriggered,
      indexCtaIsValidLink: indexCtaTagName === 'A',
      indexCtaNavigated,
      installFunctionReady: state.installFunction === 'function',
      installEntryRemovedFromIndex: indexInstallEntryCount === 0,
      manifestPathOk: state.manifestHref === `${expectedBase}manifest.json`,
      noLocalFailures: localFailures.length === 0,
      persistentInstallEntry: state.persistentInstallEntry,
      scriptPathOk: state.pwaScript === `${expectedBase}js/pwa.js?v=20260801-pwa-install-v10`,
      serviceWorkerPathOk: state.serviceWorkerScript === `${expectedBase}sw.js?v=20260731-pwa-v8`,
      serviceWorkerScopeOk: state.serviceWorkerScope === expectedBase
    };

    console.log(JSON.stringify({ assertions, assetStatuses, localFailures, state }, null, 2));

    if (Object.values(assertions).some((passed) => !passed)) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
