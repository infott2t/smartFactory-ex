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

async function readDetail(page, baseUrl, id) {
  await page.goto(`${baseUrl}/explore_detail.html?id=${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#label-work-metric');
  return page.evaluate(() => {
    const rowDisplay = id => getComputedStyle(document.querySelector(id).closest('tr')).display;
    return {
      job: document.querySelector('#job-title')?.textContent.trim(),
      metricLabel: document.querySelector('#label-work-metric')?.textContent.trim(),
      metricValue: document.querySelector('#val-work-metric')?.textContent.trim(),
      deductDisplay: rowDisplay('#val-deduct'),
      shiftBonusDisplay: rowDisplay('#val-shift-bonus'),
      achievementTitle: document.querySelector('.achievement-title')?.textContent.trim(),
      achievementText: document.querySelector('#achievement-container')?.innerText.trim(),
      total: document.querySelector('#val-achievement-total')?.textContent.trim(),
      rankBonus: document.querySelector('#val-bonus')?.textContent.trim(),
      pay: document.querySelector('#val-pay')?.textContent.trim(),
      bodyText: document.body.innerText
    };
  });
}

(async () => {
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    sessionStorage.setItem('user-id', '2');
    sessionStorage.setItem('user', JSON.stringify({ id: 2, name: '최수아', role: '일반' }));
    localStorage.setItem('mypage_history_2', JSON.stringify([
      {
        id: 'kimchi-history',
        workId: 1,
        job: '김치만들기',
        date: '2026-07-26',
        time: '10:00 ~ 12:00',
        checkInTime: '10:00:00',
        checkOutTime: '12:00:00',
        role: '일반',
        ratio: 1.2,
        helpReceived: 6,
        shiftBonus: 0,
        stageCounts: { '1': 2, '2': 1 },
        flipCount: 1,
        pay: 10000
      },
      {
        id: 'uton-history',
        workId: 2,
        job: '우동만들기',
        brandName: 'Uton',
        iconUrl: './images/Uton_150x150.png',
        date: '2026-07-26',
        time: '13:00 ~ 15:00',
        checkInTime: '13:00:00',
        checkOutTime: '15:00:00',
        role: '일반',
        ratio: 1.2,
        completedOrdersCount: 3,
        helpReceived: 99,
        helpGiven: 88,
        shiftDeduct: 9999,
        shiftBonus: 7777,
        stageCounts: { '1': 99 },
        flipCount: 99,
        pay: 12000
      }
    ]));
    localStorage.setItem('mypage_history_3', JSON.stringify([
      {
        id: 'hist-capegon23@gmail.com-2-20260719-0',
        userId: '3',
        userName: '김수민',
        workId: 2,
        job: '우동만들기',
        brandName: 'Uton',
        iconUrl: './images/Uton_150x150.png',
        date: '2026-07-19',
        time: '10:00 ~ 11:30',
        checkInTime: '10:00:00',
        checkOutTime: '11:30:00',
        role: '일반',
        ratio: 1.2,
        completedOrdersCount: 1,
        pay: 9000
      }
    ]));
  });

  try {
    const page = await context.newPage();
    const uton = await readDetail(page, baseUrl, 'uton-history');
    const kimchi = await readDetail(page, baseUrl, 'kimchi-history');

    const kimsuminContext = await browser.newContext();
    await kimsuminContext.addInitScript(() => {
      localStorage.clear();
      sessionStorage.setItem('user-id', '3');
      sessionStorage.setItem('user', JSON.stringify({ id: 3, name: '김수민', email: 'capegon23@gmail.com', role: '일반' }));
      localStorage.setItem('mypage_history_3', JSON.stringify([
        {
          id: 'hist-capegon23@gmail.com-2-20260719-0',
          userId: '3',
          userName: '김수민',
          workId: 2,
          job: '우동만들기',
          brandName: 'Uton',
          iconUrl: './images/Uton_150x150.png',
          date: '2026-07-19',
          time: '10:00 ~ 11:30',
          checkInTime: '10:00:00',
          checkOutTime: '11:30:00',
          role: '일반',
          ratio: 1.2,
          completedOrdersCount: 1,
          pay: 9000
        }
      ]));
    });
    const kimsuminPage = await kimsuminContext.newPage();
    const kimsuminUton = await readDetail(kimsuminPage, baseUrl, 'hist-capegon23@gmail.com-2-20260719-0');

    if (uton.metricLabel !== '완료 주문 수') throw new Error(`Uton metric label mismatch: ${uton.metricLabel}`);
    if (uton.metricValue !== '3건') throw new Error(`Uton metric value mismatch: ${uton.metricValue}`);
    if (uton.rankBonus !== '500 원') throw new Error(`Uton rank bonus mismatch: ${uton.rankBonus}`);
    if (uton.pay !== '+₩ 12,500') throw new Error(`Uton pay should include rank bonus: ${uton.pay}`);
    if (uton.deductDisplay !== 'none' || uton.shiftBonusDisplay !== 'none') {
      throw new Error(`Uton should hide kimchi shift rows: ${uton.deductDisplay}, ${uton.shiftBonusDisplay}`);
    }
    if (uton.bodyText.includes('99회') || uton.achievementText.includes('Stage')) {
      throw new Error('Uton detail leaked kimchi-only help/stage data');
    }
    if (kimchi.metricLabel !== '도움을 받은 횟수') throw new Error(`Kimchi metric label mismatch: ${kimchi.metricLabel}`);
    if (!kimchi.metricValue.includes('6회')) throw new Error(`Kimchi metric value mismatch: ${kimchi.metricValue}`);
    if (kimchi.deductDisplay === 'none' || kimchi.shiftBonusDisplay === 'none') {
      throw new Error('Kimchi should show shift rows');
    }
    if (kimsuminUton.rankBonus !== '500 원') {
      throw new Error(`Kim Su-min Uton rank bonus mismatch: ${kimsuminUton.rankBonus}`);
    }
    if (kimsuminUton.pay !== '+₩ 9,500') {
      throw new Error(`Kim Su-min Uton pay should include rank bonus: ${kimsuminUton.pay}`);
    }

    console.log(JSON.stringify({ uton, kimchi, kimsuminUton }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
