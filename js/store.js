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
                    step1Done: true,
                    step2Done: false,
                    step2Status: "salting",
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
                    operator: "김태호",
                    startTime: "09:30:00",
                    endTime: null,
                    postWorkQty: null,
                    postWorkWeight: null,
                    sessions: [],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: true,
                    step2Done: false,
                    step2Status: "salting",
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
                    operator: "박준호",
                    startTime: "08:30:00",
                    endTime: null,
                    postWorkQty: null,
                    postWorkWeight: null,
                    sessions: [],
                    defectCount: 0,
                    weight: 37.5,
                    step1Done: true,
                    step2Done: false,
                    step2Status: "salting",
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
            const currentSettingHours = parseInt(localStorage.getItem("kimp_salting_time_setting") || "17");
            const limit = matchedBatch.saltingTimeLimit || (currentSettingHours * 3600 * 1000);
            const elapsed = Date.now() - matchedBatch.startTime;
            const remaining = Math.max(0, limit - elapsed);

            s2.saltingStartTime = new Date(matchedBatch.startTime).toLocaleTimeString();
            s2.targetDuration = limit / 3600000; // e.g. 17 or dynamically changed
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
                    cloned.progressStatus = "생산중(Stage2 완료)";
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
                    cloned.progressStatus = "생산중(Stage2 절임중)";
                }
            }

            // 💡 [수정] Stage 2 실시간 상태의 무결성을 지키기 위해 메모리 원본 DB 객체에 강제 역방향 Write-back 적용
            if (cloned.currentTask === 2 && cloned.progressStatus) {
                if (window.FactoryStore && window.FactoryStore.state && window.FactoryStore.state.productionOrders) {
                    const dbOrder = window.FactoryStore.state.productionOrders[cloned.orderId];
                    if (dbOrder) {
                        dbOrder.progressStatus = cloned.progressStatus;
                        dbOrder.currentTask = cloned.currentTask;
                    }
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

        // 💡 [수정] Stage 4(밀봉 및 보관) 실적 승인 완료 여부를 statusSubmitted 플래그로만 정밀 판별하여 상태 고정
        if (cloned.currentTask === 4 || (s4 && s4.statusSubmitted)) {
            if (s4 && s4.statusSubmitted) {
                cloned.progressStatus = "생산중(Stage4 완료)";
            } else {
                cloned.progressStatus = "생산중(Stage4)";
            }
        }

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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request' || key === 'kimp_workers_progress') {
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
            // 💡 [실시간 출근 시간 덮어쓰기] 로컬스토리지에 저장된 출근 스캔 시각이 있다면 w.checkInTime 에 무조건 오버라이트 반영한다!
            let hasCheckInTime = false;
            for (let oldId of oldUserIds) {
                let v = localStorage.getItem("kimp_check_in_time_" + oldId);
                if (v !== null && v !== "" && v !== "null") {
                    w.checkInTime = v;
                    hasCheckInTime = true;
                    break;
                }
            }
            if (!hasCheckInTime && state.currentUser && String(state.currentUser.id) === String(uId)) {
                let v = localStorage.getItem("kimp_check_in_time");
                if (v && v !== "" && v !== "null") {
                    w.checkInTime = v;
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
            let parsed = JSON.parse(localStorage.getItem(getStorageKey('app_reservations_db')) || '[]');
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
                const currentSettingHours = parseInt(localStorage.getItem("kimp_salting_time_setting") || "17");
                const currentSettingMs = currentSettingHours * 3600 * 1000;
                
                const initialSalting = [
                    {
                        id: order1Id,
                        orderId: order1Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 4 * 3600 * 1000,
                        saltingTimeLimit: currentSettingMs
                    },
                    {
                        id: order2Id,
                        orderId: order2Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 3 * 3600 * 1000,
                        saltingTimeLimit: currentSettingMs
                    },
                    {
                        id: order3Id,
                        orderId: order3Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - (currentSettingMs - 60 * 1000),
                        saltingTimeLimit: currentSettingMs
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
            localStorage.setItem(getStorageKey('app_reservations_db'), JSON.stringify(state.reservations));
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
                
                const norm = progress.replace(/\s+/g, "");
                if (norm.includes("생산중(Stage")) {
                    const match = norm.match(/Stage(\d+)/);
                    let base = 4;
                    if (match) {
                        base += parseInt(match[1], 10) * 2;
                    }
                    if (norm.includes("완료")) {
                        base += 1;
                    }
                    if (norm.includes("말리기") || norm.includes("3-2") || norm.includes("물기빼는")) {
                        base += 0.5;
                    }
                    return base;
                }
                if (progress === "생산 완료") return 30;
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
                    if (localTask === 2) {
                        isLocalNewer = true;
                    } else if (localTask > storageTask) {
                        isLocalNewer = true;
                    } else if (localTask < storageTask) {
                        isLocalNewer = false;
                    } else {
                        const localHasTaskNum = state.productionOrders[key].progressStatus && state.productionOrders[key].progressStatus.includes(String(localTask));
                        const storageHasTaskNum = currentOrders[key].progressStatus && currentOrders[key].progressStatus.includes(String(localTask));
                        
                        if (localHasTaskNum && !storageHasTaskNum) {
                            isLocalNewer = true;
                        } else if (!localHasTaskNum && storageHasTaskNum) {
                            isLocalNewer = false;
                        } else {
                            if (localProgressPriority > storageProgressPriority) {
                                isLocalNewer = true;
                            } else if (localProgressPriority < storageProgressPriority) {
                                isLocalNewer = false;
                            } else {
                                if (localStatusPriority > storageStatusPriority) {
                                    isLocalNewer = true;
                                }
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request') {
                return localStorage.getItem(key);
            }
            return localStorage.getItem(key + "_" + userId);
        }
        const state = window.FactoryStore.getState();
        const currentUserId = state.currentUser ? state.currentUser.id : "guest";
        const worker = state.workers[currentUserId] || {};

        if (key === 'app_reservations_db') {
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key + "_" + userId, value);
            }
            window.dispatchEvent(new Event('storage'));
            return;
        }
        if (key === 'app_reservations_db') {
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request') {
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

// ==========================================
// 중앙 목업 데이터 (main.html, explore.html, kimp.html 공통)
// ==========================================
window.MockData = {
    // 1. explore.html, main.html 작업(Works) 데이터
    worksJSON: `[
        {
            "workId": 1, "workName": "김치만들기", "brandName": "AFood", "iconUrl": "./images/k-icon_150x150.png",
            "salary": 1.3, "salaryChange": 0.01, "taskCount": 5, "participants": 123, "createdAt": "2024-08-01",
            "region": "서울시 성동구 성수동", "categories": ["음식", "요리", "김치", "만들기"],
            "isNew": false
        },
        {
            "workId": 2, "workName": "우동만들기", "brandName": "Uton", "iconUrl": "./images/Uton_150x150.png",
            "salary": 1.1, "salaryChange": -0.05, "taskCount": 4, "participants": 70, "createdAt": "2025-03-19",
            "region": "서울시 강남구 역삼동", "categories": ["음식", "요리", "우동", "만들기"],
            "isNew": false
        },
        {
            "workId": 3, "workName": "지갑만들기", "brandName": "Persa", "iconUrl": "./images/fancy_150x150.png",
            "salary": 1.2, "salaryChange": 0.02, "taskCount": 5, "participants": 30, "createdAt": "2026-05-09",
            "region": "서울시 마포구 합정동", "categories": ["악세사리", "지갑", "만들기"],
            "isNew": false
        },
        {
            "workId": 6, "workName": "불고기구이", "brandName": "K-Meat", "iconUrl": "./images/beef_500.png",
            "salary": 1.5, "salaryChange": -0.02, "taskCount": 5, "participants": 80, "createdAt": "2026-06-20",
            "region": "서울시 종로구 연남동", "categories": ["음식", "요리", "불고기", "고기", "구이"],
            "isNew": true
        },
        {
            "workId": 7, "workName": "버거만들기", "brandName": "BurgerQueen", "iconUrl": "./images/burger_500.png",
            "salary": 1.25, "salaryChange": 0.01, "taskCount": 4, "participants": 55, "createdAt": "2026-06-25",
            "region": "서울시 용산구 이태원", "categories": ["음식", "요리", "버거", "만들기", "패스트푸드"],
            "isNew": true
        }
    ]`,
    // 2. 신규 추가: 통합된 사용자(Users) 데이터
    users: [
        {
            id: 1,
            name: "최현일",
            email: "tt2t2am1118@naver.com",
            picture: "",
            role: "MANAGER",          // 시스템 권한
            roleName: "매니저",         // 화면 표시용
            workedHours: 133,         // 통합된 근무 시간
            gender: "M",
            addr: "서울특별시 마포구 대흥동",
            tel: "010-1111-1111",
            healthCertificateImage: "choi_cert.png",
            healthCertificateStatus: "approved",
            isManagerQualified: true,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
        },
        {
            id: 2,
            name: "최수아",
            email: "capegon21@gmail.com",
            picture: "",
            role: "USER",
            roleName: "일반",
            workedHours: 22,
            gender: "F",
            addr: "서울특별시 서대문구 신촌동",
            tel: "010-2222-2222",
            healthCertificateImage: "sua_cert.png",
            healthCertificateStatus: "approved",
            isManagerQualified: false,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
        },
        {
            id: 3,
            name: "김수민",
            email: "capegon23@gmail.com",
            picture: "",
            role: "USER",
            roleName: "일반",
            workedHours: 0,
            gender: "F",
            addr: "서울특별시 영등포구 여의도동",
            tel: "010-3333-3333",
            healthCertificateImage: null,
            healthCertificateStatus: null,
            isManagerQualified: false,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
        },
        {
            id: 4,
            name: "김영희",
            email: "younghee@naver.com",
            picture: "",
            role: "HELPER",
            roleName: "헬퍼",
            workedHours: 45,
            gender: "F",
            addr: "서울특별시 강남구 역삼동",
            tel: "010-4444-4444",
            healthCertificateImage: "younghee_cert.png",
            healthCertificateStatus: "approved",
            isManagerQualified: false,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
        }
    ],

    // 2. 예약(Reservations) 목업 데이터 생성기
    getReservations: function(todayStr, tomorrowStr, nextDayStr) {
        return [
            { id: 1, userId: "leejisung", userName: "이지성", date: todayStr, slot: 0, role: "general" },
            { id: 2, userId: "choiwoobin", userName: "최우빈", date: todayStr, slot: 0, role: "general" },
            { id: 3, userId: "parksangmin", userName: "박상민", date: todayStr, slot: 0, role: "general" },

            { id: 4, userId: "kimsuyoung", userName: "김수영", date: todayStr, slot: 1, role: "general" },
            { id: 5, userId: "hanjiwon", userName: "한지원", date: todayStr, slot: 1, role: "general" },
            { id: 6, userId: "helper1", userName: "정우성", date: todayStr, slot: 1, role: "helper" },

            { id: 7, userId: "helper2", userName: "김혜수", date: tomorrowStr, slot: 1, role: "helper" },
            { id: 8, userId: "helper3", userName: "조진웅", date: tomorrowStr, slot: 1, role: "helper" },
            { id: 9, userId: "general1", userName: "이선균", date: tomorrowStr, slot: 1, role: "general" }
        ];
    },

    // 3. 각 작업(Work)별 세부(Detail) 목업 데이터
    workDetailJSON: `{
        "1": {
            "title": "김치만들기",
            "iconUrl": "./images/k-icon_150x150.png",
            "value": 1.3,
            "change": "+0.03%",
            "categories": ["요리", "김치", "만들기"],
            "workTime": "2시간 작업",
            "productSlogan": "여기서 만든 신선한 김치. 구매해보세요~. 🎁",
            "products": [
                { "id": "p300g", "name": "300g 맛김치 팩", "brand": "AFood", "imgUrl": "./images/kimchi_300g.png", "price": "3,000원", "status": "50 남음" },
                { "id": "p1kg", "name": "1kg 포기김치 팩", "brand": "AFood", "imgUrl": "./images/kimchi_1kg.png", "price": "8,000원", "status": "생산 중" },
                { "id": "p3kg", "name": "3kg 대용량 김치 팩", "brand": "AFood", "imgUrl": "./images/kimchi_3kg.png", "price": "20,000원", "status": "생산 중" }
            ],
            "chart": {
                "1h": {
                    "labels": ["10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
                    "data": [1.1, 1.1, 1.15, 1.15, 1.35, 1.35, 1.3, 1.3]
                },
                "1d": {
                    "labels": ["월", "화", "수", "목", "금", "오늘"],
                    "data": [1.1, 1.2, 1.3, 1.2, 1.3, 1.2]
                },
                "1w": {
                    "labels": ["1주전", "2주전", "3주전", "이번주"],
                    "data": [1.2, 1.2, 1.2, 1.3]
                },
                "1mo": {
                    "labels": ["1월", "2월", "3월", "4월", "5월", "이번달"],
                    "data": [1.2, 1.1, 1.3, 1.15, 1.2, 1.2]
                },
                "1y": {
                    "labels": ["2022", "2023", "2024", "2025", "2026"],
                    "data": [0.9, 0.95, 0.97, 0.98, 1.2]
                }
            },
            "stats": {
                "address": "서울시 성동구 성수동",
                "startDate": "2024년 8월 1일 (목)",
                "workingHours": "오전 10:00 ~ 오후 5:00",
                "participants": 123,
                "rating": "4.7 / 5.0"
            },
            "guidelines": [
                { "icon": "bi-egg-fried", "iconColor": "color-purple", "text": "요리. 배추를 절이는 작업입니다.", "isBanner": false },
                { "icon": "bi-card-image", "iconColor": "color-red", "text": "신분증, 보건증을 지참해주세요.", "isBanner": false },
                { "icon": "bi-clock-history", "iconColor": "color-gold", "text": "2시간 단위로 예약가능합니다.\\n2시간 단위로 30분 쉬는 시간을 드려요.", "isBanner": false },
                { "icon": "bi-ticket-perforated", "iconColor": "color-teal", "text": "혜택, 당일 식권 1매 제공.\\n일주일간 식권 사용가능합니다.", "isBanner": false },
                { "icon": "bi-person-check", "iconColor": "color-lavender", "text": "단정한 차림으로 입장해주세요.", "isBanner": false },
                { "icon": "bi-calendar-event", "iconColor": "color-green", "text": "당일 날, 자리가 비어 일이 있는 경우, 현장에서 일 접수 가능합니다. 😊", "isBanner": true, "bannerClass": "banner-green" },
                { "icon": "bi-gift-fill", "iconColor": "color-lightpurple", "text": "처음 일하시는 분이면, 체험할 때에, 보너스로 5000원을 드려요. 🎉", "textColor": "color-lightpurple", "isBanner": true, "bannerClass": "banner-purple" }
            ],
            "workflows": [
                { "step": 1, "desc": "배추 5단위 적재하기" },
                { "step": 2, "desc": "배추 손질하기" },
                { "step": 3, "desc": "배추를 절이는 작업" },
                { "step": 4, "desc": "양념제조와 양념을 묻히는 작업" },
                { "step": 5, "desc": "포장용기에 담는 작업" }
            ]
        },
        "2": {
            "title": "우동만들기",
            "iconUrl": "./images/Uton_150x150.png",
            "value": 1.1,
            "change": "-0.05%",
            "categories": ["음식", "요리", "우동", "만들기"],
            "workTime": "1시간 30분 작업",
            "productSlogan": "갓 뽑은 쫄깃한 우동 면발과 특제 육수. 🍜",
            "products": [
                { "id": "udon_01", "name": "수제 쫄깃 우동면 2인분", "brand": "Uton", "imgUrl": "./images/udon_noodle.png", "price": "4,500원", "status": "120 남음" },
                { "id": "udon_02", "name": "비법 우동 육수 1L", "brand": "Uton", "imgUrl": "./images/udon_soup.png", "price": "6,000원", "status": "생산 중" },
                { "id": "udon_03", "name": "우동 밀키트 세트 (4인분)", "brand": "Uton", "imgUrl": "./images/udon_kit.png", "price": "15,000원", "status": "생산 중" }
            ],
            "chart": {
                "1h": {
                    "labels": ["10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
                    "data": [1.0, 1.05, 1.1, 1.08, 1.12, 1.15, 1.1, 1.1]
                },
                "1d": {
                    "labels": ["월", "화", "수", "목", "금", "오늘"],
                    "data": [1.2, 1.15, 1.1, 1.05, 1.08, 1.1]
                },
                "1w": {
                    "labels": ["1주전", "2주전", "3주전", "이번주"],
                    "data": [1.1, 1.15, 1.05, 1.1]
                },
                "1mo": {
                    "labels": ["1월", "2월", "3월", "4월", "5월", "이번달"],
                    "data": [1.0, 1.1, 1.15, 1.12, 1.05, 1.1]
                },
                "1y": {
                    "labels": ["2022", "2023", "2024", "2025", "2026"],
                    "data": [0.8, 0.9, 1.0, 1.1, 1.1]
                }
            },
            "stats": {
                "address": "서울시 강남구 역삼동",
                "startDate": "2025년 3월 19일 (수)",
                "workingHours": "오전 09:00 ~ 오후 2:00",
                "participants": 70,
                "rating": "4.5 / 5.0"
            },
            "guidelines": [
                { "icon": "bi-egg-fried", "iconColor": "color-purple", "text": "요리. 우동 면발을 뽑고 국물을 끓이는 작업입니다.", "isBanner": false },
                { "icon": "bi-card-image", "iconColor": "color-red", "text": "신분증, 보건증을 지참해주세요.", "isBanner": false },
                { "icon": "bi-ticket-perforated", "iconColor": "color-teal", "text": "혜택, 당일 식권 1매 제공.", "isBanner": false },
                { "icon": "bi-calendar-event", "iconColor": "color-green", "text": "당일 날, 자리가 비어 일이 있는 경우, 현장에서 일 접수 가능합니다. 😊", "isBanner": true, "bannerClass": "banner-green" }
            ],
            "workflows": [
                { "step": 1, "desc": "면발 재료 준비하기" },
                { "step": 2, "desc": "우동 면 뽑기" },
                { "step": 3, "desc": "우동 국물 끓이기" },
                { "step": 4, "desc": "포장하기" }
            ]
        },
        "3": {
            "title": "지갑만들기",
            "iconUrl": "./images/fancy_150x150.png",
            "value": 1.2,
            "change": "+0.02%",
            "categories": ["악세사리", "지갑", "만들기"],
            "workTime": "3시간 작업",
            "productSlogan": "한 땀 한 땀 정성스럽게 만든 수제 가죽 지갑. 👛",
            "products": [
                { "id": "wallet_01", "name": "천연소가죽 명함지갑", "brand": "Persa", "imgUrl": "./images/wallet_card.png", "price": "25,000원", "status": "15 남음" },
                { "id": "wallet_02", "name": "핸드메이드 반지갑", "brand": "Persa", "imgUrl": "./images/wallet_half.png", "price": "45,000원", "status": "제작 중" },
                { "id": "wallet_03", "name": "프리미엄 장지갑", "brand": "Persa", "imgUrl": "./images/wallet_long.png", "price": "75,000원", "status": "제작 중" }
            ],
            "chart": {
                "1h": {
                    "labels": ["10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
                    "data": [1.15, 1.18, 1.2, 1.22, 1.2, 1.21, 1.19, 1.2]
                },
                "1d": {
                    "labels": ["월", "화", "수", "목", "금", "오늘"],
                    "data": [1.1, 1.15, 1.18, 1.19, 1.21, 1.2]
                },
                "1w": {
                    "labels": ["1주전", "2주전", "3주전", "이번주"],
                    "data": [1.15, 1.17, 1.19, 1.2]
                },
                "1mo": {
                    "labels": ["1월", "2월", "3월", "4월", "5월", "이번달"],
                    "data": [1.1, 1.12, 1.15, 1.18, 1.19, 1.2]
                },
                "1y": {
                    "labels": ["2022", "2023", "2024", "2025", "2026"],
                    "data": [1.0, 1.05, 1.1, 1.15, 1.2]
                }
            },
            "stats": {
                "address": "서울시 마포구 합정동",
                "startDate": "2026년 5월 9일 (토)",
                "workingHours": "오후 1:00 ~ 오후 6:00",
                "participants": 30,
                "rating": "4.8 / 5.0"
            },
            "guidelines": [
                { "icon": "bi-scissors", "iconColor": "color-purple", "text": "수공예. 가죽을 재단하고 바느질하는 작업입니다.", "isBanner": false },
                { "icon": "bi-person-check", "iconColor": "color-lavender", "text": "단정한 차림으로 입장해주세요. 안경 지참을 권장합니다.", "isBanner": false },
                { "icon": "bi-gift-fill", "iconColor": "color-lightpurple", "text": "처음 일하시는 분이면, 체험할 때에, 보너스로 5000원을 드려요. 🎉", "textColor": "color-lightpurple", "isBanner": true, "bannerClass": "banner-purple" }
            ],
            "workflows": [
                { "step": 1, "desc": "가죽 재단하기" },
                { "step": 2, "desc": "가죽 펀칭하기" },
                { "step": 3, "desc": "바느질 작업" },
                { "step": 4, "desc": "로고 각인하기" },
                { "step": 5, "desc": "포장하기" }
            ]
        },
        "6": {
            "title": "불고기구이",
            "iconUrl": "./images/beef_500.png",
            "value": 1.5,
            "change": "-0.02%",
            "categories": ["음식", "요리", "불고기", "고기", "구이"],
            "workTime": "4시간 작업",
            "productSlogan": "불향 가득한 달콤짭짤 프리미엄 불고기! 🥩",
            "products": [
                { "id": "bulgogi_01", "name": "직화 양념 불고기 500g", "brand": "K-Meat", "imgUrl": "./images/beef_500g.png", "price": "12,000원", "status": "200 남음" },
                { "id": "bulgogi_02", "name": "프리미엄 불고기 도시락", "brand": "K-Meat", "imgUrl": "./images/beef_dosirak.png", "price": "8,500원", "status": "생산 중" },
                { "id": "bulgogi_03", "name": "가족용 불고기 밀키트 1.5kg", "brand": "K-Meat", "imgUrl": "./images/beef_kit.png", "price": "32,000원", "status": "생산 중" }
            ],
            "chart": {
                "1h": {
                    "labels": ["10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
                    "data": [1.4, 1.45, 1.5, 1.48, 1.52, 1.55, 1.5, 1.5]
                },
                "1d": {
                    "labels": ["월", "화", "수", "목", "금", "오늘"],
                    "data": [1.4, 1.45, 1.48, 1.49, 1.51, 1.5]
                },
                "1w": {
                    "labels": ["1주전", "2주전", "3주전", "이번주"],
                    "data": [1.45, 1.47, 1.49, 1.5]
                },
                "1mo": {
                    "labels": ["1월", "2월", "3월", "4월", "5월", "이번달"],
                    "data": [1.4, 1.42, 1.45, 1.48, 1.49, 1.5]
                },
                "1y": {
                    "labels": ["2022", "2023", "2024", "2025", "2026"],
                    "data": [1.2, 1.25, 1.3, 1.4, 1.5]
                }
            },
            "stats": {
                "address": "서울시 종로구 연남동",
                "startDate": "2026년 6월 20일 (토)",
                "workingHours": "오후 4:00 ~ 오후 8:00",
                "participants": 80,
                "rating": "4.9 / 5.0"
            },
            "guidelines": [
                { "icon": "bi-fire", "iconColor": "color-red", "text": "요리. 신선한 소고기를 굽고 포장하는 작업입니다.", "isBanner": false },
                { "icon": "bi-person-check", "iconColor": "color-lavender", "text": "위생모와 앞치마가 지급됩니다. 편안한 신발을 착용해주세요.", "isBanner": false },
                { "icon": "bi-ticket-perforated", "iconColor": "color-teal", "text": "혜택, 불고기 도시락 1개 제공.", "isBanner": false },
                { "icon": "bi-gift-fill", "iconColor": "color-lightpurple", "text": "처음 일하시는 분이면, 체험할 때에, 보너스로 5000원을 드려요. 🎉", "textColor": "color-lightpurple", "isBanner": true, "bannerClass": "banner-purple" }
            ],
            "workflows": [
                { "step": 1, "desc": "소고기 핏물 빼기" },
                { "step": 2, "desc": "양념장 만들기" },
                { "step": 3, "desc": "고기 재우기" },
                { "step": 4, "desc": "직화구이 작업" },
                { "step": 5, "desc": "도시락 포장하기" }
            ]
        },
        "7": {
            "title": "버거만들기",
            "iconUrl": "./images/burger_500.png",
            "value": 1.25,
            "change": "+0.01%",
            "categories": ["음식", "요리", "버거", "만들기", "패스트푸드"],
            "workTime": "2시간 30분 작업",
            "productSlogan": "신선한 재료로 바로 만든 수제 버거. 🍔",
            "products": [
                { "id": "burger_01", "name": "클래식 치즈버거 단품", "brand": "BurgerQueen", "imgUrl": "./images/burger_cheese.png", "price": "5,500원", "status": "생산 중" },
                { "id": "burger_02", "name": "더블 패티 시그니처 버거", "brand": "BurgerQueen", "imgUrl": "./images/burger_signature.png", "price": "8,000원", "status": "30 남음" },
                { "id": "burger_03", "name": "패밀리 버거 세트 (버거4+감튀+음료)", "brand": "BurgerQueen", "imgUrl": "./images/burger_family.png", "price": "24,000원", "status": "생산 중" }
            ],
            "chart": {
                "1h": {
                    "labels": ["10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
                    "data": [1.2, 1.22, 1.25, 1.24, 1.26, 1.28, 1.25, 1.25]
                },
                "1d": {
                    "labels": ["월", "화", "수", "목", "금", "오늘"],
                    "data": [1.15, 1.2, 1.22, 1.24, 1.26, 1.25]
                },
                "1w": {
                    "labels": ["1주전", "2주전", "3주전", "이번주"],
                    "data": [1.2, 1.22, 1.24, 1.25]
                },
                "1mo": {
                    "labels": ["1월", "2월", "3월", "4월", "5월", "이번달"],
                    "data": [1.1, 1.15, 1.2, 1.22, 1.24, 1.25]
                },
                "1y": {
                    "labels": ["2022", "2023", "2024", "2025", "2026"],
                    "data": [1.0, 1.05, 1.1, 1.2, 1.25]
                }
            },
            "stats": {
                "address": "서울시 용산구 이태원",
                "startDate": "2026년 6월 25일 (목)",
                "workingHours": "오전 11:00 ~ 오후 1:30",
                "participants": 55,
                "rating": "4.6 / 5.0"
            },
            "guidelines": [
                { "icon": "bi-emoji-smile", "iconColor": "color-purple", "text": "요리. 맛있는 수제 버거를 조립하는 작업입니다.", "isBanner": false },
                { "icon": "bi-card-image", "iconColor": "color-red", "text": "보건증을 반드시 지참해주세요.", "isBanner": false },
                { "icon": "bi-ticket-perforated", "iconColor": "color-teal", "text": "혜택, 음료 무제한 제공.", "isBanner": false },
                { "icon": "bi-calendar-event", "iconColor": "color-green", "text": "당일 날, 자리가 비어 일이 있는 경우, 현장에서 일 접수 가능합니다. 😊", "isBanner": true, "bannerClass": "banner-green" }
            ],
            "workflows": [
                { "step": 1, "desc": "번 굽기" },
                { "step": 2, "desc": "패티 굽기" },
                { "step": 3, "desc": "채소 손질하기" },
                { "step": 4, "desc": "버거 조립하기" },
                { "step": 5, "desc": "포장하기" }
            ]
        }
    }`,
    // 4. 제품(Products) 상세 DB
    products: {
        p300g: {
            id: "p300g",
            name: "300g 맛김치 팩",
            brand: "AFood",
            price: 3000,
            weight: 300,
            rating: 4.8,
            reviews: 142,
            img: "./images/kimchi_product_300g.png",
            desc: "1인 가구용 실속형 맛김치. 한 끼에 드시기 알맞은 깔끔한 맛김치입니다. 100% 국산 농산물 원료를 사용하여 아삭한 식감과 깊은 고소함을 느낄 수 있습니다.",
            category: "김치 (비살균제품)",
            ingredients: "절임배추 70%(국산), 무(국산), 고춧가루(국산), 마늘(국산), 액젓, 생강 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 AFood 김치사업부",
            status: "50 남음",
            infoTitle1: "스마트 숙성 공법",
            infoTitle2: "위생 및 안심 마크",
            infoDesc2: "AFood Kimchi는 스마트팩토리의 전자동 위생 검사 시스템을 통과한 제품만을 출하합니다. 전 공정 비접촉 자동 포장 시스템으로 가장 위생적이고 안전합니다.",
            comments: [
                { name: "김*우", score: 5, date: "2026.06.14", body: "진짜 신선하고 아삭하네요! 스마트팩토리에서 생산되자마자 바로 와서 그런지 마트 김치랑은 비교가 안 되게 청결하고 시원합니다. 무료배송인 것도 감동이에요." },
                { name: "박*혜", score: 5, date: "2026.06.13", body: "익은 김치 좋아하시는 분들은 실온에 하루 이틀 뒀다가 냉장고에 넣으시면 딱이에요. 양념 비율이 환상적입니다. 라면이랑 꿀조합!" },
                { name: "이*민", score: 4, date: "2026.06.11", body: "포장이 정말 단단하고 꼼꼼하게 잘 되어 왔네요. 냄새 1도 안 새고 아주 신선한 상태로 배송되었습니다. 찌개용으로 쟁여두려고 더 시켰어요." },
                { name: "최*현", score: 5, date: "2026.06.10", body: "국산 100% 원재료라고 해서 믿고 시켰는데 역시 기대를 저버리지 않네요. 적당히 매콤하면서도 감칠맛이 풍부합니다. 강추합니다." }
            ]
        },
        p1kg: {
            id: "p1kg",
            name: "1kg 포기김치 팩",
            brand: "AFood",
            price: 8000,
            weight: 1000,
            rating: 4.9,
            reviews: 320,
            img: "./images/kimchi_product_1kg.png",
            desc: "가정용 표준 포장 프리미엄 김치. 전통 방식 그대로 버무린 1kg 가정용 포기김치입니다. 적당하게 깊은 전라도식 맛깔나는 액젓 배합으로 밥도둑이 따로 없습니다.",
            category: "김치 (비살균제품)",
            ingredients: "절임배추 70%(국산), 무(국산), 고춧가루(국산), 마늘(국산), 액젓, 생강 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 AFood 김치사업부",
            status: "생산 중",
            infoTitle1: "스마트 숙성 공법",
            infoTitle2: "위생 및 안심 마크",
            infoDesc2: "AFood Kimchi는 스마트팩토리의 전자동 위생 검사 시스템을 통과한 제품만을 출하합니다. 전 공정 비접촉 자동 포장 시스템으로 가장 위생적이고 안전합니다.",
            comments: [
                { name: "임*현", score: 5, date: "2026.06.15", body: "가족들이 너무 잘 먹네요. 배송도 정말 빠르고 김치가 너무 깔끔해요." }
            ]
        },
        p3kg: {
            id: "p3kg",
            name: "3kg 대용량 김치 팩",
            brand: "AFood",
            price: 20000,
            weight: 3000,
            rating: 4.7,
            reviews: 198,
            img: "./images/kimchi_product_3kg.png",
            desc: "다인가구 및 김장 보관용 실용 김치. 온 가족이 풍족하게 나누어 먹을 수 있는 3kg 대용량 김치입니다. 찌개, 찜 등 요리에 사용하기에도 넉넉한 부피입니다.",
            category: "김치 (비살균제품)",
            ingredients: "절임배추 70%(국산), 무(국산), 고춧가루(국산), 마늘(국산), 액젓, 생강 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 AFood 김치사업부",
            status: "생산 중",
            infoTitle1: "스마트 숙성 공법",
            infoTitle2: "위생 및 안심 마크",
            infoDesc2: "AFood Kimchi는 스마트팩토리의 전자동 위생 검사 시스템을 통과한 제품만을 출하합니다. 전 공정 비접촉 자동 포장 시스템으로 가장 위생적이고 안전합니다.",
            comments: [
                { name: "강*진", score: 5, date: "2026.06.12", body: "양도 푸짐하고 국물 맛이 일품입니다. 익은 후 찌개 끓여먹었는데 예술이네요." }
            ]
        },
        p5kg: {
            id: "p5kg",
            name: "5kg 실속 김치 팩",
            brand: "AFood",
            price: 32000,
            weight: 5000,
            rating: 4.8,
            reviews: 85,
            img: "./images/kimchi_product_1kg.png",
            desc: "대가족 및 업소용 실속 포장. 대용량 실속 파우치에 담긴 5kg 배추김치입니다. 양념을 아낌없이 가득 버무려 오래 두고 먹어도 감칠맛이 살아서 변치 않습니다.",
            category: "김치 (비살균제품)",
            ingredients: "절임배추 70%(국산), 무(국산), 고춧가루(국산), 마늘(국산), 액젓, 생강 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 AFood 김치사업부",
            status: "생산 중",
            infoTitle1: "스마트 숙성 공법",
            infoTitle2: "위생 및 안심 마크",
            infoDesc2: "AFood Kimchi는 스마트팩토리의 전자동 위생 검사 시스템을 통과한 제품만을 출하합니다. 전 공정 비접촉 자동 포장 시스템으로 가장 위생적이고 안전합니다.",
            comments: [
                { name: "송*아", score: 5, date: "2026.06.08", body: "이 김치만 시켜 먹어요. 원재료가 다 국산이라 믿고 안심하고 먹을 수 있습니다." }
            ]
        },
        p10kg: {
            id: "p10kg",
            name: "10kg 업소용 김치",
            brand: "AFood",
            price: 60000,
            weight: 10000,
            rating: 4.6,
            reviews: 43,
            img: "./images/kimchi_product_3kg.png",
            desc: "업소/단체급식 전용 대용량 김치. 식당이나 대규모 급식 시설 전용의 벌크형 10kg 제품입니다. 스마트팩토리의 품질 관리 기술로 균일하고 검증된 품질을 보장합니다.",
            category: "김치 (비살균제품)",
            ingredients: "절임배추 70%(국산), 무(국산), 고춧가루(국산), 마늘(국산), 액젓, 생강 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 AFood 김치사업부",
            status: "생산 중",
            infoTitle1: "스마트 숙성 공법",
            infoTitle2: "위생 및 안심 마크",
            infoDesc2: "AFood Kimchi는 스마트팩토리의 전자동 위생 검사 시스템을 통과한 제품만을 출하합니다. 전 공정 비접촉 자동 포장 시스템으로 가장 위생적이고 안전합니다.",
            comments: [
                { name: "김*식", score: 4, date: "2026.06.01", body: "식당 밑반찬용으로 늘 주문합니다. 손님들이 김치 맛있다고 칭찬하네요. 추천합니다." }
            ]
        },
        bulgogi_01: {
            id: "bulgogi_01",
            name: "직화 양념 불고기 500g",
            brand: "K-Meat",
            price: 12000,
            weight: 500,
            rating: 4.9,
            reviews: 240,
            img: "./images/beef_500g.png",
            desc: "불향 가득한 달콤짭짤 프리미엄 불고기! 100% 엄선된 소고기에 특제 양념 소스를 버무려 직화로 구워냈습니다. 가정에서 간편하게 즐기실 수 있도록 500g 진공 포장하였습니다.",
            category: "양념육 (비살균제품)",
            ingredients: "소고기 60%(미국산), 양념소스 30%[간장(국산), 설탕, 마늘, 양파, 배즙], 대파, 통깨 등",
            storage: "냉장보관 (0~10℃) 또는 즉시 섭취",
            manufacturer: "스마트팩토리 K-Meat 육가공사업부",
            status: "200 남음",
            infoTitle1: "직화 화덕 초벌 공법",
            infoTitle2: "안전 냉장 유통 마크",
            infoDesc2: "K-Meat 불고기는 위생적인 가공 시스템을 거쳐 급속 동결 및 진공 포장됩니다. 엄격한 콜드체인 시스템으로 신선함을 그대로 배송합니다.",
            comments: [
                { name: "강*호", score: 5, date: "2026.07.04", body: "후라이팬에 살짝 볶기만 했는데도 불향이 확 살아나서 밥 한 그릇 뚝딱했습니다. 고기도 야들야들하네요." },
                { name: "유*민", score: 5, date: "2026.07.01", body: "아이들이 너무 맛있게 잘 먹어요. 짜지 않고 적당히 달달해서 밥반찬으로 최적입니다." }
            ]
        },
        bulgogi_02: {
            id: "bulgogi_02",
            name: "프리미엄 불고기 도시락",
            brand: "K-Meat",
            price: 8500,
            weight: 400,
            rating: 4.8,
            reviews: 185,
            img: "./images/beef_dosirak.png",
            desc: "바쁜 일상 속 든든한 한 끼를 위한 프리미엄 불고기 도시락입니다. 엄선한 소불고기와 신선한 쌈채소, 수제 반찬으로 구성되어 맛과 영양을 모두 잡았습니다.",
            category: "즉석섭취식품",
            ingredients: "쌀 40%(국산), 소불고기 30%[소고기, 간장, 마늘], 계란말이, 볶음김치, 시금치나물 등",
            storage: "냉장보관 (0~10℃) / 구입 후 바로 섭취 권장",
            manufacturer: "스마트팩토리 K-Meat 델리사업부",
            status: "생산 중",
            infoTitle1: "당일 즉석 조리 원칙",
            infoTitle2: "위생 도시락 안심 캡",
            infoDesc2: "모든 도시락은 당일 신선하게 제조되어 친환경 안심 밀폐 캡으로 실링됩니다. 외부 이물질 유입을 차단하여 신선하고 청결한 상태를 유지합니다.",
            comments: [
                { name: "조*우", score: 5, date: "2026.07.06", body: "점심시간에 배달시켜 먹었는데 양도 푸짐하고 고기 질이 훌륭합니다. 수제 반찬 구성도 영양 균형이 잘 맞네요." },
                { name: "임*서", score: 4, date: "2026.07.02", body: "포장이 단단해서 흐트러짐 없이 배송되었습니다. 쌈채소가 아주 신선하고 불고기와 꿀맛 케미예요." }
            ]
        },
        bulgogi_03: {
            id: "bulgogi_03",
            name: "가족용 불고기 밀키트 1.5kg",
            brand: "K-Meat",
            price: 32000,
            weight: 1500,
            rating: 4.9,
            reviews: 310,
            img: "./images/beef_kit.png",
            desc: "온 가족이 넉넉하게 즐길 수 있는 1.5kg 대용량 불고기 밀키트입니다. 손질된 소고기, 양념 소스, 신선한 야채(버섯, 대파, 양파 등)가 모두 포함되어 있어 바로 볶아 드실 수 있습니다.",
            category: "간편조리세트 (밀키트)",
            ingredients: "양념소고기 50%[소고기 70%(미국산), 양념소스 30%], 양파, 새송이버섯, 팽이버섯, 대파, 당면 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 K-Meat 육가공사업부",
            status: "생산 중",
            infoTitle1: "신선 보존 진공 패키징",
            infoTitle2: "신선도 보장 안심 스티커",
            infoDesc2: "야채와 고기, 면류가 개별 밀포장되어 위생적입니다. 전 배송 차량 내 콜드체인 적용으로 최상의 신선도를 보장하는 보냉 팩에 안전하게 배송됩니다.",
            comments: [
                { name: "최*현", score: 5, date: "2026.07.05", body: "캠핑장에 가져가서 온 가족이 푸짐하게 먹었습니다. 야채가 손질되어 있어 손 갈 것도 없고 간도 딱 맞아요." }
            ]
        },
        udon_01: {
            id: "udon_01",
            name: "수제 쫄깃 우동면 2인분",
            brand: "Uton",
            price: 4500,
            weight: 400,
            rating: 4.7,
            reviews: 88,
            img: "./images/udon_noodle.png",
            desc: "스마트팩토리의 정밀 온습도 관리 공법으로 숙성시킨 수제 우동면입니다. 끓는 물에 삶았을 때 극강의 쫄깃함을 느끼실 수 있습니다.",
            category: "면류 (숙면/비살균제품)",
            ingredients: "밀가루 95%(밀: 미국산, 호주산), 정제소금, 면류첨가알칼리제 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 Uton 제면사업부",
            status: "120 남음",
            infoTitle1: "정밀 온습도 숙성 면발",
            infoTitle2: "청결 밀폐 면 포장",
            infoDesc2: "Uton 우동면은 미생물 차단 HACCP 위생 등급 공장에서 전량 자동 자동 밀폐 포장됩니다. 먼지나 이물질 접촉 우려가 전혀 없는 안심 청결 제품입니다.",
            comments: [
                { name: "김*주", score: 5, date: "2026.07.02", body: "라면 끓이듯이 가볍게 삶았는데 면발 탱글함이 사 먹는 수제 우동집 뺨치게 쫄깃해요. 냉우동으로 먹어도 최고입니다." }
            ]
        },
        udon_02: {
            id: "udon_02",
            name: "비법 우동 육수 1L",
            brand: "Uton",
            price: 6000,
            weight: 1000,
            rating: 4.8,
            reviews: 105,
            img: "./images/udon_soup.png",
            desc: "가쓰오부시와 다시마, 디포리를 최적의 비율로 우려내어 깊고 진한 감칠맛을 자랑하는 비법 육수입니다.",
            category: "소스 (살균제품)",
            ingredients: "가쓰오부시 추출액 40%[가쓰오부시(일본산)], 다시마추출액, 디포리, 정제소금, 국산간장 등",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 Uton 식품사업부",
            status: "생산 중",
            infoTitle1: "가쓰오 전통 추출 기법",
            infoTitle2: "고온 살균 안심 보틀",
            infoDesc2: "육수는 고온 가열 살균 직후 내열 안심 보틀에 충전 밀봉됩니다. 방부제를 첨가하지 않아도 유통기한 내내 깊고 맑은 첫 맛이 안전하게 변치 않습니다.",
            comments: [
                { name: "임*우", score: 5, date: "2026.07.01", body: "국물 간이 너무 세지 않고 훈연 향이 입안에 은은하게 돕니다. 오뎅탕 끓이거나 국수 장국 베이스로 쓰기 만능이네요." }
            ]
        },
        udon_03: {
            id: "udon_03",
            name: "우동 밀키트 세트 (4인분)",
            brand: "Uton",
            price: 15000,
            weight: 1800,
            rating: 4.9,
            reviews: 210,
            img: "./images/udon_kit.png",
            desc: "수제 우동면과 비법 육수, 쑥갓, 어묵, 텐카스까지 한 팩에 담은 종합 밀키트입니다. 가정이나 캠핑장에서 5분 만에 일품 우동을 완성하세요.",
            category: "간편조리세트 (밀키트)",
            ingredients: "우동면 50%, 우동육수 30%, 모둠어묵 10%, 야채 및 고명 10%",
            storage: "냉장보관 (0~10℃)",
            manufacturer: "스마트팩토리 Uton 제면/식품사업부",
            status: "생산 중",
            infoTitle1: "정통 일식 재료 큐레이팅",
            infoTitle2: "콜드체인 냉장 밀포장",
            infoDesc2: "쑥갓과 어묵 등 신선 식자재가 보냉 안심 패킹되어 신선함을 고스란히 배송합니다. 전 구간 10도 이하 콜드체인 물류로 위생 배송을 약속합니다.",
            comments: [
                { name: "신*민", score: 5, date: "2026.07.07", body: "어묵이랑 텐카스까지 정통 일식집 비주얼로 가득 들어있어 주말 야식으로 가족들과 배부르고 기분 좋게 끓여 먹었네요." }
            ]
        },
        wallet_01: {
            id: "wallet_01",
            name: "천연소가죽 명함지갑",
            brand: "Persa",
            price: 25000,
            weight: 80,
            rating: 4.9,
            reviews: 72,
            img: "./images/wallet_card.png",
            desc: "엄선된 최고급 천연 소가죽을 사용하여 한 땀 한 땀 마감한 명함지갑입니다. 사용할수록 손때가 타며 깊은 멋을 더해갑니다.",
            category: "가죽제품 (지갑)",
            ingredients: "천연 소가죽 100%(이탈리아산), 독일제 고강도 봉사",
            storage: "습기를 피하고 서늘한 곳 보관 / 가죽 전용 크림 관리 권장",
            manufacturer: "스마트팩토리 Persa 레더사업부",
            status: "15 남음",
            infoTitle1: "전통 핸드메이드 스티치",
            infoTitle2: "천연 가죽 품질 보증",
            infoDesc2: "Persa의 모든 가죽 제품은 최고급 이탈리아산 베지터블 소가죽을 사용하여 100% 수공예로 정교하게 바느질됩니다. 실밥 터짐 등 결함 시 1년 무상 A/S를 제공합니다.",
            comments: [
                { name: "강*현", score: 5, date: "2026.07.01", body: "지갑 가죽 질감이 정말 부드럽고 명함도 많이 들어가네요! 박음질 마감도 흠잡을 곳 없이 깔끔합니다." },
                { name: "임*우", score: 5, date: "2026.06.28", body: "선물용으로 샀는데 너무 고급스러워 보여서 대만족입니다. 에이징되는 모습이 기대돼요." },
                { name: "신*민", score: 4, date: "2026.06.20", body: "크기도 적당하고 수납공간이 알차네요. 처음이라 가죽이 약간 빳빳한데 쓰다보면 부드러워질 것 같습니다." }
            ]
        },
        wallet_02: {
            id: "wallet_02",
            name: "핸드메이드 반지갑",
            brand: "Persa",
            price: 45000,
            weight: 150,
            rating: 4.8,
            reviews: 94,
            img: "./images/wallet_half.png",
            desc: "클래식하고 실용적인 수제 반지갑입니다. 지폐 수납부 2곳과 카드 슬롯 6곳으로 수납력이 매우 뛰어나며 슬림한 두께를 유지합니다.",
            category: "가죽제품 (지갑)",
            ingredients: "천연 소가죽 100%(이탈리아산), 독일제 고강도 봉사",
            storage: "습기를 피하고 서늘한 곳 보관",
            manufacturer: "스마트팩토리 Persa 레더사업부",
            status: "제작 중",
            infoTitle1: "전통 핸드메이드 스티치",
            infoTitle2: "천연 가죽 품질 보증",
            infoDesc2: "Persa의 모든 가죽 제품은 최고급 이탈리아산 베지터블 소가죽을 사용하여 100% 수공예로 정교하게 바느질됩니다. 실밥 터짐 등 결함 시 1년 무상 A/S를 제공합니다.",
            comments: [
                { name: "이*진", score: 5, date: "2026.07.03", body: "남자친구 선물로 줬는데 카드 수납공간이 많고 슬림해서 주머니에 넣기 좋대요. 최고!" },
                { name: "박*호", score: 5, date: "2026.06.29", body: "바느질 상태가 견고하고 실밥 하나 튀어나온 곳이 없네요. 1년 무상 A/S가 보장된다니 더 안심입니다." },
                { name: "정*서", score: 4, date: "2026.06.22", body: "가죽 냄새가 은은하게 나서 좋아요. 수공예품이라 그런지 스티치가 정말 정교합니다." }
            ]
        },
        wallet_03: {
            id: "wallet_03",
            name: "프리미엄 장지갑",
            brand: "Persa",
            price: 75000,
            weight: 250,
            rating: 4.9,
            reviews: 58,
            img: "./images/wallet_long.png",
            desc: "수공예의 진수를 보여주는 프리미엄 장지갑입니다. 넉넉한 수납 공간과 스마트폰까지 수납이 가능한 설계로 활용도가 매우 높습니다.",
            category: "가죽제품 (지갑)",
            ingredients: "천연 소가죽 100%(이탈리아산), YKK 지퍼, 독일제 고강도 봉사",
            storage: "습기를 피하고 가죽 전용 클리너 사용 권장",
            manufacturer: "스마트팩토리 Persa 레더사업부",
            status: "제작 중",
            infoTitle1: "전통 핸드메이드 스티치",
            infoTitle2: "천연 가죽 품질 보증",
            infoDesc2: "Persa의 모든 가죽 제품은 최고급 이탈리아산 베지터블 소가죽을 사용하여 100% 수공예로 정교하게 바느질됩니다. 실밥 터짐 등 결함 시 1년 무상 A/S를 제공합니다.",
            comments: [
                { name: "윤*영", score: 5, date: "2026.07.05", body: "수납공간이 정말 광활합니다. 폰도 쏙 들어가고 지퍼도 부드럽게 열리네요. 부모님 선물로 드렸는데 아주 좋아하십니다." },
                { name: "한*재", score: 5, date: "2026.06.30", body: "이 가격에 이 퀄리티 가죽 장지갑이라니 믿을 수가 없네요. 마감이 정말 명품 못지않습니다." },
                { name: "김*아", score: 5, date: "2026.06.25", body: "가죽 표면 질감이 독특하고 고급스러워요. 오래오래 잘 쓸 것 같습니다." }
            ]
        },
        burger_01: {
            id: "burger_01",
            name: "클래식 치즈버거 단품",
            brand: "BurgerQueen",
            price: 5500,
            weight: 220,
            rating: 4.6,
            reviews: 115,
            img: "./images/burger_cheese.png",
            desc: "육즙이 가득한 소고기 패티와 고소한 체다 치즈가 어우러진 버거퀸의 정통 클래식 치즈버거입니다.",
            category: "즉석섭취식품 (햄버거)",
            ingredients: "버거번[밀가루(미국산)], 소고기 패티 35%[소고기 80%(호주산), 돼지고기 20%], 체다치즈, 양파, 피클 등",
            storage: "구입 후 즉시 섭취 / 냉장보관 시 24시간 이내",
            manufacturer: "스마트팩토리 BurgerQueen 델리사업부",
            status: "생산 중",
            infoTitle1: "100% 직화 순쇠고기 패티",
            infoTitle2: "콜드체인 야채 신선보장",
            infoDesc2: "BurgerQueen은 당일 아침 배송된 100% 무농약 국내산 토마토와 양상추만을 사용하며, 조리 전까지 영상 4도의 특수 신선실에서 철저히 보관 및 통제됩니다.",
            comments: [
                { name: "김*태", score: 5, date: "2026.07.03", body: "패티가 퍽퍽하지 않고 육즙이 가득 차 있어서 목넘김이 아주 좋습니다. 치즈가 살포시 녹아든 밸런스가 최고네요." }
            ]
        },
        burger_02: {
            id: "burger_02",
            name: "더블 패티 시그니처 버거",
            brand: "BurgerQueen",
            price: 8000,
            weight: 320,
            rating: 4.8,
            reviews: 145,
            img: "./images/burger_signature.png",
            desc: "두툼한 소고기 패티 2장과 특제 바비큐 소스, 그리고 싱싱한 토마토와 양상추가 아낌없이 들어간 버거퀸의 시그니처 수제 버거입니다.",
            category: "즉석섭취식품 (햄버거)",
            ingredients: "소고기 패티 50%[소고기(호주산)], 버거번, 토마토, 양상추, 특제소스[간장, 양파, 설탕] 등",
            storage: "구입 후 즉시 섭취 권장",
            manufacturer: "스마트팩토리 BurgerQueen 델리사업부",
            status: "30 남음",
            infoTitle1: "100% 직화 순쇠고기 패티",
            infoTitle2: "콜드체인 야채 신선보장",
            infoDesc2: "BurgerQueen은 당일 아침 배송된 100% 무농약 국내산 토마토와 양상추만을 사용하며, 조리 전까지 영상 4도의 특수 신선실에서 철저히 보관 및 통제됩니다.",
            comments: [
                { name: "이*혁", score: 5, date: "2026.07.02", body: "패티가 2장이라 그런지 입에 꽉 차는 고기 식감이 대박입니다. 특제 바비큐 소스도 달콤해서 환상 궁합이네요." }
            ]
        },
        burger_03: {
            id: "burger_03",
            name: "패밀리 버거 세트 (버거4+감튀+음료)",
            brand: "BurgerQueen",
            price: 24000,
            weight: 1500,
            rating: 4.7,
            reviews: 92,
            img: "./images/burger_family.png",
            desc: "온 가족이 배불리 먹을 수 있는 실속 구성 세트입니다. 치즈버거 2개, 시그니처 버거 2개, 대용량 감자튀김과 1.5L 콜라가 포함되어 있습니다.",
            category: "즉석섭취식품 (복합세트)",
            ingredients: "햄버거 4종, 감자튀김[감자(미국산), 식물성유지], 탄산음료 등",
            storage: "구입 즉시 섭취 권장",
            manufacturer: "스마트팩토리 BurgerQueen 델리사업부",
            status: "생산 중",
            infoTitle1: "주문 즉시 패키징 출고",
            infoTitle2: "에어타이트 보온 밀봉 봉투",
            infoDesc2: "많은 수량의 패밀리 세트 특성상, 배송 중 식지 않도록 특수 보온 에어 실링 백에 전용 밀봉 처리되어 갓 조리한 온도 그대로 도착합니다.",
            comments: [
                { name: "송*아", score: 5, date: "2026.07.06", body: "주말 저녁 패밀리 팩으로 해결했는데 가성비가 최고네요. 감자튀김도 갓 튀긴 듯 바삭하고 따끈하게 도착했습니다." }
            ]
        }
    }
};
