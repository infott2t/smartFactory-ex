const { chromium } = require("playwright");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function checkPage(page, path, probe) {
    const errors = [];
    page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", error => {
        errors.push(error.message);
    });

    await page.goto(`http://127.0.0.1:8765/${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const result = await page.evaluate(probe);
    const meaningfulErrors = errors.filter(message =>
        !message.includes("favicon") &&
        !message.includes("Failed to load resource")
    );
    return { path, result, errors: meaningfulErrors };
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    const checks = [];
    checks.push(await checkPage(page, "explore.html", () => ({
        hasStore: !!window.FactoryStore,
        works: window.FactoryStore?.getWorks?.().length || 0,
        cards: document.querySelectorAll(".task-item, .task-card, [data-id]").length,
        textLength: document.body.innerText.trim().length
    })));
    checks.push(await checkPage(page, "work_detail.html?id=2", () => ({
        hasStore: !!window.FactoryStore,
        detailKeys: Object.keys(window.FactoryStore?.getWorkDetails?.() || {}).length,
        reservations: window.FactoryStore?.getReservations?.({ workId: 2 }).length || 0,
        buttons: document.querySelectorAll("button").length,
        textLength: document.body.innerText.trim().length
    })));
    checks.push(await checkPage(page, "mypage2.html", () => ({
        hasStore: !!window.FactoryStore,
        reservations: window.FactoryStore?.getReservations?.().length || 0,
        products: window.FactoryStore?.getProducts?.().length || 0,
        cards: document.querySelectorAll(".box-partner, .order-item, .delivery-card").length,
        textLength: document.body.innerText.trim().length
    })));
    checks.push(await checkPage(page, "order_pay.html?productId=20001&qty=1", () => ({
        hasStore: !!window.FactoryStore,
        products: window.FactoryStore?.getProducts?.().length || 0,
        textLength: document.body.innerText.trim().length
    })));
    checks.push(await checkPage(page, "delivery_detail.html?productId=20001", () => ({
        hasStore: !!window.FactoryStore,
        products: window.FactoryStore?.getProducts?.().length || 0,
        textLength: document.body.innerText.trim().length
    })));
    checks.push(await checkPage(page, "uton_before.html", () => ({
        hasStore: !!window.FactoryStore,
        reservations: window.FactoryStore?.getReservations?.().length || 0,
        textLength: document.body.innerText.trim().length
    })));

    await browser.close();

    checks.forEach(check => {
        assert(check.result.hasStore, `${check.path}: FactoryStore was not loaded.`);
        assert(check.result.textLength > 0, `${check.path}: page rendered no text.`);
        assert(check.errors.length === 0, `${check.path}: console errors: ${check.errors.join(" | ")}`);
    });
    assert(checks[0].result.works > 0, "explore.html: works were not loaded.");
    assert(checks[1].result.detailKeys > 0, "work_detail.html: work details were not loaded.");
    assert(checks[2].result.products > 0, "mypage2.html: products were not loaded.");
    assert(checks[3].result.products > 0, "order_pay.html: products were not loaded.");
    assert(checks[4].result.products > 0, "delivery_detail.html: products were not loaded.");

    console.log(JSON.stringify(checks, null, 2));
})();
