const fs = require("fs");
const vm = require("vm");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

class MemoryStorage {
    constructor() {
        this.values = {};
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
}

class FakeClassList {
    constructor() {
        this.values = new Set();
    }
    add(...names) {
        names.forEach(name => this.values.add(name));
    }
    remove(...names) {
        names.forEach(name => this.values.delete(name));
    }
    toggle(name, force) {
        if (force === undefined) {
            if (this.values.has(name)) this.values.delete(name);
            else this.values.add(name);
            return this.values.has(name);
        }
        if (force) this.values.add(name);
        else this.values.delete(name);
        return force;
    }
    contains(name) {
        return this.values.has(name);
    }
}

class FakeElement {
    constructor(ownerDocument, id) {
        this.ownerDocument = ownerDocument;
        this.id = id || "";
        this.dataset = {};
        this.disabled = false;
        this.style = {};
        this.classList = new FakeClassList();
        this.listeners = {};
        this.children = [];
        this.attributes = {};
        this.textContent = "";
        this._innerHTML = "";
    }
    set innerHTML(value) {
        this._innerHTML = String(value);
        this.children = [];
        const idPattern = /\bid="([^"]+)"/g;
        let match;
        while ((match = idPattern.exec(this._innerHTML))) {
            this.ownerDocument.ensureElement(match[1]);
        }
    }
    get innerHTML() {
        return this._innerHTML;
    }
    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }
    click() {
        if (!this.disabled && this.listeners.click) this.listeners.click();
    }
    appendChild(child) {
        this.children.push(child);
    }
    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }
    querySelector(selector) {
        if (selector === ".status-badge") {
            if (!this.badge) this.badge = new FakeElement(this.ownerDocument);
            return this.badge;
        }
        return null;
    }
    scrollIntoView() {}
}

class FakeDocument {
    constructor(html) {
        this.elements = {};
        this.listeners = {};
        this.roomButtons = ["M", "F"].map(gender => {
            const element = new FakeElement(this);
            element.dataset.gender = gender;
            return element;
        });
        this.stepDots = Array.from({ length: 7 }, (_, index) => {
            const element = new FakeElement(this);
            element.dataset.dot = String(index);
            return element;
        });
        this.stepCards = Array.from({ length: 7 }, (_, index) => {
            const element = new FakeElement(this);
            element.dataset.stepCard = String(index);
            return element;
        });
        const idPattern = /\bid="([^"]+)"/g;
        let match;
        while ((match = idPattern.exec(html))) this.ensureElement(match[1]);
        this.flowHeading = new FakeElement(this);
        this.stepsIndicator = new FakeElement(this);
    }
    ensureElement(id) {
        if (!this.elements[id]) this.elements[id] = new FakeElement(this, id);
        return this.elements[id];
    }
    getElementById(id) {
        return this.ensureElement(id);
    }
    createElement() {
        return new FakeElement(this);
    }
    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }
    querySelectorAll(selector) {
        if (selector === ".room-btn") return this.roomButtons;
        if (selector === ".step-dot") return this.stepDots;
        if (selector === ".step-card") return this.stepCards;
        return [];
    }
    querySelector(selector) {
        if (selector === ".flow-heading") return this.flowHeading;
        if (selector === ".steps-indicator") return this.stepsIndicator;
        if (selector === ".step-card.active") {
            return this.stepCards.find(card => card.classList.contains("active")) || null;
        }
        if (selector === ".phone-camera") return this.getElementById("phone-camera");
        return null;
    }
}

const html = fs.readFileSync("uton_before.html", "utf8");
const inlineScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .find(script => script.includes("STEP_KEYS"));

const sessionStorage = new MemoryStorage();
const localStorage = new MemoryStorage();
const user = { id: 2, name: "최수아", email: "capegon21@gmail.com" };
const reservation = {
    id: 77,
    userId: 2,
    userName: "최수아",
    workId: 2,
    workName: "우동만들기",
    date: "2026-07-24",
    slot: 0,
    role: "general",
    time: "10:00 ~ 11:30",
    checkInSteps: {}
};
const state = { reservations: [reservation] };

