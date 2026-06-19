(function() {
    // Partitioning helper functions (matching js/auth-guard.js)
    if (!window.getStorageKey) {
        window.getStorageKey = function(key) {
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request' || key === 'kimp_workers_progress') {
                return key;
            }
            const userId = sessionStorage.getItem("user-id") || "guest";
            return key + "_" + userId;
        };
    }
    if (!window.getPartitionedItem) {
        window.getPartitionedItem = function(key) {
            return localStorage.getItem(window.getStorageKey(key));
        };
    }
    if (!window.setPartitionedItem) {
        window.setPartitionedItem = function(key, value) {
            localStorage.setItem(window.getStorageKey(key), value);
        };
    }
    if (!window.removePartitionedItem) {
        window.removePartitionedItem = function(key) {
            localStorage.removeItem(window.getStorageKey(key));
        };
    }

    let state = {
        currentUser: null,
        workers: {}, // { [userId]: { id, name, workedHours, udonHours, walletHours, checkInTime, accumBreakSeconds, breakRemainingSeconds, isOnBreak, helperBonus, helperBaseSalary, salary, completedOrdersCount } }
        reservations: [],
        history: [],
        experienceRemainingSeconds: 180,
        productionOrders: {},
        workersProgress: {},
        remainingSeconds: 7200,
        clockHour: 15,
        clockMinute: 0,
        secondCounter: 0
    };

    const listeners = [];

    function loadFromStorage() {
        const userStr = sessionStorage.getItem("user");
        state.currentUser = userStr ? JSON.parse(userStr) : null;
        
        let loadedWorkers = {};
        try {
            loadedWorkers = JSON.parse(localStorage.getItem('kimp_workers_state') || '{}');
        } catch(e) {}

        const defaultWorkers = {
            "1": { id: 1, name: "최현일", workedHours: 133, udonHours: 0, walletHours: 0, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "2": { id: 2, name: "최수아", workedHours: 22, udonHours: 0, walletHours: 0, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "3": { id: 3, name: "김수민", workedHours: 0, udonHours: 0, walletHours: 0, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "4": { id: 4, name: "김영희", workedHours: 45, udonHours: 0, walletHours: 0, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 }
        };

        state.workers = { ...defaultWorkers, ...loadedWorkers };

        const mockEmails = {
            "1": "tt2t2am1118@naver.com",
            "2": "capegon21@gmail.com",
            "3": "capegon23@gmail.com",
            "4": "younghee@naver.com"
        };

        // Migration from legacy individual keys
        Object.keys(state.workers).forEach(uId => {
            const w = state.workers[uId];
            const email = mockEmails[uId];
            const oldUserIds = [`local-${email}`, uId];
            
            if (w.udonHours === 0) {
                for (let oldId of oldUserIds) {
                    let v = localStorage.getItem("mypage_hours_udon_" + oldId);
                    if (v !== null) {
                        w.udonHours = parseInt(v) || 0;
                        break;
                    }
                }
            }
            if (w.walletHours === 0) {
                for (let oldId of oldUserIds) {
                    let v = localStorage.getItem("mypage_hours_wallet_" + oldId);
                    if (v !== null) {
                        w.walletHours = parseInt(v) || 0;
                        break;
                    }
                }
            }
            if (!w.checkInTime) {
                for (let oldId of oldUserIds) {
                    let v = localStorage.getItem("kimp_check_in_time_" + oldId);
                    if (v !== null) {
                        w.checkInTime = v;
                        break;
                    }
                }
                if (!w.checkInTime && state.currentUser && String(state.currentUser.id) === String(uId)) {
                    let v = localStorage.getItem("kimp_check_in_time");
                    if (v) w.checkInTime = v;
                }
            }
            if (state.currentUser && String(state.currentUser.id) === String(uId)) {
                const profileStr = sessionStorage.getItem('kimp_worker_profile');
                if (profileStr) {
                    w.workedHours = JSON.parse(profileStr).workedHours || w.workedHours;
                }
            }
        });

        // 2. Reservations
        try {
            let parsed = JSON.parse(localStorage.getItem(getStorageKey('kimp_reservations_db')) || '[]');
            state.reservations = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            state.reservations = [];
        }

        // 3. History
        const currentUserId = state.currentUser ? state.currentUser.id : "guest";
        try {
            let parsed = JSON.parse(localStorage.getItem("mypage_history_" + currentUserId) || '[]');
            state.history = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            state.history = [];
        }

        // 4. Experience time
        const expRem = localStorage.getItem(getStorageKey('kimp_experience_remaining_seconds'));
        state.experienceRemainingSeconds = expRem !== null ? parseInt(expRem) : 180;

        // 6. Production orders
        try {
            let parsed = JSON.parse(localStorage.getItem('kimp_production_orders') || '{}');
            if (parsed && Array.isArray(parsed)) {
                let obj = {};
                parsed.forEach(o => {
                    if (o && o.orderId) obj[o.orderId] = o;
                });
                state.productionOrders = obj;
            } else {
                state.productionOrders = parsed || {};
            }
        } catch(e) {
            state.productionOrders = {};
        }

        // 7. Workers progress
        try {
            state.workersProgress = JSON.parse(localStorage.getItem('kimp_workers_progress') || '{}');
        } catch(e) {
            state.workersProgress = {};
        }

        // 8. Shift timer
        const rem = localStorage.getItem(getStorageKey('kimp_remaining_seconds'));
        state.remainingSeconds = rem !== null ? parseInt(rem) : 7200;

        const h = localStorage.getItem(getStorageKey('kimp_clock_hour'));
        state.clockHour = h !== null ? parseInt(h) : 15;
        const m = localStorage.getItem(getStorageKey('kimp_clock_minute'));
        state.clockMinute = m !== null ? parseInt(m) : 0;
        const s = localStorage.getItem(getStorageKey('kimp_second_counter'));
        state.secondCounter = s !== null ? parseInt(s) : 0;
    }

    function saveToStorage(onlyKeys) {
        const currentUserId = state.currentUser ? state.currentUser.id : "guest";
        const shouldSave = (key) => !onlyKeys || onlyKeys.includes(key);

        // 0. Workers state
        if (shouldSave('workers')) {
            localStorage.setItem('kimp_workers_state', JSON.stringify(state.workers));
            // Save legacy values for absolute backward compatibility
            Object.keys(state.workers).forEach(uId => {
                const w = state.workers[uId];
                localStorage.setItem("mypage_hours_udon_" + uId, w.udonHours);
                localStorage.setItem("mypage_hours_wallet_" + uId, w.walletHours);
                if (w.checkInTime) {
                    localStorage.setItem("kimp_check_in_time_" + uId, w.checkInTime);
                } else {
                    localStorage.removeItem("kimp_check_in_time_" + uId);
                }
            });
            if (state.workers[currentUserId]) {
                const profileStr = sessionStorage.getItem('kimp_worker_profile');
                let profile = profileStr ? JSON.parse(profileStr) : {};
                profile.workedHours = state.workers[currentUserId].workedHours;
                sessionStorage.setItem('kimp_worker_profile', JSON.stringify(profile));
            }
        }

        // 2. Reservations
        if (shouldSave('reservations')) {
            localStorage.setItem(getStorageKey('kimp_reservations_db'), JSON.stringify(state.reservations));
        }

        // 3. History
        if (shouldSave('history')) {
            localStorage.setItem("mypage_history_" + currentUserId, JSON.stringify(state.history));
        }

        // 4. Experience time
        if (shouldSave('experience_time')) {
            localStorage.setItem(getStorageKey('kimp_experience_remaining_seconds'), state.experienceRemainingSeconds);
        }

        // 5. Check-in time
        if (shouldSave('check_in_time')) {
            if (state.workers[currentUserId] && state.workers[currentUserId].checkInTime) {
                localStorage.setItem(getStorageKey('kimp_check_in_time'), state.workers[currentUserId].checkInTime);
            } else {
                localStorage.removeItem(getStorageKey('kimp_check_in_time'));
            }
        }

        // 6. Production orders
        if (shouldSave('production_orders')) {
            let currentOrders = {};
            try {
                let storedOrders = localStorage.getItem('kimp_production_orders');
                let parsed = storedOrders ? JSON.parse(storedOrders) : {};
                if (parsed && Array.isArray(parsed)) {
                    let obj = {};
                    parsed.forEach(o => {
                        if (o && o.orderId) obj[o.orderId] = o;
                    });
                    currentOrders = obj;
                } else {
                    currentOrders = parsed || {};
                }
            } catch(e) {
                currentOrders = {};
            }

            const getStatusPriority = function(status) {
                if (status === 'completed') return 2;
                if (status === 'in_progress') return 1;
                return 0; // pending or other
            };

            // Merge local state.productionOrders into currentOrders safely
            for (let key in state.productionOrders) {
                if (currentOrders[key]) {
                    let localPriority = getStatusPriority(state.productionOrders[key].status);
                    let storagePriority = getStatusPriority(currentOrders[key].status);
                    
                    if (localPriority > storagePriority) {
                        currentOrders[key].status = state.productionOrders[key].status;
                        if (state.productionOrders[key].currentTask !== undefined) {
                            currentOrders[key].currentTask = state.productionOrders[key].currentTask;
                        }
                        if (state.productionOrders[key].progressStatus) {
                            currentOrders[key].progressStatus = state.productionOrders[key].progressStatus;
                        }
                    } else {
                        // Keep storage state and sync it back to local state
                        state.productionOrders[key].status = currentOrders[key].status;
                        if (currentOrders[key].currentTask !== undefined) {
                            state.productionOrders[key].currentTask = currentOrders[key].currentTask;
                        }
                        if (currentOrders[key].progressStatus) {
                            state.productionOrders[key].progressStatus = currentOrders[key].progressStatus;
                        }
                    }
                    
                    // Merge stages and other nested objects safely
                    if (state.productionOrders[key].stages) {
                        if (!currentOrders[key].stages) currentOrders[key].stages = {};
                        for (let stageNum in state.productionOrders[key].stages) {
                            currentOrders[key].stages[stageNum] = {
                                ...(currentOrders[key].stages[stageNum] || {}),
                                ...(state.productionOrders[key].stages[stageNum] || {})
                            };
                        }
                    }
                } else {
                    currentOrders[key] = state.productionOrders[key];
                }
            }

            // Sync back to state just in case
            state.productionOrders = currentOrders;
            localStorage.setItem('kimp_production_orders', JSON.stringify(state.productionOrders));
        }

        // 7. Workers progress
        if (shouldSave('workers_progress')) {
            localStorage.setItem('kimp_workers_progress', JSON.stringify(state.workersProgress));
        }

        // 8. Shift timer
        if (shouldSave('shift_timer')) {
            localStorage.setItem(getStorageKey('kimp_remaining_seconds'), state.remainingSeconds);
            localStorage.setItem(getStorageKey('kimp_clock_hour'), state.clockHour);
            localStorage.setItem(getStorageKey('kimp_clock_minute'), state.clockMinute);
            localStorage.setItem(getStorageKey('kimp_second_counter'), state.secondCounter);
        }

        // 9. Break times and helper salary
        if (shouldSave('break_times') || shouldSave('workers')) {
            if (state.workers[currentUserId]) {
                const w = state.workers[currentUserId];
                localStorage.setItem(getStorageKey('kimp_accum_break_seconds'), w.accumBreakSeconds);
                localStorage.setItem(getStorageKey('kimp_break_remaining_seconds'), w.breakRemainingSeconds);
                localStorage.setItem(getStorageKey('kimp_is_on_break'), w.isOnBreak ? 'true' : 'false');
                localStorage.setItem(getStorageKey('kimp_helper_bonus'), w.helperBonus);
                localStorage.setItem(getStorageKey('kimp_helper_base_salary'), w.helperBaseSalary);
            }
        }
    }

    // Initialize state
    loadFromStorage();

    window.FactoryStore = {
        getState: function() {
            // Return copy to prevent direct mutations
            return {
                currentUser: state.currentUser,
                workers: state.workers ? JSON.parse(JSON.stringify(state.workers)) : {},
                reservations: Array.isArray(state.reservations) ? [...state.reservations] : [],
                history: Array.isArray(state.history) ? [...state.history] : [],
                experienceRemainingSeconds: state.experienceRemainingSeconds,
                productionOrders: state.productionOrders ? { ...state.productionOrders } : {},
                workersProgress: state.workersProgress ? { ...state.workersProgress } : {},
                remainingSeconds: state.remainingSeconds,
                clockHour: state.clockHour,
                clockMinute: state.clockMinute,
                secondCounter: state.secondCounter
            };
        },
        subscribe: function(listener) {
            listeners.push(listener);
            return function unsubscribe() {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            };
        },
        dispatch: function(action) {
            const currentUserId = state.currentUser ? state.currentUser.id : "guest";
            switch (action.type) {
                case 'SET_WORKED_HOURS': {
                    const uId = action.payload.userId || currentUserId;
                    const val = action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].workedHours = parseInt(val);
                    break;
                }
                case 'SET_UDON_HOURS': {
                    const uId = action.payload.userId || currentUserId;
                    const val = action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].udonHours = parseInt(val);
                    break;
                }
                case 'SET_WALLET_HOURS': {
                    const uId = action.payload.userId || currentUserId;
                    const val = action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].walletHours = parseInt(val);
                    break;
                }
                case 'ADD_RESERVATION':
                    state.reservations.push(action.payload);
                    break;
                case 'SET_RESERVATIONS':
                    state.reservations = action.payload;
                    break;
                case 'SET_HISTORY':
                    state.history = action.payload;
                    break;
                case 'ADD_HISTORY_ITEM':
                    state.history.push(action.payload);
                    break;
                case 'UPDATE_EXPERIENCE_TIME':
                    state.experienceRemainingSeconds = parseInt(action.payload);
                    break;
                case 'DECREMENT_EXPERIENCE_TIME':
                    state.experienceRemainingSeconds = Math.max(0, state.experienceRemainingSeconds - 1);
                    break;
                case 'SET_CHECK_IN_TIME': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].checkInTime = val;
                    break;
                }
                case 'SET_PRODUCTION_ORDERS':
                    state.productionOrders = action.payload || {};
                    break;
                case 'UPDATE_PRODUCTION_ORDER': {
                    if (!state.productionOrders) state.productionOrders = {};
                    const orderId = action.payload.orderId;
                    state.productionOrders[orderId] = {
                        ...(state.productionOrders[orderId] || {}),
                        ...action.payload
                    };
                    break;
                }
                case 'INCREMENT_WORKED_HOURS': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? parseFloat(action.payload.value) : parseFloat(action.payload);
                    if (state.workers[uId]) {
                        state.workers[uId].workedHours = parseFloat(state.workers[uId].workedHours || 0) + val;
                    }
                    break;
                }
                case 'SET_ACCUM_BREAK_SECONDS': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].accumBreakSeconds = parseInt(val);
                    break;
                }
                case 'SET_BREAK_REMAINING_SECONDS': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].breakRemainingSeconds = parseInt(val);
                    break;
                }
                case 'SET_IS_ON_BREAK': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].isOnBreak = !!val;
                    break;
                }
                case 'SET_HELPER_BONUS': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].helperBonus = parseInt(val);
                    break;
                }
                case 'SET_HELPER_BASE_SALARY': {
                    const uId = action.payload && action.payload.userId ? action.payload.userId : currentUserId;
                    const val = action.payload && action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].helperBaseSalary = parseInt(val);
                    break;
                }
                case 'SET_BREAK_TIME': {
                    const uId = action.payload.userId || currentUserId;
                    if (state.workers[uId]) {
                        if (action.payload.breakRemainingSeconds !== undefined) {
                            state.workers[uId].breakRemainingSeconds = parseInt(action.payload.breakRemainingSeconds);
                        }
                        if (action.payload.accumBreakSeconds !== undefined) {
                            state.workers[uId].accumBreakSeconds = parseInt(action.payload.accumBreakSeconds);
                        }
                    }
                    break;
                }
                case 'UPDATE_WORKER_STATE': {
                    const targetWorkerId = action.payload.userId;
                    if (state.workers[targetWorkerId]) {
                        state.workers[targetWorkerId] = {
                            ...state.workers[targetWorkerId],
                            ...action.payload.data
                        };
                    }
                    break;
                }
                case 'SET_WORKERS_PROGRESS':
                    state.workersProgress = action.payload;
                    break;
                case 'UPDATE_WORKER_PROGRESS': {
                    const wId = action.payload.workerId;
                    state.workersProgress[wId] = { ...state.workersProgress[wId], ...action.payload.data };
                    break;
                }
                case 'SET_SHIFT_TIME':
                    if (action.payload.remainingSeconds !== undefined) state.remainingSeconds = parseInt(action.payload.remainingSeconds);
                    if (action.payload.clockHour !== undefined) state.clockHour = parseInt(action.payload.clockHour);
                    if (action.payload.clockMinute !== undefined) state.clockMinute = parseInt(action.payload.clockMinute);
                    if (action.payload.secondCounter !== undefined) state.secondCounter = parseInt(action.payload.secondCounter);
                    break;
                case 'DECREMENT_SHIFT_TIME':
                    state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
                    break;
                case 'SYNC_FROM_STORAGE':
                    loadFromStorage();
                    break;
                case 'RESET_ALL_DATA':
                    state.reservations = [];
                    state.productionOrders = {};
                    state.workersProgress = {};
                    state.remainingSeconds = 7200;
                    state.clockHour = 15;
                    state.clockMinute = 0;
                    state.secondCounter = 0;
                    
                    // Reset all workers
                    Object.keys(state.workers).forEach(uId => {
                        state.workers[uId].checkInTime = null;
                        state.workers[uId].accumWorkSeconds = 0;
                        state.workers[uId].accumBreakSeconds = 0;
                        state.workers[uId].breakRemainingSeconds = 1800;
                        state.workers[uId].isOnBreak = false;
                        state.workers[uId].helperBonus = 0;
                        state.workers[uId].helperBaseSalary = 0;
                        state.workers[uId].salary = 0;
                        state.workers[uId].completedOrdersCount = 0;
                    });
                    break;
                default:
                    console.warn("Unknown action type:", action.type);
                    return;
            }

            if (action.type !== 'SYNC_FROM_STORAGE') {
                let keysToSave = null;
                switch (action.type) {
                    case 'SET_WORKED_HOURS':
                    case 'SET_UDON_HOURS':
                    case 'SET_WALLET_HOURS':
                    case 'INCREMENT_WORKED_HOURS':
                    case 'UPDATE_WORKER_STATE':
                        keysToSave = ['workers'];
                        break;
                    case 'ADD_RESERVATION':
                    case 'SET_RESERVATIONS':
                        keysToSave = ['reservations'];
                        break;
                    case 'SET_HISTORY':
                    case 'ADD_HISTORY_ITEM':
                        keysToSave = ['history'];
                        break;
                    case 'UPDATE_EXPERIENCE_TIME':
                    case 'DECREMENT_EXPERIENCE_TIME':
                        keysToSave = ['experience_time'];
                        break;
                    case 'SET_CHECK_IN_TIME':
                        keysToSave = ['workers', 'check_in_time'];
                        break;
                    case 'SET_PRODUCTION_ORDERS':
                    case 'UPDATE_PRODUCTION_ORDER':
                        keysToSave = ['production_orders'];
                        break;
                    case 'SET_ACCUM_BREAK_SECONDS':
                    case 'SET_BREAK_REMAINING_SECONDS':
                    case 'SET_IS_ON_BREAK':
                    case 'SET_HELPER_BONUS':
                    case 'SET_HELPER_BASE_SALARY':
                    case 'SET_BREAK_TIME':
                        keysToSave = ['workers', 'break_times'];
                        break;
                    case 'SET_WORKERS_PROGRESS':
                    case 'UPDATE_WORKER_PROGRESS':
                        keysToSave = ['workers_progress'];
                        break;
                    case 'SET_SHIFT_TIME':
                    case 'DECREMENT_SHIFT_TIME':
                        keysToSave = ['shift_timer'];
                        break;
                    default:
                        keysToSave = null; // Save all
                }
                saveToStorage(keysToSave);
                window.dispatchEvent(new Event('storage'));
            }

            const currentState = JSON.parse(JSON.stringify(state));
            listeners.forEach(listener => listener(currentState));
        }
    };

    // Override global partitioned storage helpers to route through FactoryStore
    window.getPartitionedItem = function(key) {
        if (!window.FactoryStore) {
            const userId = sessionStorage.getItem("user-id") || "guest";
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request') {
                return localStorage.getItem(key);
            }
            return localStorage.getItem(key + "_" + userId);
        }
        const state = window.FactoryStore.getState();
        const currentUserId = state.currentUser ? state.currentUser.id : "guest";
        const worker = state.workers[currentUserId] || {};

        if (key === 'kimp_reservations_db') {
            return JSON.stringify(state.reservations);
        }
        if (key === 'kimp_production_orders') {
            return JSON.stringify(state.productionOrders);
        }
        if (key === 'kimp_workers_progress') {
            return JSON.stringify(state.workersProgress);
        }
        if (key === 'kimp_remaining_seconds') {
            return String(state.remainingSeconds);
        }
        if (key === 'kimp_clock_hour') {
            return String(state.clockHour);
        }
        if (key === 'kimp_clock_minute') {
            return String(state.clockMinute);
        }
        if (key === 'kimp_second_counter') {
            return String(state.secondCounter);
        }
        if (key === 'kimp_check_in_time') {
            return worker.checkInTime || null;
        }
        if (key === 'kimp_experience_remaining_seconds') {
            return String(state.experienceRemainingSeconds);
        }
        if (key === 'kimp_accum_break_seconds') {
            return String(worker.accumBreakSeconds || 0);
        }
        if (key === 'kimp_break_remaining_seconds') {
            return String(worker.breakRemainingSeconds || 1800);
        }
        if (key === 'kimp_is_on_break') {
            return String(worker.isOnBreak || false);
        }
        if (key === 'kimp_helper_bonus') {
            return String(worker.helperBonus || 0);
        }
        if (key === 'kimp_helper_base_salary') {
            return String(worker.helperBaseSalary || 0);
        }

        function _calcElapsedSinceCheckIn(targetWorker) {
            const elapsedSeconds = 7200 - state.remainingSeconds;
            if (!targetWorker.checkInTime || targetWorker.checkInTime === '-') return elapsedSeconds;
            const parts = targetWorker.checkInTime.split(':');
            if (parts.length < 2) return elapsedSeconds;
            const ciH = parseInt(parts[0]) || 0;
            const ciM = parseInt(parts[1]) || 0;
            const ciS = parts.length > 2 ? (parseInt(parts[2]) || 0) : 0;
            const checkInSecs = ciH * 3600 + ciM * 60 + ciS;
            const now = new Date();
            const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            let diff = nowSecs - checkInSecs;
            if (diff < 0) diff += 86400;
            return diff;
        }

        if (key === 'kimp_salary') {
            const isHelper = state.currentUser && state.currentUser.role === '헬퍼';
            const elapsedSinceCheckIn = _calcElapsedSinceCheckIn(worker);
            if (isHelper) {
                const baseSalary = Math.floor(elapsedSinceCheckIn * (12384 / 3600));
                return String(baseSalary + (worker.helperBonus || 0));
            } else {
                const workSeconds = Math.max(0, elapsedSinceCheckIn - (worker.accumBreakSeconds || 0));
                return String(Math.floor(workSeconds * (12384 / 3600)));
            }
        }
        if (key === 'kimp_helper_base_salary') {
            const elapsedSinceCheckIn = _calcElapsedSinceCheckIn(worker);
            return String(Math.floor(elapsedSinceCheckIn * (12384 / 3600)));
        }
        if (key === 'kimp_salary_taeho' || key === 'kimp_salary_younghee' || key === 'kimp_salary_kimyounghee') {
            const isHelper = state.currentUser && state.currentUser.role === '헬퍼';
            const elapsedSinceCheckIn = _calcElapsedSinceCheckIn(worker);
            if (isHelper) {
                const baseSalary = Math.floor(elapsedSinceCheckIn * (12384 / 3600));
                return String(baseSalary + (worker.helperBonus || 0));
            } else {
                const workSeconds = Math.max(0, elapsedSinceCheckIn - (worker.accumBreakSeconds || 0));
                return String(Math.floor(workSeconds * (12384 / 3600)));
            }
        }
        
        // Fallback to real partitioned storage
        const userId = sessionStorage.getItem("user-id") || "guest";
        return localStorage.getItem(key + "_" + userId);
    };

    window.setPartitionedItem = function(key, value) {
        if (!window.FactoryStore) {
            const userId = sessionStorage.getItem("user-id") || "guest";
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key + "_" + userId, value);
            }
            window.dispatchEvent(new Event('storage'));
            return;
        }
        if (key === 'kimp_reservations_db') {
            window.FactoryStore.dispatch({ type: 'SET_RESERVATIONS', payload: JSON.parse(value) });
            return;
        }
        if (key === 'kimp_production_orders') {
            let parsed = JSON.parse(value);
            let obj = {};
            if (parsed) {
                if (Array.isArray(parsed)) {
                    parsed.forEach(o => {
                        if (o && o.orderId) obj[o.orderId] = o;
                    });
                } else {
                    obj = parsed;
                }
            }
            window.FactoryStore.dispatch({ type: 'SET_PRODUCTION_ORDERS', payload: obj });
            return;
        }
        if (key === 'kimp_workers_progress') {
            window.FactoryStore.dispatch({ type: 'SET_WORKERS_PROGRESS', payload: JSON.parse(value) });
            return;
        }
        if (key === 'kimp_remaining_seconds') {
            window.FactoryStore.dispatch({ type: 'SET_SHIFT_TIME', payload: { remainingSeconds: parseInt(value) } });
            return;
        }
        if (key === 'kimp_clock_hour') {
            window.FactoryStore.dispatch({ type: 'SET_SHIFT_TIME', payload: { clockHour: parseInt(value) } });
            return;
        }
        if (key === 'kimp_clock_minute') {
            window.FactoryStore.dispatch({ type: 'SET_SHIFT_TIME', payload: { clockMinute: parseInt(value) } });
            return;
        }
        if (key === 'kimp_second_counter') {
            window.FactoryStore.dispatch({ type: 'SET_SHIFT_TIME', payload: { secondCounter: parseInt(value) } });
            return;
        }
        if (key === 'kimp_check_in_time') {
            window.FactoryStore.dispatch({ type: 'SET_CHECK_IN_TIME', payload: value });
            return;
        }
        if (key === 'kimp_experience_remaining_seconds') {
            window.FactoryStore.dispatch({ type: 'UPDATE_EXPERIENCE_TIME', payload: value });
            return;
        }
        if (key === 'kimp_accum_break_seconds') {
            window.FactoryStore.dispatch({ type: 'SET_ACCUM_BREAK_SECONDS', payload: parseInt(value) });
            return;
        }
        if (key === 'kimp_break_remaining_seconds') {
            window.FactoryStore.dispatch({ type: 'SET_BREAK_REMAINING_SECONDS', payload: parseInt(value) });
            return;
        }
        if (key === 'kimp_is_on_break') {
            window.FactoryStore.dispatch({ type: 'SET_IS_ON_BREAK', payload: value === 'true' });
            return;
        }
        if (key === 'kimp_helper_bonus') {
            window.FactoryStore.dispatch({ type: 'SET_HELPER_BONUS', payload: parseInt(value) });
            return;
        }
        if (key === 'kimp_helper_base_salary') {
            window.FactoryStore.dispatch({ type: 'SET_HELPER_BASE_SALARY', payload: parseInt(value) });
            return;
        }
        
        // Fallback to real partitioned storage
        const userId = sessionStorage.getItem("user-id") || "guest";
        localStorage.setItem(key + "_" + userId, value);
        window.dispatchEvent(new Event('storage'));
    };

    window.removePartitionedItem = function(key) {
        if (!window.FactoryStore) {
            const userId = sessionStorage.getItem("user-id") || "guest";
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request') {
                localStorage.removeItem(key);
            } else {
                localStorage.removeItem(key + "_" + userId);
            }
            window.dispatchEvent(new Event('storage'));
            return;
        }
        if (key === 'kimp_check_in_time') {
            window.FactoryStore.dispatch({ type: 'SET_CHECK_IN_TIME', payload: null });
            return;
        }
        if (key === 'kimp_experience_remaining_seconds') {
            window.FactoryStore.dispatch({ type: 'UPDATE_EXPERIENCE_TIME', payload: 180 });
            return;
        }
        
        const userId = sessionStorage.getItem("user-id") || "guest";
        localStorage.removeItem(key + "_" + userId);
        window.dispatchEvent(new Event('storage'));
    };

    // Cross-tab sync
    window.addEventListener('storage', function(e) {
        if (!e.key) return;

        const key = e.key;
        if (key.startsWith('kimp_') || key.includes('mypage_') || key === 'kimp_worker_profile' || key.includes('hours_udon') || key.includes('hours_wallet')) {
            window.FactoryStore.dispatch({ type: 'SYNC_FROM_STORAGE' });
        }
    });
})();
