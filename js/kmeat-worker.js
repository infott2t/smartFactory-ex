/* ==========================================================
   K-Meat 작업자 단말 공용 로직
   kmeat-ex.html   → window.KMEAT_MODE = 'ex'   (3분 체험)
   kmeat-real.html → window.KMEAT_MODE = 'real' (실제 작업)
   ========================================================== */
(function () {
    'use strict';

    const MODE = window.KMEAT_MODE === 'ex' ? 'ex' : 'real';
    const IS_EX = MODE === 'ex';
    const WORK_ID = 6;
    const HOURLY_BASE = 10320;
    const EXP_FLAG_KEY = 'kmeat_ex_is3min';
    const STATION_KEY = 'kmeat_worker_station_' + MODE;

    // ── 시스템 시간 변경에 영향받지 않는 가상 시계 ──
    const APP_START = Date.now();
    const APP_PERF = performance.now();
    function nowDate() { return new Date(APP_START + (performance.now() - APP_PERF)); }

    const won = new Intl.NumberFormat('ko-KR');

    // ══════════════════════════════════════════
    //  상태
    // ══════════════════════════════════════════
    let currentUser = null;
    let stationKey = localStorage.getItem(STATION_KEY) || 'butcher';
    let activeTab = 'orders';

    let isResting = false;
    let restAccumSec = 0;
    let lastTick = performance.now();
    let workFinished = false;
    let isEarlyLeave = false;
    let accumSalary = 0;

    let expLeft = 180;
    let expTimer = null;
    let expReady = false;

    let cookTimers = {};   // taskKey → { endAt, intervalId }
    let scaleValue = 0;
    let scaleContext = null; // { orderNo, taskKey, menuId }
    let banchanChecked = {}; // orderNo → Set-like object
    let stepChecked = {};    // `${orderNo}|${taskKey}` → { [stepNo]: true }
    let knownOrderNos = new Set();
    let notifyArmed = false;
    let leaveTimer = null;
    let leaveLeft = 300;
    let helpWatchId = null;  // 내가 올린 도움 요청 id (매니저 완료 처리 감시용)

    const M = () => window.MockData || {};

    // ══════════════════════════════════════════
    //  유틸
    // ══════════════════════════════════════════
    function esc(v) {
        return String(v === undefined || v === null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function $(id) { return document.getElementById(id); }
    function hhmmss(sec) {
        const s = Math.max(0, Math.floor(sec));
        return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
            .map(n => String(n).padStart(2, '0')).join(':');
    }
    function mmss(sec) {
        const s = Math.max(0, Math.floor(sec));
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function vibrate(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

    function beep(freqs) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            (freqs || [880]).forEach((f, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
                g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.14);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.15);
            });
        } catch (e) {}
    }

    function toast(msg, kind, icon) {
        const wrap = $('toast-wrap');
        if (!wrap) return;
        const el = document.createElement('div');
        el.className = 'toast' + (kind ? ' ' + kind : '');
        el.innerHTML = `<i class="bi ${icon || 'bi-info-circle-fill'}"></i><div>${msg}</div>`;
        wrap.appendChild(el);
        setTimeout(() => { if (el.parentElement) el.remove(); }, 3200);
    }

    function log(text, kind) {
        if (M().addKmeatWorkerLog) M().addKmeatWorkerLog(MODE, { text, kind: kind || 'info' });
        if (activeTab === 'more') renderMore();
    }

    // ══════════════════════════════════════════
    //  세션
    // ══════════════════════════════════════════
    function resolveUser() {
        let u = window.AuthManager && typeof window.AuthManager.getCurrentUser === 'function'
            ? window.AuthManager.getCurrentUser() : null;
        if (!u) {
            try { const raw = sessionStorage.getItem('user'); if (raw) u = JSON.parse(raw); } catch (e) {}
        }
        return u;
    }

    function numericUserId() {
        const users = (M().users) || [];
        if (currentUser) {
            const hit = users.find(x => x.name === currentUser.name || x.email === currentUser.email);
            if (hit) return hit.id;
            if (currentUser.id) return currentUser.id;
        }
        return 2;
    }

    function payRatio() {
        try {
            const r = JSON.parse(sessionStorage.getItem('selected_reservation') || 'null');
            if (r && r.ratio !== undefined) return Number(r.ratio) || 1.5;
        } catch (e) {}
        return 1.5; // 불고기구이 기본 배율
    }

    /* ── 순위 보너스 (월간 랭킹 시급 가산) ──────────────────
       적용 시급 = 최저시급 × 급여배율 + 시급 보너스
       보너스 금액 = 시급 보너스 × ceil(근무시간)  ← 1시간 미만도 1시간분
       계산은 store.js(MockData)에 모아 두었고, 김치·우동·버거와 같은 규칙을 쓴다. */
    function workerName() {
        if (currentUser && currentUser.name) return currentUser.name;
        try { return (JSON.parse(sessionStorage.getItem('user') || '{}') || {}).name || null; } catch (e) { return null; }
    }

    function rankBonusPerHour() {
        const md = window.MockData;
        return (md && typeof md.getRankBonusPerHour === 'function')
            ? (Number(md.getRankBonusPerHour(WORK_ID, workerName())) || 0) : 0;
    }

    function rankBonusAmount(workSec) {
        const md = window.MockData;
        return (md && typeof md.getRankBonusAmount === 'function')
            ? (Number(md.getRankBonusAmount(WORK_ID, workerName(), workSec)) || 0) : 0;
    }

    function appliedHourlyWage() {
        return Math.floor(HOURLY_BASE * payRatio()) + rankBonusPerHour();
    }

    function checkInTs() {
        const uid = sessionStorage.getItem('user-id') || 'guest';
        const key = 'kmeat_checkin_ts_' + MODE + '_' + uid;
        let ts = localStorage.getItem(key);
        if (!ts) { ts = String(nowDate().getTime()); localStorage.setItem(key, ts); }
        return parseInt(ts, 10);
    }
    function elapsedSec() {
        return Math.max(0, Math.floor((nowDate().getTime() - checkInTs()) / 1000));
    }

    // 불고기구이 근무: 16:00 ~ 20:00 (4시간)
    function shiftRemainSec() {
        const n = nowDate();
        const cur = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
        const end = 20 * 3600;
        if (cur < 16 * 3600) return end - 16 * 3600;
        return Math.max(0, end - cur);
    }

    // ══════════════════════════════════════════
    //  헤더 타이머
    // ══════════════════════════════════════════
    function tick() {
        const n = nowDate();
        const cur = $('st-clock');
        if (cur) cur.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');

        watchHelp();

        const perf = performance.now();
        const delta = (perf - lastTick) / 1000;
        lastTick = perf;

        if (workFinished) return;

        if (isResting) restAccumSec += delta;

        const restSec = Math.floor(restAccumSec);
        const workSec = Math.max(0, elapsedSec() - restSec);
        accumSalary = Math.floor(workSec * (HOURLY_BASE * payRatio()) / 3600) + rankBonusAmount(workSec);

        const wEl = $('st-work');
        if (wEl) wEl.textContent = hhmmss(workSec);
        const sEl = $('st-salary');
        if (sEl) sEl.textContent = won.format(accumSalary);
        const rEl = $('st-rest');
        if (rEl) rEl.textContent = hhmmss(restSec);
        const rc = $('st-rest-cell');
        if (rc) rc.classList.toggle('resting', isResting);

        const rb = $('rest-timer');
        if (rb) rb.textContent = hhmmss(restSec);

        const remEl = $('more-remain');
        if (remEl) remEl.textContent = hhmmss(shiftRemainSec());
        refreshFinishButton();
    }

    // ══════════════════════════════════════════
    //  체험 타이머 (ex 전용)
    // ══════════════════════════════════════════
    function setExpReady() {
        expReady = true;
        localStorage.setItem(EXP_FLAG_KEY, 'true');
        const t = $('exp-label');
        if (t) t.textContent = '체험완료하기';
        const b = $('exp-btn');
        if (b) b.classList.add('ready');
    }

    function startExpTimer() {
        if (!IS_EX) return;
        if (localStorage.getItem(EXP_FLAG_KEY) === 'true') { setExpReady(); return; }
        const t = $('exp-label');
        if (t) t.textContent = '가상체험중 3:00';
        expTimer = setInterval(() => {
            expLeft--;
            if (expLeft <= 0) {
                clearInterval(expTimer);
                setExpReady();
                beep([784, 1046]);
                toast('3분 체험이 완료되었습니다! <b>체험완료하기</b>를 눌러주세요.', 'ok', 'bi-check-circle-fill');
            } else if (t) {
                t.textContent = '가상체험중 ' + mmss(expLeft);
            }
        }, 1000);
    }

    function completeExperience() {
        const uid = numericUserId();

        if (!expReady) {
            toast('데모로 3분을 건너뛰고 체험을 완료합니다.', 'warn', 'bi-fast-forward-fill');
            if (expTimer) clearInterval(expTimer);
            setExpReady();
            setTimeout(() => finishExperience(uid), 900);
            return;
        }
        finishExperience(uid);
    }

    function finishExperience(uid) {
        if (M().setExpCompleted) M().setExpCompleted(uid, WORK_ID);
        try {
            const key = 'experienceCompleted_' + (sessionStorage.getItem('user-id') || uid);
            if (typeof window.setPartitionedItem === 'function') window.setPartitionedItem(key, 'true');
            else localStorage.setItem(key, 'true');
        } catch (e) {}
        log('불고기구이 가상체험을 완료했습니다.', 'ok');
        alert('불고기구이 체험이 완료되었습니다!\n예약 페이지로 돌아갑니다.');
        window.location.replace('work_detail.html?id=' + WORK_ID);
    }

    // ══════════════════════════════════════════
    //  시트
    // ══════════════════════════════════════════
    function openSheet(title, icon, bodyHtml) {
        $('sheet-title').innerHTML = `<i class="bi ${icon || 'bi-window'}"></i> ${title}`;
        $('sheet-body').innerHTML = bodyHtml;
        $('sheet').classList.add('open');
        $('sheet-back').classList.add('open');
        $('sheet-body').scrollTop = 0;
    }
    function closeSheet() {
        $('sheet').classList.remove('open');
        $('sheet-back').classList.remove('open');
    }

    // ══════════════════════════════════════════
    //  주문 데이터
    // ══════════════════════════════════════════
    function orders() { return M().getKmeatOrders ? M().getKmeatOrders() : []; }
    function orderOf(no) { return orders().find(o => String(o.orderNo) === String(no)) || null; }
    function stageOf(o) {
        if (!o) return 'ordered';
        if (o.status === 'cancelled') return 'cancelled';
        return o.kitchenStage || 'ordered';
    }
    function activeOrders() {
        return orders().filter(o => ['ordered', 'queued', 'cooked', 'pickup_wait'].includes(stageOf(o)));
    }
    function station() {
        return (M().kmeatWorkerStations || {})[stationKey] || { key: stationKey, label: stationKey, icon: 'bi-tools', color: '#64748b', handles: [] };
    }
    function myTasks() {
        return M().getKmeatStationTasks ? M().getKmeatStationTasks(stationKey) : [];
    }

    // 주문 상태를 작업 진행에 맞춰 자동 승격
    function autoAdvanceStage(orderNo) {
        const o = orderOf(orderNo);
        if (!o) return;
        const stage = stageOf(o);
        if (stage === 'cancelled' || stage === 'received') return;

        const plan = M().buildKmeatCookingSequence(o);
        const courses = plan.courses || [];
        const allTasksDone = courses.every(c =>
            c.rows.every(r => M().isKmeatTaskDone(o, M().getKmeatTaskKey(r.task))));
        const fullyServed = M().isKmeatOrderFullyServed(o);

        let next = null;
        if (fullyServed) next = 'received';
        else if (M().isKmeatCourseReady(o, 1) && stage === 'queued') next = 'cooked';
        else if (allTasksDone && ['ordered', 'queued', 'cooked'].includes(stage)) next = 'pickup_wait';
        else if (stage === 'ordered') next = 'queued';

        if (!next || next === stage) return;
        applyStage(orderNo, next);
    }

    function applyStage(orderNo, next) {
        const now = nowDate().toISOString();
        const up = { kitchenStage: next };
        if (next === 'queued') up.cookStartedAt = now;
        if (next === 'cooked') up.cookedAt = now;
        if (next === 'pickup_wait') up.pickupCalledAt = now;
        if (next === 'received') { up.receivedAt = now; up.status = 'served'; }

        const updated = M().updateKmeatOrder(orderNo, up);
        if (updated) syncShopHistory(updated);
    }

    // kmanager.html과 동일한 동기화 로직
    function mapKitchenStatus(o) {
        const s = stageOf(o);
        if (s === 'cancelled') return 'cancelled';
        if (s === 'received') return 'received';
        if (s === 'pickup_wait' || s === 'cooked') return 'ready';
        if (s === 'queued') return 'preparing';
        return 'queued';
    }

    function syncShopHistory(o) {
        const recordId = 'bulgogi_' + o.orderNo;
        const s = stageOf(o);
        const changes = {
            kitchenStage: s,
            kitchenStatus: mapKitchenStatus(o),
            estimatedMinutes: o.estimatedMinutes || null
        };
        if (s === 'received') changes.status = 'completed';

        if (window.FactoryStore && typeof window.FactoryStore.dispatch === 'function') {
            window.FactoryStore.dispatch({ type: 'UPDATE_SHOP_ORDER', payload: { id: recordId, changes } });
            return;
        }
        try {
            let h = JSON.parse(localStorage.getItem('kimp_shop_history') || '[]');
            if (!Array.isArray(h)) h = [];
            const i = h.findIndex(x => x && String(x.id) === recordId);
            if (i > -1) {
                h[i] = Object.assign({}, h[i], changes);
                localStorage.setItem('kimp_shop_history', JSON.stringify(h));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {}
    }

    // ══════════════════════════════════════════
    //  탭 1: 주문 확인하기
    // ══════════════════════════════════════════
    function renderOrders() {
        const box = $('view-orders');
        if (!box) return;
        const list = activeOrders();

        if (list.length === 0) {
            box.innerHTML = `<div class="empty">
                <i class="bi bi-inbox"></i>
                <p>지금 처리할 주문이 없습니다.</p>
                <span>손님이 테이블에서 주문하면<br>여기에 바로 표시됩니다.</span>
            </div>`;
            return;
        }

        box.innerHTML = list.map(o => {
            const plan = M().buildKmeatCookingSequence(o);
            const est = M().estimateKmeatOrderTime(o);
            const elapsed = Math.floor((Date.now() - (Date.parse(o.orderedAt || '') || Date.now())) / 60000);
            const finalized = M().isKmeatOrderFinalized(o);
            const totalTasks = (plan.courses || []).reduce((s, c) => s + c.rows.length, 0);
            const doneTasks = (plan.courses || []).reduce((s, c) =>
                s + c.rows.filter(r => M().isKmeatTaskDone(o, M().getKmeatTaskKey(r.task))).length, 0);
            const pct = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
            const late = est.firstServeMinutes > 0 && elapsed > est.firstServeMinutes
                && !M().isKmeatCourseServed(o, 1);

            const courseRows = (plan.courses || []).map(c => {
                const served = M().isKmeatCourseServed(o, c.course);
                const ready = c.rows.every(r => M().isKmeatTaskDone(o, M().getKmeatTaskKey(r.task)));
                const meta = c.meta || {};
                const names = c.rows.map(r => r.task.name).join(', ');
                let tag;
                if (served) tag = '<span class="chip ok"><i class="bi bi-check2-all"></i> 서빙완료</span>';
                else if (ready) tag = '<span class="chip ok"><i class="bi bi-bell-fill"></i> 서빙대기</span>';
                else if (c.held) tag = '<span class="chip"><i class="bi bi-pause-circle"></i> 보류</span>';
                else tag = `<span class="chip time">+${c.serveAtMinute}분 서빙</span>`;
                return `<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--border);">
                    <i class="bi ${meta.icon || 'bi-circle'}" style="color:${meta.color};font-size:1rem;margin-top:2px;"></i>
                    <div style="min-width:0;flex:1;">
                        <div style="font-size:0.84rem;font-weight:800;">${esc(meta.label || '')}</div>
                        <div style="font-size:0.76rem;color:var(--text-sub);line-height:1.45;word-break:keep-all;">${esc(names)}</div>
                    </div>
                    ${tag}
                </div>`;
            }).join('');

            return `<div class="task-card ${late ? 'is-late' : ''}" style="--c-color:${late ? '#dc2626' : '#e0362c'};">
                <div class="task-top">
                    <div style="min-width:0;">
                        <div class="task-name">주문 #${esc(o.orderNo)}</div>
                        <div class="task-sub">${elapsed}분 경과 · ${won.format(Number(o.total) || 0)}원</div>
                    </div>
                    <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(o.tableId || '-')}</span>
                </div>

                <div class="chips">
                    <span class="chip ${late ? 'late' : 'time'}">
                        <i class="bi bi-lightning-charge-fill"></i> 생고기 +${est.firstServeMinutes}분
                    </span>
                    <span class="chip">고기 ${est.meatServings}인분</span>
                    ${finalized
                        ? '<span class="chip ok"><i class="bi bi-lock-fill"></i> 주문마감</span>'
                        : '<span class="chip"><i class="bi bi-plus-circle-dotted"></i> 추가주문 가능</span>'}
                    ${late ? '<span class="chip late"><i class="bi bi-exclamation-triangle-fill"></i> 서빙 지연</span>' : ''}
                </div>

                <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">
                    <div class="prog" style="flex:1;"><i style="width:${pct}%"></i></div>
                    <span style="font-size:0.78rem;font-weight:800;color:var(--text-sub);">${doneTasks}/${totalTasks}</span>
                </div>

                ${courseRows}

                <button class="btn btn-line btn-sm" style="margin-top:11px;"
                    onclick="KmeatWorker.openOrderDetail('${esc(o.orderNo)}')">
                    <i class="bi bi-list-check"></i> 주문 상세 · 조리 순서 보기
                </button>
            </div>`;
        }).join('');
    }

    function openOrderDetail(orderNo) {
        const o = orderOf(orderNo);
        if (!o) return;
        const plan = M().buildKmeatCookingSequence(o);
        const est = M().estimateKmeatOrderTime(o);
        const rounds = M().getKmeatOrderRounds(o);

        const roundsHtml = rounds.length > 1 ? `
            <div class="card">
                <div style="font-size:0.9rem;font-weight:800;margin-bottom:8px;">
                    <i class="bi bi-layers-fill" style="color:var(--purple);"></i> 주문 차수 (${rounds.length}차)
                </div>
                ${rounds.map(r => `<div style="font-size:0.83rem;padding:6px 0;border-top:1px solid var(--border);">
                    <b>${r.round}차</b> · ${(r.items || []).map(i => esc(i.name) + ' ' + (i.quantity || 1) + esc(i.unit || '개')).join(', ')}
                </div>`).join('')}
            </div>` : '';

        const coursesHtml = (plan.courses || []).map(c => {
            const meta = c.meta || {};
            const served = M().isKmeatCourseServed(o, c.course);
            const rows = c.rows.map(r => {
                const t = r.task;
                const key = M().getKmeatTaskKey(t);
                const done = M().isKmeatTaskDone(o, key);
                return `<div class="step ${done ? 'checked' : ''}">
                    <div class="step-no">${done ? '<i class="bi bi-check-lg"></i>' : r.startAtMinute + '′'}</div>
                    <div class="step-body">
                        <div class="step-text"><b>${esc(t.name)}</b> ${t.qty}${esc(t.unit || '개')}</div>
                        <div class="step-min">${esc(t.stationLabel)} · ${t.minutes}분
                            ${t.scale ? ' · 저울 ' + t.scale.target + 'g' : ''}</div>
                    </div>
                </div>`;
            }).join('');
            return `<div class="card" style="border-left:5px solid ${meta.color};">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:9px;">
                    <i class="bi ${meta.icon}" style="color:${meta.color};"></i>
                    <b style="font-size:0.94rem;">${esc(meta.label)}</b>
                    <span class="chip time" style="margin-left:auto;">서빙 +${c.serveAtMinute}분</span>
                    ${served ? '<span class="chip ok">완료</span>' : ''}
                </div>
                <div style="font-size:0.78rem;color:var(--text-sub);line-height:1.5;margin-bottom:10px;">${esc(meta.desc || '')}</div>
                <div class="steps">${rows}</div>
                ${c.held ? '<div class="notice warn" style="margin-top:10px;"><i class="bi bi-pause-circle"></i> 추가 주문 대기 중 · 매니저 주문 마감 후 착수</div>' : ''}
            </div>`;
        }).join('');

        openSheet(`주문 #${esc(orderNo)}`, 'bi-receipt', `
            <div class="card" style="text-align:center;">
                <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(o.tableId || '-')}</span>
                <div style="margin-top:11px;font-size:0.84rem;color:var(--text-sub);line-height:1.6;">
                    생고기 서빙 목표 <b style="color:#c62828;">+${est.firstServeMinutes}분</b><br>
                    고기 ${est.meatServings}인분 · 예상 식사 ${est.totalMealMinutes}분<br>
                    마지막 접시 +${est.totalMinutes}분
                </div>
            </div>
            <div class="notice">
                <i class="bi bi-info-circle-fill"></i>
                <b>고기는 굽지 않습니다.</b> 저울로 계량해 접시에 담아 바로 내보내고,
                손님이 테이블 불판에서 직접 구웁니다.
            </div>
            ${roundsHtml}
            ${coursesHtml}
        `);
    }

    // ══════════════════════════════════════════
    //  탭 2: 내 작업 (담당 포지션)
    // ══════════════════════════════════════════
    function renderWork() {
        const box = $('view-work');
        if (!box) return;
        const st = station();

        // 포지션 바
        const bar = `<div class="station-bar" style="--st-color:${st.color};">
            <div class="ico"><i class="bi ${st.icon}"></i></div>
            <div class="txt"><b>${esc(st.label)}</b><span>${esc(st.desc || '')}</span></div>
            <button class="swap" onclick="KmeatWorker.openStationPicker()">변경</button>
        </div>`;

        if (stationKey === 'dish') { box.innerHTML = bar + renderDishHtml(); return; }
        if (stationKey === 'serving') { box.innerHTML = bar + renderServingHtml(); return; }

        const tasks = myTasks();
        const todo = tasks.filter(t => !t.done);

        if (tasks.length === 0) {
            box.innerHTML = bar + `<div class="section"><div class="empty">
                <i class="bi bi-emoji-smile"></i>
                <p>${esc(st.label)}에 배정된 작업이 없습니다.</p>
                <span>새 주문이 들어오면 알림과 함께<br>여기에 표시됩니다.</span>
            </div></div>`;
            return;
        }

        const cards = tasks.map(t => {
            const late = !t.done && t.dueInMinutes < 0;
            const key = t.taskKey;
            const scaleChip = t.task.scale ? `<span class="chip scale"><i class="bi bi-speedometer2"></i> ${t.task.scale.target}g</span>` : '';
            const rawChip = t.task.raw ? '<span class="chip raw"><i class="bi bi-droplet"></i> 생고기</span>' : '';

            let actions;
            if (t.done) {
                actions = `<div class="btn-row">
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.openManual('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-journal-text"></i> 매뉴얼
                    </button>
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.undoTask('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-arrow-counterclockwise"></i> 되돌리기
                    </button>
                </div>`;
            } else if (t.task.scale) {
                actions = `<div class="btn-row">
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.openManual('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-journal-text"></i> 매뉴얼
                    </button>
                    <button class="btn btn-brand btn-sm" onclick="KmeatWorker.openScale('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-speedometer2"></i> 저울로 g재기
                    </button>
                </div>`;
            } else if (key === '__plating__') {
                actions = `<button class="btn btn-ok" onclick="KmeatWorker.openBanchan('${esc(t.orderNo)}')">
                    <i class="bi bi-basket-fill"></i> 반찬 덜기 시작
                </button>`;
            } else if (t.task.station === 'soup' || t.task.station === 'cold') {
                actions = `<div class="btn-row">
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.openManual('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-journal-text"></i> 매뉴얼
                    </button>
                    <button class="btn btn-warn btn-sm" onclick="KmeatWorker.openCook('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-fire"></i> 화구 조리 시작
                    </button>
                </div>`;
            } else {
                actions = `<div class="btn-row">
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.openManual('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-journal-text"></i> 매뉴얼
                    </button>
                    <button class="btn btn-ok btn-sm" onclick="KmeatWorker.doneTask('${esc(t.orderNo)}','${esc(key)}')">
                        <i class="bi bi-check-lg"></i> 완료
                    </button>
                </div>`;
            }

            return `<div class="task-card ${t.done ? 'is-done' : ''} ${late ? 'is-late' : ''} ${t.held ? 'is-held' : ''}"
                        style="--c-color:${t.courseColor};">
                <div class="task-top">
                    <div style="min-width:0;">
                        <div class="task-name">${esc(t.task.name)}</div>
                        <div class="task-sub">${t.task.qty}${esc(t.task.unit || '개')} · 주문 #${esc(t.orderNo)}</div>
                    </div>
                    <span class="table-tag"><i class="bi bi-geo-alt-fill"></i> ${esc(t.tableId)}</span>
                </div>
                <div class="chips">
                    <span class="chip course" style="color:${t.courseColor};border-color:${t.courseColor};">${esc(t.courseLabel)}</span>
                    ${rawChip}${scaleChip}
                    <span class="chip time"><i class="bi bi-stopwatch"></i> ${t.task.minutes}분</span>
                    ${t.done
                        ? '<span class="chip ok"><i class="bi bi-check-circle-fill"></i> 완료</span>'
                        : (late
                            ? `<span class="chip late"><i class="bi bi-exclamation-triangle-fill"></i> ${Math.abs(t.dueInMinutes)}분 지연</span>`
                            : `<span class="chip">서빙까지 ${t.dueInMinutes}분</span>`)}
                    ${t.held ? '<span class="chip"><i class="bi bi-pause-circle"></i> 착수보류</span>' : ''}
                </div>
                ${actions}
            </div>`;
        }).join('');

        box.innerHTML = bar + `<div class="section">
            <div class="section-head">
                <h2><i class="bi ${st.icon}" style="color:${st.color};"></i> 내 작업 지시</h2>
                <span class="cnt">남은 ${todo.length}건 / 전체 ${tasks.length}건</span>
            </div>
            ${cards}
        </div>`;
    }

    // ── 포지션 선택 ──
    function openStationPicker() {
        const stations = M().kmeatWorkerStations || {};
        const dq = M().getKmeatDishQueue ? M().getKmeatDishQueue() : { pending: 0 };
        const html = `<div class="notice">
                <i class="bi bi-info-circle-fill"></i> 지금 담당할 포지션을 선택하세요. 선택한 포지션의 작업 지시만 표시됩니다.
            </div>
            <div class="station-grid">
            ${Object.keys(stations).map(k => {
                const s = stations[k];
                let cnt = 0;
                if (k === 'dish') cnt = dq.pending;
                else if (k === 'serving') cnt = (M().getKmeatServeQueue ? M().getKmeatServeQueue() : []).filter(q => q.ready).length;
                else cnt = (M().getKmeatStationTasks ? M().getKmeatStationTasks(k) : []).filter(t => !t.done).length;
                return `<button class="station-pick ${k === stationKey ? 'active' : ''}" style="--st-color:${s.color};"
                            onclick="KmeatWorker.pickStation('${k}')">
                    ${cnt > 0 ? `<span class="badge">${cnt}</span>` : ''}
                    <i class="bi ${s.icon}"></i>
                    <b>${esc(s.short)}</b>
                    <small>${esc(s.label)}</small>
                </button>`;
            }).join('')}
            </div>`;
        openSheet('담당 포지션 선택', 'bi-grid-3x3-gap-fill', html);
    }

    function pickStation(key) {
        stationKey = key;
        localStorage.setItem(STATION_KEY, key);
        closeSheet();
        const s = station();
        toast(`담당을 <b>${esc(s.label)}</b>(으)로 변경했습니다.`, 'ok', 'bi-check-circle-fill');
        log(`담당 포지션 변경 → ${s.label}`);
        renderAll();
    }

    // ── 조리 매뉴얼 ──
    function openManual(orderNo, taskKey) {
        const o = orderOf(orderNo);
        if (!o) return;
        const t = myTasks().find(x => String(x.orderNo) === String(orderNo) && x.taskKey === taskKey)
            || M().getKmeatStationTasks(stationKey).find(x => x.taskKey === taskKey);
        if (!t) return;

        const sk = orderNo + '|' + taskKey;
        stepChecked[sk] = stepChecked[sk] || {};
        const checked = stepChecked[sk];

        const steps = (t.task.steps || []).map(s => `
            <div class="step ${checked[s.step] ? 'checked' : ''}" onclick="KmeatWorker.toggleStep('${esc(orderNo)}','${esc(taskKey)}',${s.step})">
                <div class="step-no">${checked[s.step] ? '<i class="bi bi-check-lg"></i>' : s.step}</div>
                <div class="step-body">
                    <div class="step-text">${esc(s.text)}</div>
                    <div class="step-min"><i class="bi bi-stopwatch"></i> 약 ${s.minutes}분</div>
                </div>
            </div>`).join('');

        const scaleBox = t.task.scale ? `<div class="notice">
                <i class="bi bi-speedometer2"></i> <b>저울 계량</b> · 목표 <b>${t.task.scale.target}g</b>
                (허용 ${t.task.scale.min}~${t.task.scale.max}g)<br>${esc(t.task.scale.note)}
            </div>` : '';
        const cautions = (t.task.cautions || []).length ? `<div class="caution">
                <i class="bi bi-exclamation-triangle-fill"></i> ${t.task.cautions.map(esc).join('<br>')}
            </div>` : '';

        const allChecked = (t.task.steps || []).every(s => checked[s.step]);
        let cta;
        if (t.done) {
            cta = '<div class="notice ok"><i class="bi bi-check-circle-fill"></i> 이미 완료 처리된 작업입니다.</div>';
        } else if (t.task.scale) {
            cta = `<button class="btn btn-brand" onclick="KmeatWorker.openScale('${esc(orderNo)}','${esc(taskKey)}')">
                <i class="bi bi-speedometer2"></i> 저울로 g재기
            </button>`;
        } else if (taskKey === '__plating__') {
            cta = `<button class="btn btn-ok" onclick="KmeatWorker.openBanchan('${esc(orderNo)}')">
                <i class="bi bi-basket-fill"></i> 반찬 덜기 시작
            </button>`;
        } else {
            cta = `<button class="btn btn-ok" ${allChecked ? '' : 'disabled'}
                    onclick="KmeatWorker.doneTask('${esc(orderNo)}','${esc(taskKey)}')">
                <i class="bi bi-check-lg"></i> ${allChecked ? '조리 완료 처리' : '모든 단계를 체크해주세요'}
            </button>`;
        }

        openSheet(esc(t.task.name), 'bi-journal-text', `
            <div class="card">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(t.tableId)}</span>
                    <span class="chip course" style="color:${t.courseColor};border-color:${t.courseColor};">${esc(t.courseLabel)}</span>
                </div>
                <div style="margin-top:10px;font-size:0.84rem;color:var(--text-sub);line-height:1.6;">
                    주문 #${esc(orderNo)} · ${t.task.qty}${esc(t.task.unit || '개')} ·
                    ${esc(t.task.stationLabel)} · 약 ${t.task.minutes}분
                </div>
            </div>
            ${t.task.raw ? '<div class="notice warn"><i class="bi bi-droplet-fill"></i> <b>생고기로 제공합니다.</b> 주방에서 굽지 마세요. 계량 후 접시에 담아 바로 내보냅니다.</div>' : ''}
            ${scaleBox}
            <div class="section-head" style="margin:0;"><h2><i class="bi bi-list-ol"></i> 작업 순서</h2>
                <span class="cnt">터치해서 체크</span></div>
            <div class="steps">${steps}</div>
            ${cautions}
            ${cta}
        `);
    }

    function toggleStep(orderNo, taskKey, stepNo) {
        const sk = orderNo + '|' + taskKey;
        stepChecked[sk] = stepChecked[sk] || {};
        stepChecked[sk][stepNo] = !stepChecked[sk][stepNo];
        vibrate(20);
        openManual(orderNo, taskKey);
    }

    // ── 저울 계량 ──
    function openScale(orderNo, taskKey) {
        const t = M().getKmeatStationTasks(stationKey).find(x =>
            String(x.orderNo) === String(orderNo) && x.taskKey === taskKey);
        if (!t || !t.task.scale) return;
        scaleContext = { orderNo, taskKey, menuId: t.task.menuId, name: t.task.name, tableId: t.tableId };
        scaleValue = 0;
        renderScale();
    }

    function renderScale() {
        if (!scaleContext) return;
        const manual = M().getKmeatMenuManual(scaleContext.menuId);
        const s = manual.scale;
        const judge = M().judgeKmeatWeight(scaleContext.menuId, scaleValue);
        const cls = scaleValue === 0 ? '' : (judge.ok ? '' : (judge.low ? 'low' : 'high'));

        openSheet('저울 계량 · ' + esc(scaleContext.name), 'bi-speedometer2', `
            <div class="card" style="text-align:center;">
                <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(scaleContext.tableId)}</span>
                <div style="margin-top:8px;font-size:0.8rem;color:var(--text-sub);">주문 #${esc(scaleContext.orderNo)}</div>
            </div>

            <div class="scale-panel">
                <div class="scale-target">목표 <b>${s.target}g</b> · 허용 ${s.min}g ~ ${s.max}g</div>
                <div class="scale-readout ${cls}">${scaleValue}<small> g</small></div>
                ${scaleValue === 0
                    ? '<div class="scale-msg" style="background:#fff;color:var(--text-sub);border:1px solid var(--border);">고기를 올리고 무게를 입력하세요.</div>'
                    : `<div class="scale-msg ${judge.ok ? 'ok' : 'ng'}">
                        <i class="bi ${judge.ok ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}"></i>
                        ${esc(judge.message)}</div>`}
                <div class="scale-pad">
                    <button onclick="KmeatWorker.scaleAdd(-10)">-10</button>
                    <button onclick="KmeatWorker.scaleAdd(-1)">-1</button>
                    <button onclick="KmeatWorker.scaleAdd(1)">+1</button>
                    <button onclick="KmeatWorker.scaleAdd(10)">+10</button>
                    <button onclick="KmeatWorker.scaleSet(0)"><i class="bi bi-arrow-counterclockwise"></i> 영점</button>
                    <button onclick="KmeatWorker.scaleAuto()"><i class="bi bi-hand-index-thumb"></i> 올리기</button>
                    <button onclick="KmeatWorker.scaleSet(${s.target})">정량 ${s.target}</button>
                    <button onclick="KmeatWorker.scaleAdd(50)">+50</button>
                </div>
            </div>

            <div class="notice"><i class="bi bi-info-circle-fill"></i> ${esc(s.note)}</div>

            <button class="btn btn-ok" ${judge.ok && scaleValue > 0 ? '' : 'disabled'}
                onclick="KmeatWorker.confirmScale()">
                <i class="bi bi-check-lg"></i>
                ${judge.ok && scaleValue > 0 ? '계량 합격 · 담기 완료' : '허용 범위에 맞춰주세요'}
            </button>
        `);
    }

    function scaleAdd(d) { scaleValue = Math.max(0, scaleValue + d); vibrate(12); renderScale(); }
    function scaleSet(v) { scaleValue = Math.max(0, v); vibrate(12); renderScale(); }
    function scaleAuto() {
        // 실제 저울에 올린 것처럼 목표 근처의 임의값 (때때로 범위를 벗어남)
        const manual = M().getKmeatMenuManual(scaleContext.menuId);
        const t = manual.scale.target;
        scaleValue = Math.round(t + (Math.random() * 2 - 1) * t * 0.09);
        vibrate(25);
        renderScale();
    }

    function confirmScale() {
        if (!scaleContext) return;
        const judge = M().judgeKmeatWeight(scaleContext.menuId, scaleValue);
        if (!judge.ok) return;
        M().markKmeatTaskDone(scaleContext.orderNo, scaleContext.taskKey, {
            weightG: scaleValue, worker: (currentUser && currentUser.name) || '작업자'
        });
        log(`[계량] ${scaleContext.name} ${scaleValue}g 합격 → ${scaleContext.tableId} (주문 #${scaleContext.orderNo})`, 'ok');
        toast(`${esc(scaleContext.name)} <b>${scaleValue}g</b> 계량 완료`, 'ok', 'bi-check-circle-fill');
        beep([1046]);
        autoAdvanceStage(scaleContext.orderNo);
        scaleContext = null;
        closeSheet();
        renderAll();
    }

    // ── 반찬 덜기 ──
    function openBanchan(orderNo) {
        const o = orderOf(orderNo);
        if (!o) return;
        const servings = M().countKmeatMeatServings(o.items || []);
        const cl = M().buildKmeatBanchanChecklist(servings);
        banchanChecked[orderNo] = banchanChecked[orderNo] || {};
        const ck = banchanChecked[orderNo];
        const doneCount = cl.items.filter(i => ck[i.key]).length;
        const all = doneCount === cl.items.length;

        openSheet('반찬 덜기 · ' + esc(o.tableId || ''), 'bi-basket-fill', `
            <div class="card" style="text-align:center;">
                <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(o.tableId || '-')}</span>
                <div style="margin-top:9px;font-size:0.86rem;">
                    고기 <b>${servings}인분</b> 기준으로 계량합니다.
                </div>
            </div>
            <div class="notice"><i class="bi bi-info-circle-fill"></i>
                반찬 <b>${M().kmeatBanchanPolicy.banchanCount}종</b> + 쌈채소 + 쌈장을 담습니다.
                항목을 터치해서 체크하세요.
            </div>
            <div style="display:flex;align-items:center;gap:9px;">
                <div class="prog" style="flex:1;"><i style="width:${Math.round(doneCount / cl.items.length * 100)}%"></i></div>
                <span style="font-size:0.8rem;font-weight:800;color:var(--text-sub);">${doneCount}/${cl.items.length}</span>
            </div>
            <div class="check-list">
                ${cl.items.map(i => `
                    <div class="check-item ${ck[i.key] ? 'checked' : ''}"
                         onclick="KmeatWorker.toggleBanchan('${esc(orderNo)}','${esc(i.key)}')">
                        <div class="check-box"><i class="bi bi-check-lg"></i></div>
                        <div style="min-width:0;">
                            <div class="check-name">${esc(i.name)}</div>
                            <div class="check-note">${esc(i.note || '')}</div>
                        </div>
                        <div class="check-amt">${esc(i.amount)}</div>
                    </div>`).join('')}
            </div>
            <div class="caution"><i class="bi bi-exclamation-triangle-fill"></i>
                쌈채소는 물기를 완전히 제거하고 담습니다. 반찬은 주문 시점에 새로 담아주세요.
            </div>
            <button class="btn btn-ok" ${all ? '' : 'disabled'} onclick="KmeatWorker.confirmBanchan('${esc(orderNo)}')">
                <i class="bi bi-check-lg"></i> ${all ? '반찬·쌈채소 세팅 완료' : '모든 항목을 체크해주세요'}
            </button>
        `);
    }

    function toggleBanchan(orderNo, key) {
        banchanChecked[orderNo] = banchanChecked[orderNo] || {};
        banchanChecked[orderNo][key] = !banchanChecked[orderNo][key];
        vibrate(18);
        openBanchan(orderNo);
    }

    function confirmBanchan(orderNo) {
        const o = orderOf(orderNo);
        if (!o) return;
        const servings = M().countKmeatMeatServings(o.items || []);
        M().markKmeatTaskDone(orderNo, '__plating__', {
            servings, worker: (currentUser && currentUser.name) || '작업자'
        });
        log(`[반찬] ${o.tableId} 반찬 5종 + 쌈채소 ${servings}인분 세팅 완료 (주문 #${orderNo})`, 'ok');
        toast('반찬 · 쌈채소 세팅 완료', 'ok', 'bi-check-circle-fill');
        beep([1046]);
        autoAdvanceStage(orderNo);
        closeSheet();
        renderAll();
    }

    // ── 화구 조리 (타이머) ──
    function openCook(orderNo, taskKey) {
        const t = M().getKmeatStationTasks(stationKey).find(x =>
            String(x.orderNo) === String(orderNo) && x.taskKey === taskKey);
        if (!t) return;
        const ck = orderNo + '|' + taskKey;
        const timer = cookTimers[ck];
        const remain = timer ? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)) : null;
        const done = timer && remain === 0;

        const steps = (t.task.steps || []).map(s => `
            <div class="step">
                <div class="step-no">${s.step}</div>
                <div class="step-body">
                    <div class="step-text">${esc(s.text)}</div>
                    <div class="step-min"><i class="bi bi-stopwatch"></i> 약 ${s.minutes}분</div>
                </div>
            </div>`).join('');

        openSheet('화구 조리 · ' + esc(t.task.name), 'bi-fire', `
            <div class="card" style="text-align:center;">
                <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(t.tableId)}</span>
                <div style="margin-top:8px;font-size:0.82rem;color:var(--text-sub);">
                    주문 #${esc(orderNo)} · ${esc(t.task.stationLabel)} · ${t.task.qty}${esc(t.task.unit || '개')}
                </div>
            </div>

            <div class="cook-timer ${done ? 'done' : ''}" id="cook-box">
                <div class="lbl">${timer ? (done ? '조리 완료!' : '조리 중 · 남은 시간') : '조리 예상 시간'}</div>
                <div class="big" id="cook-remain">${timer ? mmss(remain) : mmss(t.task.minutes * 60)}</div>
                <div class="lbl">${esc(t.task.name)} ${t.task.minutes}분</div>
            </div>

            ${timer
                ? (done
                    ? `<button class="btn btn-ok" onclick="KmeatWorker.doneTask('${esc(orderNo)}','${esc(taskKey)}')">
                           <i class="bi bi-check-lg"></i> 조리 완료 처리
                       </button>`
                    : `<button class="btn btn-line" onclick="KmeatWorker.stopCook('${esc(orderNo)}','${esc(taskKey)}')">
                           <i class="bi bi-stop-circle"></i> 타이머 중지
                       </button>
                       <button class="btn btn-ok btn-sm" onclick="KmeatWorker.doneTask('${esc(orderNo)}','${esc(taskKey)}')">
                           <i class="bi bi-fast-forward-fill"></i> (데모) 바로 완료
                       </button>`)
                : `<button class="btn btn-warn" onclick="KmeatWorker.startCook('${esc(orderNo)}','${esc(taskKey)}',${t.task.minutes})">
                       <i class="bi bi-play-fill"></i> 화구 점화 · 타이머 시작
                   </button>`}

            <div class="section-head" style="margin:0;"><h2><i class="bi bi-list-ol"></i> 조리 순서</h2></div>
            <div class="steps">${steps}</div>
            ${(t.task.cautions || []).length ? `<div class="caution">
                <i class="bi bi-exclamation-triangle-fill"></i> ${t.task.cautions.map(esc).join('<br>')}</div>` : ''}
        `);
    }

    function startCook(orderNo, taskKey, minutes) {
        const ck = orderNo + '|' + taskKey;
        // 데모 편의: 실제 분 → 초 단위로 압축 (1분당 6초)
        const seconds = Math.max(6, Math.round(minutes * 6));
        cookTimers[ck] = { endAt: Date.now() + seconds * 1000, intervalId: null };
        log(`[화구] ${taskKey} 조리 시작 (${minutes}분 예상, 데모 ${seconds}초)`);
        toast(`화구 점화 · <b>${minutes}분</b> 조리 시작 (데모 ${seconds}초)`, 'warn', 'bi-fire');
        beep([660]);

        cookTimers[ck].intervalId = setInterval(() => {
            const remain = Math.max(0, Math.ceil((cookTimers[ck].endAt - Date.now()) / 1000));
            const el = $('cook-remain');
            if (el) el.textContent = mmss(remain);
            if (remain === 0) {
                clearInterval(cookTimers[ck].intervalId);
                cookTimers[ck].intervalId = null;
                const box = $('cook-box');
                if (box) box.classList.add('done');
                beep([880, 1174]);
                toast('조리 시간이 끝났습니다. 완료 처리해주세요.', 'ok', 'bi-bell-fill');
                openCook(orderNo, taskKey);
            }
        }, 250);
        openCook(orderNo, taskKey);
    }

    function stopCook(orderNo, taskKey) {
        const ck = orderNo + '|' + taskKey;
        if (cookTimers[ck] && cookTimers[ck].intervalId) clearInterval(cookTimers[ck].intervalId);
        delete cookTimers[ck];
        toast('타이머를 중지했습니다.', 'warn', 'bi-stop-circle');
        openCook(orderNo, taskKey);
    }

    // ── 일반 완료/되돌리기 ──
    function doneTask(orderNo, taskKey) {
        const ck = orderNo + '|' + taskKey;
        if (cookTimers[ck]) {
            if (cookTimers[ck].intervalId) clearInterval(cookTimers[ck].intervalId);
            delete cookTimers[ck];
        }
        const t = M().getKmeatStationTasks(stationKey).find(x =>
            String(x.orderNo) === String(orderNo) && x.taskKey === taskKey);
        M().markKmeatTaskDone(orderNo, taskKey, { worker: (currentUser && currentUser.name) || '작업자' });
        log(`[완료] ${t ? t.task.name : taskKey} → ${t ? t.tableId : ''} (주문 #${orderNo})`, 'ok');
        toast(`${t ? esc(t.task.name) : '작업'} 완료`, 'ok', 'bi-check-circle-fill');
        beep([1046]);
        autoAdvanceStage(orderNo);
        closeSheet();
        renderAll();
    }

    function undoTask(orderNo, taskKey) {
        M().unmarkKmeatTask(orderNo, taskKey);
        toast('완료를 되돌렸습니다.', 'warn', 'bi-arrow-counterclockwise');
        renderAll();
    }

    // ══════════════════════════════════════════
    //  서빙 (홀)
    // ══════════════════════════════════════════
    function renderServingHtml() {
        const q = M().getKmeatServeQueue ? M().getKmeatServeQueue() : [];
        if (q.length === 0) {
            return `<div class="section"><div class="empty">
                <i class="bi bi-cup-hot"></i><p>서빙할 접시가 없습니다.</p>
                <span>조리가 끝나면 여기에 표시됩니다.</span></div></div>`;
        }
        const ready = q.filter(x => x.ready);
        return `<div class="section">
            <div class="section-head">
                <h2><i class="bi bi-person-walking" style="color:var(--purple);"></i> 서빙 대기</h2>
                <span class="cnt">준비완료 ${ready.length}건 / 전체 ${q.length}건</span>
            </div>
            <div class="notice"><i class="bi bi-info-circle-fill"></i>
                <b>테이블 번호를 꼭 확인하세요.</b> 생고기(1차)는 손님이 바로 구울 수 있게 가장 먼저 나갑니다.
            </div>
            ${q.map(x => `
                <div class="task-card ${x.ready ? '' : 'is-done'} ${!x.ready && x.dueInMinutes < 0 ? 'is-late' : ''}"
                     style="--c-color:${x.courseColor};">
                    <div class="task-top">
                        <div style="min-width:0;">
                            <div class="task-name"><i class="bi ${x.courseIcon}" style="color:${x.courseColor};"></i> ${esc(x.courseLabel)}</div>
                            <div class="task-sub">주문 #${esc(x.orderNo)} · ${esc(x.itemNames.join(', '))}</div>
                        </div>
                        <span class="table-tag big"><i class="bi bi-geo-alt-fill"></i> ${esc(x.tableId)}</span>
                    </div>
                    <div class="chips">
                        ${x.ready
                            ? '<span class="chip ok"><i class="bi bi-check-circle-fill"></i> 조리 완료 · 서빙 가능</span>'
                            : `<span class="chip">조리 ${x.doneCount}/${x.totalCount} 진행중</span>`}
                        ${x.dueInMinutes < 0
                            ? `<span class="chip late">${Math.abs(x.dueInMinutes)}분 지연</span>`
                            : `<span class="chip time">서빙까지 ${x.dueInMinutes}분</span>`}
                        ${x.held ? '<span class="chip"><i class="bi bi-pause-circle"></i> 보류</span>' : ''}
                    </div>
                    <button class="btn ${x.ready ? 'btn-purple' : 'btn-line'}" ${x.ready ? '' : 'disabled'}
                        onclick="KmeatWorker.serveCourse('${esc(x.orderNo)}',${x.course})">
                        <i class="bi bi-box-arrow-right"></i>
                        ${x.ready ? esc(x.tableId) + ' 서빙 완료' : '조리 대기 중'}
                    </button>
                </div>`).join('')}
        </div>`;
    }

    function serveCourse(orderNo, course) {
        const o = orderOf(orderNo);
        if (!o) return;
        M().serveKmeatCourse(orderNo, course);
        const label = (M().kmeatServiceCourses[course] || {}).label || (course + '차');
        log(`[서빙] ${o.tableId} ${label} 서빙 완료 (주문 #${orderNo})`, 'ok');
        toast(`<b>${esc(o.tableId)}</b> ${esc(label)} 서빙 완료`, 'ok', 'bi-box-arrow-right');
        beep([880, 1046]);
        autoAdvanceStage(orderNo);
        if (M().syncKmeatDishQueue) M().syncKmeatDishQueue();
        renderAll();
    }

    // ══════════════════════════════════════════
    //  설겆이
    // ══════════════════════════════════════════
    function renderDishHtml() {
        const q = M().syncKmeatDishQueue ? M().syncKmeatDishQueue() : { pending: 0, washed: 0 };
        return `<div class="section">
            <div class="section-head"><h2><i class="bi bi-droplet-fill" style="color:var(--info);"></i> 설겆이</h2>
                <span class="cnt">완료 ${q.washed}개</span></div>
            <div class="card" style="text-align:center;">
                <div style="font-size:0.86rem;color:var(--text-sub);font-weight:700;">세척 대기 그릇</div>
                <div style="font-family:'Outfit',monospace;font-size:3.2rem;font-weight:800;color:${q.pending > 0 ? '#1d4ed8' : '#10b981'};line-height:1.15;">
                    ${q.pending}<span style="font-size:1.1rem;">개</span>
                </div>
                <div style="font-size:0.78rem;color:var(--text-sub);">손님이 식사를 마치면 그릇이 쌓입니다.</div>
            </div>
            ${q.pending === 0
                ? '<div class="notice ok"><i class="bi bi-check-circle-fill"></i> 세척할 그릇이 없습니다. 수고하셨습니다!</div>'
                : `<div class="notice"><i class="bi bi-info-circle-fill"></i>
                       세제 → 흐르는 물 → 건조대 순서로 세척합니다. 불판은 기름을 먼저 긁어내고 세척하세요.</div>
                   <div class="btn-row">
                       <button class="btn btn-info" onclick="KmeatWorker.wash(5)"><i class="bi bi-droplet"></i> 5개 세척</button>
                       <button class="btn btn-info" onclick="KmeatWorker.wash(10)"><i class="bi bi-droplet-half"></i> 10개 세척</button>
                   </div>
                   <button class="btn btn-line" onclick="KmeatWorker.wash(${q.pending})">
                       <i class="bi bi-check2-all"></i> 전부 세척 (${q.pending}개)
                   </button>`}
        </div>`;
    }

    function wash(n) {
        const r = M().washKmeatDishes(n);
        log(`[설겆이] 그릇 ${r.washed}개 세척 완료 (남은 ${r.queue.pending}개)`, 'ok');
        toast(`그릇 <b>${r.washed}개</b> 세척 완료`, 'ok', 'bi-droplet-fill');
        vibrate(30);
        renderAll();
    }

    // ══════════════════════════════════════════
    //  탭 3: 매뉴얼 (전체 메뉴)
    // ══════════════════════════════════════════
    function renderManuals() {
        const box = $('view-manual');
        if (!box) return;
        const manuals = M().kmeatMenuManuals || {};
        const keys = Object.keys(manuals);

        const group = (g, title, icon, color, note) => {
            const items = keys.filter(k => manuals[k].group === g);
            return `<div class="section">
                <div class="section-head"><h2><i class="bi ${icon}" style="color:${color};"></i> ${title}</h2>
                    <span class="cnt">${items.length}종</span></div>
                ${note ? `<div class="notice" style="margin-bottom:10px;">${note}</div>` : ''}
                ${items.map(k => {
                    const m = manuals[k];
                    const c = M().getKmeatServeCourse(m);
                    const cm = M().kmeatServiceCourses[c] || {};
                    return `<div class="task-card" style="--c-color:${cm.color};">
                        <div class="task-top">
                            <div style="min-width:0;">
                                <div class="task-name">${esc(m.name)}</div>
                                <div class="task-sub">${won.format(m.price)}원 / ${esc(m.unit)}</div>
                            </div>
                        </div>
                        <div class="chips">
                            <span class="chip course" style="color:${cm.color};border-color:${cm.color};">${esc(cm.label || '')}</span>
                            <span class="chip time"><i class="bi bi-stopwatch"></i> ${m.prepMinutes}분</span>
                            ${m.raw ? '<span class="chip raw"><i class="bi bi-droplet"></i> 생고기</span>' : ''}
                            ${m.targetWeightG ? `<span class="chip scale">${m.targetWeightG}g</span>` : ''}
                        </div>
                        <button class="btn btn-line btn-sm" onclick="KmeatWorker.openMenuManual('${esc(k)}')">
                            <i class="bi bi-journal-text"></i> 조리 매뉴얼 보기
                        </button>
                    </div>`;
                }).join('')}
            </div>`;
        };

        box.innerHTML =
            group('meat', '고기 메뉴 (생고기)', 'bi-speedometer2', '#e0362c',
                '<i class="bi bi-droplet-fill"></i> <b>고기는 굽지 않습니다.</b> 저울 계량 → 손질 → 접시 담기까지만 하고 1차로 가장 먼저 내보냅니다.')
            + group('side', '식사 · 사이드', 'bi-egg-fried', '#f59e0b',
                '<i class="bi bi-clock-history"></i> 계란찜은 2차, 찌개·냉면·공기밥은 3차로 손님 식사 진행에 맞춰 나갑니다.')
            + `<div class="section">
                <div class="section-head"><h2><i class="bi bi-basket-fill" style="color:var(--ok);"></i> 반찬 · 쌈채소 기준</h2></div>
                <div class="card">
                    ${M().kmeatBanchanPolicy.banchanList.map(b => `
                        <div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:0.88rem;">
                            <div><b>${esc(b.name)}</b><div style="font-size:0.74rem;color:var(--text-sub);">${esc(b.note)}</div></div>
                            <b style="color:var(--info);white-space:nowrap;">${esc(b.amount)}</b>
                        </div>`).join('')}
                    <div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:0.88rem;">
                        <div><b>상추</b><div style="font-size:0.74rem;color:var(--text-sub);">2회 세척 후 물기 제거</div></div>
                        <b style="color:var(--info);white-space:nowrap;">70g / 1인분</b>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;font-size:0.88rem;">
                        <div><b>깻잎</b><div style="font-size:0.74rem;color:var(--text-sub);">줄기 제거, 겹치지 않게</div></div>
                        <b style="color:var(--info);white-space:nowrap;">20g / 1인분</b>
                    </div>
                </div>
            </div>`;
    }

    function openMenuManual(menuId) {
        const m = M().getKmeatMenuManual(menuId);
        if (!m) return;
        const c = M().getKmeatServeCourse(m);
        const cm = M().kmeatServiceCourses[c] || {};
        openSheet(esc(m.name), 'bi-journal-text', `
            <div class="card">
                <div class="chips" style="margin:0;">
                    <span class="chip course" style="color:${cm.color};border-color:${cm.color};">${esc(cm.label || '')}</span>
                    <span class="chip time"><i class="bi bi-stopwatch"></i> ${m.prepMinutes}분</span>
                    ${m.raw ? '<span class="chip raw"><i class="bi bi-droplet"></i> 생고기 제공</span>' : ''}
                    <span class="chip">${won.format(m.price)}원 / ${esc(m.unit)}</span>
                </div>
                <div style="margin-top:9px;font-size:0.8rem;color:var(--text-sub);line-height:1.55;">
                    ${esc(cm.desc || '')}
                </div>
            </div>
            ${m.scale ? `<div class="notice">
                <i class="bi bi-speedometer2"></i> <b>저울 계량</b> · 목표 <b>${m.scale.target}g</b>
                (허용 ${m.scale.min}~${m.scale.max}g)<br>${esc(m.scale.note)}</div>` : ''}
            <div class="section-head" style="margin:0;"><h2><i class="bi bi-list-ol"></i> 작업 순서</h2></div>
            <div class="steps">
                ${(m.steps || []).map(s => `<div class="step">
                    <div class="step-no">${s.step}</div>
                    <div class="step-body">
                        <div class="step-text">${esc(s.text)}</div>
                        <div class="step-min"><i class="bi bi-stopwatch"></i> 약 ${s.minutes}분</div>
                    </div></div>`).join('')}
            </div>
            ${(m.cautions || []).length ? `<div class="caution">
                <i class="bi bi-exclamation-triangle-fill"></i> ${m.cautions.map(esc).join('<br>')}</div>` : ''}
        `);
    }

    // ══════════════════════════════════════════
    //  탭 4: 휴식 / QR
    // ══════════════════════════════════════════
    function renderRest() {
        const box = $('view-rest');
        if (!box) return;

        if (isResting) {
            // 💡 복귀 조작(.rest-return)은 .section 밖에 둔다.
            //    body.resting 이 .section 을 pointer-events:none 으로 잠그기 때문.
            box.innerHTML = `
                <div class="rest-banner">
                    <div><i class="bi bi-cup-hot-fill"></i> 휴식 중</div>
                    <div class="t" id="rest-timer">${hhmmss(restAccumSec)}</div>
                    <div style="font-size:0.8rem;font-weight:700;">급여 계산이 일시 정지되었습니다.</div>
                </div>
                <div class="rest-return">
                    <div class="notice warn" style="margin-bottom:12px;">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        작업장으로 돌아오면 <b>입구 QR코드</b>를 스캔해야 휴식이 종료되고 작업이 재개됩니다.
                    </div>

                    <div class="qr-box ok demo" onclick="KmeatWorker.scanEnter()">
                        <i class="bi bi-qr-code-scan"></i>
                        <b>작업장 입장 QR 스캔</b>
                        <span>자리에 돌아오셨다면 QR코드를 찍어주세요.</span>
                        <span class="demo-hint"><span><i class="bi bi-hand-index-fill"></i> 데모: 여기를 클릭하면 스캔됩니다</span></span>
                    </div>

                    <button class="btn btn-ok" style="margin-top:12px;" onclick="KmeatWorker.scanEnter()">
                        <i class="bi bi-play-fill"></i> 휴식 종료 · 작업 복귀하기
                    </button>

                    <div style="margin-top:10px;font-size:0.78rem;color:var(--text-sub);text-align:center;line-height:1.55;">
                        QR 스캔 또는 위 버튼을 누르면 휴식이 종료됩니다.
                    </div>

                    ${helpCardHtml()}
                </div>`;
            return;
        }

        box.innerHTML = `<div class="section">
            <div class="section-head"><h2><i class="bi bi-cup-hot" style="color:var(--warn);"></i> 휴식 · 위치 QR</h2></div>
            <div class="notice"><i class="bi bi-info-circle-fill"></i>
                4시간 근무에 <b>30분 휴식</b>을 권장합니다. 휴식하려면 안전을 위해 작업장에서 나가야 하며,
                <b>퇴실 QR</b>을 찍으면 휴식 타이머가 시작됩니다.
            </div>
            <div class="qr-box demo" onclick="KmeatWorker.scanExit()">
                <i class="bi bi-qr-code-scan"></i>
                <b>작업장 퇴실 QR 스캔</b>
                <span>휴식을 시작합니다.<br>QR코드를 찍어주세요.</span>
                <span class="demo-hint"><span><i class="bi bi-hand-index-fill"></i> 데모: 여기를 클릭하면 스캔됩니다</span></span>
            </div>
            <div class="card" style="margin-top:12px;">
                <div style="font-size:0.9rem;font-weight:800;margin-bottom:9px;">
                    <i class="bi bi-geo-alt-fill" style="color:var(--purple);"></i> 자리 위치 확인 QR
                </div>
                <div style="font-size:0.8rem;color:var(--text-sub);line-height:1.6;margin-bottom:11px;">
                    담당 스테이션에 도착했을 때 위치 QR을 찍어 근무 위치를 등록합니다.
                </div>
                <button class="btn btn-purple" onclick="KmeatWorker.scanStation()">
                    <i class="bi bi-qr-code"></i> ${esc(station().label)} 위치 QR 찍기
                </button>
            </div>
            ${helpCardHtml()}
            ${finishCardHtml()}
            <div class="card">
                <div style="font-size:0.9rem;font-weight:800;margin-bottom:9px;">
                    <i class="bi bi-house-heart-fill" style="color:#ec4899;"></i> 조퇴하기
                </div>
                <div style="font-size:0.8rem;color:var(--text-sub);line-height:1.6;margin-bottom:11px;">
                    몸이 안 좋거나 사정이 있으면 조퇴를 신청할 수 있습니다.
                    승인 대기 5분 후 퇴실 QR을 찍으면 정산됩니다.
                </div>
                <button class="btn btn-danger-line" onclick="KmeatWorker.openLeave()">
                    <i class="bi bi-house-heart"></i> 조퇴 신청하기
                </button>
            </div>
        </div>`;
    }

    /* ── 라운지: 근무 종료 카드 ─────────────────────────────
       근무 종료 버튼은 예정 종료 10분 전부터 활성화된다.
       ⓘ 를 누르면 '근무 종료 10분 전에 활성화됩니다.' 안내를 보여준다. */
    function shiftEndInfo() {
        // 가상체험(kmeat-ex)은 예약 시간대와 무관한 3분 체험이므로 잠그지 않는다.
        if (IS_EX) {
            return { label: null, minutesLeft: null, secondsLeft: null, canFinish: true, hasSchedule: false, thresholdMinutes: 10 };
        }
        if (M().getShiftEndInfo) {
            return M().getShiftEndInfo({ workId: WORK_ID, endLabel: shiftLabel(), checkInAt: new Date(checkInTs()) });
        }
        return { label: shiftLabel(), minutesLeft: Math.ceil(shiftRemainSec() / 60), canFinish: shiftRemainSec() <= 600, hasSchedule: true, thresholdMinutes: 10 };
    }

    // 불고기구이 근무 시간대 (예약이 있으면 예약 시간대를 우선)
    function shiftLabel() {
        try {
            const r = JSON.parse(sessionStorage.getItem('selected_reservation') || 'null');
            if (r && (r.time || r.slotLabel)) return r.time || r.slotLabel;
        } catch (e) {}
        return '16:00 ~ 20:00';
    }

    function finishCardHtml() {
        const info = shiftEndInfo();
        const enabled = info.canFinish || workFinished;   // 근무가 끝난 뒤에는 정산 내역 다시 보기
        const waitMin = info.minutesLeft !== null && info.minutesLeft !== undefined
            ? Math.max(0, info.minutesLeft - (info.thresholdMinutes || 10)) : null;
        return `<div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;">
                <div style="font-size:0.9rem;font-weight:800;">
                    <i class="bi bi-check2-circle" style="color:var(--ok);"></i> 근무 종료
                </div>
                <button type="button" aria-label="근무 종료 활성화 안내"
                        style="background:none;border:0;color:var(--text-sub);font-size:1.1rem;line-height:1;padding:2px 4px;"
                        onclick="KmeatWorker.toggleFinishHint()">
                    <i class="bi bi-info-circle"></i>
                </button>
            </div>
            <div id="finish-hint" class="notice" style="display:none;">
                <i class="bi bi-info-circle-fill"></i>
                <div><b>근무 종료 10분 전에 활성화됩니다.</b><br>
                <span id="finish-hint-detail">${enabled
                    ? '지금 근무를 종료할 수 있습니다.'
                    : `예정 종료 ${esc(String(info.label || ''))} · 약 ${waitMin === null ? '-' : waitMin}분 후 활성화됩니다.`}</span></div>
            </div>
            <div style="font-size:0.8rem;color:var(--text-sub);line-height:1.6;margin:9px 0 11px;">
                근무 종료 10분 전이 되면 눌러주세요. 인수인계와 간단한 청소 안내를 확인하고
                근무 시간·급여·작업 로그를 정산해 근로 이력으로 저장합니다.
            </div>
            <button class="btn btn-brand" id="btn-finish-work" onclick="KmeatWorker.openFinishWork()" ${enabled ? '' : 'disabled'}
                    title="${enabled ? '근무 종료 정산을 진행합니다.' : '근무 종료 10분 전에 활성화됩니다.'}">
                <i class="bi ${enabled ? 'bi-box-arrow-right' : 'bi-lock'}"></i>
                ${enabled ? '근무 종료하기' : '근무 종료 (종료 10분 전 활성화)'}
            </button>
        </div>`;
    }

    function toggleFinishHint() {
        const el = $('finish-hint');
        if (!el) return;
        refreshFinishButton();
        el.style.display = el.style.display === 'none' ? '' : 'none';
    }

    // 1초 타이머에서 버튼 상태를 갱신 (10분 전이 되면 자동 활성화)
    function refreshFinishButton() {
        const btn = $('btn-finish-work');
        if (!btn) return;
        const info = shiftEndInfo();
        const enabled = info.canFinish || workFinished;
        btn.disabled = !enabled;
        btn.title = enabled ? '근무 종료 정산을 진행합니다.' : (M().WORK_FINISH_HINT || '근무 종료 10분 전에 활성화됩니다.');
        btn.innerHTML = enabled
            ? '<i class="bi bi-box-arrow-right"></i> 근무 종료하기'
            : '<i class="bi bi-lock"></i> 근무 종료 (종료 10분 전 활성화)';
        const detail = $('finish-hint-detail');
        if (detail) {
            const waitMin = info.minutesLeft !== null && info.minutesLeft !== undefined
                ? Math.max(0, info.minutesLeft - (info.thresholdMinutes || 10)) : null;
            detail.textContent = enabled
                ? '지금 근무를 종료할 수 있습니다.'
                : `예정 종료 ${info.label || ''} · 약 ${waitMin === null ? '-' : waitMin}분 후 활성화됩니다.`;
        }
    }

    // ── 도움 요청 (매니저 호출) ──
    function helpPending() {
        return M().getKmeatHelpPendingFor ? M().getKmeatHelpPendingFor(MODE, numericUserId()) : null;
    }

    function helpElapsedSec(req) {
        if (!req || !req.createdAt) return 0;
        return Math.max(0, Math.floor((nowDate().getTime() - new Date(req.createdAt).getTime()) / 1000));
    }

    // 휴식·QR 탭에 들어가는 도움 요청 카드 (요청 전 / 요청 중 두 가지 상태)
    function helpCardHtml() {
        const req = helpPending();
        if (req) {
            return `<div class="card" style="border:1px solid rgba(245,158,11,0.45);background:rgba(245,158,11,0.06);">
                <div style="font-size:0.9rem;font-weight:800;margin-bottom:9px;color:#92400e;">
                    <i class="bi bi-life-preserver"></i> 도움 요청 중 · 매니저 확인 대기
                </div>
                <div style="font-size:0.8rem;color:var(--text-sub);line-height:1.6;margin-bottom:11px;">
                    요청 시각 <b>${esc(req.createdAt ? new Date(req.createdAt).toTimeString().slice(0, 8) : '')}</b>
                    · 경과 <b id="help-elapsed">${hhmmss(helpElapsedSec(req))}</b><br>
                    매니저가 도착해 문제가 해결되면 <b>완료</b>를 눌러주세요.
                </div>
                <div class="btn-row">
                    <button class="btn btn-ok btn-sm" onclick="KmeatWorker.completeHelp()">
                        <i class="bi bi-check-circle-fill"></i> 완료
                    </button>
                    <button class="btn btn-line btn-sm" onclick="KmeatWorker.cancelHelp()">
                        <i class="bi bi-x-circle"></i> 요청 취소
                    </button>
                </div>
            </div>`;
        }
        return `<div class="card">
            <div style="font-size:0.9rem;font-weight:800;margin-bottom:9px;">
                <i class="bi bi-life-preserver" style="color:var(--warn);"></i> 도움 요청
            </div>
            <div style="font-size:0.8rem;color:var(--text-sub);line-height:1.6;margin-bottom:11px;">
                작업 중 문제가 생기면 매니저를 호출할 수 있습니다.
                요청하면 관리자 콘솔에 즉시 알림이 표시됩니다.
            </div>
            <button class="btn btn-warn" onclick="KmeatWorker.requestHelp()">
                <i class="bi bi-life-preserver"></i> 도움 요청하기
            </button>
        </div>`;
    }

    function requestHelp() {
        const already = helpPending();
        if (already) {
            toast('이미 도움 요청이 접수되어 있습니다.', 'warn', 'bi-life-preserver');
            renderAll();
            return;
        }
        if (!confirm('도움 요청하시겠습니까?')) return;

        const s = station();
        const res = M().createKmeatHelpRequest ? M().createKmeatHelpRequest({
            mode: MODE,
            workerId: numericUserId(),
            workerName: (currentUser && currentUser.name) || '작업자',
            station: s.key,
            stationLabel: s.label,
            reason: '작업 도움 요청'
        }) : { ok: false };

        if (!res.ok) {
            toast('이미 도움 요청이 접수되어 있습니다.', 'warn', 'bi-life-preserver');
            renderAll();
            return;
        }

        helpWatchId = res.request.id;
        beep([880, 660, 880]);
        vibrate([50, 60, 50]);
        toast('도움 요청이 매니저에게 전달되었습니다.', 'warn', 'bi-life-preserver');
        if (activeTab === 'more') renderMore();
        renderAll();
    }

    function completeHelp() {
        const req = helpPending();
        if (!req) { renderAll(); return; }
        if (!confirm('도움 요청이 해결되었습니까?\n완료 처리하면 요청이 종료됩니다.')) return;

        if (M().resolveKmeatHelpRequest) {
            M().resolveKmeatHelpRequest(req.id, ((currentUser && currentUser.name) || '작업자') + ' (작업자 확인)');
        }
        helpWatchId = null;
        beep([1046, 1318]);
        vibrate(40);
        toast('도움 요청이 완료 처리되었습니다.', 'ok', 'bi-check-circle-fill');
        renderAll();
    }

    function cancelHelp() {
        const req = helpPending();
        if (!req) { renderAll(); return; }
        if (!confirm('도움 요청을 취소하시겠습니까?')) return;
        if (M().cancelKmeatHelpRequest) M().cancelKmeatHelpRequest(req.id);
        helpWatchId = null;
        toast('도움 요청을 취소했습니다.', 'warn', 'bi-x-circle');
        renderAll();
    }

    // 매니저가 완료 처리했는지 감시 (1초 tick 에서 호출)
    function watchHelp() {
        const el = $('help-elapsed');
        if (el) {
            const cur = helpPending();
            if (cur) el.textContent = hhmmss(helpElapsedSec(cur));
        }
        if (!helpWatchId) return;
        const req = M().getKmeatHelpRequest ? M().getKmeatHelpRequest(helpWatchId) : null;
        if (!req || req.status === 'pending') return;

        helpWatchId = null;
        if (req.status === 'resolved') {
            beep([1046, 1318, 1568]);
            vibrate([40, 50, 40]);
            toast(`도움 요청이 <b>완료 처리</b>되었습니다.<br>처리자: ${esc(req.resolvedBy || '매니저')}`,
                'ok', 'bi-check-circle-fill');
        }
        renderAll();
    }

    function scanExit() {
        beep([1200, 900]);
        vibrate([30, 40, 30]);
        isResting = true;
        document.body.classList.add('resting');
        log('[QR] 작업장 퇴실 스캔 · 휴식 시작', 'warn');
        toast('퇴실 완료. 휴식 타이머가 시작되었습니다.', 'warn', 'bi-cup-hot-fill');
        renderAll();
    }

    function scanEnter() {
        beep([900, 1200]);
        vibrate([30, 40, 30]);
        isResting = false;
        document.body.classList.remove('resting');
        log('[QR] 작업장 입장 스캔 · 작업 재개', 'ok');
        toast('입장 완료. 급여 계산이 재개됩니다.', 'ok', 'bi-check-circle-fill');
        renderAll();
    }

    function scanStation() {
        beep([1046]);
        vibrate(40);
        const s = station();
        log(`[QR] ${s.label} 위치 등록 완료`, 'ok');
        toast(`<b>${esc(s.label)}</b> 위치가 등록되었습니다.`, 'ok', 'bi-geo-alt-fill');
    }

    // ── 조퇴 ──
    function openLeave() {
        openSheet('조퇴 신청', 'bi-house-heart', `
            <div class="notice warn"><i class="bi bi-info-circle-fill"></i>
                조퇴 사유를 선택하고 승인을 요청하세요. 승인 대기 중에는 취소할 수 있습니다.
            </div>
            <div class="check-list" id="leave-reasons">
                ${['🤒 컨디션 난조', '🏠 개인 사정', '💬 기타'].map((r, i) => `
                    <div class="check-item ${i === 0 ? 'checked' : ''}" onclick="KmeatWorker.pickReason(this)">
                        <div class="check-box"><i class="bi bi-check-lg"></i></div>
                        <div class="check-name">${r}</div>
                        <div></div>
                    </div>`).join('')}
            </div>
            <button class="btn btn-danger-line" onclick="KmeatWorker.requestLeave()">
                <i class="bi bi-send"></i> 조퇴 승인 요청
            </button>
        `);
    }

    function pickReason(el) {
        const list = $('leave-reasons');
        if (!list) return;
        Array.from(list.children).forEach(c => c.classList.remove('checked'));
        el.classList.add('checked');
        vibrate(18);
    }

    function requestLeave() {
        leaveLeft = 300;
        const render = () => `
            <div class="card" style="text-align:center;">
                <i class="bi bi-hourglass-split" style="font-size:3rem;color:var(--warn);"></i>
                <div style="margin-top:11px;font-size:1.05rem;font-weight:800;">조퇴 승인 대기 중...</div>
                <div style="margin-top:6px;font-size:0.82rem;color:var(--text-sub);line-height:1.55;">
                    잘못 누르셨다면 아래에서 취소할 수 있습니다.
                </div>
                <div onclick="KmeatWorker.skipLeave()" style="margin:14px auto 0;padding:14px;border-radius:12px;
                    background:rgba(245,158,11,0.1);color:#b45309;font-weight:800;cursor:pointer;">
                    남은 시간 <span id="leave-left" style="font-size:1.6rem;">${mmss(leaveLeft)}</span>
                    <div style="font-size:0.72rem;font-weight:600;margin-top:5px;color:var(--text-sub);">
                        (데모) 여기를 누르면 5분을 건너뜁니다.
                    </div>
                </div>
            </div>
            <button class="btn btn-line" onclick="KmeatWorker.cancelLeave()">
                <i class="bi bi-arrow-counterclockwise"></i> 조퇴 무르기 (취소)
            </button>`;
        openSheet('조퇴 승인 대기', 'bi-hourglass-split', render());
        log('[조퇴] 승인 요청 전송', 'warn');

        leaveTimer = setInterval(() => {
            leaveLeft--;
            const el = $('leave-left');
            if (el) el.textContent = mmss(leaveLeft);
            if (leaveLeft <= 0) { clearInterval(leaveTimer); leaveExitScreen(); }
        }, 1000);
    }

    function cancelLeave() {
        if (leaveTimer) clearInterval(leaveTimer);
        toast('조퇴 신청을 취소했습니다.', 'warn', 'bi-arrow-counterclockwise');
        log('[조퇴] 신청 취소');
        closeSheet();
    }

    function skipLeave() {
        if (leaveTimer) clearInterval(leaveTimer);
        leaveExitScreen();
    }

    function leaveExitScreen() {
        openSheet('조퇴 승인 완료', 'bi-door-closed', `
            <div class="notice ok"><i class="bi bi-check-circle-fill"></i>
                조퇴가 승인되었습니다. 퇴실하셔도 좋습니다. 이용해주셔서 감사합니다.
            </div>
            <div class="qr-box" onclick="KmeatWorker.leaveExitScan()">
                <i class="bi bi-qr-code-scan"></i>
                <b>퇴실 QR 스캔</b>
                <span>작업장 입구 QR코드를 찍어주세요.</span>
            </div>
        `);
    }

    function leaveExitScan() {
        beep([1200, 800]);
        vibrate([40, 50, 40]);
        workFinished = true;
        isEarlyLeave = true;
        document.body.classList.add('finished');
        log('[조퇴] 작업장 퇴실 완료 · 업무 종료', 'ok');
        showSummary(true);
    }

    function showSummary(early) {
        const restSec = Math.floor(restAccumSec);
        const workSec = Math.max(0, elapsedSec() - restSec);
        const bonusPerHour = rankBonusPerHour();
        const bonusAmount = rankBonusAmount(workSec);
        const bonusHours = Math.ceil(workSec / 3600);
        openSheet(early ? '조퇴 정산 내역' : '퇴근 정산 내역', 'bi-receipt', `
            <div class="card">
                <div style="text-align:center;font-size:1.1rem;font-weight:800;color:var(--brand);margin-bottom:14px;">
                    수고하셨습니다!
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">총 근무 시간</span><b>${hhmmss(workSec)}</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">휴식 시간</span><b>${hhmmss(restSec)}</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">적용 시급</span><b>${won.format(appliedHourlyWage())}원${bonusPerHour > 0 ? `<span style="font-weight:500;color:var(--text-sub);"> (기본 ${won.format(Math.floor(HOURLY_BASE * payRatio()))} + 순위 ${won.format(bonusPerHour)}/시간)</span>` : ''}</b>
                </div>
                ${bonusAmount > 0 ? `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">순위 보너스</span><b style="color:var(--ok);">+${won.format(bonusAmount)}원<span style="font-weight:500;color:var(--text-sub);"> (${bonusHours}시간분·올림)</span></b>
                </div>` : ''}
                <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-size:1rem;">
                    <b>발생 급여</b>
                    <b style="color:var(--ok);font-size:1.3rem;">${won.format(accumSalary)}원</b>
                </div>
            </div>
            <button class="btn btn-line" onclick="KmeatWorker.switchTab('more');KmeatWorker.closeSheet();">
                <i class="bi bi-journal-text"></i> 나의 작업 기록 보기
            </button>
            ${IS_EX
                ? `<button class="btn btn-brand" onclick="KmeatWorker.completeExperience()">
                       <i class="bi bi-check-circle-fill"></i> 체험 완료하고 나가기
                   </button>`
                : `<button class="btn btn-brand" onclick="KmeatWorker.goMypage()">
                       <i class="bi bi-box-arrow-right"></i> 퇴근하고 마이페이지로
                   </button>`}
        `);
    }

    /* ── 근무 종료(정상 퇴근) ─────────────────────────────
       근무 종료 10분 전에 눌러 인수인계·청소 안내를 받고 정산한다.
       조퇴(leaveExitScan)와 달리 checkoutType 이 '퇴근' 으로 저장된다. */
    function workDetailRowsHtml(workSec, restSec) {
        const bonusPerHour = rankBonusPerHour();
        const bonusAmount = rankBonusAmount(workSec);
        const bonusHours = Math.ceil(workSec / 3600);
        const row = (label, value, strong) => `
            <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                <span style="color:var(--text-sub);">${label}</span>
                <b style="${strong ? 'color:var(--ok);font-size:1.15rem;' : ''}">${value}</b>
            </div>`;
        const dq = M().getKmeatDishQueue ? M().getKmeatDishQueue() : { washed: 0, pending: 0 };
        return row('출근 시각', clockStr(new Date(checkInTs())))
            + row('퇴근 시각', clockStr(nowDate()))
            + row('총 근무 시간', hhmmss(workSec))
            + row('휴식 시간', hhmmss(restSec))
            + row('설겆이 완료', `${dq.washed}개`)
            + row('적용 시급', `${won.format(appliedHourlyWage())}원`
                + (bonusPerHour > 0 ? `<span style="font-weight:500;color:var(--text-sub);"> (기본 ${won.format(Math.floor(HOURLY_BASE * payRatio()))} + 순위 ${won.format(bonusPerHour)}/시간)</span>` : ''))
            + (bonusAmount > 0
                ? row('순위 보너스', `+${won.format(bonusAmount)}원<span style="font-weight:500;color:var(--text-sub);"> (${bonusHours}시간분·올림)</span>`)
                : '')
            + row('발생 급여', `${won.format(accumSalary)}원`, true);
    }

    function clockStr(d) {
        const p = n => String(n).padStart(2, '0');
        return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    // 근로 이력에 저장할 로그 (`[시각] 내용`, 오래된 것 → 최신 순)
    function historyLogLines() {
        const logs = M().getKmeatWorkerLogs ? M().getKmeatWorkerLogs(MODE) : [];
        return logs.map(l => `[${l.time || ''}] ${l.text || ''}`);
    }

    function workLogListHtml() {
        const logs = (M().getKmeatWorkerLogs ? M().getKmeatWorkerLogs(MODE) : []).slice().reverse();
        return `<div class="section-head" style="margin-top:16px;">
                <h2><i class="bi bi-journal-text" style="color:var(--ok);"></i> 오늘의 작업 로그</h2>
                <span class="cnt">${logs.length}건</span>
            </div>
            ${logs.length === 0
                ? `<div class="empty"><i class="bi bi-journal"></i><p>기록이 없습니다.</p></div>`
                : `<div class="log-list">${logs.slice(0, 60).map(l => `
                       <div class="log-row">
                           <span class="log-time">${esc(l.time || '')}</span>
                           <span class="log-text">${esc(l.text || '')}</span>
                       </div>`).join('')}</div>`}
            <div style="font-size:0.75rem;color:var(--text-sub);margin-top:8px;">
                * 위 로그는 근로 이력에 함께 저장되어 마이페이지·근로 상세에서 다시 볼 수 있습니다.
            </div>`;
    }

    function openFinishWork() {
        if (workFinished) { showSummary(isEarlyLeave); return; }
        const gate = shiftEndInfo();
        if (!gate.canFinish) {
            const hint = $('finish-hint');
            if (hint) hint.style.display = '';
            refreshFinishButton();
            toast((M().WORK_FINISH_HINT || '근무 종료 10분 전에 활성화됩니다.')
                + (gate.minutesLeft !== null ? `<br>예정 종료 ${esc(String(gate.label || ''))} · 지금은 ${gate.minutesLeft}분 남았습니다.` : ''),
                'warn', 'bi-lock-fill');
            return;
        }
        const restSec = Math.floor(restAccumSec);
        const workSec = Math.max(0, elapsedSec() - restSec);
        const remainMin = (gate.minutesLeft === null || gate.minutesLeft === undefined)
            ? Math.ceil(shiftRemainSec() / 60) : gate.minutesLeft;
        openSheet('근무 종료', 'bi-check2-circle', `
            <div class="notice ok"><i class="bi bi-info-circle-fill"></i>
                <b>10분 전입니다.</b> 인수인계를 하고, 청소를 간단히 하고 퇴근하시면 됩니다.
                ${remainMin > 0 ? `<br><span style="opacity:.85;">예정 종료까지 약 ${remainMin}분 남았습니다.</span>` : ''}
            </div>
            <div class="card" style="text-align:center;font-size:1.05rem;font-weight:800;color:var(--brand);">
                🙏 이용해주셔서 감사합니다.
            </div>
            <div class="card">${workDetailRowsHtml(workSec, restSec)}</div>
            ${workLogListHtml()}
            <button class="btn btn-brand" onclick="KmeatWorker.confirmFinishWork()">
                <i class="bi bi-box-arrow-right"></i> 근무 종료하고 마이페이지로
            </button>
            <button class="btn btn-line" onclick="KmeatWorker.closeSheet()">
                <i class="bi bi-arrow-left"></i> 계속 근무하기
            </button>
        `);
        log('[근무종료] 종료 안내 확인 (인수인계 · 청소)', 'warn');
    }

    function confirmFinishWork() {
        workFinished = true;
        isEarlyLeave = false;
        document.body.classList.add('finished');
        log('[근무종료] 정상 퇴근 처리 완료', 'ok');
        closeSheet();
        goMypage();
    }

    /* 근로 이력 저장 (mypage2 '내가 했던 일' · explore2 근로 이력 · explore_detail 상세)
       체험 모드(kmeat-ex)는 실제 급여가 아니므로 저장하지 않는다. */
    function saveWorkHistory(early) {
        if (IS_EX) return null;
        if (!M().finishWorkSession) return null;
        const restSec = Math.floor(restAccumSec);
        const workSec = Math.max(0, elapsedSec() - restSec);
        let res = null;
        try { res = JSON.parse(sessionStorage.getItem('selected_reservation') || 'null'); } catch (e) {}
        const dq = M().getKmeatDishQueue ? M().getKmeatDishQueue() : { washed: 0 };
        return M().finishWorkSession({
            workId: WORK_ID,
            userId: sessionStorage.getItem('user-id') || numericUserId(),
            userName: workerName(),
            job: '불고기구이',
            role: (res && res.role) || ((currentUser && currentUser.role === 'ROLE_MANAGER') ? '매니저' : '일반'),
            checkInAt: new Date(checkInTs()),
            checkOutAt: nowDate(),
            workedSeconds: workSec,
            breakSeconds: restSec,
            ratio: payRatio(),
            pay: accumSalary,
            bonus: rankBonusAmount(workSec),
            bonusPerHour: rankBonusPerHour(),
            logs: historyLogLines(),
            completedOrdersCount: Number(dq.washed) || 0,
            locker: (res && res.lockerNumber) ? `${res.lockerGender || res.userGender || '선택'} 사물함 ${res.lockerNumber}번` : '사물함 정보 없음',
            isEarlyLeave: !!early,
            checkoutType: early ? '조퇴' : '퇴근',
            date: (res && res.date) || undefined,
            slot: res ? res.slot : null,
            time: (res && (res.time || res.slotLabel)) || undefined,
            extra: { station: stationKey, washedCount: Number(dq.washed) || 0 },
            source: early ? 'kmeat_real_early_leave' : 'kmeat_real_checkout'
        });
    }

    function goMypage() {
        const uid = sessionStorage.getItem('user-id') || 'guest';
        const early = !!isEarlyLeave;
        // 1) 로그·급여를 근로 이력으로 저장
        const historyItem = saveWorkHistory(early);
        // 2) 예약 상태도 종료로 갱신
        if (!IS_EX) {
            let res = null;
            try { res = JSON.parse(sessionStorage.getItem('selected_reservation') || 'null'); } catch (e) {}
            if (res && window.FactoryStore && typeof window.FactoryStore.dispatch === 'function') {
                try {
                    const restSec = Math.floor(restAccumSec);
                    window.FactoryStore.dispatch({ type: 'UPDATE_RESERVATION', payload: {
                        id: res.id,
                        changes: {
                            workStatus: early ? 'early_left' : 'completed',
                            workCompletedAt: nowDate().toISOString(),
                            checkoutType: early ? '조퇴' : '퇴근',
                            breakSeconds: restSec,
                            actualWorkSeconds: Math.max(0, elapsedSec() - restSec),
                            earnedPay: accumSalary,
                            attendanceHistoryId: historyItem ? historyItem.id : undefined
                        }
                    }});
                } catch (e) {}
            }
        }
        // 3) 이 단말의 진행 기록 삭제 (기록은 근로 이력에 남는다)
        localStorage.removeItem('kmeat_checkin_ts_' + MODE + '_' + uid);
        if (M().clearKmeatWorkerLogs) { try { M().clearKmeatWorkerLogs(MODE); } catch (e) {} }
        alert((early ? '조퇴' : '퇴근') + ' 처리가 완료되었습니다.\n이용해주셔서 감사합니다.\n마이페이지에서 오늘 근무 이력을 확인해보세요.');
        window.location.href = 'mypage2.html';
    }

    // ══════════════════════════════════════════
    //  탭 5: 더보기 (근무정보 / 로그)
    // ══════════════════════════════════════════
    function renderMore() {
        // ⚠️ #view-more 를 직접 덮어쓰면 상단 근무현황/체험버튼 요소가 사라져
        //    타이머가 갱신할 대상을 잃는다. 반드시 #more-body 에만 렌더링한다.
        const box = $('more-body');
        if (!box) return;
        const logs = M().getKmeatWorkerLogs ? M().getKmeatWorkerLogs(MODE) : [];
        const dq = M().getKmeatDishQueue ? M().getKmeatDishQueue() : { pending: 0, washed: 0 };
        const st = station();

        box.innerHTML = `<div class="section">
            <div class="section-head"><h2><i class="bi bi-person-badge" style="color:var(--brand);"></i> 나의 근무 정보</h2></div>
            <div class="card">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">근무자</span><b>${esc((currentUser && currentUser.name) || '손님')}</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">공정</span><b>불고기구이 K-Meat</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">담당 포지션</span>
                    <b style="color:${st.color};"><i class="bi ${st.icon}"></i> ${esc(st.label)}</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
                    <span style="color:var(--text-sub);">근무 남은 시간</span><b id="more-remain">${hhmmss(shiftRemainSec())}</b>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.9rem;">
                    <span style="color:var(--text-sub);">설겆이 완료</span><b>${dq.washed}개 (대기 ${dq.pending}개)</b>
                </div>
            </div>

            <div class="section-head" style="margin-top:16px;">
                <h2><i class="bi bi-journal-text" style="color:var(--ok);"></i> 나의 작업 기록</h2>
                <span class="cnt">${logs.length}건</span>
            </div>
            ${logs.length === 0
                ? `<div class="empty"><i class="bi bi-journal"></i><p>기록이 없습니다.</p>
                       <span>작업을 완료하면 여기에 기록됩니다.</span></div>`
                : `<div class="log-list">
                       ${logs.slice().reverse().slice(0, 60).map(l => `
                           <div class="log-row">
                               <span class="log-time">${esc(l.time)}</span>
                               <span class="log-text">${esc(l.text)}</span>
                           </div>`).join('')}
                   </div>`}

            <div style="margin-top:14px;display:flex;flex-direction:column;gap:9px;">
                ${!workFinished ? `<button class="btn btn-line" onclick="KmeatWorker.showSummary(false)">
                    <i class="bi bi-receipt"></i> 지금까지 급여 정산 보기
                </button>` : ''}
                <a class="btn btn-line" href="bulgogi_order.html?workId=6" style="text-decoration:none;">
                    <i class="bi bi-phone"></i> 손님 주문 화면 열기
                </a>
                <a class="btn btn-line" href="main.html" style="text-decoration:none;">
                    <i class="bi bi-house-door"></i> 메인으로
                </a>
            </div>
        </div>`;
    }

    // ══════════════════════════════════════════
    //  탭 / 렌더
    // ══════════════════════════════════════════
    const TABS = ['orders', 'work', 'manual', 'rest', 'more'];

    function switchTab(tab) {
        if (TABS.indexOf(tab) < 0) tab = 'orders';
        activeTab = tab;
        TABS.forEach(t => {
            const v = $('view-' + t);
            if (v) v.style.display = t === tab ? 'block' : 'none';
            const b = $('tab-' + t);
            if (b) b.classList.toggle('active', t === tab);
        });
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderBadges() {
        const todo = ['butcher', 'soup', 'cold', 'prep'].indexOf(stationKey) > -1
            ? myTasks().filter(t => !t.done).length
            : (stationKey === 'serving'
                ? (M().getKmeatServeQueue ? M().getKmeatServeQueue().filter(q => q.ready).length : 0)
                : (M().getKmeatDishQueue ? M().getKmeatDishQueue().pending : 0));
        const ob = $('badge-orders');
        if (ob) { ob.textContent = String(activeOrders().length); ob.classList.toggle('show', activeOrders().length > 0); }
        const wb = $('badge-work');
        if (wb) { wb.textContent = String(todo); wb.classList.toggle('show', todo > 0); }
    }

    function renderAll() {
        renderBadges();
        if (activeTab === 'orders') renderOrders();
        if (activeTab === 'work') renderWork();
        if (activeTab === 'manual') renderManuals();
        if (activeTab === 'rest') renderRest();
        if (activeTab === 'more') renderMore();
    }

    // 신규 주문 감지
    function detectNew() {
        const list = orders();
        const cur = new Set(list.map(o => String(o.orderNo)));
        const fresh = list.filter(o => !knownOrderNos.has(String(o.orderNo)) && o.status !== 'cancelled');

        if (notifyArmed && fresh.length > 0) {
            fresh.forEach(o => {
                const est = M().estimateKmeatOrderTime(o);
                const names = (o.items || []).map(i => i.name).slice(0, 2).join(', ');
                toast(`🔔 <b>새 주문 #${esc(o.orderNo)}</b><br>${esc(o.tableId || '')} · ${esc(names)}<br>생고기 <b>${est.firstServeMinutes}분</b> 내 서빙`,
                    'ng', 'bi-bell-fill');
                log(`[신규주문] #${o.orderNo} ${o.tableId} · ${names}`, 'warn');
            });
            beep([784, 1046, 1318]);
            vibrate([60, 60, 60]);
        }
        knownOrderNos = cur;
        notifyArmed = true;
    }

    // ══════════════════════════════════════════
    //  공개 API
    // ══════════════════════════════════════════
    window.KmeatWorker = {
        switchTab, closeSheet, openStationPicker, pickStation,
        openOrderDetail, openManual, openMenuManual, toggleStep,
        openScale, scaleAdd, scaleSet, scaleAuto, confirmScale,
        openBanchan, toggleBanchan, confirmBanchan,
        openCook, startCook, stopCook,
        doneTask, undoTask, serveCourse, wash,
        scanExit, scanEnter, scanStation,
        requestHelp, completeHelp, cancelHelp,
        openLeave, pickReason, requestLeave, cancelLeave, skipLeave, leaveExitScan,
        showSummary, goMypage, completeExperience,
        openFinishWork, confirmFinishWork, toggleFinishHint
    };

    // ══════════════════════════════════════════
    //  초기화
    // ══════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', function () {
        currentUser = resolveUser();
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }

        const nameEl = $('who');
        if (nameEl) nameEl.textContent = (currentUser.name || '작업자') + ' 님';

        checkInTs();
        tick();
        setInterval(tick, 1000);

        knownOrderNos = new Set(orders().map(o => String(o.orderNo)));
        notifyArmed = true;

        // 새로고침해도 진행 중인 도움 요청을 계속 감시
        const myHelp = helpPending();
        if (myHelp) helpWatchId = myHelp.id;

        if (IS_EX) startExpTimer();

        if (M().syncKmeatDishQueue) M().syncKmeatDishQueue();
        switchTab('orders');
        log(IS_EX ? '불고기구이 가상체험을 시작했습니다.' : '불고기구이 실제 작업을 시작했습니다.');

        window.addEventListener('storage', function () { detectNew(); renderAll(); });

        if (window.FactoryStore && typeof window.FactoryStore.subscribe === 'function') {
            window.FactoryStore.subscribe(function () { renderAll(); });
        }

        setInterval(function () {
            if (window.FactoryStore && typeof window.FactoryStore.dispatch === 'function'
                && !window.FactoryStore.isSaving()) {
                window.FactoryStore.dispatch({ type: 'SYNC_FROM_STORAGE' });
            }
            detectNew();
            renderAll();
        }, 3000);
    });
})();