sessionStorage.setItem("user", JSON.stringify(user));
sessionStorage.setItem("user_info", JSON.stringify({ gender: "F" }));
sessionStorage.setItem("selected_reservation", JSON.stringify(reservation));

const document = new FakeDocument(html);
const location = { href: "" };
const FactoryStore = {
    getState() {
        return state;
    },
    dispatch(action) {
        if (action.type !== "UPDATE_RESERVATION") return;
        const index = state.reservations.findIndex(item => String(item.id) === String(action.payload.id));
        assert(index >= 0, "갱신할 예약이 없습니다.");
        const current = state.reservations[index];
        state.reservations[index] = Object.assign({}, current, action.payload.changes, {
            checkInSteps: Object.assign({}, current.checkInSteps || {}, action.payload.changes.checkInSteps || {})
        });
    }
};

const context = {
    window: {
        AuthManager: { getCurrentUser: () => user },
        FactoryStore,
        MockData: {
            users: [{ id: 2, name: "최수아", email: "capegon21@gmail.com", gender: "F" }],
            getWorkTimeSlots: () => ({
                type: "1.5h",
                slots: [{ slot: 0, time: "10:00 ~ 11:30" }]
            })
        }
    },
    document,
    sessionStorage,
    localStorage,
    location,
    FactoryStore,
    console,
    setTimeout(callback) {
        callback();
        return 1;
    },
    clearTimeout() {},
    setInterval() {
        return 1;
    },
    clearInterval() {}
};
context.window.window = context.window;
context.window.sessionStorage = sessionStorage;
context.window.localStorage = localStorage;
context.window.location = location;

vm.createContext(context);
vm.runInContext(inlineScript, context);
document.listeners.DOMContentLoaded();

assert(document.stepCards[0].classList.contains("active"), "첫 단계가 활성화되지 않았습니다.");
document.getElementById("scan-qr-btn").click();
assert(state.reservations[0].checkInAt, "QR 출근 시각이 저장되지 않았습니다.");
assert(state.reservations[0].workStatus === "checked_in", "출근 상태가 저장되지 않았습니다.");
assert(document.roomButtons[0].disabled, "여성 회원에게 남성 락커룸이 활성화되었습니다.");
assert(!document.roomButtons[1].disabled, "여성 락커룸이 활성화되지 않았습니다.");

document.getElementById("confirm-room-btn").click();
assert(state.reservations[0].lockerGender === "F", "락커 성별이 저장되지 않았습니다.");
const lockerGrid = document.getElementById("locker-grid");
assert(lockerGrid.children.length === 20, "락커 번호 20개가 생성되지 않았습니다.");
lockerGrid.children[6].click();
assert(state.reservations[0].lockerNumber === 7, "락커 번호가 즉시 저장되지 않았습니다.");

document.getElementById("confirm-clothes-btn").click();
document.getElementById("confirm-uniform-btn").click();
document.getElementById("skip-wash-btn").click();
assert(state.reservations[0].handWashSkipped === true, "손씻기 건너뛰기 상태가 저장되지 않았습니다.");
document.getElementById("confirm-sanitizer-btn").click();
document.getElementById("capture-hand-btn").click();
assert(state.reservations[0].handPhotoStatus === "approved", "손 사진이 자동 승인되지 않았습니다.");
assert(state.reservations[0].handPhotoVerifiedAt, "손 사진 승인 시각이 저장되지 않았습니다.");

document.getElementById("enter-shop-btn").click();
assert(state.reservations[0].preWorkStatus === "verified", "출근 전 인증 완료 상태가 저장되지 않았습니다.");
assert(state.reservations[0].workStatus === "ready", "작업 준비 상태가 저장되지 않았습니다.");
assert(location.href === "uton_real.html", "최종 목적지가 uton_real.html이 아닙니다.");

console.log("Uton 출근 준비 전체 흐름 테스트 통과");
