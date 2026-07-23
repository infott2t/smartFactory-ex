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
        sessionStorage.setItem("user", JSON.stringify({
            id: 2,
            name: "최수아",
            email: "capegon21@gmail.com"
        }));
        localStorage.setItem("mypage_history_2", JSON.stringify([
            {
                id: "hist_general_role",
                date: "2026-07-23",
                time: "10:00 ~ 12:00",
                job: "김치만들기",
                role: "general",
                pay: 40000,
                status: "완료"
            }
        ]));
    });

    await page.goto("http://127.0.0.1:8765/explore2.html?tab=history", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const text = await page.locator("body").innerText({ timeout: 5000 });
    await browser.close();

    const meaningfulErrors = errors.filter(message => !message.includes("Failed to load resource"));
    assert(meaningfulErrors.length === 0, `console errors: ${meaningfulErrors.join(" | ")}`);
    assert(text.includes("일반"), "general role should be displayed as 일반.");
    assert(!text.includes("general"), "Raw general role text should not be rendered.");
    console.log("Explore2 role label test passed");
})();
