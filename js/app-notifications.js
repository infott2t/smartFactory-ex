(function () {
    "use strict";

    const STORAGE_PREFIX = "app_notifications_";
    const MAX_NOTIFICATIONS = 100;
    const NOTIFICATION_PAGE_URL = "./notifications.html";
    const MOUNT_RETRY_INTERVAL_MS = 300;
    const MOUNT_RETRY_LIMIT = 20;
    let mountRetryTimer = null;
    const CLOSED_STATUSES = ["completed", "complete", "cancelled", "canceled", "absent", "early_leave", "finished"];
    let notifications = [];
    let storageKey = "";
    let bellButton = null;
    let badge = null;
    let panel = null;
    let list = null;
    let countLabel = null;
    let markAllButton = null;
    let initialized = false;

    function getCurrentUser() {
        if (window.AuthManager && typeof window.AuthManager.getCurrentUser === "function") {
            const user = window.AuthManager.getCurrentUser();
            if (user) return user;
        }
        try {
            return JSON.parse(sessionStorage.getItem("user") || "null");
        } catch (error) {
            return null;
        }
    }

    function getUserStorageKey() {
        const user = getCurrentUser() || {};
        const identity = user.id || user.email || user.name || sessionStorage.getItem("user-id") || "guest";
        return STORAGE_PREFIX + encodeURIComponent(String(identity));
    }

    function normalizeNotification(value) {
        if (!value || typeof value !== "object") return null;
        return {
            id: String(value.id || ("notification-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8))),
            title: String(value.title || "알림"),
            message: String(value.message || ""),
            type: String(value.type || "info"),
            href: value.href ? String(value.href) : "",
            createdAt: value.createdAt || new Date().toISOString(),
            readAt: value.readAt || null,
            dedupeKey: value.dedupeKey ? String(value.dedupeKey) : ""
        };
    }

    function loadNotifications() {
        storageKey = getUserStorageKey();
        try {
            const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
            notifications = Array.isArray(parsed) ? parsed.map(normalizeNotification).filter(Boolean) : [];
        } catch (error) {
            notifications = [];
        }
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    function saveNotifications() {
        notifications = notifications.slice(0, MAX_NOTIFICATIONS);
        localStorage.setItem(storageKey, JSON.stringify(notifications));
        render();
        window.dispatchEvent(new CustomEvent("app:notifications-changed", {
            detail: { notifications: getAll(), unreadCount: getUnreadCount() }
        }));
    }

    function getAll() {
        return notifications.map(item => ({ ...item }));
    }

    function getUnreadCount() {
        return notifications.filter(item => !item.readAt).length;
    }

    function getTypeIcon(type) {
        const icons = {
            reservation: "bi-calendar2-check-fill",
            success: "bi-check-circle-fill",
            warning: "bi-exclamation-triangle-fill",
            work: "bi-briefcase-fill",
            shopping: "bi-bag-check-fill",
            info: "bi-info-circle-fill"
        };
        return icons[type] || icons.info;
    }

    function formatRelativeTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const diff = Date.now() - date.getTime();
        if (diff < 60000) return "방금 전";
        if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + "분 전";
        if (diff < 86400000) return Math.floor(diff / 3600000) + "시간 전";
        return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function render() {
        if (!initialized || !badge || !list) return;
        const unreadCount = getUnreadCount();
        badge.hidden = unreadCount === 0;
        badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        countLabel.textContent = unreadCount ? "읽지 않음 " + unreadCount + "개" : "모두 확인함";
        markAllButton.disabled = unreadCount === 0;
        list.textContent = "";

        if (notifications.length === 0) {
            const empty = createElement("div", "app-notification-empty");
            const icon = createElement("i", "bi bi-bell-slash");
            icon.setAttribute("aria-hidden", "true");
            empty.appendChild(icon);
            empty.appendChild(createElement("span", "", "새로운 알림이 없습니다."));
            list.appendChild(empty);
            return;
        }

        notifications.forEach(item => {
            const button = createElement("button", "app-notification-item" + (!item.readAt ? " is-unread" : ""));
            button.type = "button";
            button.dataset.notificationId = item.id;
            button.setAttribute("aria-label", item.title + (item.readAt ? "" : ", 읽지 않음"));

            const iconWrap = createElement("span", "app-notification-item__icon");
            const icon = createElement("i", "bi " + getTypeIcon(item.type));
            icon.setAttribute("aria-hidden", "true");
            iconWrap.appendChild(icon);

            const content = createElement("span", "app-notification-item__content");
            content.appendChild(createElement("span", "app-notification-item__title", item.title));
            if (item.message) content.appendChild(createElement("span", "app-notification-item__message", item.message));
            content.appendChild(createElement("span", "app-notification-item__time", formatRelativeTime(item.createdAt)));

            button.appendChild(iconWrap);
            button.appendChild(content);
            button.addEventListener("click", function () {
                markRead(item.id);
                if (item.href) window.location.href = item.href;
            });
            list.appendChild(button);
        });
    }

    function notify(input) {
        const item = normalizeNotification(input || {});
        if (!item) return null;
        if (item.dedupeKey) {
            const existing = notifications.find(notification => notification.dedupeKey === item.dedupeKey);
            if (existing) return { ...existing };
        }
        notifications.unshift(item);
        saveNotifications();
        return { ...item };
    }

    function markRead(id) {
        const item = notifications.find(notification => notification.id === String(id));
        if (!item || item.readAt) return item ? { ...item } : null;
        item.readAt = new Date().toISOString();
        saveNotifications();
        return { ...item };
    }

    function markAllRead() {
        const readAt = new Date().toISOString();
        let changed = false;
        notifications.forEach(item => {
            if (!item.readAt) {
                item.readAt = readAt;
                changed = true;
            }
        });
        if (changed) saveNotifications();
        return getAll();
    }

    function remove(id) {
        const originalLength = notifications.length;
        notifications = notifications.filter(item => item.id !== String(id));
        if (notifications.length !== originalLength) saveNotifications();
    }

    function clear() {
        notifications = [];
        saveNotifications();
    }

    function positionPanel() {
        if (!panel || !bellButton) return;
        const rect = bellButton.getBoundingClientRect();
        panel.style.top = Math.round(rect.bottom + 8) + "px";
        panel.style.right = Math.max(12, Math.round(window.innerWidth - rect.right)) + "px";
        panel.style.left = "auto";
    }

    function openPanel() {
        if (!panel || !bellButton) return;
        panel.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
        bellButton.setAttribute("aria-expanded", "true");
        positionPanel();
        const firstTarget = panel.querySelector("button:not(:disabled)");
        if (firstTarget) firstTarget.focus({ preventScroll: true });
    }

    function closePanel(options) {
        if (!panel || !bellButton) return;
        panel.classList.remove("is-open");
        panel.setAttribute("aria-hidden", "true");
        bellButton.setAttribute("aria-expanded", "false");
        if (options && options.restoreFocus) bellButton.focus({ preventScroll: true });
    }

    function togglePanel() {
        if (panel.classList.contains("is-open")) closePanel({ restoreFocus: true });
        else openPanel();
    }

    function findHeaderTarget() {
        const mainMemberControl = document.querySelector("header.header .main-member-control .h-open-btn");
        if (mainMemberControl) {
            const mainRightHeader = document.querySelector("header.header .h-bar");
            if (mainRightHeader) return { header: mainRightHeader, memberControl: null };
        }

        const memberControl = document.querySelector(".header .h-open-btn, .menu-bar .h-open-btn, .menu-bar .header-icon");
        if (memberControl && memberControl.parentElement) {
            return { header: memberControl.parentElement, memberControl: memberControl };
        }
        const header = document.querySelector(".fixed-header-wrap .menu-bar, .header-wrap .header.menu-bar, .header-wrap .header, header.header, header.app-header");
        return header ? { header: header, memberControl: null } : null;
    }

    function mountHeaderButton() {
        const target = findHeaderTarget();
        if (!target) return false;
        const actions = createElement("div", "app-header-actions");
        bellButton = createElement("button", "app-notification-bell");
        bellButton.type = "button";
        bellButton.setAttribute("aria-label", "알림");
        bellButton.setAttribute("aria-expanded", "false");
        bellButton.setAttribute("aria-controls", "app-notification-panel");
        const icon = createElement("i", "bi bi-bell");
        icon.setAttribute("aria-hidden", "true");
        badge = createElement("span", "app-notification-badge", "0");
        badge.hidden = true;
        badge.setAttribute("aria-hidden", "true");
        bellButton.appendChild(icon);
        bellButton.appendChild(badge);
        actions.appendChild(bellButton);

        if (target.memberControl) {
            target.header.insertBefore(actions, target.memberControl);
            actions.appendChild(target.memberControl);
        } else {
            target.header.appendChild(actions);
        }
        target.header.classList.add("app-notification-host");
        bellButton.addEventListener("click", togglePanel);
        return true;
    }

    function mountPanel() {
        panel = createElement("section", "app-notification-panel");
        panel.id = "app-notification-panel";
        panel.setAttribute("aria-label", "알림 목록");
        panel.setAttribute("aria-hidden", "true");

        const header = createElement("div", "app-notification-panel__header");
        // 헤더 상단(제목 영역)을 누르면 알림 전체 페이지로 이동합니다.
        const title = createElement("a", "app-notification-panel__title");
        title.href = NOTIFICATION_PAGE_URL;
        title.setAttribute("role", "heading");
        title.setAttribute("aria-level", "2");
        title.appendChild(document.createTextNode("알림"));
        countLabel = createElement("span", "app-notification-panel__count", "모두 확인함");
        title.appendChild(countLabel);
        const titleChevron = createElement("i", "bi bi-chevron-right app-notification-panel__title-arrow");
        titleChevron.setAttribute("aria-hidden", "true");
        title.appendChild(titleChevron);
        markAllButton = createElement("button", "app-notification-mark-all", "모두 읽음");
        markAllButton.type = "button";
        markAllButton.addEventListener("click", markAllRead);
        header.appendChild(title);
        header.appendChild(markAllButton);
        // 제목 이외의 헤더 빈 영역을 눌러도 동일하게 이동시킵니다. ('모두 읽음' 버튼은 제외)
        header.addEventListener("click", function (event) {
            if (markAllButton.contains(event.target) || title.contains(event.target)) return;
            window.location.href = NOTIFICATION_PAGE_URL;
        });

        list = createElement("div", "app-notification-list");
        panel.appendChild(header);
        panel.appendChild(list);
        document.body.appendChild(panel);
    }

    function getDateKey(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }

    function getReservationTime(reservation) {
        if (window.MockData && typeof window.MockData.getWorkTimeSlots === "function") {
            const config = window.MockData.getWorkTimeSlots(reservation.workId || 1);
            const slot = config && Array.isArray(config.slots)
                ? config.slots.find(value => String(value.slot) === String(reservation.slot))
                : null;
            if (slot && slot.time) return slot.time;
        }
        return ["10:00 ~ 12:00", "13:00 ~ 15:00", "15:00 ~ 17:00"][Number(reservation.slot)] || "시간 확인 필요";
    }

    function getReservationWorkName(reservation) {
        if (reservation.workName) return reservation.workName;
        if (window.FactoryStore && typeof window.FactoryStore.getWorks === "function") {
            const work = window.FactoryStore.getWorks().find(item => String(item.workId) === String(reservation.workId || 1));
            if (work) return work.workName;
        }
        return String(reservation.workId) === "2" ? "우동만들기" : "김치만들기";
    }

    function syncReservationNotifications() {
        if (!initialized || !window.FactoryStore || typeof window.FactoryStore.getReservations !== "function") return;
        const user = getCurrentUser();
        if (!user) return;
        const today = getDateKey(new Date());
        const reservations = window.FactoryStore.getReservations().filter(reservation => {
            const belongsToUser = String(reservation.userId) === String(user.id)
                || (reservation.userName && reservation.userName === user.name);
            const status = String(reservation.workStatus || reservation.status || "reserved").toLowerCase();
            return belongsToUser && String(reservation.date || "") >= today && !CLOSED_STATUSES.includes(status);
        });

        reservations.forEach(reservation => {
            const workName = getReservationWorkName(reservation);
            const identity = reservation.id || [reservation.userId || reservation.userName, reservation.workId || 1, reservation.date, reservation.slot].join("-");
            const dateText = String(reservation.date || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
            notify({
                title: workName + " 일정이 있습니다.",
                message: dateText + " " + getReservationTime(reservation) + " · 예약 내역을 확인해주세요.",
                type: "reservation",
                href: "./explore2.html?tab=reservation",
                createdAt: reservation.createdAt || new Date().toISOString(),
                dedupeKey: "reservation:" + identity
            });
        });
    }

    function scheduleMountRetry() {
        if (mountRetryTimer) return;
        let attempts = 0;
        mountRetryTimer = window.setInterval(function () {
            attempts += 1;
            if (initialized || attempts > MOUNT_RETRY_LIMIT) {
                window.clearInterval(mountRetryTimer);
                mountRetryTimer = null;
                return;
            }
            init();
        }, MOUNT_RETRY_INTERVAL_MS);
    }

    function init() {
        if (initialized || !document.body) return;
        // 헤더가 아직 없거나(동적 렌더링) 늦게 만들어지는 페이지를 위해 잠시 재시도합니다.
        if (!mountHeaderButton()) {
            scheduleMountRetry();
            return;
        }
        mountPanel();
        loadNotifications();
        initialized = true;
        render();
        syncReservationNotifications();

        if (window.FactoryStore && typeof window.FactoryStore.subscribe === "function") {
            window.FactoryStore.subscribe(syncReservationNotifications);
        }
        window.addEventListener("storage", function (event) {
            if (event.key !== storageKey) return;
            loadNotifications();
            render();
        });
        window.addEventListener("app:notify", function (event) {
            notify(event.detail || {});
        });
        window.addEventListener("resize", function () {
            if (panel && panel.classList.contains("is-open")) positionPanel();
        });
        document.addEventListener("click", function (event) {
            if (!panel || !panel.classList.contains("is-open")) return;
            const eventPath = typeof event.composedPath === "function" ? event.composedPath() : [];
            if (eventPath.includes(panel) || eventPath.includes(bellButton)
                    || panel.contains(event.target) || bellButton.contains(event.target)) return;
            closePanel();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && panel && panel.classList.contains("is-open")) {
                closePanel({ restoreFocus: true });
            }
        });
    }

    window.AppNotifications = {
        notify: notify,
        markRead: markRead,
        markAllRead: markAllRead,
        remove: remove,
        clear: clear,
        getAll: getAll,
        getUnreadCount: getUnreadCount,
        open: openPanel,
        close: closePanel,
        syncReservations: syncReservationNotifications
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
