const { chromium } = require("playwright");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function assertBlockedEntry(browser, workStatus) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("console", msg => {
        if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", error => errors.push(error.message));
    page.on("dialog", dialog => dialog.accept());

    await page.addInitScript(status => {
        const reservation = {
            id: `guard-${status}`,
            userId: 2,
            userName: "Test User",
            workId: 2,
            workName: "Uton work",
            brandName: "Uton",
            date: "2026-07-23",
            slot: 0,
            role: "general",
            workStatus: status,
            preWorkStatus: "verified",
            handPhotoStatus: "approved",
            checkInAt: "2026-07-23T01:00:00.000Z",
            workStartedAt: "2026-07-23T01:05:00.000Z",
            workCompletedAt: status === "completed" ? "2026-07-23T03:00:00.000Z" : null,
            earlyLeaveCompletedAt: status === "early_left" ? "2026-07-23T02:00:00.000Z" : null,
            checkInSteps: { shopEntry: true }
        };
        const user = { id: 2, name: "Test User", email: "test@example.com" };
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("selected_reservation", JSON.stringify(reservation));
        localStorage.setItem("app_reservations_db", JSON.stringify([reservation]));
    }, workStatus);

    await page.goto("http://127.0.0.1:8765/uton_real.html", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/mypage2.html?tab=shopping", { timeout: 5000 });

    const selected = await page.evaluate(() => JSON.parse(sessionStorage.getItem("selected_reservation") || "null"));
    await page.close();

    const meaningfulErrors = errors.filter(message => !message.includes("Failed to load resource"));
    assert(meaningfulErrors.length === 0, `console errors for ${workStatus}: ${meaningfulErrors.join(" | ")}`);
    assert(selected && selected.workStatus === workStatus, `selected reservation was not preserved for ${workStatus}`);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        await assertBlockedEntry(browser, "early_left");
        await assertBlockedEntry(browser, "completed");
    } finally {
        await browser.close();
    }
    console.log("Uton closed work entry guard test passed");
})();
