(function () {
    "use strict";

    const footerItems = [
        { key: "home", label: "홈", icon: "bi-house-door", activeIcon: "bi-house-door-fill", href: "./main.html" },
        { key: "jobs", label: "일찾기", icon: "bi-search", activeIcon: "bi-search", href: "./explore.html" },
        { key: "schedule", label: "내 일정", icon: "bi-calendar3", activeIcon: "bi-calendar2-check-fill", href: "./explore2.html?tab=reservation" },
        { key: "mypage", label: "마이페이지", icon: "bi-person", activeIcon: "bi-person-fill", href: "./mypage2.html" }
    ];

    function getActiveKey() {
        const explicitKey = document.body && document.body.dataset.appFooterActive;
        if (explicitKey) return explicitKey;

        const pageName = (window.location.pathname.split("/").pop() || "main.html").toLowerCase();
        if (pageName === "main.html" || pageName === "") return "home";
        if (pageName === "explore.html" || pageName === "work_detail.html") return "jobs";
        if (pageName === "explore2.html") return "schedule";
        if (pageName === "mypage2.html" || pageName === "settings.html") return "mypage";
        return "";
    }

    function renderAppFooter() {
        if (!document.body || document.querySelector(".app-footer-shell")) return;

        const activeKey = getActiveKey();
        const shell = document.createElement("div");
        shell.className = "app-footer-shell";

        const nav = document.createElement("nav");
        nav.className = "app-footer-nav";
        nav.setAttribute("aria-label", "주요 메뉴");

        footerItems.forEach(function (item) {
            const isActive = item.key === activeKey;
            const link = document.createElement("a");
            link.className = "app-footer-item" + (isActive ? " is-active" : "");
            link.href = item.href;
            link.dataset.footerKey = item.key;
            link.setAttribute("aria-label", item.label);
            if (isActive) link.setAttribute("aria-current", "page");

            const icon = document.createElement("i");
            icon.className = "bi " + (isActive ? item.activeIcon : item.icon);
            icon.setAttribute("aria-hidden", "true");

            link.appendChild(icon);
            nav.appendChild(link);
        });

        shell.appendChild(nav);
        document.body.classList.add("app-footer-enabled");
        document.body.appendChild(shell);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderAppFooter, { once: true });
    } else {
        renderAppFooter();
    }
})();
