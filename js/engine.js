(function() {
    // 1. Election of Master Tab
    const tabId = 'tab_' + Math.random().toString(36).substring(2, 11);
    let isMaster = false;
    let lastTick = Date.now();

    function electMaster() {
        const now = Date.now();
        let masterInfo = null;
        try {
            const raw = localStorage.getItem('kimp_master_tab_info');
            if (raw) masterInfo = JSON.parse(raw);
        } catch(e) {}

        // If no master exists, or the master has not ticked in 2.5 seconds, or we are the master
        if (!masterInfo || (now - masterInfo.timestamp > 2500) || masterInfo.id === tabId) {
            localStorage.setItem('kimp_master_tab_info', JSON.stringify({
                id: tabId,
                timestamp: now
            }));
            if (!isMaster) {
                isMaster = true;
                console.log(`[Engine] Elected as MASTER tab: ${tabId}`);
            }
        } else {
            if (isMaster) {
                isMaster = false;
                console.log(`[Engine] Demoted to SLAVE tab: ${tabId}`);
            }
        }
    }

    // Run election every 1s
    electMaster();
    setInterval(electMaster, 1000);

    // Release master on tab close
    window.addEventListener('beforeunload', function() {
        try {
            const raw = localStorage.getItem('kimp_master_tab_info');
            if (raw) {
                const info = JSON.parse(raw);
                if (info.id === tabId) {
                    localStorage.removeItem('kimp_master_tab_info');
                }
            }
        } catch(e) {}
    });

    // 2. Master Tab Tick Loop (runs every 1s)
    setInterval(function() {
        if (!isMaster) return;

        const now = Date.now();
        const deltaTime = Math.round((now - lastTick) / 1000);
        lastTick = now;

        if (deltaTime <= 0) return;

        const store = window.FactoryStore;
        if (!store) return;

        const state = store.getState();
        const currentUserId = state.currentUser ? state.currentUser.id : null;
        const currentWorker = currentUserId ? state.workers[currentUserId] : null;

        // A. Increment worked hours for current logged-in user
        if (state.currentUser && currentWorker) {
            const hourDelta = deltaTime / 3600; // Increment hours fraction
            store.dispatch({
                type: 'INCREMENT_WORKED_HOURS',
                payload: {
                    userId: state.currentUser.id,
                    value: hourDelta
                }
            });
        }

        // B. Decrement experienceRemainingSeconds
        if (state.experienceRemainingSeconds > 0) {
            const newExpTime = Math.max(0, state.experienceRemainingSeconds - deltaTime);
            store.dispatch({
                type: 'UPDATE_EXPERIENCE_TIME',
                payload: newExpTime
            });
        }

        // C. Update Shift remaining seconds & clock time
        const newRemaining = Math.max(0, (state.remainingSeconds || 7200) - deltaTime);
        const sysTime = new Date();
        store.dispatch({
            type: 'SET_SHIFT_TIME',
            payload: {
                remainingSeconds: newRemaining,
                clockHour: sysTime.getHours(),
                clockMinute: sysTime.getMinutes(),
                secondCounter: sysTime.getSeconds()
            }
        });

        // D. Update Break times if on break
        if (currentWorker && currentWorker.isOnBreak) {
            const newBreakRem = Math.max(0, (currentWorker.breakRemainingSeconds || 1800) - deltaTime);
            const newAccumBreak = (currentWorker.accumBreakSeconds || 0) + deltaTime;
            store.dispatch({
                type: 'SET_BREAK_TIME',
                payload: {
                    userId: state.currentUser.id,
                    breakRemainingSeconds: newBreakRem,
                    accumBreakSeconds: newAccumBreak
                }
            });
        }

        // E. Update Helper Countdown in localStorage
        try {
            let helperReqStr = localStorage.getItem('kimp_help_request');
            if (helperReqStr) {
                let helperReq = JSON.parse(helperReqStr);
                if (helperReq && helperReq.status === "requested") {
                    let arrivalSec = helperReq.arrivalCountdown !== undefined ? helperReq.arrivalCountdown : 10;
                    if (arrivalSec > 0) {
                        helperReq.arrivalCountdown = Math.max(0, arrivalSec - deltaTime);
                        localStorage.setItem('kimp_help_request', JSON.stringify(helperReq));
                        window.dispatchEvent(new Event('storage'));
                    }
                }
            }
        } catch(e) {}

        // F. Update Active Session Duration in productionOrders
        let ordersChanged = false;
        const orders = state.productionOrders || {};
        Object.keys(orders).forEach(orderId => {
            const order = orders[orderId];
            if (order && order.stages) {
                Object.keys(order.stages).forEach(stageNum => {
                    const stage = order.stages[stageNum];
                    if (stage && stage.step1Done && !stage.statusSubmitted) {
                        if (stage.sessions && stage.sessions.length > 0) {
                            const lastSession = stage.sessions[stage.sessions.length - 1];
                            if (lastSession && !lastSession.endTime) {
                                lastSession.duration = (lastSession.duration || 0) + deltaTime;
                                ordersChanged = true;
                            }
                        }
                    }
                });
            }
        });

        if (ordersChanged) {
            store.dispatch({
                type: 'SET_PRODUCTION_ORDERS',
                payload: orders
            });
        }

    }, 1000);

    // 3. UI Synchronization subscription in every tab
    window.addEventListener('load', function() {
        const store = window.FactoryStore;
        if (!store) return;

        store.subscribe(function(state) {
            const currentUserId = state.currentUser ? state.currentUser.id : "guest";
            const worker = state.workers[currentUserId] || {};

            // Sync store state to local global variables in page context if they exist
            if (typeof remainingSeconds !== 'undefined') {
                remainingSeconds = state.remainingSeconds;
            }
            if (typeof clockHour !== 'undefined') {
                clockHour = state.clockHour;
            }
            if (typeof clockMinute !== 'undefined') {
                clockMinute = state.clockMinute;
            }
            if (typeof secondCounter !== 'undefined') {
                secondCounter = state.secondCounter;
            }
            if (typeof experienceRemainingSeconds !== 'undefined') {
                experienceRemainingSeconds = state.experienceRemainingSeconds;
            }
            if (typeof accumBreakSeconds !== 'undefined') {
                accumBreakSeconds = worker.accumBreakSeconds || 0;
            }
            if (typeof breakRemainingSeconds !== 'undefined') {
                breakRemainingSeconds = worker.breakRemainingSeconds || 1800;
            }
            if (typeof isOnBreak !== 'undefined') {
                isOnBreak = worker.isOnBreak || false;
            }
            if (typeof productionOrders !== 'undefined' && state.productionOrders) {
                for (var key in state.productionOrders) {
                    productionOrders[key] = {
                        ...(productionOrders[key] || {}),
                        ...state.productionOrders[key]
                    };
                }
                for (var key in productionOrders) {
                    if (!state.productionOrders[key]) {
                        delete productionOrders[key];
                    }
                }
            }

            // Trigger page update/render functions
            if (typeof updateClocks === 'function') {
                updateClocks();
            }
            if (typeof updateSalaryAndBreakTime === 'function') {
                updateSalaryAndBreakTime();
            }
            if (typeof updateCompleteButtonText === 'function') {
                updateCompleteButtonText();
            }
            if (typeof syncClock === 'function') {
                syncClock();
            }
            if (typeof syncSalary === 'function') {
                syncSalary();
            }
        });
    });

    // Expose engine status globally
    window.SimulationEngine = {
        isMaster: () => isMaster,
        getTabId: () => tabId
    };
})();
