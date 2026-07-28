/**
 * 공용 가중치 피드(js/ratio-feed.js)와 main / explore / work_detail 연동 검증.
 * 실제 모듈 파일과 실제 HTML 을 그대로 읽어 테스트한다.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const ok = (m) => console.log('  [정상] ' + m);
const fail = (m) => { bad++; console.log('  [실패] ' + m); };

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ── 실제 모듈 로드 (가짜 DOM 포함: startListFeed 까지 실행해 본다) ──
console.log('== js/ratio-feed.js 로드 ==');
const feedSrc = read('js/ratio-feed.js');

const elements = [];
function makeEl(cls, workId, digits) {
    return {
        _cls: new Set(cls.split(' ')),
        _attr: { 'data-work-id': String(workId), 'data-ratio-digits': digits === undefined ? null : String(digits) },
        textContent: '',
        style: {},
        classList: {
            toggle(name, on) { on ? this._o._cls.add(name) : this._o._cls.delete(name); }
        },
        getAttribute(k) { return this._attr[k] === undefined ? null : this._attr[k]; },
        matches(sel) { return sel.split(',').some((s) => this._matchOne(s.trim())); },
        _matchOne(sel) {
            // .cls / .cls[data-work-id] / .cls[data-work-id="7"] 모두 지원
            const m = sel.match(/^\.([\w-]+)(\[data-work-id(?:="([^"]+)")?\])?$/);
            if (!m) return false;
            if (!this._cls.has(m[1])) return false;
            if (m[2]) {
                const v = this._attr['data-work-id'];
                if (v === null || v === undefined) return false;
                if (m[3] !== undefined && v !== m[3]) return false;
            }
            return true;
        }
    };
}
function addEl(cls, workId, digits) {
    const el = makeEl(cls, workId, digits);
    el.classList._o = el;
    elements.push(el);
    return el;
}

const fakeDoc = {
    hidden: false,
    addEventListener() {},
    querySelectorAll(sel) { return elements.filter((e) => e.matches(sel)); }
};
const sandbox = {
    window: {}, document: fakeDoc, Math, Date, console,
    setTimeout: () => 1, clearTimeout: () => {}, Array
};
sandbox.global = sandbox;
vm.createContext(sandbox);
try {
    new vm.Script(feedSrc, { filename: 'ratio-feed.js' }).runInContext(sandbox);
    ok('모듈 실행 성공');
} catch (e) {
    fail('모듈 실행 오류: ' + e.message);
    process.exit(1);
}
const Feed = sandbox.window.RatioFeed;
if (!Feed) { fail('window.RatioFeed 미노출'); process.exit(1); }
ok('window.RatioFeed 노출 확인');

console.log('\n== 변동 범위 (1.1 ~ 1.5) ==');
Feed.MIN === 1.1 ? ok('MIN = 1.1') : fail('MIN = ' + Feed.MIN);
Feed.MAX === 1.5 ? ok('MAX = 1.5') : fail('MAX = ' + Feed.MAX);

let gMin = Infinity, gMax = -Infinity;
const workIds = [1, 2, 3, 6, 7];
for (const id of workIds) {
    for (const key of Object.keys(Feed.STEPS)) {
        const seed = Feed.seedFor(id, key);
        for (let b = 0; b < 30000; b++) {
            const v = Feed.ratioAt(b, seed);
            if (v < gMin) gMin = v;
            if (v > gMax) gMax = v;
        }
    }
}
console.log('  관측 최소=' + gMin + ' 최대=' + gMax + ' (일 5개 × 시간대 8개 × 버킷 3만)');
(gMin >= 1.1 && gMax <= 1.5) ? ok('모든 값이 범위 안') : fail('범위 이탈');

console.log('\n== 10초 단위 동작 ==');
Feed.LIST_KEY === '10s' ? ok('목록 갱신 단위 = 10s') : fail('목록 단위가 10s 아님: ' + Feed.LIST_KEY);
Feed.STEPS['10s'] && Feed.STEPS['10s'].stepMs === 10000
    ? ok('10s 버킷 크기 = 10000ms') : fail('10s 버킷 정의 오류');

const bucketStart = Math.floor(Date.now() / 10000) * 10000;
const s1 = Feed.listValue(7, bucketStart + 500);
const s2 = Feed.listValue(7, bucketStart + 5000);
const s3 = Feed.listValue(7, bucketStart + 9500);
(s1 === s2 && s2 === s3)
    ? ok('같은 10초 구간에서는 값이 고정 (' + s1 + ')')
    : fail('같은 구간에서 값이 흔들림: ' + s1 + ', ' + s2 + ', ' + s3);

let changes = 0;
for (let i = 1; i <= 60; i++) {
    if (Feed.listValue(7, bucketStart + i * 10000) !== Feed.listValue(7, bucketStart + (i - 1) * 10000)) changes++;
}
console.log('  향후 10분(60구간) 중 값이 바뀌는 횟수: ' + changes + '/60');
changes >= 50 ? ok('10초마다 값이 갱신됨') : fail('10초 단위 변화 부족: ' + changes);

const until = Feed.msUntilNext(10000, bucketStart + 3000);
until === 7000 ? ok('다음 10초 경계까지 계산 정확 (7000ms)') : fail('경계 계산 오류: ' + until);

console.log('\n== 일별 개별 값 ==');
const perWork = {};
for (const id of workIds) perWork[id] = Feed.listValue(id, Date.now());
console.log('  현재 구간: ' + workIds.map((id) => id + '번=' + perWork[id].toFixed(2)).join(', '));
new Set(Object.values(perWork)).size >= 3
    ? ok('일마다 서로 다른 값') : fail('값이 너무 겹침');

let same = 0;
for (let i = 0; i < 300; i++) {
    if (Feed.listValue(1, Date.now() + i * 10000) === Feed.listValue(7, Date.now() + i * 10000)) same++;
}
console.log('  1번 vs 7번 300개 표본 중 동일값 ' + same + '개');
same < 60 ? ok('일별 고유 곡선 유지') : fail('곡선이 너무 유사');

console.log('\n== DOM 갱신 동작 (가짜 DOM) ==');
const numEl = addEl('val work-ratio', 7);
// 방향 클래스를 일부러 넣지 않고 시작 → 실제로 코드가 붙이는지 확인
const arrowEl = addEl('bi work-ratio-arrow', 7);
const chgEl = addEl('change-rate work-ratio-change', 7);
const oneDigitEl = addEl('work-ratio', 6, 1);

// 셀렉터가 하나라도 안 맞으면 조용히 통과되지 않도록 먼저 확인
const matched = fakeDoc.querySelectorAll('.work-ratio[data-work-id]').length;
matched === 2
    ? ok('가짜 DOM 셀렉터 매칭 확인 (' + matched + '개)')
    : fail('셀렉터 매칭 실패 (' + matched + '개) — 테스트 신뢰 불가');

Feed.refreshRatioElements();

/^\d\.\d{2}$/.test(numEl.textContent)
    ? ok('숫자 갱신 (소수 2자리): ' + numEl.textContent)
    : fail('숫자 형식 오류: ' + numEl.textContent);
parseFloat(numEl.textContent) === Feed.listValue(7)
    ? ok('표시값이 모듈 계산값과 일치') : fail('표시값 불일치');

// 숫자는 등락과 무관하게 항상 흰색
const WHITE = ['#ffffff', '#fff', 'white'];
WHITE.includes(String(numEl.style.color).toLowerCase())
    ? ok('가중치 숫자 색상 = 흰색 (' + numEl.style.color + ')')
    : fail('숫자 색상이 흰색 아님: ' + numEl.style.color);
!oneDigitEl.style.color || WHITE.includes(String(oneDigitEl.style.color).toLowerCase())
    ? ok('다른 카드 숫자도 흰색 (' + oneDigitEl.style.color + ')')
    : fail('숫자 색상 불일치: ' + oneDigitEl.style.color);
// 하락 구간에서도 흰색이 유지되는지: 여러 시각을 훑어 상승/하락 모두 확인
(function () {
    let sawUp = false, sawDown = false, nonWhite = 0;
    const step = Feed.STEPS[Feed.LIST_KEY].stepMs;
    const base = Math.floor(Date.now() / step) * step;
    for (let i = 0; i < 200; i++) {
        const cur = Feed.listValue(7, base + i * step);
        const prev = Feed.listValue(7, base + (i - 1) * step);
        if (cur > prev) sawUp = true;
        if (cur < prev) sawDown = true;
    }
    // 실제 DOM 경로로도 재확인
    numEl.style.color = '';
    Feed.refreshRatioElements();
    if (!WHITE.includes(String(numEl.style.color).toLowerCase())) nonWhite++;
    (sawUp && sawDown)
        ? ok('상승/하락 구간 모두 존재하는 데이터로 검증')
        : fail('상승 또는 하락 구간이 없어 검증 불충분');
    nonWhite === 0 ? ok('재갱신 후에도 숫자는 흰색 유지') : fail('재갱신 시 숫자 색상 변경됨');
})();

// 화살표/등락률은 여전히 등락 색을 쓴다
const UPDOWN = ['#00b894', '#ff6b6b'];
UPDOWN.includes(String(arrowEl.style.color).toLowerCase())
    ? ok('화살표는 등락 색 유지 (' + arrowEl.style.color + ')')
    : fail('화살표 색상 오류: ' + arrowEl.style.color);
UPDOWN.includes(String(chgEl.style.color).toLowerCase())
    ? ok('등락률은 등락 색 유지 (' + chgEl.style.color + ')')
    : fail('등락률 색상 오류: ' + chgEl.style.color);
/^-?\+?[\d.-]+%$/.test(chgEl.textContent.replace('+', ''))
    ? ok('등락률 갱신: ' + chgEl.textContent) : fail('등락률 형식 오류: ' + chgEl.textContent);
(arrowEl._cls.has('bi-caret-up-fill') || arrowEl._cls.has('bi-caret-down-fill'))
    ? ok('화살표 방향 클래스 적용') : fail('화살표 클래스 미적용');
(arrowEl._cls.has('bi-caret-up-fill') !== arrowEl._cls.has('bi-caret-down-fill'))
    ? ok('상승/하락 클래스가 동시에 붙지 않음') : fail('화살표 클래스 충돌');
/^\d\.\d$/.test(oneDigitEl.textContent)
    ? ok('data-ratio-digits 반영: ' + oneDigitEl.textContent)
    : fail('자릿수 지정 미반영: ' + oneDigitEl.textContent);
typeof Feed.startListFeed === 'function' ? ok('startListFeed 노출') : fail('startListFeed 없음');
try { Feed.startListFeed(); ok('startListFeed 실행 오류 없음'); }
catch (e) { fail('startListFeed 오류: ' + e.message); }

// ── 페이지 연동 ──
function checkPage(file, checks) {
    console.log('\n== ' + file + ' 연동 ==');
    const html = read(file);
    for (const [name, needle] of checks) {
        html.includes(needle) ? ok(name) : fail(name + ' 누락');
    }
    const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    blocks.forEach((code, i) => {
        try { new vm.Script(code, { filename: file + '-' + i + '.js' }); }
        catch (e) { fail(file + ' 인라인 블록 ' + i + ' 문법 오류: ' + e.message); }
    });
    ok('인라인 스크립트 ' + blocks.length + '개 문법 정상');
    return html;
}

const mainHtml = checkPage('main.html', [
    ['ratio-feed.js 로드', 'js/ratio-feed.js'],
    ['가중치 요소', 'class="val work-ratio" data-work-id='],
    ['화살표 요소', 'work-ratio-arrow'],
    ['피드 시작', 'RatioFeed.startListFeed()']
]);
const mainCount = (mainHtml.match(/class="val work-ratio"/g) || []).length;
mainCount >= 2 ? ok('신규/인기 두 목록 모두 적용 (' + mainCount + '곳)') : fail('한쪽만 적용됨');
!mainHtml.includes('msUntilNextMinute') ? ok('옛 1분 갱신 로직 제거됨') : fail('1분 갱신 로직 잔존');

checkPage('explore.html', [
    ['ratio-feed.js 로드', 'js/ratio-feed.js'],
    ['가중치 요소', 'work-ratio" data-work-id='],
    ['화살표 요소', 'work-ratio-arrow'],
    ['등락률 요소', 'work-ratio-change'],
    ['렌더 후 즉시 반영', 'RatioFeed.refreshRatioElements()'],
    ['피드 시작', 'RatioFeed.startListFeed()']
]);

const detailHtml = checkPage('work_detail.html', [
    ['ratio-feed.js 로드', 'js/ratio-feed.js'],
    ['공용 모듈 사용', 'window.RatioFeed'],
    ["범례 라벨 '시급'", "label: '시급',"]
]);
!/function hash01\(/.test(detailHtml) ? ok('중복 hash01 제거됨') : fail('hash01 중복 잔존');
!/function ratioAt\(/.test(detailHtml) ? ok('중복 ratioAt 제거됨') : fail('ratioAt 중복 잔존');
!detailHtml.includes('시급 가중치') ? ok("'시급 가중치' 표기 제거됨") : fail("'시급 가중치' 표기 잔존");
!/const workName/.test(detailHtml) ? ok('미사용 workName 변수 제거됨') : fail('미사용 workName 잔존');

console.log('\n== 서비스워커 사전 캐시 ==');
read('sw.js').includes("'/js/ratio-feed.js'") ? ok('ratio-feed.js 등록') : fail('사전 캐시 누락');

console.log('\n결과: ' + (bad === 0 ? '문제 없음' : bad + '건 문제'));
process.exit(bad === 0 ? 0 : 1);
