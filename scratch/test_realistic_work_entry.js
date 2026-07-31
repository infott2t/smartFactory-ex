const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const storeSource = fs.readFileSync(path.join(root, 'js', 'store.js'), 'utf8');
const featureStart = storeSource.indexOf('/* ============================================================\n * 실제 근무 입장 시간 현실화');
const featureEnd = storeSource.indexOf('/* ============================================================\n * 공통 상수', featureStart);

assert(featureStart >= 0 && featureEnd > featureStart, '입장 시간 현실화 공통 코드를 찾을 수 없습니다.');

const localValues = new Map();
const sessionValues = new Map();
const storageApi = values => ({
    getItem(key) {
        return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
        values.set(key, String(value));
    },
    removeItem(key) {
        values.delete(key);
    }
});

const context = {
    window: { MockData: {}, dispatchEvent() {} },
    localStorage: storageApi(localValues),
    sessionStorage: storageApi(sessionValues),
    Event: class Event {},
    Date,
    Number,
    Boolean,
    JSON,
    Math,
    Object,
    Array,
    String
};

context.window.MockData.getWorkSlot = function () {
    return { slot: 0, startHour: 16, startMin: 0, endHour: 20, endMin: 0, time: '16:00 ~ 20:00' };
};

vm.runInNewContext(storeSource.slice(featureStart, featureEnd), context);

const mockData = context.window.MockData;
const reservation = {
    id: 6001,
    userId: 2,
    workId: 6,
    date: '2026-07-31',
    slot: 0,
    workStatus: 'reserved'
};

assert.strictEqual(mockData.getRealisticWorkEntrySettings().enabled, false, '기본값은 아니오여야 합니다.');
assert.strictEqual(mockData.getReservationEntryStatus(reservation, new Date(2026, 6, 31, 10, 0)).allowed, true, '기능이 꺼지면 기존처럼 입장을 허용해야 합니다.');

mockData.setRealisticWorkEntrySettings({ enabled: true });
assert.strictEqual(mockData.getReservationEntryStatus(reservation, new Date(2026, 6, 31, 15, 49)).allowed, false, '예약 시작 11분 전에는 입장할 수 없어야 합니다.');
assert.strictEqual(mockData.getReservationEntryStatus(reservation, new Date(2026, 6, 31, 15, 50)).allowed, true, '예약 시작 10분 전부터 입장할 수 있어야 합니다.');
assert.strictEqual(mockData.getReservationEntryStatus(reservation, new Date(2026, 6, 31, 19, 59)).allowed, true, '예약 시간대에는 입장할 수 있어야 합니다.');
assert.strictEqual(mockData.getReservationEntryStatus(reservation, new Date(2026, 6, 31, 20, 0)).allowed, false, '예약 종료 시각부터는 입장할 수 없어야 합니다.');

let validation = mockData.validateRealWorkEntry({
    reservation,
    workId: 6,
    now: new Date(2026, 6, 31, 16, 0)
});
assert.strictEqual(validation.allowed, false, '입장하기 절차를 거치지 않은 직접 진입은 차단해야 합니다.');
assert.strictEqual(validation.code, 'check_in_required');

const grant = mockData.grantRealWorkEntry(reservation, 6, new Date(2026, 6, 31, 16, 0));
assert.strictEqual(grant.allowed, true, '예약 시간에 입장하기 권한을 발급해야 합니다.');

validation = mockData.validateRealWorkEntry({
    reservation,
    workId: 6,
    now: new Date(2026, 6, 31, 16, 1)
});
assert.strictEqual(validation.allowed, true, '입장하기 절차 완료 후 실제 근무 화면 진입을 허용해야 합니다.');

validation = mockData.validateRealWorkEntry({
    reservation,
    workId: 7,
    now: new Date(2026, 6, 31, 16, 1)
});
assert.strictEqual(validation.allowed, false, '다른 일의 입장 권한으로 우회할 수 없어야 합니다.');

const testHtml = fs.readFileSync(path.join(root, 'test.html'), 'utf8');
const announceHtml = fs.readFileSync(path.join(root, 'check-in-announce.html'), 'utf8');
const guardedPages = [
    'kimp_ex1.html', 'uton_real.html', 'kmeat-real.html', 'burger-real.html',
    'manager.html', 'umanager.html', 'kmanager.html', 'bmanager.html'
];

assert(testHtml.includes('입장하기 시간 현실화. 정확한 시간에 출근이 가능합니다.'), '통합 테스트 체크리스트 항목이 필요합니다.');
assert(announceHtml.includes('grantRealWorkEntry'), '입장하기 버튼에서 실제 근무 입장 권한을 발급해야 합니다.');
guardedPages.forEach(file => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert(html.includes('work-entry-guard.js'), `${file}에 직접 진입 차단 스크립트가 필요합니다.`);
});

console.log('입장 시간 현실화 테스트 통과');
