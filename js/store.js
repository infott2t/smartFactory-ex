(function() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yy = String(yesterday.getFullYear()).slice(-2);
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayDateStr = `${yy}${mm}${dd}`;

    window.defaultProductionOrders = {
        [`${yesterdayDateStr}-15-3`]: {
            orderId: `${yesterdayDateStr}-15-3`,
            productId: "raw_cabbage",
            productName: "절임용 원배추",
            quantity: 15,
            status: "in_progress",
            currentTask: 2,
            progressStatus: "생산중 (Stage 2)",
            cabbageOrigin: "충남 태안 황토 배추",
            supplier: "서해안 청과",
            deliveryRoute: "루트-3",
            createdTime: "10:00:00",
            stages: {
                1: {
                    operator: "최수아",
                    startTime: "10:00:00",
                    endTime: "10:15:00",
                    postWorkQty: 15,
                    postWorkWeight: 37.5,
                    sessions: [
                        { operator: "최수아", startTime: "10:00:00", endTime: "10:15:00", duration: 900 }
                    ],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: true,
                    step2Done: true,
                    step2Status: "approved",
                    step3Done: true,
                    step3Status: "approved",
                    step4Done: true,
                    statusSubmitted: true
                },
                2: {
                    operator: "최수아",
                    startTime: "10:17:00",
                    endTime: null,
                    postWorkQty: null,
                    postWorkWeight: null,
                    sessions: [],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: false,
                    step2Done: false,
                    step2Status: "none",
                    step3Done: false,
                    step3Status: "none",
                    step4Done: false,
                    statusSubmitted: false
                }
            }
        },
        [`${yesterdayDateStr}-15-2`]: {
            orderId: `${yesterdayDateStr}-15-2`,
            productId: "raw_cabbage",
            productName: "절임용 원배추",
            quantity: 15,
            status: "in_progress",
            currentTask: 2,
            progressStatus: "생산중 (Stage 2 완료)",
            cabbageOrigin: "제주 서귀포 산지",
            supplier: "제주 영농조합",
            deliveryRoute: "루트-2",
            createdTime: "09:00:00",
            stages: {
                1: {
                    operator: "김태호",
                    startTime: "09:00:00",
                    endTime: "09:15:00",
                    postWorkQty: 15,
                    postWorkWeight: 37.5,
                    sessions: [
                        { operator: "김태호", startTime: "09:00:00", endTime: "09:15:00", duration: 900 }
                    ],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: true,
                    step2Done: true,
                    step2Status: "approved",
                    step3Done: true,
                    step3Status: "approved",
                    step4Done: true,
                    statusSubmitted: true
                },
                2: {
                    operator: null,
                    startTime: null,
                    endTime: null,
                    postWorkQty: null,
                    postWorkWeight: null,
                    sessions: [],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: false,
                    step2Done: false,
                    step2Status: "none",
                    step3Done: false,
                    step3Status: "none",
                    step4Done: false,
                    statusSubmitted: false
                }
            }
        },
        [`${yesterdayDateStr}-15-1`]: {
            orderId: `${yesterdayDateStr}-15-1`,
            productId: "raw_cabbage",
            productName: "절임용 원배추",
            quantity: 15,
            status: "in_progress",
            currentTask: 2,
            progressStatus: "생산중 (Stage 2 완료)",
            cabbageOrigin: "강원 평창 고랭지",
            supplier: "대관령 유통",
            deliveryRoute: "루트-1",
            createdTime: "08:00:00",
            stages: {
                1: {
                    operator: "박준호",
                    startTime: "08:00:00",
                    endTime: "08:15:00",
                    postWorkQty: 15,
                    postWorkWeight: 37.5,
                    sessions: [
                        { operator: "박준호", startTime: "08:00:00", endTime: "08:15:00", duration: 900 }
                    ],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: true,
                    step2Done: true,
                    step2Status: "approved",
                    step3Done: true,
                    step3Status: "approved",
                    step4Done: true,
                    statusSubmitted: true
                },
                2: {
                    operator: null,
                    startTime: null,
                    endTime: null,
                    postWorkQty: null,
                    postWorkWeight: null,
                    sessions: [],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: false,
                    step2Done: false,
                    step2Status: "none",
                    step3Done: false,
                    step3Status: "none",
                    step4Done: false,
                    statusSubmitted: false
                }
            }
        }
    };


    const localStorage = window.localStorage;
    let isSaving = false;

    function mapOrderToFrontend(order) {
        if (!order || typeof order !== 'object') return null;
        const cloned = JSON.parse(JSON.stringify(order));
        if (!cloned.orderId) return null;
        if (!cloned.stages || typeof cloned.stages !== 'object') cloned.stages = {};

        // Construct rawMaterial if missing for legacy orders
        if (!cloned.rawMaterial) {
            cloned.rawMaterial = {
                cabbageQty: cloned.quantity || 5,
                cabbageWeightPerPiece: 2.5,
                origin: cloned.cabbageOrigin || "강원도 평창 고랭지",
                supplier: cloned.supplier || "대관령 유통"
            };
        }

        // Ensure all stages 1 to 5 exist and have basic properties
        for (let i = 1; i <= 5; i++) {
            if (!cloned.stages[i] || typeof cloned.stages[i] !== 'object') {
                cloned.stages[i] = {};
            }
        }

        // Construct stage 1 frontend view
        const s1 = cloned.stages[1] || {};
        s1.operator = s1.operator || (s1.operators && s1.operators[0]) || null;
        s1.postWorkQty = s1.postWorkQty || (s1.step1_cutting && s1.step1_cutting.yieldQty) || cloned.quantity || 0;
        s1.step5Status = s1.step5Status || "none";
        s1.statusSubmitted = s1.statusSubmitted !== undefined ? !!s1.statusSubmitted : false;
        cloned.stages[1] = s1;

        // Construct stage 2 frontend view
        const s2 = cloned.stages[2] || {};
        s2.operator = s2.operator || (s2.operators && s2.operators[0]) || null;
        s2.step5Status = s2.step5Status || "none";

        // Fetch details from manager.html#salting (kimp_factory_salting)
        let saltingBatches = [];
        try {
            saltingBatches = JSON.parse(localStorage.getItem("kimp_factory_salting") || "[]");
        } catch(e) {}
        // Support both ID formats (with/without SALT- prefix, just in case)
        const matchedBatch = saltingBatches.find(b => 
            b.orderId === cloned.orderId || 
            b.id === cloned.orderId || 
            (b.orderId && b.orderId.replace(/^SALT-/, "") === cloned.orderId.replace(/^SALT-/, ""))
        );

        if (matchedBatch) {
            const limit = matchedBatch.saltingTimeLimit || 61200000;
            const elapsed = Date.now() - matchedBatch.startTime;
            const remaining = Math.max(0, limit - elapsed);

            s2.saltingStartTime = new Date(matchedBatch.startTime).toLocaleTimeString();
            s2.targetDuration = limit / 3600000; // e.g. 17
            s2.isTurnedOver = matchedBatch.status === "matured" || elapsed >= limit;
            
            // Map status properties
            if (matchedBatch.status === "matured" || elapsed >= limit || s2.step5Status === "approved" || s2.statusSubmitted) {
                s2.step2Done = true;
                s2.step2Status = "approved";
                s2.step3Done = true;
                s2.step3Status = "approved";
                s2.step4Done = true;
                s2.statusSubmitted = true;
                s2.endTime = s2.endTime || new Date(matchedBatch.maturedTime || (matchedBatch.startTime + limit)).toLocaleTimeString();
                
                if (cloned.currentTask === 2) {
                    cloned.progressStatus = "생산중 (Stage 2 완료)";
                }
            } else {
                s2.step2Done = false;
                s2.step2Status = "salting";
                s2.step3Done = false;
                s2.step3Status = "none";
                s2.step4Done = false;
                s2.statusSubmitted = false;
                s2.endTime = null;
                
                if (cloned.currentTask === 2) {
                    cloned.progressStatus = "생산중 (Stage 2)";
                }
            }
        } else if (s2.step2_salting) {
            s2.brineSalinity = s2.brineSalinity !== undefined ? s2.brineSalinity : s2.step2_salting.brineSalinity;
            s2.brineVolumeLiters = s2.brineVolumeLiters !== undefined ? s2.brineVolumeLiters : s2.step2_salting.brineVolumeLiters;
            s2.extraSaltAmountKg = s2.extraSaltAmountKg !== undefined ? s2.extraSaltAmountKg : s2.step2_salting.extraSaltAmountKg;
            s2.isTurnedOver = s2.isTurnedOver !== undefined ? s2.isTurnedOver : s2.step2_salting.isTurnedOver;
            s2.saltingStartTime = s2.saltingStartTime !== undefined ? s2.saltingStartTime : s2.step2_salting.saltingStartTime;
            s2.targetDuration = s2.targetDuration !== undefined ? s2.targetDuration : s2.step2_salting.targetDuration;
        }
        s2.statusSubmitted = s2.statusSubmitted !== undefined ? !!s2.statusSubmitted : false;
        cloned.stages[2] = s2;

        // Construct stage 3 frontend view
        const s3 = cloned.stages[3] || {};
        s3.operator = s3.operator || (s3.operators && s3.operators[0]) || null;
        s3.step5Status = s3.step5Status || "none";
        s3.statusSubmitted = s3.statusSubmitted !== undefined ? !!s3.statusSubmitted : false;
        if (s3.stage32) {
            s3.stage32.step5Status = s3.stage32.step5Status || "none";
            s3.stage32.statusSubmitted = s3.stage32.statusSubmitted !== undefined ? !!s3.stage32.statusSubmitted : false;
        }
        if (s3.step3_washing_drying) {
            s3.isWashedThreeTimes = s3.isWashedThreeTimes !== undefined ? s3.isWashedThreeTimes : s3.step3_washing_drying.isWashedThreeTimes;
            s3.dryingDurationHours = s3.dryingDurationHours !== undefined ? s3.dryingDurationHours : s3.step3_washing_drying.dryingDurationHours;
            s3.isDryingTimeMet = s3.isDryingTimeMet !== undefined ? s3.isDryingTimeMet : s3.step3_washing_drying.isDryingTimeMet;
        }
        cloned.stages[3] = s3;

        // Construct stage 4 frontend view from s4 seasoning part
        const s4 = cloned.stages[4] || {};
        s4.operator = s4.operator || (s4.operators && s4.operators[0]) || null;
        if (s4.step4_seasoning_packing) {
            s4.cabbagesTakenOut = s4.cabbagesTakenOut !== undefined ? s4.cabbagesTakenOut : s4.step4_seasoning_packing.subTasks.cabbagesTakenOut;
            s4.seasoningApplied = s4.seasoningApplied !== undefined ? s4.seasoningApplied : s4.step4_seasoning_packing.subTasks.seasoningApplied;
            s4.endTime = s4.step4_seasoning_packing.seasoningEndTime || s4.endTime;
            s4.defectCount = s4.step4_seasoning_packing.seasoningDefectCount !== undefined ? s4.step4_seasoning_packing.seasoningDefectCount : s4.defectCount;
        }
        cloned.stages[4] = s4;

        // Construct stage 5 frontend view from s4 packing part
        if (s4.step4_seasoning_packing) {
            const s5 = {};
            s5.operator = s4.step4_seasoning_packing.packingOperator || s4.operator;
            s5.startTime = s4.step4_seasoning_packing.packingStartTime || null;
            s5.endTime = s4.step4_seasoning_packing.packingEndTime || null;
            s5.defectCount = s4.step4_seasoning_packing.packingDefectCount || 0;
            s5.putInContainers = s4.step4_seasoning_packing.subTasks.putInContainers || false;
            s5.statusSubmitted = s4.step4_seasoning_packing.packingStatusSubmitted || false;
            s5.sessions = s4.step4_seasoning_packing.packingSessions || [];

            // Restore Stage 5 properties
            s5.step1Done = s4.step4_seasoning_packing.packingStep1Done || false;
            s5.step2Done = s4.step4_seasoning_packing.packingStep2Done || false;
            s5.step2Status = s4.step4_seasoning_packing.packingStep2Status || "none";
            s5.step3Done = s4.step4_seasoning_packing.packingStep3Done || false;
            s5.step3Status = s4.step4_seasoning_packing.packingStep3Status || "none";
            s5.step4Done = s4.step4_seasoning_packing.packingStep4Done || false;
            s5.step5Status = s4.step4_seasoning_packing.packingStep5Status || "none";
            s5.preWorkQty = s4.step4_seasoning_packing.packingPreWorkQty !== undefined ? s4.step4_seasoning_packing.packingPreWorkQty : null;
            s5.weight = s4.step4_seasoning_packing.packingWeight !== undefined ? s4.step4_seasoning_packing.packingWeight : null;
            s5.postWorkWeight = s4.step4_seasoning_packing.packingPostWorkWeight !== undefined ? s4.step4_seasoning_packing.packingPostWorkWeight : null;
            s5.breakStartTime = s4.step4_seasoning_packing.packingBreakStartTime || null;
            s5.breakHistory = s4.step4_seasoning_packing.packingBreakHistory || [];
            s5.currentBreakStartRemaining = s4.step4_seasoning_packing.packingCurrentBreakStartRemaining !== undefined ? s4.step4_seasoning_packing.packingCurrentBreakStartRemaining : null;

            // Find actual packaging quantities
            const pkg = s4.step4_seasoning_packing.targetPackaging || [];
            let matchingType = cloned.productId === 'p300g' ? '300g' : cloned.productId === 'p1kg' ? '1kg' : cloned.productId === 'p3kg' ? '3kg' : cloned.productId === 'p5kg' ? '5kg' : '10kg';
            let matchingPkg = pkg.find(p => p.type === matchingType);
            s5.postWorkQty = matchingPkg ? matchingPkg.actualQty : 0;
            cloned.stages[5] = s5;
        }

        return cloned;
    }

    function mapOrderToDatabase(order) {
        if (!order) return order;
        const cloned = JSON.parse(JSON.stringify(order));
        if (!cloned.stages) return cloned;

        const dbStages = {};

        // Stage 1
        if (cloned.stages[1]) {
            const s1 = cloned.stages[1];
            dbStages[1] = {
                ...s1,
                operators: s1.operators || (s1.operator ? [s1.operator] : []),
                startTime: s1.startTime || null,
                endTime: s1.endTime || null,
                defectCount: parseInt(s1.defectCount) || 0,
                step5Status: s1.step5Status || "none",
                statusSubmitted: !!s1.statusSubmitted,
                step1_cutting: {
                    yieldQty: parseInt(s1.postWorkQty) || 0
                }
            };
        }

        // Stage 2
        if (cloned.stages[2]) {
            const s2 = cloned.stages[2];
            const saltingStartTime = s2.saltingStartTime || s2.startTime || null;
            const isTurnedOver = s2.isTurnedOver !== undefined ? s2.isTurnedOver : (s2.endTime ? true : false);
            dbStages[2] = {
                ...s2,
                operators: s2.operators || (s2.operator ? [s2.operator] : []),
                startTime: s2.startTime || null,
                endTime: s2.endTime || null,
                defectCount: parseInt(s2.defectCount) || 0,
                step5Status: s2.step5Status || "none",
                statusSubmitted: !!s2.statusSubmitted,
                step2_salting: {
                    brineSalinity: parseFloat(s2.brineSalinity) || 0,
                    brineVolumeLiters: parseFloat(s2.brineVolumeLiters) || 0,
                    extraSaltAmountKg: parseFloat(s2.extraSaltAmountKg) || 0,
                    isTurnedOver: !!isTurnedOver,
                    saltingStartTime: saltingStartTime,
                    targetDuration: parseFloat(s2.targetDuration) || 0
                }
            };
        }

        // Stage 3
        if (cloned.stages[3]) {
            const s3 = cloned.stages[3];
            const isWashedThreeTimes = s3.isWashedThreeTimes !== undefined ? s3.isWashedThreeTimes : (s3.endTime ? true : false);
            const isDryingTimeMet = s3.isDryingTimeMet !== undefined ? s3.isDryingTimeMet : (s3.endTime ? true : false);

            let dryingDurationHours = 2.5;
            if (s3.sessions && s3.sessions.length > 0) {
                let totalSec = 0;
                s3.sessions.forEach(sess => {
                    totalSec += sess.duration || 0;
                });
                if (totalSec > 0) {
                    dryingDurationHours = parseFloat((totalSec / 3600).toFixed(2));
                }
            }
            if (s3.dryingDurationHours !== undefined) {
                dryingDurationHours = parseFloat(s3.dryingDurationHours);
            }

            dbStages[3] = {
                ...s3,
                operators: s3.operators || (s3.operator ? [s3.operator] : []),
                startTime: s3.startTime || null,
                endTime: s3.endTime || null,
                defectCount: parseInt(s3.defectCount) || 0,
                step5Status: s3.step5Status || "none",
                statusSubmitted: !!s3.statusSubmitted,
                step3_washing_drying: {
                    isWashedThreeTimes: !!isWashedThreeTimes,
                    dryingDurationHours: dryingDurationHours,
                    isDryingTimeMet: !!isDryingTimeMet
                }
            };
        }

        // Stage 4 (merging 4 & 5)
        const s4 = cloned.stages[4] || {};
        const s5 = cloned.stages[5] || {};

        let targetPackaging = [];
        if (s4.step4_seasoning_packing && s4.step4_seasoning_packing.targetPackaging) {
            targetPackaging = JSON.parse(JSON.stringify(s4.step4_seasoning_packing.targetPackaging));
        } else {
            targetPackaging = [
                { type: "300g", targetQty: 0, actualQty: 0 },
                { type: "1kg", targetQty: 0, actualQty: 0 },
                { type: "3kg", targetQty: 0, actualQty: 0 },
                { type: "5kg", targetQty: 0, actualQty: 0 },
                { type: "10kg", targetQty: 0, actualQty: 0 }
            ];
        }

        if (s5.postWorkQty !== undefined && s5.postWorkQty !== null) {
            let matchingType = cloned.productId === 'p300g' ? '300g' : cloned.productId === 'p1kg' ? '1kg' : cloned.productId === 'p3kg' ? '3kg' : cloned.productId === 'p5kg' ? '5kg' : '10kg';
            let pkgItem = targetPackaging.find(p => p.type === matchingType);
            if (pkgItem) {
                pkgItem.actualQty = parseInt(s5.postWorkQty) || 0;
            }
        }

        const s4Ops = s4.operators || (s4.operator ? [s4.operator] : []);
        const s5Ops = s5.operators || (s5.operator ? [s5.operator] : []);
        const mergedOps = Array.from(new Set([...s4Ops, ...s5Ops]));

        dbStages[4] = {
            ...s4,
            operators: mergedOps,
            startTime: s4.startTime || null,
            endTime: s5.endTime || s4.endTime || null,
            defectCount: (parseInt(s4.defectCount) || 0) + (parseInt(s5.defectCount) || 0),
            step4_seasoning_packing: {
                subTasks: {
                    cabbagesTakenOut: !!(s4.cabbagesTakenOut || (s4.step4_seasoning_packing && s4.step4_seasoning_packing.subTasks && s4.step4_seasoning_packing.subTasks.cabbagesTakenOut)),
                    seasoningApplied: !!(s4.seasoningApplied || (s4.step4_seasoning_packing && s4.step4_seasoning_packing.subTasks && s4.step4_seasoning_packing.subTasks.seasoningApplied)),
                    putInContainers: !!(s5.putInContainers || (s4.step4_seasoning_packing && s4.step4_seasoning_packing.subTasks && s4.step4_seasoning_packing.subTasks.putInContainers))
                },
                targetPackaging: targetPackaging,

                seasoningEndTime: s4.endTime || null,
                seasoningDefectCount: parseInt(s4.defectCount) || 0,
                packingOperator: s5.operator || null,
                packingStartTime: s5.startTime || null,
                packingEndTime: s5.endTime || null,
                packingDefectCount: parseInt(s5.defectCount) || 0,
                packingStatusSubmitted: !!s5.statusSubmitted,
                packingSessions: s5.sessions || [],

                // Map missing Stage 5 properties
                packingStep1Done: s5.step1Done !== undefined ? !!s5.step1Done : false,
                packingStep2Done: s5.step2Done !== undefined ? !!s5.step2Done : false,
                packingStep2Status: s5.step2Status || "none",
                packingStep3Done: s5.step3Done !== undefined ? !!s5.step3Done : false,
                packingStep3Status: s5.step3Status || "none",
                packingStep4Done: s5.step4Done !== undefined ? !!s5.step4Done : false,
                packingStep5Status: s5.step5Status || "none",
                packingPreWorkQty: s5.preWorkQty !== undefined ? parseInt(s5.preWorkQty) : null,
                packingWeight: s5.weight !== undefined ? parseFloat(s5.weight) : null,
                packingPostWorkWeight: s5.postWorkWeight !== undefined ? parseFloat(s5.postWorkWeight) : null,
                packingBreakStartTime: s5.breakStartTime || null,
                packingBreakHistory: s5.breakHistory || [],
                packingCurrentBreakStartRemaining: s5.currentBreakStartRemaining !== undefined ? parseInt(s5.currentBreakStartRemaining) : null
            }
        };

        cloned.stages = dbStages;
        return cloned;
    }

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
        packagingOrders: {},
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
            const rawOrders = localStorage.getItem('kimp_production_orders');
            let parsed = null;
            if (rawOrders && rawOrders !== 'null' && rawOrders !== 'undefined') {
                try {
                    parsed = JSON.parse(rawOrders);
                } catch (e) {
                    console.error("Failed to parse kimp_production_orders:", e);
                }
            }

            // Calculate yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yy = String(yesterday.getFullYear()).slice(-2);
            const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
            const dd = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayDateStr = `${yy}${mm}${dd}`;

            const isEmpty = !parsed || (Array.isArray(parsed) && parsed.length === 0) || (typeof parsed === 'object' && Object.keys(parsed).length === 0);
            let obj = {};
            let dbChanged = false;

            if (!isEmpty) {
                if (Array.isArray(parsed)) {
                    parsed.forEach(o => {
                        const sanitized = mapOrderToFrontend(o);
                        if (sanitized && sanitized.orderId) {
                            obj[sanitized.orderId] = sanitized;
                        }
                    });
                } else if (typeof parsed === 'object') {
                    for (let k in parsed) {
                        const sanitized = mapOrderToFrontend(parsed[k]);
                        if (sanitized && sanitized.orderId) {
                            obj[sanitized.orderId] = sanitized;
                        }
                    }
                }
            }

            // If empty, perform dynamic initial setup with yesterday's date mock orders
            if (isEmpty || Object.keys(obj).length === 0) {
                const order1Id = `${yesterdayDateStr}-15-1`;
                const order2Id = `${yesterdayDateStr}-15-2`;
                const order3Id = `${yesterdayDateStr}-15-3`;

                obj = {
                    [order1Id]: mapOrderToFrontend(window.defaultProductionOrders[order1Id]),
                    [order2Id]: mapOrderToFrontend(window.defaultProductionOrders[order2Id]),
                    [order3Id]: mapOrderToFrontend(window.defaultProductionOrders[order3Id])
                };

                // Also initialize refrigerator salting batches
                const now = Date.now();
                const initialSalting = [
                    {
                        id: order1Id,
                        orderId: order1Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 4 * 3600 * 1000,
                        saltingTimeLimit: 17 * 3600 * 1000
                    },
                    {
                        id: order2Id,
                        orderId: order2Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 3 * 3600 * 1000,
                        saltingTimeLimit: 17 * 3600 * 1000
                    },
                    {
                        id: order3Id,
                        orderId: order3Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - (17 * 3600 * 1000 - 60 * 1000),
                        saltingTimeLimit: 17 * 3600 * 1000
                    }
                ];
                localStorage.setItem("kimp_factory_salting", JSON.stringify(initialSalting));
                localStorage.setItem("kimp_factory_matured_cabbages", "0");
                dbChanged = true;
            }

            // Centralized cleanup of legacy keys
            for (let k in obj) {
                if (k.startsWith("260530-") || k.startsWith("260612-")) {
                    delete obj[k];
                    dbChanged = true;
                }
            }

            // Ensure cabbage orders exist
            const newKeys = [
                `${yesterdayDateStr}-15-1`,
                `${yesterdayDateStr}-15-2`,
                `${yesterdayDateStr}-15-3`
            ];
            newKeys.forEach(k => {
                if (!obj[k] && window.defaultProductionOrders[k]) {
                    obj[k] = mapOrderToFrontend(window.defaultProductionOrders[k]);
                    dbChanged = true;
                }
            });

            // Self-healing database consistency: If Stage 2 is pending but no matching request exists, reset it.
            let requests = [];
            try {
                requests = JSON.parse(localStorage.getItem("kimp_approval_requests") || "[]");
            } catch(e) {}
            
            for (let k in obj) {
                if (obj[k] && obj[k].stages && obj[k].stages[2]) {
                    let s2 = obj[k].stages[2];
                    if (s2.step2Status === "pending" || s2.step3Status === "pending") {
                        let hasReq = requests.some(r => r.orderId === k && r.stageNum === 2);
                        if (!hasReq) {
                            s2.step1Done = false;
                            s2.step2Done = false;
                            s2.step2Status = "none";
                            s2.step3Done = false;
                            s2.step3Status = "none";
                            s2.startTime = null;
                            s2.sessions = [];
                            s2.operator = null;
                            dbChanged = true;
                        }
                    }
                }
            }

            state.productionOrders = obj;

            if (dbChanged) {
                let dbOrders = {};
                for (let k in state.productionOrders) {
                    if (state.productionOrders[k]) {
                        dbOrders[k] = mapOrderToDatabase(state.productionOrders[k]);
                    }
                }
                localStorage.setItem('kimp_production_orders', JSON.stringify(dbOrders));
            }
        } catch(e) {
            console.error("Error loading production orders in loadFromStorage:", e);
            state.productionOrders = {};
        }

        // 7. Workers progress
        try {
            state.workersProgress = JSON.parse(localStorage.getItem('kimp_workers_progress') || '{}');
        } catch(e) {
            state.workersProgress = {};
        }

        // 7.5 Packaging orders
        try {
            state.packagingOrders = JSON.parse(localStorage.getItem('kimp_packaging_orders') || '{}');
        } catch(e) {
            state.packagingOrders = {};
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
                    parsed.forEach(o => {
                        if (o && o.orderId) currentOrders[o.orderId] = mapOrderToFrontend(o);
                    });
                } else {
                    for (let k in parsed) {
                        currentOrders[k] = mapOrderToFrontend(parsed[k]);
                    }
                }
            } catch(e) {
                currentOrders = {};
            }

            const getStatusPriority = function(status) {
                if (status === 'completed') return 2;
                if (status === 'in_progress' || status === 'assigned' || status === 'task1_ready' || status === 'ready') return 1;
                return 0; // pending or other
            };

            const getProgressPriority = function(progress) {
                if (!progress || progress === "대기 중") return 0;
                if (progress === "QR코드 스캔 전") return 1;
                if (progress === "투입 후 생산 중") return 2;
                if (progress === "검사 대기 중") return 3;
                if (progress.indexOf("생산중 (Stage") !== -1) {
                    const match = progress.match(/Stage(\d+)완료/);
                    if (match) {
                        return 4 + parseInt(match[1]); // Stage1완료=5, Stage2완료=6, ...
                    }
                    return 4;
                }
                if (progress === "생산 완료") return 15;
                return 0;
            };

            // Merge local state.productionOrders into currentOrders safely
            for (let key in state.productionOrders) {
                if (currentOrders[key]) {
                    let localStatusPriority = getStatusPriority(state.productionOrders[key].status);
                    let storageStatusPriority = getStatusPriority(currentOrders[key].status);
                    
                    let localProgressPriority = getProgressPriority(state.productionOrders[key].progressStatus);
                    let storageProgressPriority = getProgressPriority(currentOrders[key].progressStatus);

                    let localTask = state.productionOrders[key].currentTask || 0;
                    let storageTask = currentOrders[key].currentTask || 0;

                    let isLocalNewer = false;
                    if (localStatusPriority > storageStatusPriority) {
                        isLocalNewer = true;
                    } else if (localStatusPriority === storageStatusPriority) {
                        if (localProgressPriority > storageProgressPriority) {
                            isLocalNewer = true;
                        } else if (localProgressPriority === storageProgressPriority) {
                            if (localTask > storageTask) {
                                isLocalNewer = true;
                            }
                        }
                    }

                    if (isLocalNewer) {
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

            let dbOrders = {};
            for (let k in state.productionOrders) {
                dbOrders[k] = mapOrderToDatabase(state.productionOrders[k]);
            }
            localStorage.setItem('kimp_production_orders', JSON.stringify(dbOrders));
        }

        // 6.5 Packaging orders
        if (shouldSave('packaging_orders')) {
            localStorage.setItem('kimp_packaging_orders', JSON.stringify(state.packagingOrders));
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
        isSaving: function() {
            return isSaving;
        },
        getState: function() {
            // Return copy to prevent direct mutations
            return {
                currentUser: state.currentUser,
                workers: state.workers ? JSON.parse(JSON.stringify(state.workers)) : {},
                reservations: Array.isArray(state.reservations) ? [...state.reservations] : [],
                history: Array.isArray(state.history) ? [...state.history] : [],
                experienceRemainingSeconds: state.experienceRemainingSeconds,
                productionOrders: state.productionOrders ? { ...state.productionOrders } : {},
                packagingOrders: state.packagingOrders ? { ...state.packagingOrders } : {},
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
                case 'SET_PACKAGING_ORDERS':
                    state.packagingOrders = action.payload || {};
                    break;
                case 'ADD_PACKAGING_ORDER':
                case 'UPDATE_PACKAGING_ORDER': {
                    if (!state.packagingOrders) state.packagingOrders = {};
                    const orderId = action.payload.orderId;
                    state.packagingOrders[orderId] = {
                        ...(state.packagingOrders[orderId] || {}),
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
                    state.packagingOrders = {};
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
                isSaving = true;
                try {
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
                        case 'SET_PACKAGING_ORDERS':
                        case 'ADD_PACKAGING_ORDER':
                        case 'UPDATE_PACKAGING_ORDER':
                            keysToSave = ['packaging_orders'];
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
                } finally {
                    isSaving = false;
                }
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
        if (key === 'kimp_packaging_orders') {
            return JSON.stringify(state.packagingOrders);
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
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request') {
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
        if (key === 'kimp_packaging_orders') {
            window.FactoryStore.dispatch({ type: 'SET_PACKAGING_ORDERS', payload: JSON.parse(value) });
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
            if (key === 'kimp_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request') {
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
        if (isSaving) return;
        if (!e.key) return;

        const key = e.key;
        if (key.startsWith('kimp_') || key.includes('mypage_') || key === 'kimp_worker_profile' || key.includes('hours_udon') || key.includes('hours_wallet')) {
            window.FactoryStore.dispatch({ type: 'SYNC_FROM_STORAGE' });
        }
    });
})();
