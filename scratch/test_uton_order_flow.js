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
}

function assertInlineScriptsParse(fileName) {
    const html = fs.readFileSync(fileName, "utf8");
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
        .map(match => match[1])
        .filter(script => script.trim());
    scripts.forEach((script, index) => {
        try {
            new Function(script);
        } catch (error) {
            throw new Error(`${fileName} 인라인 스크립트 ${index + 1} 구문 오류: ${error.message}`);
        }
    });
}

const legacyUtonOrder = {
    id: "legacy-uton",
    orderNo: 321,
    productName: "정통 가쓰오 우동",
    qty: 1,
    price: 3000,
    status: "pending"
};
const deliveryOrder = {
    id: "delivery-1",
    orderNo: "450",
    productId: "kimchi_01",
    productName: "맛김치",
    status: "pending"
};
const localStorage = new MemoryStorage({
    kimp_shop_history: JSON.stringify([legacyUtonOrder, deliveryOrder])
});
const sessionStorage = new MemoryStorage({
    "user-id": "local-capegon21@gmail.com",
    user: JSON.stringify({ id: 2, name: "최수아", email: "capegon21@gmail.com" })
});
const windowObject = {
    localStorage,
    sessionStorage,
    addEventListener() {},
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
assert(store && typeof store.getShopOrders === "function", "주문 조회 API가 생성되지 않았습니다.");

let utonOrders = store.getShopOrders({ workId: 2 });
assert(utonOrders.length === 1, "레거시 Uton 주문의 workId 추론에 실패했습니다.");
assert(utonOrders[0].orderNo === "321", "레거시 주문번호 문자열 정규화에 실패했습니다.");
assert(utonOrders[0].menuType === "udon", "레거시 메뉴 종류 추론에 실패했습니다.");
assert(utonOrders[0].kitchenStatus === "queued", "레거시 주방 대기 상태 보완에 실패했습니다.");

const orderedAt = "2026-07-23T05:00:00.000Z";
store.dispatch({
    type: "ADD_SHOP_ORDER",
    payload: {
        id: "ord-20002",
        orderNo: "654",
        userId: 2,
        userName: "최수아",
        workId: 2,
        productId: 20002,
        productCode: "p2",
        productName: "감칠맛 간장 비빔면",
        qty: 1,
        unitPrice: 3000,
        price: 3000,
        status: "pending",
        kitchenStatus: "queued",
        orderedAt
    }
});

utonOrders = store.getShopOrders({ workId: 2, status: "pending", menuType: "bibim" });
assert(utonOrders.length === 1 && utonOrders[0].orderNo === "654", "신규 주문 식별자 조회에 실패했습니다.");
assert(
    JSON.parse(localStorage.getItem("kimp_shop_history")).some(order => order.orderNo === "654"),
    "주문번호가 kimp_shop_history에 저장되지 않았습니다."
);

store.dispatch({
    type: "UPDATE_SHOP_ORDER",
    payload: {
        id: "ord-20002",
        changes: { kitchenStatus: "preparing", preparingAt: orderedAt }
    }
});
assert(
    store.getShopOrders({ kitchenStatus: "preparing" })[0].orderNo === "654",
    "조리 시작 상태 저장에 실패했습니다."
);

store.dispatch({
    type: "UPDATE_SHOP_ORDER",
    payload: {
        id: "ord-20002",
        changes: { kitchenStatus: "ready", readyAt: orderedAt }
    }
});
assert(
    store.getShopOrders({ workId: 2, kitchenStatus: "ready" })[0].orderNo === "654",
    "수령 가능 상태 저장에 실패했습니다."
);

store.dispatch({ type: "COMPLETE_SHOP_ORDER", payload: "ord-20002" });
const receivedOrder = store.getShopOrders({ userId: 2, status: "completed" })[0];
assert(receivedOrder.kitchenStatus === "received", "수령 완료 주방 상태 저장에 실패했습니다.");
assert(receivedOrder.completedAt, "수령 완료 시각이 저장되지 않았습니다.");

receivedOrder.orderNo = "변조";
assert(
    store.getShopOrders({ userId: 2, status: "completed" })[0].orderNo === "654",
    "주문 조회 결과가 Store 원본을 노출합니다."
);

assertInlineScriptsParse("kimp_detail.html");
assertInlineScriptsParse("mypage2.html");
assertInlineScriptsParse("uton_real.html");
assertInlineScriptsParse("explore2.html");
const utonMap = fs.readFileSync("images/work-map-uton.svg", "utf8");
assert(!utonMap.includes("Task 1") && !utonMap.includes("Task 2-3") && !utonMap.includes("Task 4-5"), "Uton 지도에 제거 대상 Task 영역이 남아 있습니다.");
const utonRealHtml = fs.readFileSync("uton_real.html", "utf8");
assert(utonRealHtml.includes("getLoungeStorageKey") && utonRealHtml.includes("loadReservationLoungeState"), "예약별 작업 로그 저장 키가 연결되지 않았습니다.");

const utonHtml = fs.readFileSync("uton_real.html", "utf8");
assert(utonHtml.includes("실시간 주문 대기"), "Uton 주문 대기 UI가 없습니다.");
assert(utonHtml.includes("UPDATE_SHOP_ORDER"), "Uton 주문 상태 연동이 없습니다.");
assert(utonHtml.includes("주문번호 #"), "Uton 현재 주문번호 표시가 없습니다.");

console.log("Uton 주문번호·주방 상태 연동 테스트 통과");
