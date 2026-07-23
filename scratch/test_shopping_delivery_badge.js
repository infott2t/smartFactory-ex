const { chromium } = require("playwright");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", error => errors.push(error.message));

    await page.addInitScript(() => {
        const user = { id: 2, name: "최수아", email: "capegon21@gmail.com" };
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("kimp_shop_history", JSON.stringify([
            {
                id: "ord_test_delivery",
                orderNo: "924",
                orderDate: "2026-07-23",
                dateStr: "2026.07.23",
                userId: 2,
                userName: "최수아",
                productName: "300g 맛김치 팩",
                productId: "p300g",
                brandName: "AFood",
                price: 3000,
                qty: 1,
                status: "completed",
                fulfillmentType: "delivery",
                deliveryStatus: "ordered"
            }
        ]));
    });

    await page.goto("http://127.0.0.1:8765/mypage2.html?tab=shopping", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const text = await page.locator("#shop-history-container").innerText({ timeout: 5000 });
    await browser.close();

    const meaningfulErrors = errors.filter(message => !message.includes("Failed to load resource"));
    assert(meaningfulErrors.length === 0, `console errors: ${meaningfulErrors.join(" | ")}`);
    assert(text.includes("배송 준비중"), "배송 상품 결제 직후에는 배송 준비중 뱃지가 보여야 합니다.");
    assert(!text.includes("수령 완료"), "배송 완료 전 배송 상품에 수령 완료 뱃지가 보이면 안 됩니다.");
    console.log("Shopping delivery badge test passed");
})();
