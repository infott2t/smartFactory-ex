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

const localStorage = new MemoryStorage({
    app_reservations_db: JSON.stringify([
        { id: 1, userId: 2, workId: 2, date: "2026-07-24", slot: 0, workStatus: "reserved" },
        { id: 2, userId: 2, workId: 1, date: "2026-07-24", slot: 1, workStatus: "reserved" }
    ]),
    kimp_shop_history: JSON.stringify([
        { id: "order-1", userId: 2, workId: 2, productId: 20001, status: "queued" }
    ])
});
const sessionStorage = new MemoryStorage({
    user: JSON.stringify({ id: 2, name: "Test User", email: "test@example.com" })
});
const windowObject = {
    localStorage,
    sessionStorage,
    addEventListener() {},
    dispatchEvent() {}
};
windowObject.window = windowObject;

const context = {
    window: windowObject,
    localStorage,
    sessionStorage,
    console,
    Event: class Event { constructor(type) { this.type = type; } },
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
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
assert(store, "FactoryStore must be created.");

const tables = store.getTables();
assert(Array.isArray(tables.users) && tables.users.length >= 4, "users table should expose mock users.");
assert(Array.isArray(tables.works) && tables.works.some(work => Number(work.workId) === 2), "works table should expose work rows.");
assert(Array.isArray(tables.workReservations) && tables.workReservations.length === 2, "workReservations table should expose reservations.");
assert(Array.isArray(tables.shopOrders) && tables.shopOrders.length === 1, "shopOrders table should expose shop history.");
assert(store.getState().shopHistory.length === 0, "kimp_shop_history should not retain Uton orders after migration.");
assert(store.getState().utonShopHistory.length === 1, "uton_shop_history should receive migrated Uton orders.");
assert(JSON.parse(localStorage.getItem("kimp_shop_history")).length === 0, "legacy Uton order should be removed from kimp_shop_history.");
assert(JSON.parse(localStorage.getItem("uton_shop_history")).length === 1, "migrated Uton order should be saved to uton_shop_history.");
assert(Array.isArray(store.getProducts({ workId: 2 })), "getProducts should support workId filters.");
assert(store.getReservations({ workId: 2 }).length === 1, "getReservations should support workId filters.");
assert(store.tableSources.workReservations.includes("app_reservations_db"), "tableSources should document reservation storage.");
assert(store.getState().users.length === tables.users.length, "getState should include master user rows.");

console.log("FactoryStore table selector test passed");
