const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

class MemoryStorage {
    constructor(initial) { this.values = Object.assign({}, initial || {}); }
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null; }
    setItem(key, value) { this.values[key] = String(value); }
    removeItem(key) { delete this.values[key]; }
}

function assertInlineScriptsParse(fileName) {
    const html = fs.readFileSync(fileName, 'utf8');
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
        .map(match => match[1])
        .filter(script => script.trim());
    scripts.forEach(script => new Function(script));
}

const localStorage = new MemoryStorage({
    app_reservations_db: JSON.stringify([{
        id: 2,
        userId: 2,
        userName: '테스트 사용자',
        workId: 2,
        date: '2026-07-23',
        slot: 0,
        status: 'reserved'
    }, {
        id: 3,
        userId: 2,
        userName: '테스트 사용자',
        workId: 2,
        date: '2026-07-22',
        slot: 0,
        status: 'reserved'
    }])
});
const sessionStorage = new MemoryStorage({
    user: JSON.stringify({ id: 2, name: '테스트 사용자', email: 'uton@example.com' })
});
const windowObject = { localStorage, sessionStorage, addEventListener() {}, dispatchEvent() {} };
windowObject.window = windowObject;
const context = {
    window: windowObject, localStorage, sessionStorage, console, JSON, Date, Math, Object, Array,
    String, Number, Boolean, parseInt,
    Event: class Event { constructor(type) { this.type = type; } }
};
context.getStorageKey = (...args) => windowObject.getStorageKey(...args);
context.getPartitionedItem = (...args) => windowObject.getPartitionedItem(...args);
context.setPartitionedItem = (...args) => windowObject.setPartitionedItem(...args);
context.removePartitionedItem = (...args) => windowObject.removePartitionedItem(...args);
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/store.js', 'utf8'), context);

const store = windowObject.FactoryStore;
const reservation = store.getState().reservations.find(item => String(item.id) === '2');
assert(reservation, 'Uton 예약을 찾지 못했습니다.');

store.dispatch({
    type: 'UPDATE_RESERVATION',
    payload: {
        id: reservation.id,
        changes: {
            workStatus: 'early_left',
            checkoutType: '조퇴',
            breakSeconds: 180,
            actualWorkSeconds: 1200,
            earnedPay: 3784,
            attendanceHistoryId: 999001
        }
    }
});
const attendance = store.getWorkAttendance(2).find(item => String(item.id) === String(reservation.id));
assert(attendance.workStatus === 'early_left', '조퇴 상태가 예약에 저장되지 않았습니다.');
assert(attendance.breakSeconds === 180 && attendance.actualWorkSeconds === 1200, '휴식/실근무 시간이 저장되지 않았습니다.');
assert(attendance.earnedPay === 3784 && attendance.attendanceHistoryId === 999001, '급여/이력 ID가 저장되지 않았습니다.');
store.appendReservationLog(reservation.id, {
    type: 'task',
    status: 'working',
    message: '면 삶기 단계 완료'
});
const loggedAttendance = store.getWorkAttendance(2).find(item => String(item.id) === String(reservation.id));
assert(loggedAttendance.workLogs.length === 1 && loggedAttendance.workLogs[0].type === 'task', '예약 작업 로그가 저장되지 않았습니다.');

store.dispatch({
    type: 'ADD_HISTORY_ITEM',
    payload: {
        id: 999001,
        job: 'Uton 우동만들기',
        checkInTime: '10:00:00',
        checkOutTime: '10:23:00',
        breakSeconds: 180,
        actualWorkSeconds: 1200,
        pay: 3784,
        isEarlyLeave: true,
        checkoutType: '조퇴'
    }
});
const storedHistory = JSON.parse(localStorage.getItem('mypage_history_2'));
assert(storedHistory.some(item => item.id === 999001 && item.actualWorkSeconds === 1200), '조퇴 이력이 사용자 기록에 저장되지 않았습니다.');
store.markExpiredReservationsAbsent(new Date('2026-07-23T13:00:00.000Z'));
const absent = store.getWorkAttendance(2).find(item => String(item.id) === '3');
assert(absent.workStatus === 'absent' && absent.checkoutType === '결근', '미출근 예약이 결근으로 전환되지 않았습니다.');
assert(absent.workLogs.some(log => log.type === 'absent'), '결근 로그가 예약에 저장되지 않았습니다.');

assertInlineScriptsParse('uton_real.html');
assertInlineScriptsParse('explore_detail.html');
const utonHtml = fs.readFileSync('uton_real.html', 'utf8');
assert(utonHtml.includes('조퇴하시겠어요? 5분이 지나면 자동조퇴가 됩니다.'), '조퇴 대기 안내 문구가 없습니다.');
assert(utonHtml.includes('이용해 주셔서 감사합니다.'), '조퇴 완료 안내 문구가 없습니다.');
assert(utonHtml.includes('explore_detail.html?id='), '조퇴 상세 페이지 이동이 없습니다.');

console.log('Uton 조퇴·정산·기록 연동 테스트 통과');
