/**
 * K-Meat 도움 요청 플로우 E2E
 *  1) kmeat-real.html [휴식·QR] 탭에서 "도움 요청하기" → confirm("도움 요청하시겠습니까?")
 *  2) kmanager.html 에 알림 토스트 + 사이드바 배지 + 도움 요청 탭 카드 표시
 *  3) 매니저가 [완료] 클릭 → 요청 종료 + 로그 기록
 *  4) 작업자 단말에 완료 토스트 & 카드 원복, 작업 기록(로그)에 남음
 */
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
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  console.log('  ok - ' + msg);
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(root, safePath === path.sep ? 'index.html' : safePath);
      if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.addInitScript(() => {
    sessionStorage.setItem('user', JSON.stringify({ id: 99, name: '최현일', email: 'tt2t2am1118@naver.com', role: 'ROLE_MANAGER' }));
    sessionStorage.setItem('user-id', '99');
    // 오디오 스텁 (headless 환경 에러 방지)
    class FakeAudioContext {
      constructor() { this.currentTime = 0; this.destination = {}; }
      createOscillator() {
        return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} };
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });

  const errors = [];
  const track = (label, page) => {
    page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
    page.on('dialog', async d => { console.log(`  [dialog:${label}] ${d.message().replace(/\n/g, ' / ')}`); await d.accept(); });
  };

  try {
    // ── 매니저 콘솔 먼저 열어 신규 알림 감지 상태로 둔다 ──
    const mgr = await context.newPage();
    track('kmanager', mgr);
    await mgr.goto(`${baseUrl}/kmanager.html`, { waitUntil: 'domcontentloaded' });
    await mgr.waitForTimeout(900);
    await mgr.evaluate(() => {
      localStorage.removeItem('kmeat_help_requests');
      window.__toasts = [];
      const orig = window.showToast;
      window.showToast = function (t, m) { window.__toasts.push(String(t) + ' | ' + String(m)); return orig(t, m); };
    });

    assert(await mgr.$('li[data-tab="help"]') !== null, 'kmanager 사이드바에 도움 요청 메뉴 존재');
    assert(await mgr.$('#view-help') !== null, 'kmanager 도움 요청 뷰 존재');

    // ── 작업자 단말: 휴식·QR 탭에서 도움 요청 ──
    const wrk = await context.newPage();
    track('kmeat-real', wrk);
    await wrk.goto(`${baseUrl}/kmeat-real.html`, { waitUntil: 'domcontentloaded' });
    await wrk.waitForTimeout(700);
    await wrk.click('#tab-rest');
    await wrk.waitForTimeout(250);

    const helpBtn = await wrk.$('#view-rest button:has-text("도움 요청하기")');
    assert(helpBtn !== null, '휴식·QR 탭에 [도움 요청하기] 버튼 존재');
    await helpBtn.click();
    await wrk.waitForTimeout(400);

    const pending = await wrk.evaluate(() => window.MockData.getKmeatHelpPending());
    assert(pending.length === 1, '도움 요청 1건이 접수됨 (status=pending)');
    assert(pending[0].workerName === '최현일' && pending[0].stationLabel, '요청에 작업자/스테이션 정보 포함: '
      + pending[0].workerName + ' / ' + pending[0].stationLabel);

    const wLogs1 = await wrk.evaluate(() => window.MockData.getKmeatWorkerLogs('real').map(l => l.text));
    assert(wLogs1.some(t => t.includes('[도움요청]') && t.includes('요청')), '작업자 로그에 도움 요청 기록');

    const pendingCard = await wrk.textContent('#view-rest');
    assert(pendingCard.includes('도움 요청 중'), '작업자 화면이 "도움 요청 중" 상태로 전환');
    assert(await wrk.$('#view-rest button:has-text("완료")') !== null, '작업자 화면에 [완료] 버튼 노출');

    // ── 매니저 콘솔에 알림 도착 (storage 이벤트 / 3초 폴링) ──
    await mgr.waitForTimeout(3800);
    const toasts = await mgr.evaluate(() => window.__toasts || []);
    const helpToast = toasts.find(t => t.includes('도움 요청'));
    assert(!!helpToast, 'kmanager 알림(토스트) 발생: ' + (helpToast || '(없음)'));
    assert((await mgr.textContent('#help-badge')).trim() === '1', 'kmanager 사이드바 배지 1건');
    assert((await mgr.textContent('#dashboard-help-badge')).includes('1건'), '대시보드 도움 요청 패널 1건 대기');

    // ── 매니저: 도움 요청 탭에서 완료 처리 ──
    await mgr.click('li[data-tab="help"]');
    await mgr.waitForTimeout(400);
    const cardText = await mgr.textContent('#help-pending-list');
    assert(cardText.includes('최현일'), '도움 요청 탭에 요청 카드 표시');
    await mgr.click('#help-pending-list button:has-text("완료")');
    await mgr.waitForTimeout(600);

    const resolved = await mgr.evaluate(() => window.MockData.getKmeatHelpRequests());
    assert(resolved.length === 1 && resolved[0].status === 'resolved', '요청 상태가 resolved 로 종료됨');
    assert(String(resolved[0].resolvedBy).includes('매니저'), '처리자 기록: ' + resolved[0].resolvedBy);
    assert(resolved[0].resolvedAt && Number.isFinite(resolved[0].durationSec), '완료 시각/소요시간 기록');

    assert((await mgr.textContent('#help-log-tbody')).includes('해결 완료'), 'kmanager 도움 요청 로그 테이블에 기록');
    assert((await mgr.textContent('#help-pending-list')).includes('진행 중인 도움 요청이 없습니다'), '대기 목록 비워짐');
    assert((await mgr.textContent('#help-badge')).trim() === '0', '사이드바 배지 0건으로 복귀');

    // ── 작업자 단말에 완료 반영 (1초 tick) ──
    await wrk.waitForTimeout(1800);
    const wToast = await wrk.textContent('#toast-wrap');
    assert(wToast.includes('완료'), '작업자 단말에 완료 토스트: ' + wToast.replace(/\s+/g, ' ').trim().slice(0, 60));
    const restText = await wrk.textContent('#view-rest');
    assert(restText.includes('도움 요청하기') && !restText.includes('도움 요청 중'), '작업자 카드가 요청 전 상태로 복귀');

    const wLogs2 = await wrk.evaluate(() => window.MockData.getKmeatWorkerLogs('real').map(l => l.text));
    assert(wLogs2.some(t => t.includes('[도움요청]') && t.includes('해결 완료')), '작업자 로그에 해결 완료 기록');

    // ── 더보기 탭 로그 목록에도 노출 ──
    await wrk.click('#tab-more');
    await wrk.waitForTimeout(300);
    assert((await wrk.textContent('#more-body')).includes('도움요청'), '작업자 [더보기] 작업 기록에 도움요청 로그 표시');

    // ── 휴식 중(퇴실 QR 스캔 상태)에도 도움 요청 가능해야 함 ──
    await wrk.click('#tab-rest');
    await wrk.waitForTimeout(200);
    await wrk.click('#view-rest .qr-box');   // 퇴실 QR 스캔 → 휴식 시작
    await wrk.waitForTimeout(300);
    assert(await wrk.evaluate(() => document.body.classList.contains('resting')), '휴식 상태로 전환');
    const restHelpBtn = await wrk.$('#view-rest button:has-text("도움 요청하기")');
    assert(restHelpBtn !== null, '휴식 중에도 [도움 요청하기] 버튼 노출');
    await restHelpBtn.click();               // pointer-events 잠금 여부 검증
    await wrk.waitForTimeout(400);
    assert((await wrk.evaluate(() => window.MockData.getKmeatHelpPending())).length === 1,
      '휴식 중 도움 요청도 정상 접수됨');
    await wrk.click('#view-rest button:has-text("요청 취소")');
    await wrk.waitForTimeout(300);
    assert((await wrk.evaluate(() => window.MockData.getKmeatHelpPending())).length === 0, '요청 취소 동작');

    assert(errors.length === 0, '콘솔/페이지 에러 없음' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    console.log('\nPASS: K-Meat 도움 요청 플로우 정상 동작');
  } catch (e) {
    console.error('\nFAIL: ' + e.message);
    if (errors.length) console.error('errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
