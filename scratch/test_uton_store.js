const fs = require("fs");
const vm = require("vm");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

class MemoryStorage {
    constructor(initial) {
        this.values = Object.assign({}, initial || {});
    }
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null;
    }
    setItem(key, value) {
        this.values[key] = String(value);
    }
    removeItem(key) {
        delete this.values[key];
    }
    clear() {
        this.values = {};
    }
}

const selectedReservation = {
    id: 501,
    userId: 2,
    userName: "최수아",
    workId: 2,
    date: "2026-07-24",
    slot: 0,
    status: "reserved"
};
const fallbackReservation = {
    userId: 2,
    userName: "최수아",
    workId: 2,
    date: "2026-07-25",
    slot: 1,
    status: "reserved"
};
const otherWorkReservation = {
    id: 502,
    userId: 2,
    userName: "최수아",
    workId: 1,
    date: "2026-07-24",
    slot: 0,
    status: "reserved"
};

const localStorage = new MemoryStorage({
    app_reservations_db: JSON.stringify([
        selectedReservation,
        Object.assign({}, selectedReservation, {
            id: 999,
            workStatus: "working",
            workLogs: [{ type: "task", message: "중복 데이터 우선 보존" }]
        }),
        fallbackReservation,
        otherWorkReservation
    ])
});
const sessionStorage = new MemoryStorage({
    "user-id": "local-capegon21@gmail.com",
    user: JSON.stringify({ id: 2, name: "최수아", email: "capegon21@gmail.com" }),
    selected_reservation: JSON.stringify(selectedReservation)
});

const listeners = {};
const windowObject = {
    localStorage,
    sessionStorage,
    addEventListener(type, handler) {
        listeners[type] = handler;
    },
    dispatchEvent() {},
    MockData: null
};
windowObject.window = windowObject;

const context = {
    window: windowObject,
    localStorage,
    sessionStorage,
    console,
    Event: class Event {
        constructor(type) {
            this.type = type;
        }
    },
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    parseInt,
    setTimeout,
    clearTimeout,
    getStorageKey(...args) {
        return windowObject.getStorageKey(...args);
    },
    getPartitionedItem(...args) {
        return windowObject.getPartitionedItem(...args);
    },
    setPartitionedItem(...args) {
        return windowObject.setPartitionedItem(...args);
    },
    removePartitionedItem(...args) {
        return windowObject.removePartitionedItem(...args);
    }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("js/store.js", "utf8"), context);

const store = windowObject.FactoryStore;
assert(store.getState().reservations.filter(item => item.workId === 2 && item.date === "2026-07-24" && item.slot === 0).length === 1, "동일 예약이 Store에서 중복 제거되지 않았습니다.");
assert(store, "FactoryStore가 생성되지 않았습니다.");

let attendance = store.getWorkAttendance(2);
assert(attendance.length === 2, "workId 2 예약 필터가 올바르지 않습니다.");
assert(attendance[0].preWorkStatus === "not_started", "레거시 예약 기본 상태가 보완되지 않았습니다.");
assert(attendance[0].checkInSteps.handPhoto === false, "손 사진 기본 단계가 보완되지 않았습니다.");

const checkInAt = "2026-07-24T01:00:00.000Z";
store.dispatch({
    type: "UPDATE_RESERVATION",
    payload: {
        id: 501,
        match: { userId: 2, workId: 2, date: "2026-07-24", slot: 0 },
        changes: {
            checkInAt,
            lockerGender: "F",
            lockerNumber: 7,
            workStatus: "checked_in",
            checkInSteps: { qr: true, lockerRoom: true, lockerNumber: true }
        }
    }
});

attendance = store.getWorkAttendance(2);
const updated = attendance.find(item => item.id === 501);
assert(updated.checkInAt === checkInAt, "출근 시각이 Store에 저장되지 않았습니다.");
assert(updated.lockerGender === "F" && updated.lockerNumber === 7, "락커 정보가 저장되지 않았습니다.");
assert(updated.checkInSteps.qr && updated.checkInSteps.lockerNumber, "단계 상태가 병합되지 않았습니다.");

const persisted = JSON.parse(localStorage.getItem("app_reservations_db"));
assert(persisted.find(item => item.id === 501).checkInAt === checkInAt, "공유 예약 DB에 저장되지 않았습니다.");
const selected = JSON.parse(sessionStorage.getItem("selected_reservation"));
assert(selected.checkInAt === checkInAt, "선택 예약 세션이 동기화되지 않았습니다.");

store.dispatch({
    type: "UPDATE_RESERVATION",
    payload: {
        id: null,
        match: { userId: 2, workId: 2, date: "2026-07-25", slot: 1 },
        changes: { handPhotoStatus: "approved" }
    }
});
attendance = store.getWorkAttendance(2);
assert(
    attendance.find(item => item.date === "2026-07-25").handPhotoStatus === "approved",
    "복합키 예약 갱신이 동작하지 않습니다."
);

attendance[0].lockerNumber = 99;
assert(store.getWorkAttendance(2)[0].lockerNumber !== 99, "조회 결과가 Store 원본을 노출합니다.");

const mockReservations = windowObject.MockData.getReservations("2026-07-23", "2026-07-24", "2026-07-25");
assert(mockReservations.every(item => item.checkInSteps && item.workStatus === "reserved"), "Mock 예약 기본값이 누락되었습니다.");

console.log("Uton 공유 예약 Store 테스트 통과");
