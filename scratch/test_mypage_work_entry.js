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
        localStorage.setItem("app_reservations_db", JSON.stringify([
            {
                id: 8802,
                userId: 2,
                userName: "최수아",
                workId: 2,
                workName: "우동만들기",
                brandName: "Uton",
                iconUrl: "./images/Uton_150x150.png",
                date: "2026-07-23",
                slot: 0,
                role: "general",
                workStatus: "ready",
                preWorkStatus: "verified",
                handPhotoStatus: "approved",
                checkInAt: "2026-07-23T01:00:00.000Z",
                checkInSteps: { shopEntry: true }
            }
        ]));
    });

    await page.goto("http://127.0.0.1:8765/mypage2.html?tab=shopping", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const button = page.locator("button.res-check-in-btn", { hasText: "근무 진행 중" });
    assert(await button.count() === 1, "근무 진행 중 버튼이 하나 보여야 합니다.");
    assert(await button.isEnabled(), "근무 진행 중 버튼은 클릭 가능해야 합니다.");

    await button.click();
    await page.waitForURL("**/uton_real.html", { timeout: 5000 });
    const selected = await page.evaluate(() => JSON.parse(sessionStorage.getItem("selected_reservation") || "null"));
    await browser.close();

    const meaningfulErrors = errors.filter(message => !message.includes("Failed to load resource"));
    assert(meaningfulErrors.length === 0, `console errors: ${meaningfulErrors.join(" | ")}`);
    assert(selected && Number(selected.workId) === 2, "선택 예약이 세션에 저장되어야 합니다.");
    console.log("Mypage work entry test passed");
})();
