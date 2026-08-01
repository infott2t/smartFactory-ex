const { chromium } = require('playwright');

const LOGIN_URL = 'http://127.0.0.1:8081/login.html';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    const quickContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const quickPage = await quickContext.newPage();
    quickPage.on('dialog', (dialog) => dialog.accept());
    await quickPage.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const layout = await quickPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.quick-account'));
      const buttonRects = buttons.map((button) => button.getBoundingClientRect());
      return {
        backHref: document.querySelector('.login-back')?.getAttribute('href'),
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        headerHeight: document.querySelector('.login-topbar')?.getBoundingClientRect().height,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        localVisible: getComputedStyle(document.getElementById('section-local')).display !== 'none',
        names: Array.from(document.querySelectorAll('.quick-name')).map((element) => element.textContent.trim()),
        passwordType: document.getElementById('login-pwd')?.type,
        quickButtonHeights: buttonRects.map((rect) => Math.round(rect.height)),
        quickButtonsStacked: buttonRects.every((rect, index) => index === 0 || rect.top > buttonRects[index - 1].bottom),
        quickButtonWidths: buttonRects.map((rect) => Math.round(rect.width)),
        quickCount: buttons.length,
        usernameType: document.getElementById('login-email')?.type
      };
    });

    assert(layout.backHref === './index.html', 'Back control does not link to index.html.');
    assert(layout.bodyBackground === 'rgb(9, 10, 15)', 'Dark background was not applied.');
    assert(layout.headerHeight >= 54 && layout.headerHeight <= 56, 'Header height does not match mypage2.html.');
    assert(!layout.hasHorizontalOverflow, 'Login layout overflows horizontally.');
    assert(layout.localVisible, 'ID/password login is not visible.');
    assert(layout.quickCount === 4, 'Expected four quick-login accounts.');
    assert(layout.names.join(',') === '최현일 로그인,최수아 로그인,김수민 로그인,김영희 로그인', 'Quick-login names are incorrect.');
    assert(layout.quickButtonHeights.every((height) => height >= 68), 'Quick-login buttons are too short.');
    assert(layout.quickButtonWidths.every((width) => width === layout.quickButtonWidths[0]), 'Quick-login buttons have inconsistent widths.');
    assert(layout.quickButtonsStacked, 'Quick-login buttons are not stacked vertically.');
    assert(layout.usernameType === 'text' && layout.passwordType === 'password', 'Login input types are incorrect.');

    await Promise.all([
      quickPage.waitForURL('**/main.html', { timeout: 10000 }),
      quickPage.locator('.quick-account[data-user-id="2"]').click()
    ]);
    const quickUser = await quickPage.evaluate(() => JSON.parse(sessionStorage.getItem('user') || 'null'));
    assert(quickUser?.name === '최수아' && quickUser?.role === 'ROLE_USER', 'Quick login did not preserve the existing profile logic.');
    await quickContext.close();

    const formContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const formPage = await formContext.newPage();
    formPage.on('dialog', (dialog) => dialog.accept());
    await formPage.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await formPage.locator('#login-email').fill('tt2t2am1118@naver.com');
    await formPage.locator('#login-pwd').fill('test-password');
    await Promise.all([
      formPage.waitForURL('**/main.html', { timeout: 10000 }),
      formPage.locator('.login-submit').click()
    ]);
    const formUser = await formPage.evaluate(() => JSON.parse(sessionStorage.getItem('user') || 'null'));
    assert(formUser?.name === '최현일' && formUser?.role === 'ROLE_MANAGER', 'ID/password login is not connected to AuthManager.');
    await formContext.close();

    console.log(JSON.stringify({ layout, quickUser, formUser }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
