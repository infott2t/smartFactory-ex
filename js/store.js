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

            // 💡 [수정] matchedBatch 분기에서도 원래 지시서 발행 시의 절임 세팅 파라미터 값들을 보존하여 매핑함
            if (cloned.stages[2] && cloned.stages[2].step2_salting) {
                const specSalting = cloned.stages[2].step2_salting;
                s2.brineSalinity = s2.brineSalinity !== undefined ? s2.brineSalinity : specSalting.brineSalinity;
                s2.brineVolumeLiters = s2.brineVolumeLiters !== undefined ? s2.brineVolumeLiters : specSalting.brineVolumeLiters;
                s2.extraSaltAmountKg = s2.extraSaltAmountKg !== undefined ? s2.extraSaltAmountKg : specSalting.extraSaltAmountKg;
                s2.targetDuration = s2.targetDuration !== undefined ? s2.targetDuration : (specSalting.targetDuration || (limit / 3600000));
            } else {
                s2.brineSalinity = s2.brineSalinity !== undefined ? s2.brineSalinity : 8;
                s2.brineVolumeLiters = s2.brineVolumeLiters !== undefined ? s2.brineVolumeLiters : 0;
                s2.extraSaltAmountKg = s2.extraSaltAmountKg !== undefined ? s2.extraSaltAmountKg : 0;
            }
            
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
            s2.flipCount = s2.flipCount !== undefined ? parseInt(s2.flipCount) || 0 : (order.stages && order.stages[2] && order.stages[2].flipCount !== undefined ? parseInt(order.stages[2].flipCount) || 0 : 0);
            s2.statusSubmitted = s2.statusSubmitted !== undefined ? !!s2.statusSubmitted : false;
            cloned.stages[2] = s2;
        }

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
            const specSalting = s2.step2_salting || {};
            const saltingStartTime = s2.saltingStartTime || s2.startTime || specSalting.saltingStartTime || null;
            const isTurnedOver = s2.isTurnedOver !== undefined ? s2.isTurnedOver : (s2.endTime ? true : (specSalting.isTurnedOver || false));
            
            const salinityVal = s2.brineSalinity !== undefined && s2.brineSalinity !== null ? s2.brineSalinity : specSalting.brineSalinity;
            const volumeVal = s2.brineVolumeLiters !== undefined && s2.brineVolumeLiters !== null ? s2.brineVolumeLiters : specSalting.brineVolumeLiters;
            const saltVal = s2.extraSaltAmountKg !== undefined && s2.extraSaltAmountKg !== null ? s2.extraSaltAmountKg : specSalting.extraSaltAmountKg;
            const durationVal = s2.targetDuration !== undefined && s2.targetDuration !== null ? s2.targetDuration : specSalting.targetDuration;

            dbStages[2] = {
                ...s2,
                operators: s2.operators || (s2.operator ? [s2.operator] : []),
                startTime: s2.startTime || null,
                endTime: s2.endTime || null,
                defectCount: parseInt(s2.defectCount) || 0,
                step5Status: s2.step5Status || "none",
                statusSubmitted: !!s2.statusSubmitted,
                step2_salting: {
                    brineSalinity: parseFloat(salinityVal) || 0,
                    brineVolumeLiters: parseFloat(volumeVal) || 0,
                    extraSaltAmountKg: parseFloat(saltVal) || 0,
                    isTurnedOver: !!isTurnedOver,
                    saltingStartTime: saltingStartTime,
                    targetDuration: parseFloat(durationVal) || 0
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

        // 💡 [수정] 3-2, 5-1, 5-2, 6 등 표준(1~4) 외 서브 공정 키들이 직렬화 저장 시 삭제되지 않도록 보존 
        for (let key in cloned.stages) {
            if (key !== "1" && key !== "2" && key !== "3" && key !== "4" && key !== 1 && key !== 2 && key !== 3 && key !== 4) {
                dbStages[key] = cloned.stages[key];
            }
        }

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

    const UTON_ORDER_SETTINGS_STORAGE_KEY = 'uton_order_settings';
    const UTON_ORDER_SETTINGS_DEFAULTS = {
        intervalMinutes: 10,
        maxQtyPerInterval: 2
    };

    function normalizeUtonOrderSettings(settings) {
        const source = settings && typeof settings === 'object' ? settings : {};
        const intervalMinutes = Math.max(1, Math.floor(Number(source.intervalMinutes) || UTON_ORDER_SETTINGS_DEFAULTS.intervalMinutes));
        const maxQtyPerInterval = Math.max(1, Math.floor(Number(source.maxQtyPerInterval) || UTON_ORDER_SETTINGS_DEFAULTS.maxQtyPerInterval));
        return { intervalMinutes, maxQtyPerInterval };
    }

    function loadUtonOrderSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(UTON_ORDER_SETTINGS_STORAGE_KEY) || 'null');
            if (stored && typeof stored === 'object') {
                return normalizeUtonOrderSettings(stored);
            }
        } catch (error) {}

        const defaults = (window.MockData && window.MockData.utonOrderSettings)
            || (window.MockData && window.MockData.utonFinanceAssumptions && {
                intervalMinutes: window.MockData.utonFinanceAssumptions.maxSalesIntervalMinutes,
                maxQtyPerInterval: window.MockData.utonFinanceAssumptions.maxSalesQtyPerMenuPerInterval
            });
        return normalizeUtonOrderSettings(defaults);
    }

    function saveUtonOrderSettings(settings) {
        const normalized = normalizeUtonOrderSettings(settings);
        localStorage.setItem(UTON_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    // 예약 출근/위생/작업 상태의 공통 기본값
    const reservationStepDefaults = {
        qr: false,
        lockerRoom: false,
        lockerNumber: false,
        clothes: false,
        uniform: false,
        handWash: false,
        sanitizer: false,
        handPhoto: false,
        shopEntry: false
    };

    const reservationAttendanceDefaults = {
        userGender: null,
        checkInAt: null,
        lockerGender: null,
        lockerNumber: null,
        preWorkStatus: 'not_started',
        handWashSkipped: false,
        handPhotoStatus: 'not_submitted',
        handPhotoCapturedAt: null,
        handPhotoVerifiedAt: null,
        handPhotoVerificationMode: null,
        workStatus: 'reserved',
        workStartedAt: null,
        workCompletedAt: null,
        absenceAt: null,
        earlyLeaveRequestedAt: null,
        earlyLeaveAutoAt: null,
        earlyLeaveCompletedAt: null,
        checkoutType: null,
        breakSeconds: 0,
        actualWorkSeconds: 0,
        earnedPay: 0,
        attendanceHistoryId: null,
        workLogs: [],
        currentTaskType: null,
        currentTaskStep: null,
        currentTaskName: null,
        completedOrdersCount: 0,
        lastActivityAt: null
    };

    function normalizeReservation(reservation) {
        if (!reservation || typeof reservation !== 'object' || Array.isArray(reservation)) {
            return reservation;
        }

        const normalized = {
            ...reservationAttendanceDefaults,
            ...reservation,
            checkInSteps: {
                ...reservationStepDefaults,
                ...(reservation.checkInSteps && typeof reservation.checkInSteps === 'object'
                    ? reservation.checkInSteps
                : {})
            }
        };
        normalized.workLogs = Array.isArray(reservation.workLogs)
            ? reservation.workLogs.map(log => ({ ...log }))
            : [];
        return normalized;
    }

    function hasReservationIdentityValue(value) {
        return value !== undefined && value !== null && value !== '';
    }

    function getReservationIdentityKey(reservation) {
        if (!reservation) return null;
        const user = hasReservationIdentityValue(reservation.userId)
            ? reservation.userId
            : reservation.userName;
        if (hasReservationIdentityValue(user) && hasReservationIdentityValue(reservation.workId)
            && hasReservationIdentityValue(reservation.date) && hasReservationIdentityValue(reservation.slot)) {
            return ['reservation', user, reservation.workId, reservation.date, reservation.slot]
                .map(value => String(value).trim().toLowerCase()).join('|');
        }
        if (hasReservationIdentityValue(reservation.id)) return 'id|' + String(reservation.id).trim().toLowerCase();
        return null;
    }

    function dedupeReservations(reservations) {
        const map = new Map();
        (Array.isArray(reservations) ? reservations : []).forEach(item => {
            const reservation = normalizeReservation(item);
            if (!reservation) return;
            const key = getReservationIdentityKey(reservation) || ('anonymous|' + JSON.stringify(reservation));
            const existing = map.get(key);
            if (!existing) {
                map.set(key, reservation);
                return;
            }
            const score = value => (value.checkInAt ? 4 : 0)
                + (value.workStatus && value.workStatus !== 'reserved' ? 3 : 0)
                + (Array.isArray(value.workLogs) ? value.workLogs.length : 0);
            if (score(reservation) >= score(existing)) {
                const merged = { ...existing, ...reservation, id: existing.id || reservation.id };
                const logs = [];
                [...(existing.workLogs || []), ...(reservation.workLogs || [])].forEach(log => {
                    const logKey = log && (log.id || `${log.type}|${log.createdAt}|${log.message}`);
                    if (logKey && !logs.some(item => (item.id || `${item.type}|${item.createdAt}|${item.message}`) === logKey)) {
                        logs.push(log);
                    }
                });
                merged.workLogs = logs;
                map.set(key, normalizeReservation(merged));
            }
        });
        return Array.from(map.values());
    }

    function matchesReservationFallback(reservation, match) {
        if (!reservation || !match) return false;
        const fields = ['userId', 'workId', 'date', 'slot'];
        return fields.every(field =>
            hasReservationIdentityValue(match[field]) &&
            String(reservation[field]) === String(match[field])
        );
    }

    function syncSelectedReservation(updatedReservation) {
        const selectedRaw = sessionStorage.getItem('selected_reservation');
        if (!selectedRaw || !updatedReservation) return;

        try {
            const selected = JSON.parse(selectedRaw);
            const hasBothIds = hasReservationIdentityValue(selected && selected.id) &&
                hasReservationIdentityValue(updatedReservation.id);
            const isSameReservation = hasBothIds
                ? String(selected.id) === String(updatedReservation.id)
                : matchesReservationFallback(updatedReservation, selected);

            if (isSameReservation) {
                sessionStorage.setItem('selected_reservation', JSON.stringify(updatedReservation));
            }
        } catch (e) {
            console.warn('선택된 예약 정보를 동기화하지 못했습니다.', e);
        }
    }

    function inferShopOrderMenuType(order) {
        if (!order || typeof order !== 'object') return null;
        if (order.menuType === 'udon' || order.menuType === 'bibim') return order.menuType;

        const productId = String(order.productId || order.productCode || '').toLowerCase();
        const productName = String(order.productName || '').toLowerCase();
        if (productId === '20002' || productId === 'p2' || productName.includes('비빔')) return 'bibim';
        if (productId === '20001' || productId === 'p1' || productName.includes('우동')) return 'udon';
        return null;
    }

    function inferShopOrderWorkId(order) {
        if (!order || typeof order !== 'object') return null;
        if (hasReservationIdentityValue(order.workId)) return order.workId;

        const menuType = inferShopOrderMenuType(order);
        const brandName = String(order.brandName || '').toLowerCase();
        return menuType || brandName === 'uton' ? 2 : null;
    }

    function normalizeShopOrder(order) {
        if (!order || typeof order !== 'object' || Array.isArray(order)) return order;

        const normalized = { ...order };
        const workId = inferShopOrderWorkId(normalized);
        const menuType = inferShopOrderMenuType(normalized);
        if (!hasReservationIdentityValue(normalized.workId) && workId !== null) normalized.workId = workId;
        if (!normalized.menuType && menuType) normalized.menuType = menuType;
        if (hasReservationIdentityValue(normalized.orderNo)) normalized.orderNo = String(normalized.orderNo);

        if (String(workId) === '2' && menuType) {
            normalized.orderType = normalized.orderType || 'dine_in';
            normalized.fulfillmentType = normalized.fulfillmentType || 'pickup';
            if (!normalized.kitchenStatus) {
                if (normalized.status === 'completed') normalized.kitchenStatus = 'received';
                else if (normalized.status === 'cancelled') normalized.kitchenStatus = 'cancelled';
                else normalized.kitchenStatus = 'queued';
            }
        }

        const isCancelled = normalized.status === 'cancelled';
        normalized.shouldShowSpendAmount = !isCancelled;
        normalized.paymentDisplayLabel = isCancelled ? '주문취소됨' : '';

        return normalized;
    }

    function isUtonShopOrder(order) {
        return String(inferShopOrderWorkId(order)) === '2';
    }

    function getShopOrderIdentity(order, index) {
        if (order && order.id !== undefined && order.id !== null && String(order.id).trim() !== '') {
            return `id:${order.id}`;
        }
        if (order && order.orderNo !== undefined && order.orderNo !== null && String(order.orderNo).trim() !== '') {
            return `order:${order.orderNo}:${order.userId || ''}:${order.orderedAt || order.orderDate || ''}`;
        }
        return `index:${index}`;
    }

    function dedupeShopOrders(orders) {
        const seen = new Set();
        return (Array.isArray(orders) ? orders : []).reduce((result, order, index) => {
            const normalized = normalizeShopOrder(order);
            const identity = getShopOrderIdentity(normalized, index);
            if (!seen.has(identity)) {
                seen.add(identity);
                result.push(normalized);
            }
            return result;
        }, []);
    }

    function getAllShopOrders() {
        return dedupeShopOrders([].concat(state.shopHistory || [], state.utonShopHistory || []));
    }

    function findShopOrderCollection(orderId) {
        const collections = [state.utonShopHistory || [], state.shopHistory || []];
        for (const collection of collections) {
            const index = collection.findIndex(item => item && String(item.id) === String(orderId));
            if (index > -1) return { collection, index };
        }
        return null;
    }

    function getShopSettlementId(order) {
        const key = order && (order.id || order.orderNo || `${order.userId || 'guest'}-${order.productId || ''}-${order.completedAt || order.orderedAt || order.orderDate || ''}`);
        return `shop-spend:${String(key)}`;
    }

    function isManagerTestOrder(order) {
        if (!order) return false;
        if (String(order.userId || '') === 'manager-test') return true;
        if (String(order.id || '').startsWith('manager_test_')) return true;
        return /^T\d+$/.test(String(order.orderNo || ''));
    }

    function ensureShopSettlementForOrder(order, options) {
        const allowCreate = !(options && options.allowCreate === false);

        // 💡 주문이 접수(완료)된 시점에 정산금액을 차감한다. 취소된 주문은 차감하지 않는다.
        if (!order || order.status === 'cancelled') return null;

        // 관리자 KDS 테스트 주문은 실제 구매가 아니므로 정산금액에서 차감하지 않는다
        if (isManagerTestOrder(order)) return null;

        // 별도 결제 절차가 있는 주문(오프라인 매장 주문 등)은 온라인 정산 결제로 확정된 경우만 차감한다.
        // paymentStatus 필드를 가진 주문은 결제 방식을 직접 선택하는 주문이다.
        if (order.paymentStatus !== undefined && order.paymentStatus !== null) {
            if (order.paymentStatus !== 'paid') return null;
            if (order.paymentMethod && order.paymentMethod !== 'online_settlement') return null;
        }

        const price = Number(order.price) || 0;
        if (price <= 0) return null;
        if (!Array.isArray(state.settlementTransactions)) state.settlementTransactions = [];

        const transactionId = order.settlementTransactionId || getShopSettlementId(order);
        const existing = state.settlementTransactions.find(item => item && item.id === transactionId);
        if (existing) {
            order.settlementTransactionId = existing.id;
            order.settlementDeductedAt = order.settlementDeductedAt || existing.createdAt;
            return existing;
        }

        // 신규 생성이 허용되지 않은 호출(로드 시 연결 전용)은 여기서 종료
        if (!allowCreate) return null;

        const createdAt = order.orderedAt || order.createdAt || new Date().toISOString();
        const transaction = {
            id: transactionId,
            type: 'shop_spend',
            userId: order.userId !== undefined && order.userId !== null ? String(order.userId) : null,
            orderId: order.id !== undefined && order.id !== null ? String(order.id) : null,
            orderNo: order.orderNo !== undefined && order.orderNo !== null ? String(order.orderNo) : null,
            productId: order.productId || order.productCode || null,
            productName: order.productName || '주문 상품',
            workId: order.workId !== undefined && order.workId !== null ? order.workId : inferShopOrderWorkId(order),
            brandName: order.brandName || null,
            qty: Math.max(1, Number(order.qty) || 1),
            unitPrice: Number(order.unitPrice) || price,
            amount: -price,
            absoluteAmount: price,
            createdAt: createdAt,
            source: 'shop_order_placed',
            description: '쇼핑 주문 접수 정산 차감'
        };
        state.settlementTransactions.push(transaction);
        order.settlementTransactionId = transaction.id;
        order.settlementDeductedAt = createdAt;
        return transaction;
    }

    // 주문 취소 시 정산 차감 트랜잭션을 제거해 잔액을 복구한다
    function removeShopSettlementForOrder(order) {
        if (!order) return false;
        if (!Array.isArray(state.settlementTransactions)) return false;

        const transactionId = order.settlementTransactionId || getShopSettlementId(order);
        const index = state.settlementTransactions.findIndex(item => item && item.id === transactionId);
        if (index < 0) return false;

        state.settlementTransactions.splice(index, 1);
        delete order.settlementTransactionId;
        delete order.settlementDeductedAt;
        return true;
    }

    let state = {
        currentUser: null,
        workers: {}, // { [userId]: { id, name, workedHours, udonHours, walletHours, checkInTime, accumBreakSeconds, breakRemainingSeconds, isOnBreak, helperBonus, helperBaseSalary, salary, completedOrdersCount } }
        userWorkHours: {}, // 신규 추가: { [`${userId}_${workId}`]: hours }
        reservations: [],
        history: [],
        shopHistory: [], // 김치 주문: kimp_shop_history
        utonShopHistory: [], // 우동/비빔면 주문: uton_shop_history
        settlementTransactions: [],
        isLike: [], // 신규 추가: [ { userId, productId, likedAt } ]
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

    function notifyListeners() {
        const currentState = JSON.parse(JSON.stringify(state));
        listeners.forEach(listener => listener(currentState));
    }

    const TABLE_NAMES = {
        USERS: 'users',
        WORKER_RUNTIME_STATE: 'workerRuntimeState',
        USER_WORK_HOURS: 'userWorkHours',
        WORKS: 'works',
        WORK_DETAILS: 'workDetails',
        WORK_RESERVATIONS: 'workReservations',
        WORK_HISTORIES: 'workHistories',
        SHOP_ORDERS: 'shopOrders',
        PRODUCTS: 'products',
        PRODUCT_REVIEWS: 'productReviews',
        USER_WORK_EXPERIENCES: 'userWorkExperiences',
        PRODUCTION_ORDERS: 'productionOrders',
        PACKAGING_ORDERS: 'packagingOrders',
        WORKERS_PROGRESS: 'workersProgress',
        LIKES: 'likes'
    };

    const TABLE_SOURCES = {
        users: 'MockData.users',
        workerRuntimeState: 'FactoryStore.state.workers',
        userWorkHours: 'FactoryStore.state.userWorkHours',
        works: 'MockData.worksJSON',
        workDetails: 'MockData.workDetailJSON',
        workReservations: 'FactoryStore.state.reservations / app_reservations_db',
        workHistories: 'FactoryStore.state.history / mypage_history_{userId}',
        shopOrders: 'FactoryStore.state.shopHistory / kimp_shop_history + FactoryStore.state.utonShopHistory / uton_shop_history',
        products: 'MockData.storeProducts',
        productReviews: 'MockData.productReviews',
        userWorkExperiences: 'MockData.userWorkProgress / userWorkProgress',
        productionOrders: 'FactoryStore.state.productionOrders / kimp_production_orders',
        packagingOrders: 'FactoryStore.state.packagingOrders / kimp_packaging_orders',
        workersProgress: 'FactoryStore.state.workersProgress / kimp_workers_progress',
        likes: 'FactoryStore.state.isLike'
    };

    function cloneData(value) {
        if (value === undefined || value === null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function parseMockJson(json, fallback) {
        try {
            return JSON.parse(json || '');
        } catch(e) {
            return fallback;
        }
    }

    function getMockUsers() {
        return cloneData((window.MockData && Array.isArray(window.MockData.users)) ? window.MockData.users : []);
    }

    function getMockWorks() {
        return parseMockJson(window.MockData && window.MockData.worksJSON, []);
    }

    function getMockWorkDetails() {
        return parseMockJson(window.MockData && window.MockData.workDetailJSON, {});
    }

    function getMockProducts() {
        return cloneData((window.MockData && Array.isArray(window.MockData.storeProducts)) ? window.MockData.storeProducts : []);
    }

    function getMockProductReviews() {
        return cloneData((window.MockData && window.MockData.productReviews) ? window.MockData.productReviews : {});
    }

    function getMockUserWorkExperiences() {
        return cloneData((window.MockData && Array.isArray(window.MockData.userWorkProgress)) ? window.MockData.userWorkProgress : []);
    }

    function getDomainTables() {
        return {
            users: getMockUsers(),
            workerRuntimeState: cloneData(state.workers || {}),
            userWorkHours: cloneData(state.userWorkHours || {}),
            works: getMockWorks(),
            workDetails: getMockWorkDetails(),
            workReservations: cloneData((state.reservations || []).map(normalizeReservation)),
            workHistories: cloneData(state.history || []),
            shopOrders: cloneData(getAllShopOrders()),
            products: getMockProducts(),
            productReviews: getMockProductReviews(),
            userWorkExperiences: getMockUserWorkExperiences(),
            productionOrders: cloneData(state.productionOrders || {}),
            packagingOrders: cloneData(state.packagingOrders || {}),
            workersProgress: cloneData(state.workersProgress || {}),
            likes: cloneData(state.isLike || [])
        };
    }

    // 회원별/작업(workId)별 기본 근로시간 생성 함수 (요청 범위 반영)
    function getDefaultUserWorkHours() {
        return {
            // 1: 최현일 (모든 일 50~60시간 사이 -> 매니저)
            "1_1": 55, "1_2": 58, "1_3": 52, "1_6": 54, "1_7": 59,
            // 2: 최수아 (모든 일 20~25시간 사이 -> 일반)
            "2_1": 22, "2_2": 24, "2_3": 20, "2_6": 23, "2_7": 25,
            // 3: 김수민 (모든 일 0~2시간 사이 -> 일반, 0시간 반드시 포함)
            "3_1": 0,  "3_2": 1,  "3_3": 0,  "3_6": 2,  "3_7": 0,
            // 4: 김영희 (모든 일 30~49시간 사이 -> 헬퍼)
            "4_1": 45, "4_2": 38, "4_3": 32, "4_6": 40, "4_7": 47
        };
    }

    function loadFromStorage() {
        const userStr = sessionStorage.getItem("user");
        state.currentUser = userStr ? JSON.parse(userStr) : null;
        
        let loadedWorkers = {};
        try {
            loadedWorkers = JSON.parse(localStorage.getItem('kimp_workers_state') || '{}');
        } catch(e) {}

        let loadedWorkHours = {};
        try {
            loadedWorkHours = JSON.parse(localStorage.getItem('kimp_user_work_hours') || '{}');
        } catch(e) {}

        const defaultWorkHours = getDefaultUserWorkHours();
        state.userWorkHours = { ...defaultWorkHours, ...loadedWorkHours };

        const defaultWorkers = {
            "1": { id: 1, name: "최현일", workedHours: state.userWorkHours["1_1"] || 55, udonHours: state.userWorkHours["1_2"] || 58, walletHours: state.userWorkHours["1_3"] || 52, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "2": { id: 2, name: "최수아", workedHours: state.userWorkHours["2_1"] || 22, udonHours: state.userWorkHours["2_2"] || 24, walletHours: state.userWorkHours["2_3"] || 20, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "3": { id: 3, name: "김수민", workedHours: state.userWorkHours["3_1"] || 0,  udonHours: state.userWorkHours["3_2"] || 1,  walletHours: state.userWorkHours["3_3"] || 0,  checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 },
            "4": { id: 4, name: "김영희", workedHours: state.userWorkHours["4_1"] || 45, udonHours: state.userWorkHours["4_2"] || 38, walletHours: state.userWorkHours["4_3"] || 32, checkInTime: null, accumBreakSeconds: 0, breakRemainingSeconds: 1800, isOnBreak: false, helperBonus: 0, helperBaseSalary: 0, salary: 0, completedOrdersCount: 0 }
        };

        state.workers = { ...defaultWorkers, ...loadedWorkers };
        // userWorkHours와 workers 객체의 개별 workedHours / udonHours / walletHours 동기화
        Object.keys(state.workers).forEach(uId => {
            const kHours = state.userWorkHours[`${uId}_1`];
            const uHours = state.userWorkHours[`${uId}_2`];
            const wHours = state.userWorkHours[`${uId}_3`];
            if (kHours !== undefined) state.workers[uId].workedHours = kHours;
            if (uHours !== undefined) state.workers[uId].udonHours = uHours;
            if (wHours !== undefined) state.workers[uId].walletHours = wHours;
        });

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
            const storedReservations = Array.isArray(parsed) ? parsed : [];
            state.reservations = dedupeReservations(storedReservations);
            if (JSON.stringify(storedReservations) !== JSON.stringify(state.reservations)) {
                localStorage.setItem(getStorageKey('app_reservations_db'), JSON.stringify(state.reservations));
            }
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

        // 3.5 Shop History
        // 김치와 Uton 매장 주문은 서로 다른 저장소를 사용합니다.
        // 이전 버전에서 kimp_shop_history에 섞여 저장된 Uton 주문은 한 번만 uton_shop_history로 이전합니다.
        let legacyKimpOrders = [];
        let storedUtonOrders = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('kimp_shop_history') || '[]');
            legacyKimpOrders = Array.isArray(parsed) ? parsed.map(normalizeShopOrder) : [];
        } catch(e) {}
        try {
            const parsed = JSON.parse(localStorage.getItem('uton_shop_history') || '[]');
            storedUtonOrders = Array.isArray(parsed) ? parsed.map(normalizeShopOrder) : [];
        } catch(e) {}

        const migratedUtonOrders = legacyKimpOrders.filter(isUtonShopOrder);
        state.shopHistory = dedupeShopOrders(legacyKimpOrders.filter(order => !isUtonShopOrder(order)));
        state.utonShopHistory = dedupeShopOrders(storedUtonOrders.concat(migratedUtonOrders));

        if (migratedUtonOrders.length > 0) {
            localStorage.setItem('kimp_shop_history', JSON.stringify(state.shopHistory));
            localStorage.setItem('uton_shop_history', JSON.stringify(state.utonShopHistory));
        }

        try {
            const parsed = JSON.parse(localStorage.getItem('kimp_settlement_transactions') || '[]');
            state.settlementTransactions = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            state.settlementTransactions = [];
        }

        // 💡 페이지 로드 시에는 기존 트랜잭션 연결만 수행한다.
        // (신규 생성을 허용하면 과거 주문들이 뒤늦게 소급 차감되는 문제가 발생함)
        const beforeSettlementCount = state.settlementTransactions.length;
        getAllShopOrders().forEach(order => ensureShopSettlementForOrder(order, { allowCreate: false }));
        if (state.settlementTransactions.length !== beforeSettlementCount) {
            localStorage.setItem('kimp_settlement_transactions', JSON.stringify(state.settlementTransactions));
            localStorage.setItem('kimp_shop_history', JSON.stringify(state.shopHistory));
            localStorage.setItem('uton_shop_history', JSON.stringify(state.utonShopHistory));
        }

        // 4. Experience time
        const expRem = localStorage.getItem(getStorageKey('kimp_experience_remaining_seconds'));
        state.experienceRemainingSeconds = expRem !== null ? parseInt(expRem) : 180;

        // 6. Production orders
        try {
            const rawOrders = localStorage.getItem('kimp_production_orders');
            let deletedIds = [];
            try {
                deletedIds = JSON.parse(localStorage.getItem("kimp_deleted_order_ids") || "[]");
            } catch(e) {}

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
                        if (o && o.orderId && !deletedIds.includes(o.orderId)) {
                            const sanitized = mapOrderToFrontend(o);
                            if (sanitized && sanitized.orderId) {
                                obj[sanitized.orderId] = sanitized;
                            }
                        }
                    });
                } else if (typeof parsed === 'object') {
                    for (let k in parsed) {
                        if (!deletedIds.includes(k)) {
                            const sanitized = mapOrderToFrontend(parsed[k]);
                            if (sanitized && sanitized.orderId) {
                                obj[sanitized.orderId] = sanitized;
                            }
                        }
                    }
                }
            }

            // If empty, perform dynamic initial setup with yesterday's date mock orders
            if (isEmpty || Object.keys(obj).length === 0) {
                const order1Id = `${yesterdayDateStr}-15-1`;
                const order2Id = `${yesterdayDateStr}-15-2`;
                const order3Id = `${yesterdayDateStr}-15-3`;

                obj = {};
                if (!deletedIds.includes(order1Id)) obj[order1Id] = mapOrderToFrontend(window.defaultProductionOrders[order1Id]);
                if (!deletedIds.includes(order2Id)) obj[order2Id] = mapOrderToFrontend(window.defaultProductionOrders[order2Id]);
                if (!deletedIds.includes(order3Id)) obj[order3Id] = mapOrderToFrontend(window.defaultProductionOrders[order3Id]);

                // Also initialize refrigerator salting batches
                const now = Date.now();
                const currentSettingHours = parseInt(localStorage.getItem("kimp_salting_time_setting") || "17");
                const currentSettingMs = currentSettingHours * 3600 * 1000;
                
                const initialSalting = [];
                if (!deletedIds.includes(order1Id)) {
                    initialSalting.push({
                        id: order1Id,
                        orderId: order1Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 4 * 3600 * 1000,
                        saltingTimeLimit: currentSettingMs
                    });
                }
                if (!deletedIds.includes(order2Id)) {
                    initialSalting.push({
                        id: order2Id,
                        orderId: order2Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - 3 * 3600 * 1000,
                        saltingTimeLimit: currentSettingMs
                    });
                }
                if (!deletedIds.includes(order3Id)) {
                    initialSalting.push({
                        id: order3Id,
                        orderId: order3Id,
                        cabbageHeads: 15,
                        status: "salting",
                        startTime: now - (currentSettingMs - 60 * 1000),
                        saltingTimeLimit: currentSettingMs
                    });
                }
                localStorage.setItem("kimp_factory_salting", JSON.stringify(initialSalting));
                localStorage.setItem("kimp_factory_matured_cabbages", "0");
                dbChanged = true;
            }

            // Centralized cleanup of legacy keys
            for (let k in obj) {
                if (k.startsWith("260530-") || k.startsWith("260612-") || deletedIds.includes(k)) {
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
                if (!deletedIds.includes(k) && !obj[k] && window.defaultProductionOrders[k]) {
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

        // 9. isLike Table Load
        try {
            const rawIsLike = localStorage.getItem('kimp_is_like_table');
            let parsed = rawIsLike ? JSON.parse(rawIsLike) : [];
            if (!Array.isArray(parsed)) {
                parsed = [];
            }
            
            // productId가 숫자이면 그대로 유지, NaN이면 폐기
            // (storeProducts가 없는 타이밍에는 애칭 치환 없이 숫자 데이터만 보존)
            const masterProducts = (window.MockData && window.MockData.storeProducts) ? window.MockData.storeProducts : [];
            parsed.forEach(r => {
                const numVal = Number(r.productId);
                if (isNaN(numVal) && masterProducts.length > 0) {
                    // 애칭 문자열("p300g" 등) → 정규 5자리 숫자로 치환
                    const match = masterProducts.find(p => String(p.productCode) === String(r.productId));
                    if (match) {
                        r.productId = Number(match.productId);
                    }
                } else if (!isNaN(numVal)) {
                    r.productId = numVal; // 이미 숫자이면 Number 형으로만 보정
                }
            });
            
            // productId가 유효한 숫자인 레코드만 보존
            state.isLike = parsed.filter(r =>
                r.productId !== undefined &&
                r.productId !== null &&
                !isNaN(Number(r.productId))
            );
        } catch(e) {
            // 파싱 에러 시에만 초기화 (TypeError 방지됨)
            if (!(e instanceof TypeError)) {
                state.isLike = [];
            } else {
                state.isLike = state.isLike || [];
            }
        }
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

        // 0.5 isLike Table Save
        if (shouldSave('isLike')) {
            localStorage.setItem('kimp_is_like_table', JSON.stringify(state.isLike));
        }

        // 2. Reservations
        if (shouldSave('reservations')) {
            localStorage.setItem(getStorageKey('app_reservations_db'), JSON.stringify(state.reservations));
        }

        // 3. History
        if (shouldSave('history')) {
            localStorage.setItem("mypage_history_" + currentUserId, JSON.stringify(state.history));
        }

        // 3.5 Shop History
        if (shouldSave('shop_history')) {
            localStorage.setItem('kimp_shop_history', JSON.stringify(state.shopHistory));
        }
        if (shouldSave('uton_shop_history')) {
            localStorage.setItem('uton_shop_history', JSON.stringify(state.utonShopHistory));
        }
        if (shouldSave('settlements')) {
            localStorage.setItem('kimp_settlement_transactions', JSON.stringify(state.settlementTransactions || []));
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
            let deletedIds = [];
            try {
                deletedIds = JSON.parse(localStorage.getItem("kimp_deleted_order_ids") || "[]");
            } catch(e) {}

            try {
                let storedOrders = localStorage.getItem('kimp_production_orders');
                let parsed = storedOrders ? JSON.parse(storedOrders) : {};
                if (parsed && Array.isArray(parsed)) {
                    parsed.forEach(o => {
                        if (o && o.orderId && !deletedIds.includes(o.orderId)) {
                            currentOrders[o.orderId] = mapOrderToFrontend(o);
                        }
                    });
                } else {
                    for (let k in parsed) {
                        if (!deletedIds.includes(k)) {
                            currentOrders[k] = mapOrderToFrontend(parsed[k]);
                        }
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
                if (deletedIds.includes(key)) {
                    delete state.productionOrders[key];
                    continue;
                }
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
                        const localProgress = state.productionOrders[key].progressStatus || "";
                        const storageProgress = currentOrders[key].progressStatus || "";
                        const localIs32 = localProgress.includes("3-2") || localProgress.includes("무게재기");
                        const storageIs32 = storageProgress.includes("3-2") || storageProgress.includes("무게재기");

                        if (localIs32 && !storageIs32) {
                            isLocalNewer = true;
                        } else if (!localIs32 && storageIs32) {
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

                        // 💡 [수정] 스토리지가 더 신규 상태일 때, 최신 stages 실적 데이터도 로컬 메모리로 완벽 동기화 역수입!
                        if (currentOrders[key].stages) {
                            if (!state.productionOrders[key].stages) state.productionOrders[key].stages = {};
                            for (let stageNum in currentOrders[key].stages) {
                                state.productionOrders[key].stages[stageNum] = {
                                    ...(state.productionOrders[key].stages[stageNum] || {}),
                                    ...(currentOrders[key].stages[stageNum] || {})
                                };
                            }
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
            const tables = getDomainTables();
            // Return copy to prevent direct mutations
            return {
                currentUser: state.currentUser,
                workers: state.workers ? JSON.parse(JSON.stringify(state.workers)) : {},
                userWorkHours: state.userWorkHours ? { ...state.userWorkHours } : {},
                users: tables.users,
                works: tables.works,
                workDetails: tables.workDetails,
                products: tables.products,
                productReviews: tables.productReviews,
                userWorkExperiences: tables.userWorkExperiences,
                reservations: Array.isArray(state.reservations)
                    ? JSON.parse(JSON.stringify(state.reservations.map(normalizeReservation)))
                    : [],
                history: Array.isArray(state.history) ? [...state.history] : [],
                shopHistory: state.shopHistory ? [...state.shopHistory] : [],
                utonShopHistory: state.utonShopHistory ? [...state.utonShopHistory] : [],
                allShopHistory: getAllShopOrders(),
                utonOrderSettings: loadUtonOrderSettings(),
                settlementTransactions: Array.isArray(state.settlementTransactions)
                    ? JSON.parse(JSON.stringify(state.settlementTransactions))
                    : [],
                experienceRemainingSeconds: state.experienceRemainingSeconds,
                productionOrders: state.productionOrders ? { ...state.productionOrders } : {},
                packagingOrders: state.packagingOrders ? { ...state.packagingOrders } : {},
                workersProgress: state.workersProgress ? { ...state.workersProgress } : {},
                remainingSeconds: state.remainingSeconds,
                clockHour: state.clockHour,
                clockMinute: state.clockMinute,
                secondCounter: state.secondCounter,
                tables: tables,
                isLike: Array.isArray(state.isLike) ? [...state.isLike] : [] // ← isLike 누락 버그 수정!
            };
        },
        tableNames: { ...TABLE_NAMES },
        tableSources: { ...TABLE_SOURCES },
        getTables: function() {
            return getDomainTables();
        },
        getTable: function(tableName) {
            const tables = getDomainTables();
            return cloneData(tables[tableName]);
        },
        getUsers: function() {
            return getMockUsers();
        },
        getWorks: function() {
            return getMockWorks();
        },
        getWorkDetails: function() {
            return getMockWorkDetails();
        },
        getProducts: function(filter) {
            const products = getMockProducts();
            if (!filter || typeof filter !== 'object') return products;
            return products.filter(product => {
                if (filter.workId !== undefined && String(product.workId) !== String(filter.workId)) return false;
                if (filter.isDelivery !== undefined && !!product.isDelivery !== !!filter.isDelivery) return false;
                if (filter.brand !== undefined && String(product.brand) !== String(filter.brand)) return false;
                return true;
            });
        },
        getUtonOrderSettings: function() {
            return loadUtonOrderSettings();
        },
        setUtonOrderSettings: function(settings) {
            const normalized = saveUtonOrderSettings(settings);
            if (window.MockData) {
                window.MockData.utonOrderSettings = Object.assign({}, normalized);
                window.MockData.utonFinanceAssumptions = Object.assign(
                    {},
                    window.MockData.utonFinanceAssumptions || {},
                    {
                        maxSalesIntervalMinutes: normalized.intervalMinutes,
                        maxSalesQtyPerMenuPerInterval: normalized.maxQtyPerInterval
                    }
                );
            }
            notifyListeners();
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: UTON_ORDER_SETTINGS_STORAGE_KEY,
                    newValue: JSON.stringify(normalized)
                }));
            } catch (error) {
                try {
                    window.dispatchEvent(new Event('uton-order-settings-changed'));
                } catch (innerError) {}
            }
            return Object.assign({}, normalized);
        },
        getReservations: function(filter) {
            const reservations = (state.reservations || []).map(normalizeReservation);
            if (!filter || typeof filter !== 'object') return cloneData(reservations);
            return cloneData(reservations.filter(reservation => {
                if (filter.userId !== undefined && String(reservation.userId) !== String(filter.userId)) return false;
                if (filter.workId !== undefined && String(reservation.workId) !== String(filter.workId)) return false;
                if (filter.date !== undefined && String(reservation.date) !== String(filter.date)) return false;
                if (filter.status !== undefined && String(reservation.workStatus || reservation.status) !== String(filter.status)) return false;
                return true;
            }));
        },
        getHistories: function(filter) {
            const histories = state.history || [];
            if (!filter || typeof filter !== 'object') return cloneData(histories);
            return cloneData(histories.filter(history => {
                if (filter.userId !== undefined && String(history.userId) !== String(filter.userId)) return false;
                if (filter.workId !== undefined && String(history.workId) !== String(filter.workId)) return false;
                return true;
            }));
        },
        getWorkAttendance: function(workId) {
            const reservations = Array.isArray(state.reservations) ? state.reservations : [];
            const filtered = hasReservationIdentityValue(workId)
                ? reservations.filter(reservation =>
                    reservation && String(reservation.workId) === String(workId)
                )
                : reservations;
            return JSON.parse(JSON.stringify(filtered.map(normalizeReservation)));
        },
        markExpiredReservationsAbsent: function(referenceTime) {
            const now = referenceTime instanceof Date ? referenceTime : new Date(referenceTime || Date.now());
            const fallbackSlots = [
                { slot: 0, endHour: 12, endMin: 0 },
                { slot: 1, endHour: 15, endMin: 0 },
                { slot: 2, endHour: 17, endMin: 0 }
            ];
            let changed = 0;
            (state.reservations || []).forEach(reservation => {
                const current = normalizeReservation(reservation);
                if (!current || current.workStatus !== 'reserved' || current.checkInAt) return;
                const date = String(current.date || '');
                const slot = Number(current.slot);
                const slotData = window.MockData && typeof window.MockData.getWorkTimeSlots === 'function'
                    ? window.MockData.getWorkTimeSlots(current.workId || 1)
                    : null;
                const slots = slotData && Array.isArray(slotData.slots) ? slotData.slots : fallbackSlots;
                const selectedSlot = slots.find(item => String(item.slot) === String(current.slot)) || fallbackSlots[slot];
                const endHour = selectedSlot && Number(selectedSlot.endHour);
                const endMin = selectedSlot && Number(selectedSlot.endMin || 0);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(endHour)) return;
                const endAt = new Date(`${date}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);
                if (Number.isNaN(endAt.getTime()) || endAt > now) return;

                const absenceAt = now.toISOString();
                const historyId = `absent-${current.id || `${current.userId}-${current.workId}-${date}-${slot}`}`;
                this.dispatch({
                    type: 'UPDATE_RESERVATION',
                    payload: {
                        id: current.id,
                        match: {
                            userId: current.userId,
                            workId: current.workId,
                            date: current.date,
                            slot: current.slot
                        },
                        changes: {
                            workStatus: 'absent',
                            absenceAt: absenceAt,
                            checkoutType: '결근',
                            attendanceHistoryId: historyId,
                            lastActivityAt: absenceAt
                        }
                    }
                });
                this.appendReservationLog(current.id, {
                    type: 'absent',
                    status: 'absent',
                    message: '예약 시간까지 출근하지 않아 결근 처리되었습니다.',
                    createdAt: absenceAt
                }, {
                    userId: current.userId,
                    workId: current.workId,
                    date: current.date,
                    slot: current.slot
                });

                const activeUser = state.currentUser || {};
                if (String(activeUser.id) === String(current.userId) || activeUser.name === current.userName) {
                    const exists = (state.history || []).some(item => String(item.id) === String(historyId));
                    if (!exists) {
                        this.dispatch({
                            type: 'ADD_HISTORY_ITEM',
                            payload: {
                                id: historyId,
                                workId: current.workId,
                                job: current.workName || (String(current.workId) === '2' ? '우동만들기' : '김치만들기'),
                                date: current.date,
                                time: '예약 시간 미출근',
                                role: current.role || 'general',
                                pay: 0,
                                checkoutType: '결근',
                                isAbsent: true,
                                workStatus: 'absent',
                                workLogs: current.workLogs || []
                            }
                        });
                    }
                }
                changed += 1;
            });
            return changed;
        },
        appendReservationLog: function(reservationId, logEntry, match) {
            const payload = {
                id: reservationId,
                match: match,
                log: logEntry
            };
            this.dispatch({ type: 'APPEND_RESERVATION_LOG', payload: payload });
            const reservations = state.reservations || [];
            const updated = hasReservationIdentityValue(reservationId)
                ? reservations.find(item => String(item.id) === String(reservationId))
                : reservations.find(item => matchesReservationFallback(item, match));
            return updated ? JSON.parse(JSON.stringify(normalizeReservation(updated).workLogs || [])) : [];
        },
        getShopOrders: function(filter) {
            const criteria = filter && typeof filter === 'object' ? filter : {};
            const matchesValue = function(actual, expected) {
                if (Array.isArray(expected)) {
                    return expected.some(value => String(actual) === String(value));
                }
                return String(actual) === String(expected);
            };

            const orders = getAllShopOrders()
                .map(normalizeShopOrder)
                .filter(order => {
                    if (!order) return false;
                    if (hasReservationIdentityValue(criteria.workId)
                        && !matchesValue(inferShopOrderWorkId(order), criteria.workId)) return false;
                    if (hasReservationIdentityValue(criteria.userId)
                        && !matchesValue(order.userId, criteria.userId)) return false;
                    if (hasReservationIdentityValue(criteria.status)
                        && !matchesValue(order.status, criteria.status)) return false;
                    if (hasReservationIdentityValue(criteria.kitchenStatus)
                        && !matchesValue(order.kitchenStatus, criteria.kitchenStatus)) return false;
                    if (hasReservationIdentityValue(criteria.menuType)
                        && !matchesValue(inferShopOrderMenuType(order), criteria.menuType)) return false;
                    return true;
                });

            return JSON.parse(JSON.stringify(orders));
        },
        getWorkHours: function(userId, workId) {
            function normalizeId(u) {
                if (!u && state.currentUser) u = state.currentUser.id || state.currentUser.name;
                if (!u) {
                    const sUser = sessionStorage.getItem("user");
                    if (sUser) {
                        try {
                            const p = JSON.parse(sUser);
                            u = p.id || p.name;
                        } catch(e) {}
                    }
                }
                if (!u) u = sessionStorage.getItem("user-id") || "2";
                const s = String(u).trim();
                if (s === "1" || s === "2" || s === "3" || s === "4") return s;
                if (s.includes("tt2t2am1118") || s.includes("최현일")) return "1";
                if (s.includes("capegon21") || s.includes("최수아")) return "2";
                if (s.includes("capegon23") || s.includes("김수민")) return "3";
                if (s.includes("younghee") || s.includes("김영희")) return "4";
                return "2"; // 기본 fallback 최수아
            }

            const normUserId = normalizeId(userId);
            const key = `${normUserId}_${workId}`;
            if (state.userWorkHours && state.userWorkHours[key] !== undefined) {
                return state.userWorkHours[key];
            }
            // Fallback for legacy workers object
            if (state.workers && state.workers[normUserId]) {
                if (String(workId) === '1') return state.workers[normUserId].workedHours || 0;
                if (String(workId) === '2') return state.workers[normUserId].udonHours || 0;
                if (String(workId) === '3') return state.workers[normUserId].walletHours || 0;
            }
            return 0;
        },
        setWorkHours: function(userId, workId, hours) {
            function normalizeId(u) {
                if (!u && state.currentUser) u = state.currentUser.id || state.currentUser.name;
                if (!u) u = sessionStorage.getItem("user-id") || "2";
                const s = String(u).trim();
                if (s === "1" || s === "2" || s === "3" || s === "4") return s;
                if (s.includes("tt2t2am1118") || s.includes("최현일")) return "1";
                if (s.includes("capegon21") || s.includes("최수아")) return "2";
                if (s.includes("capegon23") || s.includes("김수민")) return "3";
                if (s.includes("younghee") || s.includes("김영희")) return "4";
                return "2";
            }

            const normUserId = normalizeId(userId);
            const numHours = parseInt(hours) || 0;
            const key = `${normUserId}_${workId}`;
            state.userWorkHours[key] = numHours;
            if (state.workers[normUserId]) {
                if (String(workId) === '1') state.workers[normUserId].workedHours = numHours;
                if (String(workId) === '2') state.workers[normUserId].udonHours = numHours;
                if (String(workId) === '3') state.workers[normUserId].walletHours = numHours;
            }
            saveToStorage(['userWorkHours', 'workers']);
            notifyListeners();
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
                case 'SET_WORK_HOURS': {
                    const uId = action.payload.userId || currentUserId;
                    const wId = action.payload.workId;
                    const val = parseInt(action.payload.hours !== undefined ? action.payload.hours : action.payload.value) || 0;
                    if (wId !== undefined) {
                        state.userWorkHours[`${uId}_${wId}`] = val;
                        if (state.workers[uId]) {
                            if (String(wId) === '1') state.workers[uId].workedHours = val;
                            if (String(wId) === '2') state.workers[uId].udonHours = val;
                            if (String(wId) === '3') state.workers[uId].walletHours = val;
                        }
                    }
                    break;
                }
                case 'SET_WORKED_HOURS': {
                    const uId = action.payload.userId || currentUserId;
                    const val = action.payload.value !== undefined ? action.payload.value : action.payload;
                    if (state.workers[uId]) state.workers[uId].workedHours = parseInt(val);
                    state.userWorkHours[`${uId}_1`] = parseInt(val);
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
                case 'ADD_RESERVATION': {
                    const incoming = normalizeReservation(action.payload);
                    state.reservations = dedupeReservations((state.reservations || []).concat(incoming));
                    break;
                }
                case 'SET_RESERVATIONS':
                    state.reservations = dedupeReservations(action.payload);
                    break;
                case 'UPDATE_RESERVATION': {
                    const payload = action.payload || {};
                    const hasId = hasReservationIdentityValue(payload.id);
                    let reservationIndex = -1;

                    if (hasId) {
                        reservationIndex = state.reservations.findIndex(reservation =>
                            reservation && hasReservationIdentityValue(reservation.id) &&
                            String(reservation.id) === String(payload.id)
                        );
                    } else if (payload.match) {
                        reservationIndex = state.reservations.findIndex(reservation =>
                            matchesReservationFallback(reservation, payload.match)
                        );
                    }

                    if (reservationIndex < 0) {
                        console.warn('갱신할 예약을 찾지 못했습니다.', payload);
                        return;
                    }

                    const currentReservation = normalizeReservation(state.reservations[reservationIndex]);
                    const changes = payload.changes && typeof payload.changes === 'object'
                        ? payload.changes
                        : {};
                    const updatedReservation = normalizeReservation({
                        ...currentReservation,
                        ...changes,
                        checkInSteps: {
                            ...currentReservation.checkInSteps,
                            ...(changes.checkInSteps && typeof changes.checkInSteps === 'object'
                                ? changes.checkInSteps
                                : {})
                        }
                    });

                    state.reservations[reservationIndex] = updatedReservation;
                    syncSelectedReservation(updatedReservation);
                    break;
                }
                case 'APPEND_RESERVATION_LOG': {
                    const payload = action.payload || {};
                    const hasId = hasReservationIdentityValue(payload.id);
                    const reservationIndex = hasId
                        ? state.reservations.findIndex(reservation =>
                            reservation && hasReservationIdentityValue(reservation.id) &&
                            String(reservation.id) === String(payload.id))
                        : state.reservations.findIndex(reservation =>
                            matchesReservationFallback(reservation, payload.match));
                    if (reservationIndex < 0) {
                        console.warn('예약 로그를 추가할 예약을 찾지 못했습니다.', payload);
                        return;
                    }
                    const reservation = normalizeReservation(state.reservations[reservationIndex]);
                    const source = payload.log && typeof payload.log === 'object'
                        ? payload.log
                        : { type: 'note', message: String(payload.log || '') };
                    const entry = {
                        id: source.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        type: source.type || 'note',
                        status: source.status || reservation.workStatus || 'working',
                        message: source.message || '',
                        createdAt: source.createdAt || new Date().toISOString(),
                        ...source
                    };
                    reservation.workLogs = Array.isArray(reservation.workLogs)
                        ? reservation.workLogs.concat(entry)
                        : [entry];
                    reservation.lastActivityAt = entry.createdAt;
                    state.reservations[reservationIndex] = normalizeReservation(reservation);
                    syncSelectedReservation(state.reservations[reservationIndex]);
                    break;
                }
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
                case 'ADD_SHOP_ORDER': {
                    const order = normalizeShopOrder(action.payload);
                    const targetHistory = isUtonShopOrder(order)
                        ? state.utonShopHistory
                        : state.shopHistory;
                    targetHistory.unshift(order);
                    // 💡 주문 접수 시점에 정산금액 차감
                    ensureShopSettlementForOrder(order);
                    break;
                }
                case 'UPDATE_SHOP_ORDER': {
                    const payload = action.payload || {};
                    const orderId = payload.id;
                    const target = findShopOrderCollection(orderId);
                    if (target) {
                        target.collection[target.index] = normalizeShopOrder({
                            ...target.collection[target.index],
                            ...(payload.changes || {}),
                            updatedAt: (payload.changes && payload.changes.updatedAt) || new Date().toISOString()
                        });
                    }
                    break;
                }
                case 'CANCEL_SHOP_ORDER': {
                    const orderId = action.payload;
                    const found = findShopOrderCollection(orderId);
                    const target = found ? found.collection[found.index] : null;
                    if (target) {
                        target.status = 'cancelled';
                        target.kitchenStatus = 'cancelled';
                        target.cancelledAt = target.cancelledAt || new Date().toISOString();
                        target.shouldShowSpendAmount = false;
                        target.paymentDisplayLabel = '주문취소됨';
                        // 💡 주문 취소 시 차감했던 정산금액을 복구
                        removeShopSettlementForOrder(target);
                    }
                    break;
                }
                case 'COMPLETE_SHOP_ORDER': {
                    const orderId = action.payload;
                    const found = findShopOrderCollection(orderId);
                    const target = found ? found.collection[found.index] : null;
                    if (target) {
                        target.status = 'completed';
                        target.kitchenStatus = 'received';
                        target.completedAt = target.completedAt || new Date().toISOString();
                        // 주문 접수 시 이미 차감되었으므로 누락된 경우에만 보정
                        ensureShopSettlementForOrder(target);
                    }
                    break;
                }
                case 'SET_SHOP_HISTORY': {
                    const incomingOrders = Array.isArray(action.payload)
                        ? action.payload.map(normalizeShopOrder)
                        : [];
                    const incomingUtonOrders = incomingOrders.filter(isUtonShopOrder);
                    state.shopHistory = dedupeShopOrders(incomingOrders.filter(order => !isUtonShopOrder(order)));
                    state.utonShopHistory = dedupeShopOrders((state.utonShopHistory || []).concat(incomingUtonOrders));
                    break;
                }
                case 'SET_UTON_SHOP_HISTORY':
                    state.utonShopHistory = dedupeShopOrders(action.payload);
                    break;
                case 'TOGGLE_PRODUCT_LIKE': {
                    const { userId, productId } = action.payload;
                    
                    if (!state.isLike) {
                        state.isLike = [];
                    }
                    
                    const targetUserId = String(userId);
                    const targetProductId = Number(productId);
                    
                    const existingIndex = state.isLike.findIndex(r => String(r.userId) === targetUserId && Number(r.productId) === targetProductId);
                    if (existingIndex > -1) {
                        // 존재 시 제거 (토글 오프)
                        state.isLike.splice(existingIndex, 1);
                    } else {
                        // 미존재 시 삽입 (토글 온)
                        const maxId = state.isLike.reduce((max, r) => r.id > max ? r.id : max, 10000);
                        
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const date = String(now.getDate()).padStart(2, '0');
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        const seconds = String(now.getSeconds()).padStart(2, '0');
                        const dateStr = `${year}.${month}.${date} ${hours}:${minutes}:${seconds}`; // YYYY.MM.DD HH:mm:ss
                        
                        state.isLike.push({
                            id: maxId + 1, // 5자리 자동증가 PK
                            userId: targetUserId,
                            productId: targetProductId,
                            likedAt: dateStr
                        });
                    }
                    break;
                }
                case 'SYNC_FROM_STORAGE':
                    loadFromStorage();
                    break;
                case 'RESET_ALL_DATA':
                    state.reservations = [];
                    state.productionOrders = {};
                    state.packagingOrders = {};
                    state.workersProgress = {};
                    state.shopHistory = [];
                    state.utonShopHistory = [];
                    state.settlementTransactions = [];
                    state.isLike = [];
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
                        case 'ADD_SHOP_ORDER':
                        case 'UPDATE_SHOP_ORDER':
                        case 'CANCEL_SHOP_ORDER':
                        case 'COMPLETE_SHOP_ORDER':
                        case 'SET_SHOP_HISTORY':
                        case 'SET_UTON_SHOP_HISTORY':
                            keysToSave = ['shop_history', 'uton_shop_history', 'settlements'];
                            break;
                        case 'TOGGLE_PRODUCT_LIKE':
                            keysToSave = ['workers', 'isLike'];
                            break;
                        case 'SET_WORKED_HOURS':
                        case 'SET_UDON_HOURS':
                        case 'SET_WALLET_HOURS':
                        case 'INCREMENT_WORKED_HOURS':
                        case 'UPDATE_WORKER_STATE':
                            keysToSave = ['workers'];
                            break;
                        case 'ADD_RESERVATION':
                        case 'SET_RESERVATIONS':
                        case 'UPDATE_RESERVATION':
                        case 'APPEND_RESERVATION_LOG':
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_help_request' || key === 'uton_shop_history' || key === 'kimp_settlement_transactions') {
                return localStorage.getItem(key);
            }
            return localStorage.getItem(key + "_" + userId);
        }
        const state = window.FactoryStore.getState();
        const currentUserId = state.currentUser ? state.currentUser.id : "guest";
        const worker = state.workers[currentUserId] || {};

        if (key === 'kimp_shop_history') {
            return JSON.stringify(state.shopHistory);
        }
        if (key === 'uton_shop_history') {
            return JSON.stringify(state.utonShopHistory);
        }
        if (key === 'kimp_settlement_transactions') {
            return JSON.stringify(state.settlementTransactions || []);
        }
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request' || key === 'uton_shop_history' || key === 'kimp_settlement_transactions') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key + "_" + userId, value);
            }
            window.dispatchEvent(new Event('storage'));
            return;
        }
        if (key === 'kimp_shop_history') {
            window.FactoryStore.dispatch({ type: 'SET_SHOP_HISTORY', payload: JSON.parse(value) });
            return;
        }
        if (key === 'uton_shop_history') {
            window.FactoryStore.dispatch({ type: 'SET_UTON_SHOP_HISTORY', payload: JSON.parse(value) });
            return;
        }
        if (key === 'kimp_settlement_transactions') {
            state.settlementTransactions = JSON.parse(value);
            saveToStorage(['settlements']);
            notifyListeners();
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
            if (key === 'app_reservations_db' || key === 'kimp_production_orders' || key === 'kimp_packaging_orders' || key === 'kimp_help_request' || key === 'uton_shop_history' || key === 'kimp_settlement_transactions') {
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
        if (key === 'kimp_shop_history') {
            window.FactoryStore.dispatch({ type: 'SET_SHOP_HISTORY', payload: [] });
            return;
        }
        if (key === 'uton_shop_history') {
            window.FactoryStore.dispatch({ type: 'SET_UTON_SHOP_HISTORY', payload: [] });
            return;
        }
        if (key === 'kimp_settlement_transactions') {
            state.settlementTransactions = [];
            saveToStorage(['settlements']);
            notifyListeners();
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
        if (key === 'app_reservations_db' || key === 'uton_shop_history' || key === 'kimp_settlement_transactions' || key.startsWith('kimp_') || key.includes('mypage_') || key === 'kimp_worker_profile' || key.includes('hours_udon') || key.includes('hours_wallet')) {
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
            "salary": 1.3, "salaryChange": 0.01, "taskCount": 6, "participants": 123, "createdAt": "2024-08-01",
            "region": "서울시 성동구 성수동", "categories": ["음식", "요리", "김치", "만들기"],
            "isNew": false,
            "fulfillmentType": "delivery",
            "thumbnailMode": "product",
            "exp": "kimp",
            "managerLink": "manager.html"
        },
        {
            "workId": 2, "workName": "우동만들기", "brandName": "Uton", "iconUrl": "./images/Uton_150x150.png",
            "salary": 1.1, "salaryChange": -0.05, "taskCount": 2, "participants": 70, "createdAt": "2025-03-19",
            "region": "서울시 강남구 역삼동", "categories": ["음식", "요리", "우동", "만들기"],
            "isNew": false,
            "fulfillmentType": "dine_in",
            "thumbnailMode": "product",
            "exp": "uton",
            "managerLink": "umanager.html"
        },
        {
            "workId": 3, "workName": "지갑만들기", "brandName": "Persa", "iconUrl": "./images/fancy_150x150.png",
            "salary": 1.2, "salaryChange": 0.02, "taskCount": 5, "participants": 30, "createdAt": "2026-05-09",
            "region": "서울시 마포구 합정동", "categories": ["악세사리", "지갑", "만들기"],
            "isNew": false,
            "exp": null
        },
        {
            "workId": 6, "workName": "불고기구이", "brandName": "K-Meat", "iconUrl": "./images/beef_500.png",
            "salary": 1.5, "salaryChange": -0.02, "taskCount": 6, "participants": 80, "createdAt": "2026-06-20",
            "region": "서울시 종로구 연남동", "categories": ["음식", "요리", "불고기", "고기", "구이"],
            "isNew": true,
            "fulfillmentType": "dine_in",
            "thumbnailMode": "work_icon",
            "exp": "kmeat",
            "managerLink": "kmanager.html",
            "workerLink": "kmeat-real.html"
        },
        {
            "workId": 7, "workName": "버거만들기", "brandName": "BurgerQueen", "iconUrl": "./images/burger_500.png",
            "salary": 1.25, "salaryChange": 0.01, "taskCount": 4, "participants": 55, "createdAt": "2026-06-25",
            "region": "서울시 용산구 이태원", "categories": ["음식", "요리", "버거", "만들기", "패스트푸드"],
            "isNew": true,
            "exp": "burger",
            "managerLink": "bmanager.html",
            "workerLink": "burger-real.html"
        }
    ]`,
    // 2. 신규 추가: 통합된 사용자(Users) 데이터
    users: [
        {
            id: 1,
            name: "최현일",
            email: "tt2t2am1118@naver.com",
            baseAssets: 100000,
            settlementBalance: 100000,
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
            baseAssets: 100000,
            settlementBalance: 100000,
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
            baseAssets: 100000,
            settlementBalance: 100000,
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
            baseAssets: 100000,
            settlementBalance: 100000,
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
    userWorkProgress: [
        // workId 1 (김치만들기) 매핑
        { userId: 1, workId: 1, isExp: true, expCompletedAt: "2024-08-01" }, // 최현일 (완료)
        { userId: 2, workId: 1, isExp: true, expCompletedAt: "2024-08-05" }, // 최수아 (완료)
        { userId: 3, workId: 1, isExp: false, expCompletedAt: null },        // 김수민 (미완료 - 요청사항 반영)
        { userId: 4, workId: 1, isExp: true, expCompletedAt: "2024-08-10" }, // 김영희 (완료)

        // 향후 확장을 위한 데이터 예시 (우동만들기 등)
        { userId: 2, workId: 2, isExp: false, expCompletedAt: null }         // 최수아 - 우동만들기(미완료)
    ],

    // 2. 예약(Reservations) 목업 데이터 생성기
    getReservations: function(todayStr, tomorrowStr, nextDayStr) {
        var attendanceDefaults = {
            userGender: null,
            checkInAt: null,
            lockerGender: null,
            lockerNumber: null,
            preWorkStatus: 'not_started',
            checkInSteps: {
                qr: false,
                lockerRoom: false,
                lockerNumber: false,
                clothes: false,
                uniform: false,
                handWash: false,
                sanitizer: false,
                handPhoto: false,
                shopEntry: false
            },
            handWashSkipped: false,
            handPhotoStatus: 'not_submitted',
            handPhotoCapturedAt: null,
            handPhotoVerifiedAt: null,
            handPhotoVerificationMode: null,
            workStatus: 'reserved',
            workStartedAt: null,
            workCompletedAt: null,
            absenceAt: null,
            earlyLeaveRequestedAt: null,
            earlyLeaveAutoAt: null,
            earlyLeaveCompletedAt: null,
            checkoutType: null,
            breakSeconds: 0,
            actualWorkSeconds: 0,
            earnedPay: 0,
            attendanceHistoryId: null,
            workLogs: [],
            currentTaskType: null,
            currentTaskStep: null,
            currentTaskName: null,
            completedOrdersCount: 0,
            lastActivityAt: null
        };

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
        ].map(function(reservation) {
            return Object.assign({}, attendanceDefaults, reservation, {
                checkInSteps: Object.assign({}, attendanceDefaults.checkInSteps),
                workLogs: []
            });
        });
    },

    // 3. 각 작업(Work)별 세부(Detail) 목업 데이터
    workDetailJSON: `{
        "1": {
            "title": "김치만들기",
            "expPage": "kimp_ex0.html",
            "realPage": "kimp_ex1.html",
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
                { "step": "1", "desc": "배추 1/2 컷팅 & 적재하기" },
                { "step": "2", "desc": "배추 절이기" },
                { "step": "3", "desc": "배추 세척하기 & 물기 빼기" },
                { "step": "4", "desc": "배추 밀봉 & 냉장고 보관" },
                { "step": "5-1", "desc": "양념 만들기" },
                { "step": "5-2", "desc": "양념 바르기" },
                { "step": "6", "desc": "포장하기" }
            ]
        },
        "2": {
            "title": "우동만들기",
            "expPage": "uton.html",
            "iconUrl": "./images/Uton_150x150.png",
            "value": 1.1,
            "change": "-0.05%",
            "categories": ["음식", "요리", "우동", "만들기"],
            "workTime": "1시간 30분 작업",
            "productSlogan": "갓 뽑은 쫄깃한 우동 면발과 특제 육수. 🍜",
            "products": [
                { "id": "udon_01", "name": "수제 쫄깃 우동면 2인분", "brand": "Uton", "imgUrl": "./images/udon_noodle.png", "price": "4,500원", "status": "120 남음" },
                { "id": "udon_02", "name": "정통 가쓰오 우동", "brand": "Uton", "imgUrl": "./images/udon_soup.png", "price": "3,000원", "status": "생산 중" },
                { "id": "udon_03", "name": "감칠맛 간장비빔면", "brand": "Uton", "imgUrl": "./images/udon_kit.png", "price": "3,000원", "status": "생산 중" }
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
                { "step": 1, "desc": "가쓰오 우동 - 육수 가열" },
                { "step": 2, "desc": "가쓰오 우동 - 면 삶기 & 고명 준비" },
                { "step": 3, "desc": "간장 비빔면 - 소면 계량 & 삶기" },
                { "step": 4, "desc": "간장 비빔면 - 양념 비비기 & 담기" }
            ],
            "workflowGroups": [
                {
                    "menuId": "p1",
                    "name": "가쓰오 우동 만들기",
                    "icon": "🍜",
                    "color": "#2563eb",
                    "note": "따뜻한 국물 요리. 육수를 먼저 올려야 합니다.",
                    "steps": [
                        { "step": 1, "desc": "멸치·다시마 가쓰오 육수 500ml 강불 가열" },
                        { "step": 2, "desc": "끓는 물에 우동면 투입 후 타이머 조리" },
                        { "step": 3, "desc": "고명 준비 (어묵·대파·튀김가루·김가루)" },
                        { "step": 4, "desc": "그릇에 담고 육수 부어 고명 올려 완성" }
                    ]
                },
                {
                    "menuId": "p2",
                    "name": "간장 비빔면 만들기",
                    "icon": "🥢",
                    "color": "#f59e0b",
                    "note": "차가운 비빔 요리. 육수 가열 단계가 없습니다.",
                    "steps": [
                        { "step": 1, "desc": "소면 1인분 100g 계량 (묶음 지름 약 2cm)" },
                        { "step": 2, "desc": "끓는 물에 삶고 찬물에 헹궈 물기 완전히 짜기" },
                        { "step": 3, "desc": "간장·설탕·참기름 양념에 비비기 (비닐장갑 착용)" },
                        { "step": 4, "desc": "완성 접시에 정갈하게 담아 배식 준비" }
                    ]
                }
            ]
        },
        "3": {
            "title": "지갑만들기",
            "expPage": null,
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
            "expPage": "kmeat-ex.html",
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
                { "step": 1, "desc": "고기 소분하기 (저울 계량 · 생고기 제공)" },
                { "step": 2, "desc": "반찬 5종 · 쌈채소(상추·깻잎) 덜기" },
                { "step": 3, "desc": "사이드 메뉴 - 찌개류 (된장·김치찌개)" },
                { "step": 4, "desc": "사이드 메뉴 - 냉면류 (물냉면·비빔냉면)" },
                { "step": 5, "desc": "사이드 메뉴 - 계란찜" },
                { "step": 6, "desc": "테이블 서빙 및 설겆이" }
            ],
            "workflowGroups": [
                {
                    "name": "고기 소분하기",
                    "icon": "🥩",
                    "color": "#e0362c",
                    "note": "굽지 않고 생고기로 제공합니다. 손님이 테이블 불판에서 직접 굽습니다.",
                    "steps": [
                        { "step": 1, "desc": "냉장 숙성고에서 반출, 저울 트레이 영점(Tare) 조절" },
                        { "step": 2, "desc": "삼겹살·목살 180g / 항정살·갈매기살 150g 계량 (±5%)" },
                        { "step": 3, "desc": "돼지갈비는 양념 국물 걸러내고 250g 계량" },
                        { "step": 4, "desc": "핏물 제거 후 접시에 담아 1차로 즉시 서빙" }
                    ]
                },
                {
                    "name": "반찬 · 쌈채소 준비",
                    "icon": "🥬",
                    "color": "#10b981",
                    "note": "생고기와 함께 1차로 나갑니다.",
                    "steps": [
                        { "step": 1, "desc": "반찬 5종 세팅 (배추김치·무생채·콩나물·마늘고추·쌈장)" },
                        { "step": 2, "desc": "상추 1인분 70g(약 10장) 계량, 2회 세척 후 물기 제거" },
                        { "step": 3, "desc": "깻잎 1인분 20g(약 8장) 계량, 줄기 제거" },
                        { "step": 4, "desc": "쌈장 종지 1인 1개, 불판·집게·가위 세팅 확인" }
                    ]
                },
                {
                    "name": "사이드 메뉴 - 찌개류",
                    "icon": "🍲",
                    "color": "#f59e0b",
                    "note": "3차 마무리 식사. 손님 식사 진행률 70% 시점에 맞춰 늦게 착수합니다.",
                    "steps": [
                        { "step": 1, "desc": "된장찌개 - 육수 300ml에 된장 30g 풀고 두부·애호박 투입" },
                        { "step": 2, "desc": "김치찌개 - 숙성 김치 150g 먼저 볶아 감칠맛 올리기" },
                        { "step": 3, "desc": "중강불로 6~7분 끓이기" },
                        { "step": 4, "desc": "대파·청양고추 올려 뚝배기째 서빙" }
                    ]
                },
                {
                    "name": "사이드 메뉴 - 냉면류",
                    "icon": "🧊",
                    "color": "#0891b2",
                    "note": "3차 마무리 식사. 면 삶기 90초를 넘기지 않습니다.",
                    "steps": [
                        { "step": 1, "desc": "냉면 육수 350ml를 살얼음 상태(-1℃)로 준비" },
                        { "step": 2, "desc": "면 100g을 끓는 물에 90초 삶기" },
                        { "step": 3, "desc": "얼음물에 3회 헹궈 전분 제거, 물기 완전히 털기" },
                        { "step": 4, "desc": "물냉면은 육수 붓고, 비빔냉면은 비빔장 50g에 버무려 완성" }
                    ]
                },
                {
                    "name": "사이드 메뉴 - 계란찜",
                    "icon": "🍳",
                    "color": "#eab308",
                    "note": "2차 곁들이. 손님이 굽기 시작한 직후 나갑니다.",
                    "steps": [
                        { "step": 1, "desc": "계란 3개 + 육수 150ml 풀어 체에 걸러 기포 제거" },
                        { "step": 2, "desc": "뚝배기에 담아 약불 5분, 뚜껑 덮어 폭신하게" },
                        { "step": 3, "desc": "대파·통깨 올려 서빙" }
                    ]
                },
                {
                    "name": "서빙 및 설겆이",
                    "icon": "🍽️",
                    "color": "#7c3aed",
                    "note": "테이블 번호를 반드시 확인하고 차수 순서대로 내보냅니다.",
                    "steps": [
                        { "step": 1, "desc": "1차(생고기+반찬) → 2차(계란찜) → 3차(찌개·냉면·밥) 순서 서빙" },
                        { "step": 2, "desc": "지정된 테이블 번호 확인 후 배식" },
                        { "step": 3, "desc": "식사 종료 후 불판 기름 긁어내고 그릇 세척" }
                    ]
                }
            ]
        },
        "7": {
            "title": "버거만들기",
            "expPage": "burger-ex.html",
            "iconUrl": "./images/burger_500.png",
            "value": 1.25,
            "change": "+0.01%",
            "categories": ["음식", "요리", "버거", "만들기", "패스트푸드"],
            "workTime": "2시간 30분 작업",
            "productSlogan": "신선한 재료로 바로 만든 수제 버거. 🍔",
            "products": [
                { "id": "burger_set_cheese", "name": "치즈버거 세트", "brand": "BurgerQueen", "imgUrl": "./images/burger_set_cheese.png", "price": "4,000원", "status": "판매 중" },
                { "id": "burger_set_bulgogi", "name": "불고기버거 세트", "brand": "BurgerQueen", "imgUrl": "./images/burger_set_bulgogi.png", "price": "4,000원", "status": "판매 중" },
                { "id": "burger_set_hamburger", "name": "햄버거 세트", "brand": "BurgerQueen", "imgUrl": "./images/burger_set_hamburger.png", "price": "3,000원", "status": "판매 중" },
                { "id": "burger_set_shrimp", "name": "새우버거 세트", "brand": "BurgerQueen", "imgUrl": "./images/burger_set_shrimp.png", "price": "4,000원", "status": "판매 중" }
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
            img: "./images/kimchi_300g.png",
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
            img: "./images/kimchi_1kg.png",
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
                { name: "임*현", score: 5, date: "2026.06.15", body: "가족들이 너무 잘 먹네요. 배송도 정말 빠르고 김치가 너무 깔끔해요." },
                { name: "조*희", score: 5, date: "2026.06.13", body: "1kg이 양이 딱 적당해요. 2인 가족이 일주일 먹기 좋은 양입니다. 맛도 전라도식 깊은 맛이 나서 밥 한 그릇 뚝딱이에요." },
                { name: "한*수", score: 5, date: "2026.06.10", body: "포기김치 통째로 들어있어서 썰어먹는 재미가 있어요. 배추 아삭함이 살아있고 양념이 골고루 배어있습니다." },
                { name: "정*아", score: 4, date: "2026.06.08", body: "전반적으로 만족합니다. 약간 짜다는 분들도 계시는데 저는 딱 좋았어요. 삼겹살에 싸먹으니 환상적인 맛!" },
                { name: "이*재", score: 5, date: "2026.06.05", body: "세 번째 주문입니다. 다른 김치 먹다가 여기로 돌아오게 되네요. 액젓 배합이 정말 맛깔납니다. 강력 추천!" }
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
            img: "./images/kimchi_3kg.png",
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
                { name: "강*진", score: 5, date: "2026.06.12", body: "양도 푸짐하고 국물 맛이 일품입니다. 익은 후 찌개 끓여먹었는데 예술이네요." },
                { name: "유*정", score: 5, date: "2026.06.10", body: "3kg 대용량인데 양념이 균일하게 잘 배어있어요. 보통 대용량이면 겉만 맛있고 속은 밍밍한데 여기는 다릅니다." },
                { name: "김*솔", score: 4, date: "2026.06.07", body: "김장철 아닐 때 김치 넉넉하게 먹으려면 이 제품이 딱이에요. 냉장고에 보관하면 한 달은 거뜬합니다." },
                { name: "박*수", score: 5, date: "2026.06.04", body: "김치찌개, 김치전, 김치볶음밥 다 해먹었는데 요리용으로도 최고입니다. 국물 양도 넉넉해서 찌개 끓일 때 따로 육수 안 넣어도 돼요." },
                { name: "서*연", score: 4, date: "2026.06.01", body: "부모님 보내드렸더니 맛있다고 또 시켜달라고 하세요. 전통 손맛 느낌이 나서 어르신들도 좋아하시네요." }
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
            img: "./images/kimchi_1kg.png",
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
                { name: "송*아", score: 5, date: "2026.06.08", body: "이 김치만 시켜 먹어요. 원재료가 다 국산이라 믿고 안심하고 먹을 수 있습니다." },
                { name: "오*석", score: 5, date: "2026.06.06", body: "5kg인데 개별 밀봉 포장이 되어 있어서 소분 안 해도 돼요. 한 봉지씩 꺼내 먹으면 늘 신선합니다." },
                { name: "노*미", score: 4, date: "2026.06.03", body: "대가족이라 5kg도 금방 먹어요. 아이들도 잘 먹는 순한 맛이면서 감칠맛이 깊어서 온 가족 입맛에 딱 맞습니다." },
                { name: "윤*호", score: 5, date: "2026.05.30", body: "양념이 아낌없이 들어가서 오래 두고 먹어도 맛이 변하지 않아요. 익은 김치로 만두소 만들었는데 대박이었습니다." },
                { name: "배*진", score: 5, date: "2026.05.27", body: "가격 대비 양이 정말 넉넉합니다. 5kg이 이 가격이면 마트보다 훨씬 저렴해요. 맛도 좋고 가성비 최고!" }
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
            img: "./images/kimchi_3kg.png",
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
                { name: "김*식", score: 4, date: "2026.06.01", body: "식당 밑반찬용으로 늘 주문합니다. 손님들이 김치 맛있다고 칭찬하네요. 추천합니다." },
                { name: "이*택", score: 5, date: "2026.05.28", body: "분식집 운영 중인데 10kg 벌크 주문하면 단가가 확실히 절약됩니다. 품질도 균일해서 안심이에요." },
                { name: "장*미", score: 4, date: "2026.05.25", body: "급식 납품용으로 쓰고 있습니다. 위생 인증도 확실하고 아이들이 잘 먹어서 학부모 만족도도 높아요." },
                { name: "홍*우", score: 4, date: "2026.05.20", body: "대용량이라 배송 걱정했는데 아이스박스에 꼼꼼하게 포장되어 왔습니다. 맛은 언제나 한결같아요." },
                { name: "민*영", score: 5, date: "2026.05.15", body: "구내식당에서 매달 정기 주문 중입니다. 직원들 반응이 좋고 잔반율도 낮아져서 계속 이용할 예정이에요." }
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
                { name: "유*민", score: 5, date: "2026.07.01", body: "아이들이 너무 맛있게 잘 먹어요. 짜지 않고 적당히 달달해서 밥반찬으로 최적입니다." },
                { name: "박*영", score: 5, date: "2026.06.28", body: "상추에 싸서 먹으니 미친 맛이에요! 양념이 별도로 단짠 밸런스가 나서 손님 대접용으로도 손색이 없습니다." },
                { name: "이*진", score: 4, date: "2026.06.25", body: "500g 양이 적당해서 2인 가족이 딩굴하게 먹기 좋아요. 다음에는 2개 주문해서 불고기전에 도전해볼 예정입니다." },
                { name: "정*희", score: 5, date: "2026.06.22", body: "진공 포장이 완벽해서 냉장고에 2주 두었다가 구워먹었는데도 신선했어요. 콜드체인 배송 답게 품질 유지가 되네요." }
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
                { name: "임*서", score: 4, date: "2026.07.02", body: "포장이 단단해서 흐트러짐 없이 배송되었습니다. 쌈채소가 아주 신선하고 불고기와 꿀맛 케미예요." },
                { name: "김*현", score: 5, date: "2026.06.29", body: "회사 동료들에게도 추천했어요. 도시락치고는 양이 풀이라 남자들도 배부르게 먹을 수 있습니다." },
                { name: "오*지", score: 5, date: "2026.06.26", body: "계란말이랑 볶음김치 반찬까지 다 수제로 만든 것 같아요. 편의점 도시락이랑 차원이 다릅니다. 강추!" },
                { name: "송*호", score: 4, date: "2026.06.23", body: "하나 아쉬운 점이 있다면 밥이 좀더 많으면 더 좋겠어요. 그래도 고기 품질은 정말 대만족입니다." }
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
                { name: "최*현", score: 5, date: "2026.07.05", body: "캠핑장에 가져가서 온 가족이 푸짐하게 먹었습니다. 야채가 손질되어 있어 손 갈 것도 없고 간도 딱 맞아요." },
                { name: "김*정", score: 5, date: "2026.07.03", body: "1.5kg이라 4인 가족이 배부르게 먹을 수 있어요. 당면까지 들어있어서 불고기전골로 만들어 먹었는데 대박!" },
                { name: "박*희", score: 4, date: "2026.06.30", body: "야채와 고기가 개별 포장되어 있어 위생적입니다. 치즈 추가해서 불고기치즈전도 만들어 먹었어요." },
                { name: "이*미", score: 5, date: "2026.06.27", body: "요리 초보인데도 설명서대로 볶기만 하면 돼서 너무 편해요. 맛도 전문점 맛이라 가족들 눈이 휘둥그레졌습니다." },
                { name: "윤*진", score: 5, date: "2026.06.24", body: "주말 저녁 메뉴로 딱이에요. 손님 대접할 때도 충분히 리즈너블한 구성이라 만족스럽습니다." }
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
                { name: "김*주", score: 5, date: "2026.07.02", body: "라면 끓이듯이 가볍게 삶았는데 면발 탱글함이 사 먹는 수제 우동집 뺨치게 쫄깃해요. 냉우동으로 먹어도 최고입니다." },
                { name: "이*준", score: 5, date: "2026.06.30", body: "생면이라 삶는 시간이 짧아서 좋아요. 3분이면 완성! 면 자체에서 밀가루 고소한 향이 나서 소스 없이도 맛있습니다." },
                { name: "장*수", score: 4, date: "2026.06.27", body: "2인분이 양이 적당해요. 야식으로 끓여 먹었는데 부담 없이 딱 좋은 양입니다. 다시마 육수랑 궁합이 최고예요." },
                { name: "최*라", score: 5, date: "2026.06.24", body: "여름에 얼음 동동 띄워서 냉우동으로 만들어 먹었는데 면이 안 불어서 끝까지 탱탱합니다. 진짜 맛집 수준이에요." },
                { name: "한*비", score: 5, date: "2026.06.20", body: "우동면 여기저기 시켜봤는데 이 제품이 면발 퀄리티가 가장 좋습니다. 재주문 확정이에요!" }
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
                { name: "임*우", score: 5, date: "2026.07.01", body: "국물 간이 너무 세지 않고 훈연 향이 입안에 은은하게 돕니다. 오뎅탕 끓이거나 국수 장국 베이스로 쓰기 만능이네요." },
                { name: "서*영", score: 5, date: "2026.06.28", body: "가쓰오 풍미가 정말 진하고 깔끔해요. 편의점 우동 육수랑은 차원이 다릅니다. 감동적인 국물 맛!" },
                { name: "정*수", score: 4, date: "2026.06.25", body: "1리터 넉넉해서 우동 4인분까지 만들 수 있어요. 농축 타입이 아니라 그대로 데워 쓰면 되니 편합니다." },
                { name: "박*솔", score: 5, date: "2026.06.22", body: "떡볶이 육수로도 써봤는데 감칠맛이 배로 올라가네요. 만능 육수입니다. 꾸준히 주문할 예정이에요." },
                { name: "윤*하", score: 5, date: "2026.06.18", body: "방부제 없다고 해서 걱정했는데 유통기한 내내 맑고 투명한 국물 상태가 유지됩니다. 안심이에요." }
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
                { name: "신*민", score: 5, date: "2026.07.07", body: "어묵이랑 텐카스까지 정통 일식집 비주얼로 가득 들어있어 주말 야식으로 가족들과 배부르고 기분 좋게 끓여 먹었네요." },
                { name: "강*아", score: 5, date: "2026.07.04", body: "4인분 구성이 정말 알차요. 쑥갓까지 들어있어서 비주얼이 끝내줍니다. 집에서 우동 맛집 느낌 낼 수 있어요." },
                { name: "배*진", score: 5, date: "2026.07.01", body: "캠핑가서 버너에 올려놓고 끓여먹었는데 5분이면 완성! 야외에서 따뜻한 우동 한 그릇이 이렇게 행복할 줄이야." },
                { name: "조*은", score: 4, date: "2026.06.28", body: "어묵이 좀 더 많으면 좋겠지만 전체적인 구성은 매우 만족합니다. 면도 쫄깃하고 육수도 깊어요." },
                { name: "문*성", score: 5, date: "2026.06.25", body: "비오는 날 이거 하나 끓여먹으면 마음까지 따뜻해져요. 정통 일식 재료가 다 들어있어서 진짜 본격 우동입니다." }
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
                { name: "김*아", score: 5, date: "2026.06.25", body: "가죽 표면 질감이 독특하고 고급스러워요. 오래오래 잘 쓸 것 같습니다." },
                { name: "조*우", score: 4, date: "2026.06.20", body: "장지갑이라 가방에 넣고 다니기에 딱 좋은 사이즈에요. YKK 지퍼라 부드럽게 열리고 닫히는 것도 마음에 듭니다." },
                { name: "백*수", score: 5, date: "2026.06.15", body: "샘플사진보다 실물이 훨씬 고급스러워요. 선물 포장도 세련되게 돼 있어서 그대로 선물하기 좋습니다." }
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
                { name: "김*태", score: 5, date: "2026.07.03", body: "패티가 퍽퍽하지 않고 육즙이 가득 차 있어서 목넘김이 아주 좋습니다. 치즈가 살포시 녹아든 밸런스가 최고네요." },
                { name: "박*원", score: 5, date: "2026.06.30", body: "수제 버거 전문점에서 먹는 것 같은 퀄리티예요. 패티 두께가 상당하고 치즈가 쫙 녹아서 비주얼도 대박입니다." },
                { name: "이*하", score: 4, date: "2026.06.27", body: "단품이라 세트 구성이 아쉽지만 버거 자체 완성도는 정말 높아요. 양상추도 아삭하고 신선합니다." },
                { name: "정*훈", score: 5, date: "2026.06.24", body: "아이들 간식으로 주문했는데 매운맛이 없어서 아이들도 잘 먹네요. 어른들도 만족하는 보편적인 맛!" },
                { name: "윤*서", score: 5, date: "2026.06.20", body: "배달 왔는데도 번이 눅눅하지 않고 바삭함이 살아있어요. 포장 기술이 좋은 것 같습니다. 재주문 확정!" }
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
                { name: "이*혁", score: 5, date: "2026.07.02", body: "패티가 2장이라 그런지 입에 꽉 차는 고기 식감이 대박입니다. 특제 바비큐 소스도 달콤해서 환상 궁합이네요." },
                { name: "한*나", score: 5, date: "2026.06.29", body: "시그니처라는 이름값을 합니다. 토마토가 두꺼운 슬라이스로 들어가 있어서 식감의 층이 다양해요." },
                { name: "조*민", score: 5, date: "2026.06.26", body: "먹는 내내 육즙이 흘러내려서 냅킨 필수예요 ㅋㅋ 그만큼 패티가 촉촉하고 풍성합니다. 강추!" },
                { name: "강*지", score: 4, date: "2026.06.23", body: "가격이 좀 있지만 퀄리티를 생각하면 합리적이에요. 프랜차이즈 더블버거보다 훨씬 맛있습니다." },
                { name: "서*준", score: 5, date: "2026.06.20", body: "불금 야식으로 시켰는데 포장도 고급스럽고 맛도 최상급이에요. 친구들이 어디서 시킨 거냐고 물어봐요." }
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
                { name: "송*아", score: 5, date: "2026.07.06", body: "주말 저녁 패밀리 팩으로 해결했는데 가성비가 최고네요. 감자튀김도 갓 튀긴 듯 바삭하고 따끈하게 도착했습니다." },
                { name: "노*현", score: 5, date: "2026.07.03", body: "4개 버거 구성이 알차요. 치즈버거랑 시그니처 버거 2종류가 골고루 들어있어서 온 가족 취향 저격입니다." },
                { name: "차*우", score: 4, date: "2026.06.30", body: "콜라가 1.5L라 넉넉하고 감튀도 양이 많아요. 가족 4명이 먹기에 딱 적당한 세트 구성입니다." },
                { name: "안*정", score: 5, date: "2026.06.27", body: "생일파티에 주문했는데 아이들이 환호했어요! 감자튀김이 특히 인기 폭발이었습니다. 다음에도 꼭 시킬게요." },
                { name: "류*빈", score: 5, date: "2026.06.24", body: "보온 밀봉 봉투 덕분인지 배달 도착 후에도 따뜻했어요. 집에서 패스트푸드점 느낌을 그대로 즐길 수 있습니다." }
            ]
        }
    }
};

// ==========================================
// userWorkProgress - localStorage 복원 (새로고침 후에도 완료 상태 유지)
// ==========================================
(function() {
    var saved = localStorage.getItem('userWorkProgress');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                window.MockData.userWorkProgress = parsed;
            }
        } catch(e) {}
    }
})();

// ==========================================
// MockData 헬퍼 함수 - 체험 상태 조회/갱신
// ==========================================
window.MockData.getWorkProgress = function(userId, workId) {
    return this.userWorkProgress.find(function(p) {
        return p.userId == userId && p.workId == workId;
    }) || null;
};

// 체험 진행 기록(isExp)이 저장되는 localStorage 키.
// 두 가지 키가 같은 형식으로 쓰이고 있어 양쪽을 모두 인식한다.
//   userWorkProgress       : store.js / work_detail.html / burger-ex.html
//   app_user_work_progress : kimp_ex0.html
window.MockData.workProgressKeys = ['userWorkProgress', 'app_user_work_progress'];

// 저장된 모든 진행 기록을 한 배열로 읽어온다.
window.MockData.readStoredWorkProgress = function() {
    var rows = [];
    this.workProgressKeys.forEach(function(key) {
        try {
            var parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(parsed)) rows = rows.concat(parsed);
        } catch (e) {}
    });
    return rows;
};

// 체험 완료 여부 판정. userId 를 알 수 없으면(null) 작업 기준으로만 판정한다.
window.MockData.isExpCompleted = function(userId, workId) {
    var rows = this.readStoredWorkProgress()
        .concat(Array.isArray(this.userWorkProgress) ? this.userWorkProgress : []);
    return rows.some(function(p) {
        if (!p || p.isExp !== true) return false;
        if (String(p.workId) !== String(workId)) return false;
        if (userId === undefined || userId === null || userId === '') return true;
        return p.userId == userId;
    });
};

// localStorage 에 저장된 체험 기록을 메모리 테이블(userWorkProgress)에 병합한다.
// 이 파일 상단에서 로드 시 한 번 복원하지만, 로드 이후에 다른 스크립트가
// localStorage['userWorkProgress'] 를 직접 갱신한 경우(work_detail.html 의
// completeExperienceNow 등) 메모리 테이블은 그 변경을 모른다. setExpCompleted 는
// 테이블 전체를 덮어쓰므로, 병합하지 않으면 그 기록이 지워진다.
window.MockData.hydrateWorkProgress = function() {
    var saved = this.readStoredWorkProgress();
    if (!Array.isArray(saved) || !Array.isArray(this.userWorkProgress)) return this.userWorkProgress;

    var table = this.userWorkProgress;
    saved.forEach(function(row) {
        if (!row) return;
        var index = table.findIndex(function(p) {
            return p && p.userId == row.userId && String(p.workId) === String(row.workId);
        });
        if (index > -1) table[index] = Object.assign({}, table[index], row);
        else table.push(row);
    });
    return table;
};

window.MockData.setExpCompleted = function(userId, workId) {
    this.hydrateWorkProgress();
    var progress = this.userWorkProgress.find(function(p) {
        return p.userId == userId && p.workId == workId;
    });
    var today = new Date().toISOString().split('T')[0];
    if (progress) {
        progress.isExp = true;
        progress.expCompletedAt = today;
    } else {
        // 항목이 없으면 신규 추가
        this.userWorkProgress.push({
            userId: parseInt(userId),
            workId: parseInt(workId),
            isExp: true,
            expCompletedAt: today
        });
    }
    // localStorage에 persist (새로고침 후에도 유지).
    // 두 키를 함께 갱신해, 어느 쪽을 읽는 화면에서도 같은 상태가 보이게 한다.
    var payload = JSON.stringify(this.userWorkProgress);
    this.workProgressKeys.forEach(function(key) {
        try { localStorage.setItem(key, payload); } catch (e) {}
    });
};

// ==========================================
// 🛍️ 신규: 매장 판매 상품 및 상세 리뷰 데이터
// ==========================================
window.MockData.storeProducts = [
    // 김치공정 (workId: 1)
    { productId: 10001, productCode: "p300g", workId: 1, name: "300g 맛김치 팩", price: 3000, img: "./images/kimchi_300g.png", brand: "AFood", isDelivery: true, description: "1인 가구용 실속형 맛김치. 한 끼에 드시기 알맞은 깔끔한 맛김치입니다.", category: "요리", ingredients: "배추, 고춧가루, 마늘", manufacturer: "AFood" },
    { productId: 10002, productCode: "p1kg", workId: 1, name: "1kg 포기김치 팩", price: 8000, img: "./images/kimchi_1kg.png", brand: "AFood", isDelivery: true, description: "가정용 표준 포장 프리미엄 김치. 전통 방식 그대로 버무린 1kg 가정용 포기김치입니다.", category: "요리", ingredients: "배추, 고춧가루, 마늘, 젓갈", manufacturer: "AFood" },
    { productId: 10003, productCode: "p3kg", workId: 1, name: "3kg 대용량 김치 팩", price: 20000, img: "./images/kimchi_3kg.png", brand: "AFood", isDelivery: true, description: "다인가구 및 김장 보관용 실용 김치. 온 가족이 풍족하게 나누어 먹을 수 있는 3kg 대용량 김치입니다.", category: "요리", ingredients: "배추, 고춧가루, 마늘, 젓갈, 무", manufacturer: "AFood" },
    { productId: 10004, productCode: "p5kg", workId: 1, name: "5kg 실속 김치 팩", price: 32000, img: "./images/kimchi_1kg.png", brand: "AFood", isDelivery: true, description: "대가족 및 업소용 실속 포장. 대용량 실속 파우치에 담긴 5kg 배추김치입니다.", category: "요리", ingredients: "배추, 고춧가루, 마늘, 젓갈, 무, 양파", manufacturer: "AFood" },
    { productId: 10005, productCode: "p10kg", workId: 1, name: "10kg 업소용 김치", price: 60000, img: "./images/kimchi_3kg.png", brand: "AFood", isDelivery: true, description: "업소/단체급식 전용 대용량 김치. 식당이나 대규모 급식 시설 전용의 벌크형 10kg 제품입니다.", category: "요리", ingredients: "배추, 고춧가루, 마늘, 젓갈, 무, 양파, 파", manufacturer: "AFood" },
    // 우동공정 (workId: 2)
    { productId: 20001, productCode: "p1", workId: 2, name: "정통 가쓰오 우동", price: 3000, status: "판매 중", img: "./images/udon_product.png", brand: "Uton", isDelivery: false, description: "진한 가쓰오 육수와 쫄깃한 면발을 자랑하는 매장의 대표 가쓰오 우동입니다.", category: "패스트푸드", ingredients: "우동면, 육수, 쪽파", manufacturer: "Uton" },
    { productId: 20002, productCode: "p2", workId: 2, name: "감칠맛 간장 비빔면", price: 3000, status: "판매 중", img: "./images/somyeon_complete.png", brand: "Uton", isDelivery: false, description: "특제 간장 소스와 고소한 참기름을 곁들여 자극적이지 않고 달콤 짭조름하여 아이들도 너무 좋아하고 맛있게 잘 먹는 온 가족 영양 별미 감칠맛 소면 비빔면입니다.", category: "패스트푸드", ingredients: "소면, 간장, 설탕, 참기름", manufacturer: "Uton" },
    { productId: 20003, productCode: "udon_01", workId: 2, name: "수제 쫄깃 우동면 2인분", price: 4500, img: "./images/udon_noodle.png", brand: "Uton", isDelivery: true, description: "수타 공정으로 뽑아내어 한층 더 탱글하고 쫄깃한 명품 우동 사리 면발입니다.", category: "식자재", ingredients: "우동면", manufacturer: "Uton" },
    // 지갑공정 (workId: 3)
    { productId: 30001, productCode: "wallet_01", workId: 3, name: "천연소가죽 명함지갑", price: 25000, img: "./images/wallet_card.png", brand: "Persa", isDelivery: true, description: "고급 소가죽 원단을 사용하여 부드러운 터치감과 뛰어난 실용성을 갖춘 명함지갑입니다.", category: "악세사리", ingredients: "천연소가죽", manufacturer: "Persa" },
    { productId: 30002, productCode: "wallet_02", workId: 3, name: "핸드메이드 반지갑", price: 45000, img: "./images/wallet_half.png", brand: "Persa", isDelivery: true, description: "클래식하고 실용적인 수제 반지갑입니다. 지폐 수납부 2곳과 카드 슬롯 6곳으로 수납력이 우수합니다.", category: "악세사리", ingredients: "천연소가죽", manufacturer: "Persa" },
    { productId: 30003, productCode: "wallet_03", workId: 3, name: "프리미엄 장지갑", price: 75000, img: "./images/wallet_long.png", brand: "Persa", isDelivery: true, description: "수제 가죽 명장의 바느질 기법으로 제작되어 오랜 내구성과 럭셔리한 실루엣을 자아내는 장지갑입니다.", category: "악세사리", ingredients: "천연소가죽", manufacturer: "Persa" }
];

window.MockData.utonFinanceAssumptions = {
    foodCostRate: 0.30,
    monthlyElectricityCost: 400000,
    monthlyGasCost: 250000,
    monthlyRentCost: 4000000,
    utilityMonthDays: 30,
    hourlyBaseWage: 10320,
    defaultUtonSalaryRatio: 1.1,
    fullDayLaborHeadcount: 2,
    maxSalesIntervalMinutes: 10,
    maxSalesQtyPerMenuPerInterval: 2
};

window.MockData.utonOrderSettings = {
    intervalMinutes: 10,
    maxQtyPerInterval: 2
};

window.MockData.productReviews = {
    "p1": [
        { user: "홍길동", rating: 5, date: "2026-07-15", comment: "육수가 정말 끝내줍니다! 면발도 쫄깃하고 수타 우동 전문점 못지않아요." },
        { user: "김영희", rating: 4, date: "2026-07-16", comment: "3천원이라는 가격 대비 퀄리티가 정말 만족스럽습니다. 매장도 아주 청결해요." },
        { user: "이철수", rating: 5, date: "2026-07-17", comment: "가쓰오부시가 춤추는 게 시각적으로도 좋고, 국물도 개운하고 아주 뜨끈해서 좋네요." },
        { user: "박민수", rating: 5, date: "2026-07-17", comment: "가성비 끝판왕! 아이가 너무 좋아해서 다음 체험 올 때 또 사먹으려고 합니다." },
        { user: "최수아", rating: 4, date: "2026-07-18", comment: "우동 공정 체험을 하고 나서 직접 매장에서 먹으니까 감회가 새롭고 더 맛있어요!" }
    ],
    "p2": [
        { user: "김철수", rating: 5, date: "2026-07-14", comment: "단짠 비율이 완벽합니다. 참기름 냄새가 매장에 솔솔 풍기는데 안 먹을 수가 없어요." },
        { user: "박영희", rating: 5, date: "2026-07-16", comment: "1회용 비닐장갑 끼고 직접 무쳐낸 듯 양념이 면발 골고루 쏙 잘 배어 있네요." },
        { user: "이민호", rating: 4, date: "2026-07-17", comment: "면이 차갑게 잘 헹궈져서 탱글탱글 살아있습니다. 3천원에 이 정도 맛이면 최고!" },
        { user: "최지우", rating: 5, date: "2026-07-18", comment: "남녀노소 누구나 좋아할 맵지 않은 단짠 소스네요. 입맛 없을 때 강력추천합니다." },
        { user: "홍길동", rating: 5, date: "2026-07-18", comment: "비빔면 표준 매뉴얼처럼 전분기를 빼고 치댄 쫄깃한 소면 면발 식감이 대단합니다." }
    ]
};

window.MockData.getProductsByWorkId = function(workId) {
    return this.storeProducts.filter(function(p) {
        return p.workId == workId;
    });
};

window.MockData.getReviewsByProductId = function(productId) {
    return this.productReviews[productId] || [];
};

window.MockData.getWorkHours = function(userId, workId) {
    if (window.FactoryStore && typeof window.FactoryStore.getWorkHours === 'function') {
        return window.FactoryStore.getWorkHours(userId, workId);
    }
    var saved = localStorage.getItem('kimp_user_work_hours');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            var key = userId + '_' + workId;
            if (parsed[key] !== undefined) return parsed[key];
        } catch(e) {}
    }
    return 0;
};

window.MockData.setWorkHours = function(userId, workId, hours) {
    if (window.FactoryStore && typeof window.FactoryStore.setWorkHours === 'function') {
        return window.FactoryStore.setWorkHours(userId, workId, hours);
    }
};

window.MockData.getUserBaseAssets = function(userId) {
    var uList = (window.FactoryStore && window.FactoryStore.getState) ? window.FactoryStore.getState().users : (this.users || []);
    if (!uList || uList.length === 0) uList = this.users || [];
    var strId = String(userId);
    var found = uList.find(function(u) {
        return String(u.id) === strId || u.email === strId || u.name === strId;
    });
    return found ? (found.baseAssets || 100000) : 100000;
};

// 정산금액 저장 키 접두어 (회원별 파티션)
window.MockData.SETTLEMENT_BALANCE_KEY_PREFIX = 'user_settlement_balance_';

// 회원 식별자를 정규화 (users 배열의 id로 통일)
window.MockData.normalizeSettlementUserId = function(userId) {
    var uList = (window.FactoryStore && window.FactoryStore.getState) ? window.FactoryStore.getState().users : (this.users || []);
    if (!uList || uList.length === 0) uList = this.users || [];
    var strId = String(userId === undefined || userId === null ? '' : userId).trim();

    // 1) 정확 일치 (id / email / name)
    var found = uList.find(function(u) {
        return String(u.id) === strId || u.email === strId || u.name === strId;
    });
    if (found) return String(found.id);

    // 2) 부분 일치 (local-email 형태나 email 일부가 섞인 식별자 대응)
    found = uList.find(function(u) {
        if (!strId) return false;
        var emailLocal = u.email ? String(u.email).split('@')[0] : '';
        return (u.email && strId.indexOf(u.email) > -1)
            || (emailLocal && strId.indexOf(emailLocal) > -1)
            || (u.name && strId.indexOf(u.name) > -1);
    });
    if (found) return String(found.id);

    return strId;
};

// 회원정보에 등록된 초기 정산금액 (기본 10만원)
window.MockData.getUserInitialSettlementBalance = function(userId) {
    var normId = this.normalizeSettlementUserId(userId);

    // 관리자가 초기값을 조정한 경우 우선 적용
    try {
        var override = localStorage.getItem(this.SETTLEMENT_BALANCE_KEY_PREFIX + normId + '_initial');
        if (override !== null && override !== '' && override !== 'null') {
            var parsedOverride = Number(override);
            if (Number.isFinite(parsedOverride)) return parsedOverride;
        }
    } catch (e) {}

    var uList = (window.FactoryStore && window.FactoryStore.getState) ? window.FactoryStore.getState().users : (this.users || []);
    if (!uList || uList.length === 0) uList = this.users || [];
    var found = uList.find(function(u) {
        return String(u.id) === normId;
    });
    return found && Number.isFinite(Number(found.settlementBalance))
        ? Number(found.settlementBalance)
        : 100000;
};

// 현재 정산금액 = 초기 정산금액 + 모든 로그 증감액 합계 (로그 기반 파생값이라 중복 차감 불가)
window.MockData.getUserSettlementBalance = function(userId) {
    var initial = this.getUserInitialSettlementBalance(userId);
    var logs = this.getSettlementLogs(userId);
    var delta = logs.reduce(function(sum, log) {
        return sum + (Number(log.amount) || 0);
    }, 0);
    return Math.max(0, Math.round(initial + delta));
};

// 초기 정산금액 조정 (필요 시)
window.MockData.setUserInitialSettlementBalance = function(userId, value) {
    var normId = this.normalizeSettlementUserId(userId);
    var amount = Math.max(0, Math.round(Number(value) || 0));
    try {
        localStorage.setItem(this.SETTLEMENT_BALANCE_KEY_PREFIX + normId + '_initial', String(amount));
        window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    return amount;
};

// ==========================================
// 💳 정산금액 결제 로그 (상품 구입 등 차감 이력)
// ==========================================
window.MockData.SETTLEMENT_LOG_KEY_PREFIX = 'user_settlement_log_';

window.MockData.getSettlementLogs = function(userId) {
    var normId = this.normalizeSettlementUserId(userId);
    var storageKey = this.SETTLEMENT_LOG_KEY_PREFIX + normId;
    var logs = [];
    try {
        var parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(parsed)) logs = parsed;
    } catch (e) {}

    // 이미 기록된 주문번호 집합 (중복 차감 방지용)
    var knownIds = new Set(logs.map(function(l) { return String(l.id); }));
    var knownOrderNos = new Set(
        logs.filter(function(l) { return l.orderNo; })
            .map(function(l) { return String(l.orderNo); })
    );

    // FactoryStore의 shop_spend 정산 트랜잭션(김치/우동 상품 구입)도 병합
    try {
        var txns = (window.FactoryStore && window.FactoryStore.getState)
            ? (window.FactoryStore.getState().settlementTransactions || [])
            : [];
        var self = this;
        txns.forEach(function(t) {
            if (!t || t.type !== 'shop_spend') return;
            // 관리자 KDS 테스트 주문은 정산 로그에서 제외
            if (String(t.userId || '') === 'manager-test') return;
            if (String(t.orderId || '').indexOf('manager_test_') === 0) return;
            if (/^T\d+$/.test(String(t.orderNo || ''))) return;
            // 트랜잭션의 userId가 이메일/이름일 수 있으므로 정규화 후 비교
            if (t.userId !== null && t.userId !== undefined && String(t.userId) !== 'guest') {
                if (self.normalizeSettlementUserId(t.userId) !== normId) return;
            }
            if (knownIds.has(String(t.id))) return;
            if (t.orderNo && knownOrderNos.has(String(t.orderNo))) return;

            var workId = t.workId !== undefined && t.workId !== null
                ? t.workId
                : self.inferSettlementWorkId(t);
            var qty = Math.max(1, Number(t.qty) || 1);
            var unitPrice = Number(t.unitPrice) || Math.abs(Number(t.absoluteAmount || t.amount) || 0);
            logs.push({
                id: t.id,
                userId: normId,
                type: 'purchase',
                category: '상품 구입',
                title: t.productName || '상품 구입',
                storeName: t.storeName || t.brandName || self.getSettlementStoreName(workId),
                workId: workId,
                orderNo: t.orderNo || null,
                amount: -Math.abs(Number(t.absoluteAmount || t.amount) || 0),
                items: [{
                    name: t.productName || '주문 상품',
                    quantity: qty,
                    unit: '개',
                    price: unitPrice,
                    subtotal: Math.abs(Number(t.absoluteAmount || t.amount) || 0)
                }],
                createdAt: t.createdAt || new Date().toISOString(),
                description: t.description || '쇼핑 주문 정산 차감',
                paymentMethod: 'online_settlement'
            });
            knownIds.add(String(t.id));
            if (t.orderNo) knownOrderNos.add(String(t.orderNo));
        });
    } catch (e) {}

    return logs.sort(function(a, b) {
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });
};

// 정산 트랜잭션의 workId 추정 (상품코드/상품명 기반)
window.MockData.inferSettlementWorkId = function(txn) {
    if (!txn) return null;
    var productId = String(txn.productId || '').toLowerCase();
    var productName = String(txn.productName || '');

    var products = Array.isArray(this.storeProducts) ? this.storeProducts : [];
    var matched = products.find(function(p) {
        return String(p.productId).toLowerCase() === productId
            || String(p.productCode).toLowerCase() === productId;
    });
    if (matched) return matched.workId;

    if (productName.indexOf('우동') > -1 || productName.indexOf('비빔') > -1) return 2;
    if (productName.indexOf('김치') > -1) return 1;
    if (productName.indexOf('지갑') > -1) return 3;
    if (productName.indexOf('불고기') > -1) return 6;
    if (productName.indexOf('버거') > -1) return 7;
    return null;
};

window.MockData.getSettlementStoreName = function(workId) {
    var map = {
        '1': 'AFood 김치공장',
        '2': 'Uton Shop',
        '3': 'Persa 공방',
        '6': '불고기구이 K-Meat',
        '7': 'BurgerQueen'
    };
    return map[String(workId)] || '';
};

window.MockData.addSettlementLog = function(userId, entry) {
    var normId = this.normalizeSettlementUserId(userId);
    var storageKey = this.SETTLEMENT_LOG_KEY_PREFIX + normId;
    var logs = [];
    try {
        var parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(parsed)) logs = parsed;
    } catch (e) {}

    var source = entry && typeof entry === 'object' ? entry : {};
    var record = {
        id: source.id || ('settle_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
        userId: normId,
        type: source.type || 'purchase',
        category: source.category || '상품 구입',
        title: source.title || '정산금액 차감',
        storeName: source.storeName || '',
        workId: source.workId !== undefined ? source.workId : null,
        orderNo: source.orderNo || null,
        amount: Number(source.amount) || 0,
        balanceBefore: source.balanceBefore !== undefined ? Number(source.balanceBefore) : null,
        balanceAfter: source.balanceAfter !== undefined ? Number(source.balanceAfter) : null,
        items: Array.isArray(source.items) ? source.items : [],
        paymentMethod: source.paymentMethod || 'online_settlement',
        createdAt: source.createdAt || new Date().toISOString(),
        description: source.description || ''
    };

    if (!logs.some(function(l) { return String(l.id) === String(record.id); })) {
        logs.unshift(record);
        try {
            localStorage.setItem(storageKey, JSON.stringify(logs));
            window.dispatchEvent(new Event('storage'));
        } catch (e) {}
    }
    return record;
};

// 정산금액 차감 (부족하면 null 반환). 로그 기록이 곧 차감이다.
window.MockData.deductUserSettlementBalance = function(userId, amount, meta) {
    var current = this.getUserSettlementBalance(userId);
    var cost = Math.max(0, Math.round(Number(amount) || 0));
    if (current < cost) return null;

    var next = current - cost;
    this.addSettlementLog(userId, Object.assign({}, meta || {}, {
        amount: -cost,
        balanceBefore: current,
        balanceAfter: next
    }));
    return next;
};

// 하위 호환: 잔액을 직접 세팅하는 대신 차액을 조정 로그로 남긴다
window.MockData.setUserSettlementBalance = function(userId, value) {
    var current = this.getUserSettlementBalance(userId);
    var target = Math.max(0, Math.round(Number(value) || 0));
    if (current === target) return target;
    this.addSettlementLog(userId, {
        type: 'adjustment',
        category: '잔액 조정',
        title: '정산 잔액 조정',
        amount: target - current,
        balanceBefore: current,
        balanceAfter: target,
        description: '정산 잔액을 직접 조정했습니다.'
    });
    return target;
};

window.MockData.workTimeSlots = {
    "1.5h": [
        { slot: 0, time: "10:00 ~ 11:30", label: "오전 타임", startHour: 10, startMin: 0, endHour: 11, endMin: 30 },
        { slot: 1, time: "13:00 ~ 14:30", label: "오후 첫 타임", startHour: 13, startMin: 0, endHour: 14, endMin: 30 },
        { slot: 2, time: "14:30 ~ 16:00", label: "오후 둘째 타임", startHour: 14, startMin: 30, endHour: 16, endMin: 0 },
        { slot: 3, time: "16:00 ~ 17:30", label: "오후 셋째 타임", startHour: 16, startMin: 0, endHour: 17, endMin: 30 }
    ],
    "2h": [
        { slot: 0, time: "10:00 ~ 12:00", label: "오전 타임", startHour: 10, startMin: 0, endHour: 12, endMin: 0 },
        { slot: 1, time: "13:00 ~ 15:00", label: "오후 첫 타임", startHour: 13, startMin: 0, endHour: 15, endMin: 0 },
        { slot: 2, time: "15:00 ~ 17:00", label: "오후 둘째 타임", startHour: 15, startMin: 0, endHour: 17, endMin: 0 }
    ],
    "2.5h": [
        { slot: 0, time: "10:00 ~ 12:30", label: "오전 타임", startHour: 10, startMin: 0, endHour: 12, endMin: 30 },
        { slot: 1, time: "13:00 ~ 15:30", label: "오후 첫 타임", startHour: 13, startMin: 0, endHour: 15, endMin: 30 },
        { slot: 2, time: "15:30 ~ 18:00", label: "오후 둘째 타임", startHour: 15, startMin: 30, endHour: 18, endMin: 0 }
    ],
    "3h": [
        { slot: 0, time: "09:00 ~ 12:00", label: "오전 타임", startHour: 9, startMin: 0, endHour: 12, endMin: 0 },
        { slot: 1, time: "13:00 ~ 16:00", label: "오후 타임", startHour: 13, startMin: 0, endHour: 16, endMin: 0 }
    ],
    // 불고기구이(workId 6) - 저녁 영업 4시간 통근무 (오후 4시 ~ 오후 8시)
    "4h": [
        { slot: 0, time: "16:00 ~ 20:00", label: "저녁 타임", startHour: 16, startMin: 0, endHour: 20, endMin: 0 }
    ]
};

window.MockData.getWorkTimeSlots = function(workId) {
    const wId = String(workId);
    let timeKey = "2h";
    try {
        if (window.MockData.workDetailJSON) {
            const detailMap = JSON.parse(window.MockData.workDetailJSON);
            const detail = detailMap[wId];
            if (detail && detail.workTime) {
                const wt = detail.workTime;
                if (wt.includes("1시간 30분") || wt.includes("1.5시간")) timeKey = "1.5h";
                else if (wt.includes("2시간 30분") || wt.includes("2.5시간")) timeKey = "2.5h";
                else if (wt.includes("4시간")) timeKey = "4h";
                else if (wt.includes("3시간")) timeKey = "3h";
                else if (wt.includes("2시간")) timeKey = "2h";
                return {
                    type: timeKey,
                    slots: this.workTimeSlots[timeKey] || this.workTimeSlots["2h"]
                };
            }
        }
    } catch(e) {}

    if (wId === "2") timeKey = "1.5h";
    else if (wId === "3") timeKey = "3h";
    else if (wId === "6") timeKey = "4h";
    else if (wId === "7") timeKey = "2.5h";
    else timeKey = "2h";

    return {
        type: timeKey,
        slots: this.workTimeSlots[timeKey] || this.workTimeSlots["2h"]
    };
};

window.MockData.getWorkSlot = function(workId, slotValue) {
    const slotData = this.getWorkTimeSlots(workId || 1);
    const slots = slotData && Array.isArray(slotData.slots) ? slotData.slots : [];
    return slots.find(function(slot) {
        return String(slot.slot) === String(slotValue);
    }) || null;
};

window.MockData.formatWorkSlotTime = function(workId, slotValue, fallback) {
    const slot = this.getWorkSlot(workId || 1, slotValue);
    if (slot && slot.time) return slot.time;
    return fallback || '지정 시간';
};

window.MockData.inferWorkId = function(item) {
    if (item && typeof item === 'object' && item.workId !== undefined && item.workId !== null && item.workId !== '') {
        return String(item.workId);
    }
    const text = typeof item === 'object'
        ? String(item.job || item.workName || item.title || item.brandName || '')
        : String(item || '');
    if (text.includes('우동') || text.includes('Uton')) return '2';
    if (text.includes('지갑') || text.includes('Persa')) return '3';
    if (text.includes('불고기') || text.includes('K-Meat')) return '6';
    if (text.includes('버거') || text.includes('Burger')) return '7';
    return '1';
};

window.MockData.normalizeWorkTitle = function(title, workId) {
    const rawTitle = String(title || '').trim();
    const cleanedTitle = rawTitle
        .replace(/^(Uton|AFood|Persa|K-Meat|BurgerQueen)\s+/i, '')
        .trim();
    if (cleanedTitle) return cleanedTitle;
    return this.getWorkMeta ? this.getWorkMeta(workId || '1').title : '김치만들기';
};

window.MockData.getWorkMeta = function(workId) {
    const wId = String(workId || '1');
    let detail = {};
    let work = {};
    try {
        const detailMap = JSON.parse(this.workDetailJSON || '{}');
        detail = detailMap[wId] || {};
    } catch (e) {}
    try {
        const works = JSON.parse(this.worksJSON || '[]');
        work = works.find(function(item) { return String(item.workId) === wId; }) || {};
    } catch (e) {}
    return {
        workId: Number(wId),
        title: detail.title || work.workName || '김치만들기',
        brandName: work.brandName || (wId === '2' ? 'Uton' : (wId === '3' ? 'Persa' : 'AFood')),
        iconUrl: detail.iconUrl || work.iconUrl || './images/k-icon_150x150.png',
        ratio: detail.value || work.salary || 1.2,
        workTime: detail.workTime || '2시간 작업'
    };
};

window.MockData.getWorkDurationLabel = function(workId, format) {
    const wId = String(workId || '1');
    if (format === 'text') {
        const meta = this.getWorkMeta(wId);
        return String(meta.workTime || '2시간 작업').replace(/\s*작업\s*$/, '').trim();
    }
    const slotData = this.getWorkTimeSlots(wId);
    return slotData && slotData.type ? slotData.type : '2h';
};

window.MockData.getMockWorkHistories = function(userObj) {
    const userId = String((userObj && (userObj.id || userObj.email || userObj.name)) || sessionStorage.getItem('user-id') || 'guest');
    const userName = String((userObj && userObj.name) || '손님');
    const today = new Date();
    const formatDate = function(daysAgo) {
        const d = new Date();
        d.setDate(today.getDate() - daysAgo);
        return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, '0') + "." + String(d.getDate()).padStart(2, '0');
    };
    const profileMap = {
        '최현일': [
            { workId: 3, daysAgo: 1, slot: 1, role: '매니저', pay: 220000 },
            { workId: 2, daysAgo: 3, slot: 0, role: '매니저', pay: 190000 },
            { workId: 1, daysAgo: 5, slot: 2, role: '매니저', pay: 180000 }
        ],
        '최수아': [
            { workId: 2, daysAgo: 2, slot: 1, role: '헬퍼', pay: 110000 },
            { workId: 3, daysAgo: 6, slot: 0, role: '일반', pay: 50000 },
            { workId: 1, daysAgo: 10, slot: 2, role: '일반', pay: 45000 }
        ],
        '김수민': [
            { workId: 2, daysAgo: 4, slot: 0, role: '일반', pay: 45000 }
        ],
        '김영희': [
            { workId: 3, daysAgo: 1, slot: 1, role: '헬퍼', pay: 120000 },
            { workId: 2, daysAgo: 3, slot: 0, role: '헬퍼', pay: 110000 },
            { workId: 1, daysAgo: 8, slot: 2, role: '헬퍼', pay: 115000 }
        ]
    };
    const rows = profileMap[userName] || [
        { workId: 1, daysAgo: 2, slot: 0, role: '일반', pay: 40000 }
    ];

    return rows.map((row, index) => {
        const meta = this.getWorkMeta(row.workId);
        const slotData = this.getWorkTimeSlots(row.workId);
        const slots = slotData.slots || [];
        const slot = slots[row.slot] || slots[0] || { time: '10:00 ~ 12:00' };
        const timeParts = String(slot.time).split('~').map(part => part.trim());
        const checkInTime = (timeParts[0] || '10:00') + ':00';
        const checkOutTime = (timeParts[1] || '12:00') + ':00';
        return {
            id: `mock-${userId}-${row.workId}-${row.daysAgo}-${row.slot}-${index}`,
            userId: userId,
            userName: userName,
            workId: Number(row.workId),
            date: formatDate(row.daysAgo),
            time: slot.time,
            checkInTime: checkInTime,
            checkOutTime: checkOutTime,
            job: meta.title,
            workName: meta.title,
            brandName: meta.brandName,
            iconUrl: meta.iconUrl,
            role: row.role,
            pay: row.pay,
            ratio: meta.ratio,
            status: '완료',
            breakSeconds: 0
        };
    });
};

// ==========================================
// 🥩 불고기구이 K-Meat (workId 6) 조리 매뉴얼 / 예측시간 데이터
// ==========================================
window.MockData.kmeatOrderSettings = {
    intervalMinutes: 10,
    maxQtyPerInterval: 1
};

// 반찬 및 쌈채소 기준량 정책
window.MockData.kmeatBanchanPolicy = {
    banchanCount: 5,
    banchanList: [
        { name: '배추김치', amount: '80g', note: 'AFood 김치 사용' },
        { name: '무생채', amount: '60g', note: '주문 직전 무침' },
        { name: '콩나물무침', amount: '60g', note: '데친 후 참기름' },
        { name: '마늘·고추', amount: '마늘 6쪽 / 고추 2개', note: '생마늘 별도 접시' },
        { name: '쌈장', amount: '30g', note: '1인 1종지' }
    ],
    ssamPerServing: {
        sangchu: { name: '상추', gramsPerServing: 70, countPerServing: 10, note: '2회 세척 후 물기 제거' },
        kkaennip: { name: '깻잎', gramsPerServing: 20, countPerServing: 8, note: '줄기 제거, 겹치지 않게 담기' }
    },
    scaleTolerance: 0.05 // 저울 계량 허용 오차 ±5%
};

// 메뉴별 조리 매뉴얼 (bulgogi_order.html 메뉴 id와 1:1 매칭)
window.MockData.kmeatMenuManuals = {
    'samgyeopsal': {
        id: 'samgyeopsal', name: '돼지고기 삼겹살 1인분', group: 'meat', station: 'butcher',
        // 생고기 제공: 손님이 테이블 불판에서 직접 구움 → 주방은 계량·손질·담기만 수행
        serveCourse: 1, raw: true,
        price: 15000, unit: '인분', targetWeightG: 180, prepMinutes: 4,
        scale: { target: 180, min: 171, max: 189, note: '저울 위 트레이 영점(Tare) 잡고 계량. 180g ±5% 이내여야 통과.' },
        steps: [
            { step: 1, minutes: 1, text: '냉장 숙성고(0~4℃)에서 생삼겹 블록 반출, 저울 트레이 영점 조절' },
            { step: 2, minutes: 2, text: '두께 12mm로 썰어 180g 계량 (171~189g 허용). 초과분은 되돌림' },
            { step: 3, minutes: 1, text: '핏물 제거 후 생고기 접시에 결 방향으로 펼쳐 담고 즉시 서빙 (굽지 않음)' }
        ],
        cautions: ['생고기 제공 - 절대 주방에서 굽지 않음', '반출 후 10분 내 서빙, 상온 방치 금지', '핏물은 키친타월로 제거']
    },
    'moksal': {
        id: 'moksal', name: '돼지고기 목살 1인분', group: 'meat', station: 'butcher',
        serveCourse: 1, raw: true,
        price: 14000, unit: '인분', targetWeightG: 180, prepMinutes: 4,
        scale: { target: 180, min: 171, max: 189, note: '저울 영점 후 180g ±5%. 목살은 결 방향 확인 후 계량.' },
        steps: [
            { step: 1, minutes: 1, text: '목살 블록 반출, 저울 트레이 영점 조절' },
            { step: 2, minutes: 2, text: '결 반대 방향으로 15mm 두께 슬라이스, 180g 계량' },
            { step: 3, minutes: 1, text: '접시에 겹치지 않게 담아 생고기 상태로 서빙' }
        ],
        cautions: ['생고기 제공 - 굽지 않음', '결 방향으로 썰면 손님이 구웠을 때 질겨짐']
    },
    'hangjeong': {
        id: 'hangjeong', name: '항정살 1인분', group: 'meat', station: 'butcher',
        serveCourse: 1, raw: true,
        price: 19000, unit: '인분', targetWeightG: 150, prepMinutes: 5,
        scale: { target: 150, min: 143, max: 158, note: '특수부위는 150g ±5%. 저울 소수점 1자리까지 확인.' },
        steps: [
            { step: 1, minutes: 1, text: '항정살 반출, 저울 영점 후 150g 계량 (143~158g)' },
            { step: 2, minutes: 2, text: '칼집을 격자로 얕게 넣어 손님이 구울 때 오그라짐 방지' },
            { step: 3, minutes: 2, text: '소금·기름장 종지와 함께 생고기 접시에 담아 서빙' }
        ],
        cautions: ['생고기 제공 - 굽지 않음', '칼집 필수 (미실시 시 구울 때 말림)']
    },
    'galmaegi': {
        id: 'galmaegi', name: '갈매기살 1인분', group: 'meat', station: 'butcher',
        serveCourse: 1, raw: true,
        price: 17000, unit: '인분', targetWeightG: 150, prepMinutes: 5,
        scale: { target: 150, min: 143, max: 158, note: '150g ±5%. 막 제거 후 순살 기준으로 계량.' },
        steps: [
            { step: 1, minutes: 2, text: '갈매기살 반출, 겉막 완전 제거 (순살 기준 계량)' },
            { step: 2, minutes: 2, text: '10mm 두께로 손질 후 저울에 150g 계량' },
            { step: 3, minutes: 1, text: '접시에 담아 생고기 상태로 서빙' }
        ],
        cautions: ['생고기 제공 - 굽지 않음', '겉막을 남기면 손님이 구웠을 때 질김', '얇은 부위이므로 손님에게 센 불 짧게 안내']
    },
    'pork-galbi': {
        id: 'pork-galbi', name: '돼지갈비 1인분', group: 'meat', station: 'butcher',
        serveCourse: 1, raw: true,
        price: 17000, unit: '인분', targetWeightG: 250, prepMinutes: 5,
        scale: { target: 250, min: 238, max: 263, note: '양념 포함 250g ±5%. 양념 국물은 체에 걸러 제외하고 계량.' },
        steps: [
            { step: 1, minutes: 2, text: '숙성 양념갈비 반출 (최소 12시간 숙성 확인)' },
            { step: 2, minutes: 2, text: '양념 국물은 체에 걸러 제외하고 저울에 250g 계량' },
            { step: 3, minutes: 1, text: '접시에 담아 생고기 상태로 서빙 (당분 많아 저온 구이 안내)' }
        ],
        cautions: ['생고기 제공 - 굽지 않음', '숙성 12시간 미달 시 사용 불가', '손님에게 약불 구이 안내 (양념 당분으로 쉽게 탐)']
    },
    'doenjang': {
        id: 'doenjang', name: '된장찌개 단품', group: 'side', station: 'soup',
        // 마무리 식사: 손님이 고기를 다 구울 무렵 서빙 (3차)
        serveCourse: 3,
        price: 6000, unit: '개', prepMinutes: 9,
        steps: [
            { step: 1, minutes: 1, text: '멸치·다시마 육수 300ml 뚝배기에 붓기' },
            { step: 2, minutes: 1, text: '된장 30g 풀고 두부·애호박·양파 투입' },
            { step: 3, minutes: 6, text: '중강불로 6분 끓이기 (끓어오른 후 4분 유지)' },
            { step: 4, minutes: 1, text: '대파·청양고추 올려 마무리, 밥과 함께 서빙' }
        ],
        cautions: ['된장을 끓는 물에 넣으면 향이 날아감 - 육수 미지근할 때 투입']
    },
    'kimchi-jjigae': {
        id: 'kimchi-jjigae', name: '김치찌개 단품', group: 'side', station: 'soup',
        serveCourse: 3,
        price: 8000, unit: '개', prepMinutes: 11,
        steps: [
            { step: 1, minutes: 2, text: '숙성 김치 150g을 기름에 볶기 (감칠맛 상승)' },
            { step: 2, minutes: 1, text: '육수 300ml, 돼지고기 50g 투입' },
            { step: 3, minutes: 7, text: '중강불 7분 끓이기. 김치가 물러질 때까지' },
            { step: 4, minutes: 1, text: '두부·대파 올려 마무리' }
        ],
        cautions: ['김치를 먼저 볶지 않으면 국물이 겉돎']
    },
    'naengmyeon': {
        id: 'naengmyeon', name: '물냉면 단품', group: 'side', station: 'cold',
        serveCourse: 3,
        price: 7000, unit: '개', prepMinutes: 7,
        steps: [
            { step: 1, minutes: 1, text: '냉면 육수 350ml를 살얼음 상태로 준비 (-1℃)' },
            { step: 2, minutes: 2, text: '면 100g을 끓는 물에 90초 삶기' },
            { step: 3, minutes: 2, text: '얼음물에 3회 헹궈 전분 제거, 물기 완전히 털기' },
            { step: 4, minutes: 2, text: '사리 담고 육수 부어 계란·무절임·오이 고명 올리기' }
        ],
        cautions: ['면 삶기 90초 초과 금지 - 불면', '헹구기 부족 시 국물이 탁해짐']
    },
    'bibimnaengmyeon': {
        id: 'bibimnaengmyeon', name: '비빔냉면 단품', group: 'side', station: 'cold',
        serveCourse: 3,
        price: 7500, unit: '개', prepMinutes: 7,
        steps: [
            { step: 1, minutes: 2, text: '면 100g 끓는 물에 90초 삶기' },
            { step: 2, minutes: 2, text: '얼음물 3회 헹굼 후 물기 제거' },
            { step: 3, minutes: 2, text: '비빔장 50g과 골고루 버무리기' },
            { step: 4, minutes: 1, text: '참기름·통깨·고명 올려 서빙' }
        ],
        cautions: ['물기가 남으면 양념이 묽어짐']
    },
    'gyeran': {
        id: 'gyeran', name: '계란찜 단품', group: 'side', station: 'soup',
        // 곁들이 사이드: 손님이 굽기 시작한 직후 서빙 (2차)
        serveCourse: 2,
        price: 5000, unit: '개', prepMinutes: 8,
        steps: [
            { step: 1, minutes: 2, text: '계란 3개 + 육수 150ml 풀어 체에 한 번 걸러 기포 제거' },
            { step: 2, minutes: 5, text: '뚝배기에 넣고 약불 5분. 뚜껑 덮어 폭신하게' },
            { step: 3, minutes: 1, text: '대파·통깨 올려 서빙' }
        ],
        cautions: ['센 불 사용 시 겉만 타고 속이 안 익음']
    },
    'rice': {
        id: 'rice', name: '공기밥', group: 'side', station: 'rice',
        // 마무리 식사와 함께 (찌개/냉면 서빙 시점에 맞춤)
        serveCourse: 3,
        price: 1000, unit: '개', prepMinutes: 2,
        steps: [
            { step: 1, minutes: 1, text: '보온밥솥에서 210g 퍼담기' },
            { step: 2, minutes: 1, text: '뚜껑 덮어 서빙' }
        ],
        cautions: ['보온 4시간 초과된 밥은 폐기']
    }
};

// 조리 스테이션 정보 (병렬 처리 가능 단위)
// ※ 불판은 손님 테이블에 있으므로 주방 스테이션이 아님. 고기는 정육·계량대에서 생으로 담아 나감.
window.MockData.kmeatStations = {
    butcher: { key: 'butcher', label: '정육·계량대', icon: 'bi-speedometer2', capacity: 2, color: '#e0362c' },
    soup:    { key: 'soup',    label: '탕·찌개 화구', icon: 'bi-thermometer-half', capacity: 3, color: '#f59e0b' },
    cold:    { key: 'cold',    label: '냉면 코너',   icon: 'bi-snow', capacity: 2, color: '#0891b2' },
    rice:    { key: 'rice',    label: '밥·반찬 준비', icon: 'bi-basket', capacity: 4, color: '#10b981' }
};

// ==========================================
// 🍽️ 서빙 차수(코스) 정의
// 고기는 생으로 즉시 나가고, 손님이 굽는 동안 사이드가 뒤따라 나간다.
// ==========================================
window.MockData.kmeatServiceCourses = {
    1: {
        course: 1, key: 'first',
        label: '1차 · 생고기 + 반찬',
        desc: '손님이 바로 구울 수 있도록 생고기와 반찬·쌈채소를 최우선으로 서빙합니다.',
        icon: 'bi-lightning-charge-fill', color: '#e0362c'
    },
    2: {
        course: 2, key: 'accompany',
        label: '2차 · 곁들이 사이드',
        desc: '손님이 굽기 시작한 직후 나가는 곁들이 메뉴입니다.',
        icon: 'bi-egg-fried', color: '#f59e0b'
    },
    3: {
        course: 3, key: 'finale',
        label: '3차 · 마무리 식사',
        desc: '고기를 거의 다 구울 무렵 서빙합니다. 시간이 걸리는 찌개·냉면은 역산해서 늦게 착수합니다.',
        icon: 'bi-bowl', color: '#0891b2'
    }
};

// 서비스 타이밍 정책
window.MockData.kmeatServicePolicy = {
    // 1차(생고기+반찬) 세팅에 필요한 플레이팅 시간
    firstPlatingMinutes: 3,
    // 2차 곁들이 사이드 목표 서빙 시각 = 1차 서빙 + 이 값
    accompanyDelayMinutes: 6,
    // 손님이 1인분을 굽고 먹는 데 걸리는 평균 시간
    mealPaceMinutesPerServing: 8,
    // 3차 마무리 식사는 전체 식사 진행률이 이 비율에 도달할 때 서빙
    finaleServeRatio: 0.7,
    // 3차 최소 지연 (고기 서빙 후 최소 이만큼 뒤에 나감)
    finaleMinDelayMinutes: 12,
    // 3차 최대 지연 (너무 늦지 않도록 상한)
    finaleMaxDelayMinutes: 45
};

// 메뉴의 서빙 차수 판별
window.MockData.getKmeatServeCourse = function(manual) {
    if (!manual) return 3;
    if (manual.serveCourse) return Number(manual.serveCourse);
    return manual.group === 'meat' ? 1 : 3;
};

window.MockData.getKmeatMenuManual = function(menuId) {
    return this.kmeatMenuManuals[String(menuId)] || null;
};

// 메뉴 id 추정 (주문 항목명 기반 fallback)
window.MockData.resolveKmeatMenuId = function(item) {
    if (!item) return null;
    var directId = String(item.id || item.menuId || '');
    if (this.kmeatMenuManuals[directId]) return directId;

    var name = String(item.name || item.productName || '');
    var manuals = this.kmeatMenuManuals;
    var matchedKey = Object.keys(manuals).find(function(key) {
        return manuals[key].name === name;
    });
    if (matchedKey) return matchedKey;

    if (name.indexOf('삼겹') > -1) return 'samgyeopsal';
    if (name.indexOf('목살') > -1) return 'moksal';
    if (name.indexOf('항정') > -1) return 'hangjeong';
    if (name.indexOf('갈매기') > -1) return 'galmaegi';
    if (name.indexOf('갈비') > -1) return 'pork-galbi';
    if (name.indexOf('된장') > -1) return 'doenjang';
    if (name.indexOf('김치찌개') > -1) return 'kimchi-jjigae';
    if (name.indexOf('비빔냉면') > -1) return 'bibimnaengmyeon';
    if (name.indexOf('냉면') > -1) return 'naengmyeon';
    if (name.indexOf('계란') > -1) return 'gyeran';
    if (name.indexOf('공기밥') > -1 || name.indexOf('밥') > -1) return 'rice';
    return null;
};

// 주문 항목 → 작업(task) 목록 변환
window.MockData.buildKmeatTasks = function(items) {
    var self = this;
    var list = Array.isArray(items) ? items : [];
    var tasks = [];

    list.forEach(function(item) {
        var menuId = self.resolveKmeatMenuId(item);
        var manual = menuId ? self.kmeatMenuManuals[menuId] : null;
        if (!manual) return;
        var qty = Math.max(1, Number(item.quantity || item.qty) || 1);
        // 동일 메뉴 추가 수량은 함께 처리 가능하므로 60%만 가산
        var minutes = Math.max(1, Math.round(manual.prepMinutes * (1 + (qty - 1) * 0.6)));
        var station = manual.station;
        tasks.push({
            menuId: menuId,
            name: manual.name,
            group: manual.group,
            raw: !!manual.raw,
            course: self.getKmeatServeCourse(manual),
            station: station,
            stationLabel: (self.kmeatStations[station] || {}).label || station,
            qty: qty,
            unit: manual.unit || '개',
            minutes: minutes,
            unitMinutes: manual.prepMinutes,
            targetWeightG: manual.targetWeightG || null,
            scale: manual.scale || null,
            steps: manual.steps || [],
            cautions: manual.cautions || []
        });
    });

    return tasks;
};

// 고기 인분 수 (반찬·쌈채소 계량 기준)
window.MockData.countKmeatMeatServings = function(items) {
    var tasks = this.buildKmeatTasks(items);
    var servings = tasks.filter(function(t) { return t.group === 'meat'; })
                        .reduce(function(sum, t) { return sum + t.qty; }, 0);
    return Math.max(1, servings);
};

// ──────────────────────────────────────────
// 서빙 타임라인 계산
// 1차(생고기+반찬)를 최우선으로 내보내고, 2·3차는 목표 서빙 시각에서 역산해 착수한다.
// ──────────────────────────────────────────
window.MockData.planKmeatService = function(order) {
    var items = (order && Array.isArray(order.items)) ? order.items : [];
    var policy = this.kmeatServicePolicy;
    var tasks = this.buildKmeatTasks(items);

    var byCourse = { 1: [], 2: [], 3: [] };
    tasks.forEach(function(t) {
        var c = byCourse[t.course] ? t.course : 3;
        byCourse[c].push(t);
    });

    var meatServings = this.countKmeatMeatServings(items);
    var hasFirstCourse = byCourse[1].length > 0;
    var firstPlating = hasFirstCourse ? policy.firstPlatingMinutes : 0;

    // ── 1차: 스테이션 병렬 처리 후 플레이팅 ──
    var firstStationTotals = {};
    byCourse[1].forEach(function(t) {
        firstStationTotals[t.station] = (firstStationTotals[t.station] || 0) + t.minutes;
    });
    var firstPrepMinutes = 0;
    Object.keys(firstStationTotals).forEach(function(k) {
        if (firstStationTotals[k] > firstPrepMinutes) firstPrepMinutes = firstStationTotals[k];
    });
    var firstServeAt = hasFirstCourse ? firstPrepMinutes + firstPlating : 0;

    // ── 손님 식사 진행 예측 (생고기를 직접 굽는 시간) ──
    var totalMealMinutes = meatServings * policy.mealPaceMinutesPerServing;
    var grillFinishAt = firstServeAt + totalMealMinutes;

    // ── 2차: 1차 서빙 후 accompanyDelay 시점 목표 ──
    var accompanyServeAt = byCourse[2].length > 0
        ? firstServeAt + policy.accompanyDelayMinutes
        : null;

    // ── 3차: 식사 진행률 finaleServeRatio 시점 목표 (하한/상한 적용) ──
    var finaleServeAt = null;
    if (byCourse[3].length > 0) {
        var ratioDelay = Math.round(totalMealMinutes * policy.finaleServeRatio);
        var delay = Math.min(policy.finaleMaxDelayMinutes,
                             Math.max(policy.finaleMinDelayMinutes, ratioDelay));
        finaleServeAt = firstServeAt + delay;
    }

    return {
        tasks: tasks,
        byCourse: byCourse,
        meatServings: meatServings,
        firstPrepMinutes: firstPrepMinutes,
        firstPlatingMinutes: firstPlating,
        firstServeAt: firstServeAt,
        accompanyServeAt: accompanyServeAt,
        finaleServeAt: finaleServeAt,
        totalMealMinutes: totalMealMinutes,
        grillFinishAt: grillFinishAt
    };
};

// 주문 전체의 예측 시간 요약
window.MockData.estimateKmeatOrderTime = function(order) {
    var plan = this.planKmeatService(order);
    var lines = plan.tasks.map(function(t) {
        return {
            menuId: t.menuId, name: t.name, station: t.station,
            course: t.course, qty: t.qty,
            minutes: t.minutes, unitMinutes: t.unitMinutes
        };
    });

    var stationTotals = {};
    plan.tasks.forEach(function(t) {
        stationTotals[t.station] = (stationTotals[t.station] || 0) + t.minutes;
    });
    var bottleneckStation = null;
    var bottleneckMinutes = 0;
    Object.keys(stationTotals).forEach(function(k) {
        if (stationTotals[k] > bottleneckMinutes) {
            bottleneckMinutes = stationTotals[k];
            bottleneckStation = k;
        }
    });

    var serialMinutes = plan.tasks.reduce(function(s, t) { return s + t.minutes; }, 0)
        + plan.firstPlatingMinutes;

    // 마지막 서빙 완료 시점
    var lastServeAt = Math.max(
        plan.firstServeAt,
        plan.accompanyServeAt || 0,
        plan.finaleServeAt || 0
    );

    return {
        lines: lines,
        stationTotals: stationTotals,
        bottleneckStation: bottleneckStation,
        bottleneckMinutes: Math.round(bottleneckMinutes),
        platingMinutes: plan.firstPlatingMinutes,
        meatServings: plan.meatServings,
        // 1차(생고기) 서빙까지 걸리는 시간 = 손님 체감 대기시간
        firstServeMinutes: plan.firstServeAt,
        accompanyServeMinutes: plan.accompanyServeAt,
        finaleServeMinutes: plan.finaleServeAt,
        totalMealMinutes: plan.totalMealMinutes,
        // 주방이 마지막 접시를 내보내는 시점
        totalMinutes: lastServeAt,
        serialMinutes: Math.round(serialMinutes),
        courseCounts: {
            1: plan.byCourse[1].length,
            2: plan.byCourse[2].length,
            3: plan.byCourse[3].length
        }
    };
};

// ──────────────────────────────────────────
// 주문 접수 → 차수별 조리/서빙 순서 자동 생성
//  · 1차: 생고기 + 반찬·쌈채소 → 즉시 착수, 동시 완성
//  · 2차: 곁들이 사이드 → 목표 서빙 시각에서 역산 착수
//  · 3차: 마무리 식사(찌개·냉면·밥) → 목표 서빙 시각에서 역산 착수 (늦게 시작)
// ──────────────────────────────────────────
window.MockData.buildKmeatCookingSequence = function(order) {
    var self = this;
    var items = (order && Array.isArray(order.items)) ? order.items : [];
    var plan = this.planKmeatService(order);
    var policy = this.kmeatServicePolicy;
    var courses = [];

    if (plan.tasks.length === 0) {
        return { totalMinutes: 0, platingMinutes: 0, stationTotals: {}, sequence: [], courses: [] };
    }

    // ── 1차: 생고기 + 반찬 (동시 완성 후 플레이팅) ──
    if (plan.byCourse[1].length > 0) {
        var firstTasks = plan.byCourse[1].slice().sort(function(a, b) { return b.minutes - a.minutes; });
        var prepEnd = plan.firstPrepMinutes;
        var rows = firstTasks.map(function(task) {
            var startAt = Math.max(0, prepEnd - task.minutes);
            return { startAtMinute: startAt, finishAtMinute: startAt + task.minutes, task: task };
        });
        // 반찬·쌈채소 플레이팅
        rows.push({
            startAtMinute: prepEnd,
            finishAtMinute: prepEnd + plan.firstPlatingMinutes,
            task: self.buildKmeatPlatingTask(plan.meatServings, plan.firstPlatingMinutes)
        });
        courses.push({
            course: 1,
            meta: self.kmeatServiceCourses[1],
            serveAtMinute: plan.firstServeAt,
            rows: rows.sort(function(a, b) { return a.startAtMinute - b.startAtMinute; })
        });
    }

    // 주문이 아직 열려 있으면(추가 주문 가능) 마무리 식사는 착수 보류
    var finalized = this.isKmeatOrderFinalized(order);

    // ── 2차 / 3차: 목표 서빙 시각에서 역산 ──
    [2, 3].forEach(function(courseNo) {
        var courseTasks = plan.byCourse[courseNo];
        if (courseTasks.length === 0) return;
        var serveAt = courseNo === 2 ? plan.accompanyServeAt : plan.finaleServeAt;
        // 3차는 주문 마감 전에는 잠정 계획 (추가 주문 시 시각이 밀림)
        var held = courseNo === 3 && !finalized;

        // 같은 스테이션 작업은 순차 처리되므로 스테이션별로 역순 배치
        var stationCursor = {};
        var rows = courseTasks.slice()
            .sort(function(a, b) { return b.minutes - a.minutes; })
            .map(function(task) {
                var cursor = stationCursor[task.station];
                var finishAt = cursor === undefined ? serveAt : cursor;
                var startAt = Math.max(0, finishAt - task.minutes);
                stationCursor[task.station] = startAt;
                return {
                    startAtMinute: startAt,
                    finishAtMinute: finishAt,
                    held: held,
                    task: task
                };
            })
            .sort(function(a, b) { return a.startAtMinute - b.startAtMinute; });

        courses.push({
            course: courseNo,
            meta: self.kmeatServiceCourses[courseNo],
            serveAtMinute: serveAt,
            held: held,
            heldReason: held ? '추가 주문 대기 중 · 주문 마감 시 착수 시각 확정' : null,
            rows: rows
        });
    });

    // 평면 시퀀스 (착수 시간순 전체 목록)
    var sequence = [];
    courses.forEach(function(c) {
        c.rows.forEach(function(r) {
            sequence.push({
                course: c.course,
                courseLabel: c.meta.label,
                serveAtMinute: c.serveAtMinute,
                startAtMinute: r.startAtMinute,
                finishAtMinute: r.finishAtMinute,
                held: !!r.held,
                task: r.task
            });
        });
    });
    sequence.sort(function(a, b) {
        if (a.startAtMinute !== b.startAtMinute) return a.startAtMinute - b.startAtMinute;
        return a.course - b.course;
    });
    sequence = sequence.map(function(row, i) { return Object.assign({}, row, { order: i + 1 }); });

    var stationTotals = {};
    plan.tasks.forEach(function(t) {
        stationTotals[t.station] = (stationTotals[t.station] || 0) + t.minutes;
    });

    var lastServeAt = courses.reduce(function(max, c) {
        return Math.max(max, c.serveAtMinute || 0);
    }, 0);

    return {
        totalMinutes: lastServeAt,
        firstServeMinutes: plan.firstServeAt,
        platingMinutes: plan.firstPlatingMinutes,
        meatServings: plan.meatServings,
        totalMealMinutes: plan.totalMealMinutes,
        finalized: finalized,
        hasHeldCourse: courses.some(function(c) { return c.held; }),
        stationTotals: stationTotals,
        courses: courses,
        sequence: sequence
    };
};

// ==========================================
// 📋 주문 확정 여부 / 추가 주문(차수) 관리
// 한 번에 주문이 끝나지 않는 매장 특성 반영:
//  · 주문이 열려 있으면(추가 주문 가능) 3차 마무리 식사는 착수 보류
//  · '주문 마감'을 누르면 마무리 식사 시각을 확정해 착수
// ==========================================
window.MockData.isKmeatOrderFinalized = function(order) {
    return !!(order && order.orderFinalized);
};

// 주문의 차수 목록 (rounds가 없는 legacy 주문은 items 전체를 1차로 간주)
window.MockData.getKmeatOrderRounds = function(order) {
    if (!order) return [];
    if (Array.isArray(order.rounds) && order.rounds.length > 0) return order.rounds;
    return [{
        round: 1,
        items: Array.isArray(order.items) ? order.items : [],
        total: Number(order.total) || 0,
        orderedAt: order.orderedAt || null
    }];
};

// 추가 주문 접수 (같은 테이블에 메뉴 추가)
window.MockData.appendKmeatOrderItems = function(orderNo, newItems) {
    var orders = this.getKmeatOrders();
    var order = orders.find(function(o) { return String(o.orderNo) === String(orderNo); });
    if (!order) return null;
    if (order.status === 'cancelled') return null;

    var additions = (Array.isArray(newItems) ? newItems : []).filter(function(i) { return i && i.name; });
    if (additions.length === 0) return null;

    var rounds = this.getKmeatOrderRounds(order).slice();
    var nextRound = rounds.length + 1;
    var addTotal = additions.reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
    var now = new Date().toISOString();

    rounds.push({
        round: nextRound,
        items: additions,
        total: addTotal,
        orderedAt: now
    });

    // 병합 items (동일 메뉴는 수량 합산)
    var merged = [];
    rounds.forEach(function(r) {
        (r.items || []).forEach(function(item) {
            var found = merged.find(function(m) { return String(m.id) === String(item.id); });
            if (found) {
                found.quantity = (Number(found.quantity) || 0) + (Number(item.quantity) || 1);
                found.subtotal = (Number(found.subtotal) || 0) + (Number(item.subtotal) || 0);
            } else {
                merged.push(Object.assign({}, item));
            }
        });
    });

    var total = merged.reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
    var estimate = this.estimateKmeatOrderTime({ items: merged });

    return this.updateKmeatOrder(orderNo, {
        rounds: rounds,
        items: merged,
        total: total,
        estimatedMinutes: estimate.totalMinutes,
        firstServeMinutes: estimate.firstServeMinutes,
        lastRoundAt: now,
        // 추가 주문이 들어오면 다시 열린 상태로 (마무리 식사 시각 재계산 필요)
        orderFinalized: false
    });
};

// 주문 마감 (더 이상 추가 주문 없음 → 마무리 식사 착수 확정)
window.MockData.finalizeKmeatOrder = function(orderNo) {
    var orders = this.getKmeatOrders();
    var order = orders.find(function(o) { return String(o.orderNo) === String(orderNo); });
    if (!order) return null;
    var estimate = this.estimateKmeatOrderTime(order);
    return this.updateKmeatOrder(orderNo, {
        orderFinalized: true,
        finalizedAt: new Date().toISOString(),
        estimatedMinutes: estimate.totalMinutes,
        finaleServeMinutes: estimate.finaleServeMinutes
    });
};

// 주문 마감 해제 (추가 주문 재개)
window.MockData.reopenKmeatOrder = function(orderNo) {
    return this.updateKmeatOrder(orderNo, { orderFinalized: false, finalizedAt: null });
};

// 반찬 · 쌈채소 플레이팅 작업 생성
window.MockData.buildKmeatPlatingTask = function(servings, minutes) {
    var policy = this.kmeatBanchanPolicy;
    var sc = policy.ssamPerServing.sangchu;
    var kk = policy.ssamPerServing.kkaennip;
    var n = Math.max(1, Number(servings) || 1);
    return {
        menuId: '__plating__',
        name: '반찬 · 쌈채소 세팅 및 불판 준비',
        group: 'prep',
        course: 1,
        station: 'rice',
        stationLabel: (this.kmeatStations.rice || {}).label || '밥·반찬 준비',
        qty: n,
        unit: '인분',
        minutes: Math.max(1, Number(minutes) || 3),
        steps: [
            { step: 1, minutes: 1, text: '반찬 ' + policy.banchanCount + '종 세팅: '
                + policy.banchanList.map(function(b) { return b.name + ' ' + b.amount; }).join(', ') },
            { step: 2, minutes: 1, text: '상추 ' + (sc.gramsPerServing * n) + 'g(약 ' + (sc.countPerServing * n) + '장), '
                + '깻잎 ' + (kk.gramsPerServing * n) + 'g(약 ' + (kk.countPerServing * n) + '장) 계량' },
            { step: 3, minutes: 1, text: '쌈장 종지 ' + n + '개, 불판·집게·가위 세팅 확인 후 생고기와 함께 서빙' }
        ],
        cautions: ['쌈채소는 물기 제거 후 담기', '반찬은 주문 시점에 새로 담기', '불판 예열은 손님 착석 후 점화']
    };
};

// K-Meat 주문 제한 설정 저장/조회 (기본 10분당 1건)
window.MockData.KMEAT_ORDER_SETTINGS_KEY = 'kmeat_order_settings';

window.MockData.getKmeatOrderSettings = function() {
    var defaults = this.kmeatOrderSettings || { intervalMinutes: 10, maxQtyPerInterval: 1 };
    try {
        var stored = JSON.parse(localStorage.getItem(this.KMEAT_ORDER_SETTINGS_KEY) || 'null');
        if (stored && typeof stored === 'object') {
            return {
                intervalMinutes: Math.max(1, Math.floor(Number(stored.intervalMinutes) || defaults.intervalMinutes)),
                maxQtyPerInterval: Math.max(1, Math.floor(Number(stored.maxQtyPerInterval) || defaults.maxQtyPerInterval))
            };
        }
    } catch (e) {}
    return {
        intervalMinutes: Math.max(1, Math.floor(Number(defaults.intervalMinutes) || 10)),
        maxQtyPerInterval: Math.max(1, Math.floor(Number(defaults.maxQtyPerInterval) || 1))
    };
};

window.MockData.setKmeatOrderSettings = function(settings) {
    var normalized = {
        intervalMinutes: Math.max(1, Math.floor(Number(settings && settings.intervalMinutes) || 10)),
        maxQtyPerInterval: Math.max(1, Math.floor(Number(settings && settings.maxQtyPerInterval) || 1))
    };
    try {
        localStorage.setItem(this.KMEAT_ORDER_SETTINGS_KEY, JSON.stringify(normalized));
        window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    return normalized;
};

// ==========================================
// 🥩 K-Meat 주문 저장소 접근 (bulgogi_order_history 단일 소스)
// ==========================================
window.MockData.KMEAT_ORDER_HISTORY_KEY = 'bulgogi_order_history';

window.MockData.getKmeatOrders = function() {
    var orders = [];
    try {
        var parsed = JSON.parse(localStorage.getItem(this.KMEAT_ORDER_HISTORY_KEY) || '[]');
        if (Array.isArray(parsed)) orders = parsed;
    } catch (e) {}
    return orders
        .filter(function(o) { return o && o.orderNo; })
        .sort(function(a, b) {
            return (Date.parse(b.orderedAt || '') || 0) - (Date.parse(a.orderedAt || '') || 0);
        });
};

window.MockData.updateKmeatOrder = function(orderNo, updates) {
    var orders = [];
    try {
        var parsed = JSON.parse(localStorage.getItem(this.KMEAT_ORDER_HISTORY_KEY) || '[]');
        if (Array.isArray(parsed)) orders = parsed;
    } catch (e) {}

    var updated = null;
    var next = orders.map(function(o) {
        if (o && String(o.orderNo) === String(orderNo)) {
            updated = Object.assign({}, o, updates || {});
            return updated;
        }
        return o;
    });

    try {
        localStorage.setItem(this.KMEAT_ORDER_HISTORY_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    return updated;
};

// K-Meat 주방 상태 라벨 (주문완료 → 조리대기 → 조리완료 → 수령대기 → 수령완료)
window.MockData.KMEAT_KITCHEN_FLOW = [
    { key: 'ordered',   label: '주문완료', icon: 'bi-receipt',            next: 'queued' },
    { key: 'queued',    label: '조리대기', icon: 'bi-hourglass-split',    next: 'cooked' },
    { key: 'cooked',    label: '조리완료', icon: 'bi-fire',               next: 'pickup_wait' },
    { key: 'pickup_wait', label: '수령대기', icon: 'bi-bell',             next: 'received' },
    { key: 'received',  label: '수령완료', icon: 'bi-check-circle-fill',  next: null }
];

window.MockData.getKmeatFlowStage = function(stageKey) {
    var flow = this.KMEAT_KITCHEN_FLOW;
    return flow.find(function(s) { return s.key === String(stageKey); }) || flow[0];
};

// ==========================================
// 👷 K-Meat 작업자(근로자) 단말 지원 데이터 / API
// kmeat-ex.html (체험) · kmeat-real.html (실제 작업) 공용
// ==========================================

// 작업자가 선택할 수 있는 담당 포지션
window.MockData.kmeatWorkerStations = {
    butcher: {
        key: 'butcher', label: '정육·계량대', short: '고기 계량',
        icon: 'bi-speedometer2', color: '#e0362c',
        desc: '생고기를 저울에 계량하고 접시에 담습니다. 굽지 않습니다.',
        handles: ['butcher']
    },
    soup: {
        key: 'soup', label: '화구 조리 (탕·찌개)', short: '화구 조리',
        icon: 'bi-fire', color: '#f59e0b',
        desc: '된장찌개·김치찌개·계란찜을 화구에서 조리합니다.',
        handles: ['soup']
    },
    cold: {
        key: 'cold', label: '냉면 코너', short: '냉면',
        icon: 'bi-snow', color: '#0891b2',
        desc: '면을 삶고 얼음물에 헹궈 냉면을 완성합니다.',
        handles: ['cold']
    },
    prep: {
        key: 'prep', label: '반찬·밥 준비', short: '반찬 덜기',
        icon: 'bi-basket-fill', color: '#10b981',
        desc: '반찬 5종을 덜고 상추·깻잎을 계량합니다. 공기밥을 담습니다.',
        handles: ['rice']
    },
    serving: {
        key: 'serving', label: '홀 서빙', short: '서빙',
        icon: 'bi-person-walking', color: '#7c3aed',
        desc: '완성된 접시를 지정된 테이블로 서빙합니다.',
        handles: []
    },
    dish: {
        key: 'dish', label: '설겆이', short: '설겆이',
        icon: 'bi-droplet-fill', color: '#2563eb',
        desc: '사용이 끝난 그릇과 불판을 세척합니다.',
        handles: []
    }
};

// 작업 태스크의 고유 키 (주문 내 식별자)
window.MockData.getKmeatTaskKey = function(task) {
    if (!task) return '';
    return String(task.menuId || task.id || task.name || '');
};

// 주문의 태스크 진행 상황 조회
window.MockData.getKmeatTaskProgress = function(order) {
    if (!order || !order.taskProgress || typeof order.taskProgress !== 'object') return {};
    return order.taskProgress;
};

window.MockData.isKmeatTaskDone = function(order, taskKey) {
    var progress = this.getKmeatTaskProgress(order);
    var entry = progress[String(taskKey)];
    return !!(entry && entry.done);
};

// 태스크 완료 기록 (저울 계량값 등 부가정보 포함 가능)
window.MockData.markKmeatTaskDone = function(orderNo, taskKey, payload) {
    var orders = this.getKmeatOrders();
    var order = orders.find(function(o) { return String(o.orderNo) === String(orderNo); });
    if (!order) return null;

    var progress = Object.assign({}, this.getKmeatTaskProgress(order));
    progress[String(taskKey)] = Object.assign({
        done: true,
        doneAt: new Date().toISOString()
    }, payload || {});

    return this.updateKmeatOrder(orderNo, { taskProgress: progress });
};

// 태스크 완료 취소 (되돌리기)
window.MockData.unmarkKmeatTask = function(orderNo, taskKey) {
    var orders = this.getKmeatOrders();
    var order = orders.find(function(o) { return String(o.orderNo) === String(orderNo); });
    if (!order) return null;
    var progress = Object.assign({}, this.getKmeatTaskProgress(order));
    delete progress[String(taskKey)];
    return this.updateKmeatOrder(orderNo, { taskProgress: progress });
};

// 특정 차수의 모든 태스크가 완료되었는지
window.MockData.isKmeatCourseReady = function(order, course) {
    var plan = this.buildKmeatCookingSequence(order);
    var target = (plan.courses || []).find(function(c) { return c.course === Number(course); });
    if (!target || target.rows.length === 0) return false;
    var self = this;
    return target.rows.every(function(row) {
        return self.isKmeatTaskDone(order, self.getKmeatTaskKey(row.task));
    });
};

// 서빙 완료된 차수 목록
window.MockData.getKmeatServedCourses = function(order) {
    if (!order || !Array.isArray(order.servedCourses)) return [];
    return order.servedCourses.map(Number);
};

window.MockData.isKmeatCourseServed = function(order, course) {
    return this.getKmeatServedCourses(order).indexOf(Number(course)) > -1;
};

// 차수 서빙 완료 처리 (테이블에 내보냄)
window.MockData.serveKmeatCourse = function(orderNo, course) {
    var orders = this.getKmeatOrders();
    var order = orders.find(function(o) { return String(o.orderNo) === String(orderNo); });
    if (!order) return null;

    var served = this.getKmeatServedCourses(order).slice();
    if (served.indexOf(Number(course)) < 0) served.push(Number(course));

    var log = Array.isArray(order.serveLog) ? order.serveLog.slice() : [];
    log.push({ course: Number(course), servedAt: new Date().toISOString() });

    return this.updateKmeatOrder(orderNo, { servedCourses: served, serveLog: log });
};

// 주문의 모든 차수가 서빙 완료되었는지
window.MockData.isKmeatOrderFullyServed = function(order) {
    var plan = this.buildKmeatCookingSequence(order);
    var courses = (plan.courses || []).map(function(c) { return c.course; });
    if (courses.length === 0) return false;
    var self = this;
    return courses.every(function(c) { return self.isKmeatCourseServed(order, c); });
};

// 작업자 담당 포지션에서 처리해야 할 태스크 목록 추출
// 반환: [{ orderNo, tableId, course, courseLabel, serveAtMinute, held, task, taskKey, done, elapsedMinutes, dueInMinutes }]
window.MockData.getKmeatStationTasks = function(stationKey) {
    var self = this;
    var station = this.kmeatWorkerStations[String(stationKey)];
    if (!station) return [];
    var handles = station.handles || [];
    var result = [];

    this.getKmeatOrders().forEach(function(order) {
        if (!order || order.status === 'cancelled') return;
        var stage = order.kitchenStage || 'ordered';
        if (stage === 'received' || stage === 'cancelled') return;

        var plan = self.buildKmeatCookingSequence(order);
        var orderedAt = Date.parse(order.orderedAt || '') || Date.now();
        var elapsed = Math.floor((Date.now() - orderedAt) / 60000);

        (plan.courses || []).forEach(function(c) {
            // 이미 서빙된 차수는 제외
            if (self.isKmeatCourseServed(order, c.course)) return;
            c.rows.forEach(function(row) {
                var task = row.task;
                if (handles.indexOf(task.station) < 0) return;
                var taskKey = self.getKmeatTaskKey(task);
                result.push({
                    orderNo: order.orderNo,
                    tableId: order.tableId || '테이블 미지정',
                    course: c.course,
                    courseLabel: (c.meta || {}).label || ('차수 ' + c.course),
                    courseColor: (c.meta || {}).color || '#64748b',
                    serveAtMinute: c.serveAtMinute,
                    held: !!row.held,
                    startAtMinute: row.startAtMinute,
                    task: task,
                    taskKey: taskKey,
                    done: self.isKmeatTaskDone(order, taskKey),
                    elapsedMinutes: elapsed,
                    // 남은 여유 시간 (음수면 지연)
                    dueInMinutes: (c.serveAtMinute || 0) - elapsed
                });
            });
        });
    });

    // 지연된 것 우선, 그 다음 착수 시각 순
    return result.sort(function(a, b) {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return a.dueInMinutes - b.dueInMinutes;
    });
};

// 서빙 담당이 볼 목록: 조리 완료되어 나갈 준비가 된 차수
window.MockData.getKmeatServeQueue = function() {
    var self = this;
    var queue = [];
    this.getKmeatOrders().forEach(function(order) {
        if (!order || order.status === 'cancelled') return;
        var stage = order.kitchenStage || 'ordered';
        if (stage === 'received' || stage === 'cancelled') return;

        var plan = self.buildKmeatCookingSequence(order);
        var orderedAt = Date.parse(order.orderedAt || '') || Date.now();
        var elapsed = Math.floor((Date.now() - orderedAt) / 60000);

        (plan.courses || []).forEach(function(c) {
            if (self.isKmeatCourseServed(order, c.course)) return;
            var ready = c.rows.every(function(row) {
                return self.isKmeatTaskDone(order, self.getKmeatTaskKey(row.task));
            });
            queue.push({
                orderNo: order.orderNo,
                tableId: order.tableId || '테이블 미지정',
                course: c.course,
                courseLabel: (c.meta || {}).label || ('차수 ' + c.course),
                courseColor: (c.meta || {}).color || '#64748b',
                courseIcon: (c.meta || {}).icon || 'bi-circle',
                serveAtMinute: c.serveAtMinute,
                held: !!c.held,
                ready: ready,
                itemNames: c.rows.map(function(r) { return r.task.name; }),
                doneCount: c.rows.filter(function(r) {
                    return self.isKmeatTaskDone(order, self.getKmeatTaskKey(r.task));
                }).length,
                totalCount: c.rows.length,
                elapsedMinutes: elapsed,
                dueInMinutes: (c.serveAtMinute || 0) - elapsed
            });
        });
    });
    return queue.sort(function(a, b) {
        if (a.ready !== b.ready) return a.ready ? -1 : 1;
        return a.dueInMinutes - b.dueInMinutes;
    });
};

// ── 설겆이 대기열 ──
window.MockData.KMEAT_DISH_QUEUE_KEY = 'kmeat_dish_queue';

window.MockData.getKmeatDishQueue = function() {
    var defaults = { pending: 0, washed: 0, lastWashedAt: null, seededOrders: [] };
    try {
        var parsed = JSON.parse(localStorage.getItem(this.KMEAT_DISH_QUEUE_KEY) || 'null');
        if (parsed && typeof parsed === 'object') {
            return {
                pending: Math.max(0, Number(parsed.pending) || 0),
                washed: Math.max(0, Number(parsed.washed) || 0),
                lastWashedAt: parsed.lastWashedAt || null,
                seededOrders: Array.isArray(parsed.seededOrders) ? parsed.seededOrders : []
            };
        }
    } catch (e) {}
    return defaults;
};

window.MockData.saveKmeatDishQueue = function(queue) {
    try {
        localStorage.setItem(this.KMEAT_DISH_QUEUE_KEY, JSON.stringify(queue));
        window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    return queue;
};

// 서빙 완료된 주문에서 사용된 그릇 수를 설겆이 대기열에 반영 (주문당 1회)
window.MockData.syncKmeatDishQueue = function() {
    var queue = this.getKmeatDishQueue();
    var seeded = queue.seededOrders.slice();
    var added = 0;

    this.getKmeatOrders().forEach(function(order) {
        if (!order || order.status === 'cancelled') return;
        if ((order.kitchenStage || '') !== 'received') return;
        if (seeded.indexOf(String(order.orderNo)) > -1) return;
        var items = Array.isArray(order.items) ? order.items : [];
        // 접시 = 메뉴 수 + 반찬 5종 + 불판 1
        var dishes = items.reduce(function(s, i) {
            return s + Math.max(1, Number(i.quantity) || 1);
        }, 0) + 6;
        queue.pending += dishes;
        added += dishes;
        seeded.push(String(order.orderNo));
    });

    if (added > 0) {
        queue.seededOrders = seeded;
        this.saveKmeatDishQueue(queue);
    }
    return queue;
};

window.MockData.washKmeatDishes = function(count) {
    var queue = this.getKmeatDishQueue();
    var n = Math.max(1, Math.min(queue.pending, Math.floor(Number(count) || 1)));
    queue.pending = Math.max(0, queue.pending - n);
    queue.washed += n;
    queue.lastWashedAt = new Date().toISOString();
    this.saveKmeatDishQueue(queue);
    return { washed: n, queue: queue };
};

// ── 작업자 활동 로그 ──
window.MockData.KMEAT_WORKER_LOG_KEY = 'kmeat_worker_logs';

window.MockData.getKmeatWorkerLogs = function(mode) {
    var key = this.KMEAT_WORKER_LOG_KEY + '_' + (mode || 'real');
    try {
        var parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.addKmeatWorkerLog = function(mode, entry) {
    var key = this.KMEAT_WORKER_LOG_KEY + '_' + (mode || 'real');
    var logs = this.getKmeatWorkerLogs(mode);
    var now = new Date();
    logs.push(Object.assign({
        time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
            + ':' + String(now.getSeconds()).padStart(2, '0'),
        createdAt: now.toISOString()
    }, entry || {}));
    if (logs.length > 300) logs.shift();
    try {
        localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) {}
    return logs;
};

window.MockData.clearKmeatWorkerLogs = function(mode) {
    var key = this.KMEAT_WORKER_LOG_KEY + '_' + (mode || 'real');
    try { localStorage.removeItem(key); } catch (e) {}
    return [];
};

// ══════════════════════════════════════════════════════════════
//  도움 요청 (작업자 단말 → 매니저 콘솔)
//  kmeat-real / kmeat-ex 의 [휴식·QR] 탭에서 요청 → kmanager 에서 완료 처리
// ══════════════════════════════════════════════════════════════
window.MockData.KMEAT_HELP_KEY = 'kmeat_help_requests';

window.MockData.getKmeatHelpRequests = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.KMEAT_HELP_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.saveKmeatHelpRequests = function(list) {
    var arr = Array.isArray(list) ? list : [];
    if (arr.length > 200) arr = arr.slice(arr.length - 200);
    try { localStorage.setItem(this.KMEAT_HELP_KEY, JSON.stringify(arr)); } catch (e) {}
    return arr;
};

// 진행 중(미해결) 요청 목록
window.MockData.getKmeatHelpPending = function() {
    return this.getKmeatHelpRequests().filter(function(r) {
        return r && r.status === 'pending';
    });
};

// 특정 작업자의 진행 중 요청 (중복 요청 방지 · 작업자 화면 상태 표시용)
window.MockData.getKmeatHelpPendingFor = function(mode, workerId) {
    var m = mode || 'real';
    var wid = String(workerId === undefined || workerId === null ? '' : workerId);
    var hit = this.getKmeatHelpRequests().filter(function(r) {
        return r && r.status === 'pending' && (r.mode || 'real') === m && String(r.workerId) === wid;
    });
    return hit.length ? hit[hit.length - 1] : null;
};

window.MockData.getKmeatHelpRequest = function(id) {
    var hit = this.getKmeatHelpRequests().filter(function(r) { return r && r.id === id; });
    return hit.length ? hit[0] : null;
};

/**
 * 도움 요청 생성
 * @param {Object} payload { mode, workerId, workerName, station, stationLabel, reason }
 * @returns {Object} { ok, request, error }
 */
window.MockData.createKmeatHelpRequest = function(payload) {
    var p = payload || {};
    var mode = p.mode || 'real';
    var workerId = String(p.workerId === undefined || p.workerId === null ? 'guest' : p.workerId);

    var already = this.getKmeatHelpPendingFor(mode, workerId);
    if (already) return { ok: false, error: 'pending', request: already };

    var now = new Date();
    var req = {
        id: 'help-' + now.getTime() + '-' + Math.floor(Math.random() * 1000),
        mode: mode,
        workerId: workerId,
        workerName: p.workerName || '작업자',
        station: p.station || null,
        stationLabel: p.stationLabel || '',
        reason: p.reason || '작업 도움 요청',
        status: 'pending',
        createdAt: now.toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        durationSec: null
    };

    var list = this.getKmeatHelpRequests();
    list.push(req);
    this.saveKmeatHelpRequests(list);

    if (this.addKmeatWorkerLog) {
        this.addKmeatWorkerLog(mode, {
            text: '[도움요청] 매니저에게 도움을 요청했습니다.'
                + (req.stationLabel ? ' (' + req.stationLabel + ')' : ''),
            kind: 'warn'
        });
    }
    return { ok: true, request: req };
};

/**
 * 도움 요청 해결(완료) 처리 — 매니저 콘솔 또는 작업자 단말에서 호출
 * @param {String} id
 * @param {String} by 처리자 표기 (예: '매니저 김철수')
 */
window.MockData.resolveKmeatHelpRequest = function(id, by) {
    var list = this.getKmeatHelpRequests();
    var target = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) { target = list[i]; break; }
    }
    if (!target) return { ok: false, error: 'notfound' };
    if (target.status !== 'pending') return { ok: false, error: 'already', request: target };

    var now = new Date();
    target.status = 'resolved';
    target.resolvedAt = now.toISOString();
    target.resolvedBy = by || '매니저';
    target.durationSec = Math.max(0, Math.floor((now.getTime() - new Date(target.createdAt).getTime()) / 1000));
    this.saveKmeatHelpRequests(list);

    if (this.addKmeatWorkerLog) {
        this.addKmeatWorkerLog(target.mode || 'real', {
            text: '[도움요청] 해결 완료 처리 (' + target.resolvedBy + ') · 소요 '
                + Math.floor(target.durationSec / 60) + '분 ' + (target.durationSec % 60) + '초',
            kind: 'ok'
        });
    }
    return { ok: true, request: target };
};

// 작업자가 잘못 눌렀을 때 요청 취소
window.MockData.cancelKmeatHelpRequest = function(id) {
    var list = this.getKmeatHelpRequests();
    var target = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) { target = list[i]; break; }
    }
    if (!target) return { ok: false, error: 'notfound' };
    if (target.status !== 'pending') return { ok: false, error: 'already', request: target };

    target.status = 'cancelled';
    target.resolvedAt = new Date().toISOString();
    this.saveKmeatHelpRequests(list);

    if (this.addKmeatWorkerLog) {
        this.addKmeatWorkerLog(target.mode || 'real', {
            text: '[도움요청] 요청을 취소했습니다.',
            kind: 'info'
        });
    }
    return { ok: true, request: target };
};

window.MockData.clearKmeatHelpRequests = function() {
    try { localStorage.removeItem(this.KMEAT_HELP_KEY); } catch (e) {}
    return [];
};

// 저울 계량 판정
window.MockData.judgeKmeatWeight = function(menuId, grams) {
    var manual = this.getKmeatMenuManual(menuId);
    if (!manual || !manual.scale) {
        return { ok: true, message: '계량 기준이 없는 메뉴입니다.', target: null };
    }
    var g = Number(grams);
    var s = manual.scale;
    if (!Number.isFinite(g)) {
        return { ok: false, message: '무게를 입력해주세요.', target: s.target, min: s.min, max: s.max };
    }
    if (g < s.min) {
        return {
            ok: false, low: true, target: s.target, min: s.min, max: s.max, value: g,
            message: '부족합니다. ' + (s.min - g).toFixed(0) + 'g 더 담아주세요. (목표 ' + s.target + 'g)'
        };
    }
    if (g > s.max) {
        return {
            ok: false, high: true, target: s.target, min: s.min, max: s.max, value: g,
            message: '초과했습니다. ' + (g - s.max).toFixed(0) + 'g 덜어주세요. (목표 ' + s.target + 'g)'
        };
    }
    return {
        ok: true, target: s.target, min: s.min, max: s.max, value: g,
        message: '합격! ' + g + 'g (허용 ' + s.min + '~' + s.max + 'g)'
    };
};

// 반찬 덜기 체크리스트 (인분 수 반영)
window.MockData.buildKmeatBanchanChecklist = function(servings) {
    var policy = this.kmeatBanchanPolicy;
    var n = Math.max(1, Number(servings) || 1);
    var list = policy.banchanList.map(function(b, i) {
        return {
            key: 'banchan_' + i,
            name: b.name,
            amount: b.amount,
            note: b.note,
            type: 'banchan'
        };
    });
    var sc = policy.ssamPerServing.sangchu;
    var kk = policy.ssamPerServing.kkaennip;
    list.push({
        key: 'ssam_sangchu', name: sc.name, type: 'ssam',
        amount: (sc.gramsPerServing * n) + 'g (약 ' + (sc.countPerServing * n) + '장)',
        note: sc.note, grams: sc.gramsPerServing * n
    });
    list.push({
        key: 'ssam_kkaennip', name: kk.name, type: 'ssam',
        amount: (kk.gramsPerServing * n) + 'g (약 ' + (kk.countPerServing * n) + '장)',
        note: kk.note, grams: kk.gramsPerServing * n
    });
    list.push({
        key: 'ssamjang', name: '쌈장 종지', type: 'etc',
        amount: n + '개', note: '1인 1종지'
    });
    return { servings: n, items: list };
};

// ==========================================
// 🧹 K-Meat 주문 전체 삭제 (데모/초기화용)
// 주문은 여러 저장소에 미러링되어 있으므로 함께 정리해야 잔여 데이터가 남지 않는다.
//   1) bulgogi_order_history        : 주문 원본
//   2) kimp_shop_history            : 마이페이지/주문내역 미러 레코드
//   3) kimp_settlement_transactions : 정산 차감 트랜잭션 (잔액 복구)
//   4) user_settlement_log_*        : 정산 결제 로그 (잔액 복구)
//   5) kmeat_dish_queue             : 설겆이 대기열
//   6) bulgogi_payment_history      : 결제 이력
// ==========================================
window.MockData.clearKmeatOrders = function(options) {
    var opts = options || {};
    var removed = {
        orders: 0, shopRecords: 0, settlements: 0,
        settlementLogs: 0, dishes: 0, payments: 0, logs: 0
    };

    // 1) 주문 원본
    try {
        var orders = JSON.parse(localStorage.getItem(this.KMEAT_ORDER_HISTORY_KEY) || '[]');
        removed.orders = Array.isArray(orders) ? orders.length : 0;
        localStorage.removeItem(this.KMEAT_ORDER_HISTORY_KEY);
    } catch (e) {}

    // 2) kimp_shop_history 에서 K-Meat 레코드 제거
    try {
        var hist = JSON.parse(localStorage.getItem('kimp_shop_history') || '[]');
        if (Array.isArray(hist)) {
            var kept = hist.filter(function(r) {
                if (!r) return false;
                if (String(r.id || '').indexOf('bulgogi_') === 0) return false;
                if (String(r.workId) === '6') return false;
                if (String(r.productId || '') === 'bulgogi_dine_in') return false;
                return true;
            });
            removed.shopRecords = hist.length - kept.length;
            localStorage.setItem('kimp_shop_history', JSON.stringify(kept));
        }
    } catch (e) {}

    // 3) 정산 트랜잭션 제거 (정산금액 복구)
    try {
        var txns = JSON.parse(localStorage.getItem('kimp_settlement_transactions') || '[]');
        if (Array.isArray(txns)) {
            var keptTx = txns.filter(function(t) {
                if (!t) return false;
                if (String(t.workId) === '6') return false;
                if (String(t.orderId || '').indexOf('bulgogi_') === 0) return false;
                if (String(t.id || '').indexOf('shop-spend:bulgogi_') === 0) return false;
                if (String(t.productId || '') === 'bulgogi_dine_in') return false;
                if (/^KM-/.test(String(t.orderNo || ''))) return false;
                return true;
            });
            removed.settlements = txns.length - keptTx.length;
            localStorage.setItem('kimp_settlement_transactions', JSON.stringify(keptTx));
        }
    } catch (e) {}

    // 4) 회원별 정산 결제 로그에서 K-Meat 항목 제거
    try {
        var prefix = this.SETTLEMENT_LOG_KEY_PREFIX;
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf(prefix) === 0) keys.push(k);
        }
        keys.forEach(function(key) {
            try {
                var logs = JSON.parse(localStorage.getItem(key) || '[]');
                if (!Array.isArray(logs)) return;
                var keptLogs = logs.filter(function(l) {
                    if (!l) return false;
                    if (String(l.workId) === '6') return false;
                    if (String(l.id || '').indexOf('settle_bulgogi_') === 0) return false;
                    if (/^KM-/.test(String(l.orderNo || ''))) return false;
                    return true;
                });
                removed.settlementLogs += logs.length - keptLogs.length;
                localStorage.setItem(key, JSON.stringify(keptLogs));
            } catch (e) {}
        });
    } catch (e) {}

    // 5) 설겆이 대기열 초기화
    try {
        var dq = this.getKmeatDishQueue();
        removed.dishes = dq.pending;
        this.saveKmeatDishQueue({ pending: 0, washed: 0, lastWashedAt: null, seededOrders: [] });
    } catch (e) {}

    // 6) 결제 이력
    try {
        var pay = JSON.parse(localStorage.getItem('bulgogi_payment_history') || '[]');
        removed.payments = Array.isArray(pay) ? pay.length : 0;
        localStorage.removeItem('bulgogi_payment_history');
    } catch (e) {}

    // (선택) 작업자 로그도 함께 초기화
    if (opts.clearWorkerLogs) {
        try {
            removed.logs = this.getKmeatWorkerLogs('ex').length + this.getKmeatWorkerLogs('real').length;
            this.clearKmeatWorkerLogs('ex');
            this.clearKmeatWorkerLogs('real');
        } catch (e) {}
    }

    // 손님 화면의 활성 주문 표시 상태도 정리
    try {
        localStorage.removeItem('activeOrderNo_current');
    } catch (e) {}

    try {
        window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return removed;
};


// ══════════════════════════════════════════════════════════════
//  🍔 버거팩토리 (BurgerQueen · workId 7) 공용 데이터 레이어
//  burger-real.html (작업자 단말) ↔ bmanager.html (관리자 콘솔) 공유
// ══════════════════════════════════════════════════════════════
window.MockData.BURGER_WORK_ID = 7;
window.MockData.BURGER_ORDER_KEY = 'burger_order_history';
window.MockData.BURGER_INVENTORY_KEY = 'burger_inventory';
window.MockData.BURGER_INVENTORY_LOG_KEY = 'burger_inventory_log';
window.MockData.BURGER_STAFF_KEY = 'burger_staff_status';
window.MockData.BURGER_HELP_KEY = 'burger_help_requests';
window.MockData.BURGER_WORKER_LOG_KEY = 'burger_worker_logs';
window.MockData.BURGER_HOURLY_WAGE = 9860;

// 판매 메뉴 · 가격
window.MockData.burgerMenus = {
    '치즈버거':   { price: 5500, type: 'burger' },
    '불고기버거': { price: 5000, type: 'burger' },
    '새우버거':   { price: 5800, type: 'burger' },
    '햄버거':     { price: 4500, type: 'burger' },
    '감자튀김':   { price: 2500, type: 'fries'  },
    '콜라':       { price: 1800, type: 'drink'  },
    '사이다':     { price: 1800, type: 'drink'  }
};
window.MockData.BURGER_SET_EXTRA = 3000; // (구) 세트 추가금 · 현재는 세트 가격을 직접 관리한다
window.MockData.BURGER_PRICE_KEY = 'burger_menu_prices';

// 메뉴 기본 가격 (bmanager.html [메뉴·가격] 에서 변경 가능 · 단품 / 세트)
window.MockData.burgerMenuPriceDefaults = {
    '치즈버거':   { single: 3000, set: 4000 },
    '불고기버거': { single: 3000, set: 4000 },
    '햄버거':     { single: 2000, set: 3000 },
    '새우버거':   { single: 3000, set: 4000 },
    '감자튀김':   { single: 2000, set: null },
    '콜라':       { single: 1500, set: null },
    '사이다':     { single: 1500, set: null }
};

// 고객 주문 화면(burger_order.html) 용 메뉴 정보
window.MockData.burgerMenuMeta = {
    '치즈버거': {
        img: './images/burger_set_cheese.png',
        summary: '두툼한 소고기 패티에 체다치즈를 녹여 얹은 버거퀸의 치즈버거 세트.',
        components: ['버거번', '소고기 패티 1장', '체다치즈', '양상추', '피클 3장', '마요네즈', '감자튀김', '콜라/사이다'],
        cook: '그릴 180℃에서 앞뒤 1분 30초씩 구워 중심온도 74℃를 확인한 뒤 조립합니다.',
        allergy: '밀 · 우유 · 대두 · 계란 함유'
    },
    '불고기버거': {
        img: './images/burger_set_bulgogi.png',
        summary: '달콤한 불고기 양념 패티에 특제 소스를 끼얹은 인기 불고기버거 세트.',
        components: ['버거번', '불고기 패티 1장', '양상추', '불고기소스', '마요네즈', '감자튀김', '콜라/사이다'],
        cook: '그릴 170℃에서 구운 뒤 불고기소스를 끼얹어 30초간 졸여 광을 냅니다.',
        allergy: '밀 · 대두 · 계란 함유'
    },
    '햄버거': {
        img: './images/burger_set_hamburger.png',
        summary: '긴 빵에 통통한 소시지와 상큼한 케찹이 뿌려진 햄버거 세트.',
        components: ['긴 버거번', '소시지 1개', '케찹', '피클', '양상추', '감자튀김', '콜라/사이다'],
        cook: '긴 빵을 노릇하게 구운 뒤 소시지를 올리고 케찹을 예쁘게 뿌려 조립합니다.',
        allergy: '밀 · 대두 · 돼지고기 · 계란 함유'
    },
    '새우버거': {
        img: './images/burger_set_shrimp.png',
        summary: '통새우살 패티를 바삭하게 튀겨 타르타르소스와 맞춘 새우버거 세트.',
        components: ['버거번', '새우 패티 1장', '양상추', '피클 3장', '타르타르소스', '감자튀김', '콜라/사이다'],
        cook: '175℃ 기름에 3분 튀긴 뒤 10초 드레인해 튀김옷을 살립니다.',
        allergy: '밀 · 새우 · 계란 함유'
    },
    '감자튀김': {
        img: './images/burger_family.png',
        summary: '175℃에서 3분 튀긴 뒤 10초 드레인한 바삭한 감자튀김.',
        components: ['냉동감자 150g', '소금'],
        cook: '바스켓의 1/2 이하만 채워 3분 튀기고 10초 드레인합니다.',
        allergy: '밀 함유 가능'
    },
    '콜라': {
        img: './images/burger_500.png',
        summary: '얼음을 2/3까지 채워 제공하는 시원한 콜라.',
        components: ['콜라 300ml', '얼음'],
        cook: '컵을 45° 기울여 따르고 마지막에 세워 거품을 정리합니다.',
        allergy: '-'
    },
    '사이다': {
        img: './images/burger_500.png',
        summary: '깔끔한 청량감의 사이다.',
        components: ['사이다 300ml', '얼음'],
        cook: '컵을 45° 기울여 따르고 마지막에 세워 거품을 정리합니다.',
        allergy: '-'
    }
};

// 세트 구성 (버거 + 감자튀김 + 음료)
window.MockData.BURGER_SET_COMPONENTS = ['버거 1개', '감자튀김', '음료 1잔'];

window.MockData.getBurgerMenuPrices = function() {
    var defaults = this.burgerMenuPriceDefaults;
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(this.BURGER_PRICE_KEY) || 'null'); } catch (e) {}
    var out = {};
    Object.keys(defaults).forEach(function(k) {
        var d = defaults[k];
        var s = (saved && saved[k]) || {};
        out[k] = {
            single: Number.isFinite(Number(s.single)) ? Number(s.single) : d.single,
            set: (d.set === null) ? null
                : (Number.isFinite(Number(s.set)) ? Number(s.set) : d.set)
        };
    });
    return out;
};

window.MockData.saveBurgerMenuPrices = function(prices) {
    try { localStorage.setItem(this.BURGER_PRICE_KEY, JSON.stringify(prices || {})); } catch (e) {}
    return this.getBurgerMenuPrices();
};

window.MockData.setBurgerMenuPrice = function(menu, single, set) {
    var prices = this.getBurgerMenuPrices();
    if (!prices[menu]) return { ok: false, error: 'notfound' };
    var s = Math.max(0, Math.floor(Number(single) || 0));
    prices[menu].single = s;
    if (prices[menu].set !== null) {
        prices[menu].set = Math.max(0, Math.floor(Number(set) || 0));
    }
    this.saveBurgerMenuPrices(prices);
    return { ok: true, price: prices[menu] };
};

window.MockData.resetBurgerMenuPrices = function() {
    try { localStorage.removeItem(this.BURGER_PRICE_KEY); } catch (e) {}
    return this.getBurgerMenuPrices();
};

// 단품/세트 단가
window.MockData.getBurgerUnitPrice = function(menu, isSet) {
    var p = this.getBurgerMenuPrices()[menu];
    if (!p) return 0;
    if (isSet && p.set !== null) return p.set;
    return p.single;
};

// 세트 판매 가능한 버거 메뉴인지
window.MockData.isBurgerSetMenu = function(menu) {
    var p = this.getBurgerMenuPrices()[menu];
    return !!(p && p.set !== null);
};

/**
 * work_detail.html?id=7 상품 카드 · burger_order.html 목록용 데이터
 * 관리자가 가격을 바꾸면 이 값이 함께 바뀐다.
 */
window.MockData.getBurgerProductCards = function() {
    var prices = this.getBurgerMenuPrices();
    var meta = this.burgerMenuMeta;
    var self = this;
    return ['치즈버거', '불고기버거', '햄버거', '새우버거'].map(function(menu) {
        return {
            menu: menu,
            name: menu + ' 세트',
            brand: 'BurgerQueen',
            img: (meta[menu] && meta[menu].img) || './images/burger_500.png',
            single: prices[menu].single,
            set: prices[menu].set,
            summary: (meta[menu] && meta[menu].summary) || '',
            status: self.getBurgerLowStock().length > 0 ? '재고 확인 중' : '판매 중'
        };
    });
};

// 재고 기본값 (원가 = 1단위 매입원가)
window.MockData.burgerInventoryDefaults = [
    { id: 'bun',           name: '버거번',        unit: '개',   stock: 200,   safety: 40,   unitCost: 450 },
    { id: 'patty_beef',    name: '고기패티',      unit: '장',   stock: 150,   safety: 30,   unitCost: 1200 },
    { id: 'patty_bulgogi', name: '불고기패티',    unit: '장',   stock: 100,   safety: 20,   unitCost: 1150 },
    { id: 'patty_shrimp',  name: '새우패티',      unit: '장',   stock: 80,    safety: 20,   unitCost: 1300 },
    { id: 'cheese',        name: '체다치즈',      unit: '장',   stock: 180,   safety: 30,   unitCost: 300 },
    { id: 'lettuce',       name: '양상추',        unit: 'g',    stock: 5000,  safety: 800,  unitCost: 6 },
    { id: 'pickle',        name: '피클',          unit: '장',   stock: 400,   safety: 60,   unitCost: 60 },
    { id: 'mayo',          name: '마요네즈',      unit: 'g',    stock: 3000,  safety: 500,  unitCost: 8 },
    { id: 'bulgogi_sauce', name: '불고기소스',    unit: 'g',    stock: 2500,  safety: 400,  unitCost: 9 },
    { id: 'tartar',        name: '타르타르소스',  unit: 'g',    stock: 2000,  safety: 400,  unitCost: 10 },
    { id: 'potato',        name: '냉동감자',      unit: 'g',    stock: 12000, safety: 2000, unitCost: 3 },
    { id: 'cola',          name: '콜라 원액',     unit: 'ml',   stock: 6000,  safety: 1000, unitCost: 2 },
    { id: 'cider',         name: '사이다 원액',   unit: 'ml',   stock: 6000,  safety: 1000, unitCost: 2 },
    { id: 'pack',          name: '포장지 · 컵',   unit: '세트', stock: 300,   safety: 50,   unitCost: 200 }
];

// 메뉴별 소요 자재 (BOM)
window.MockData.burgerBOM = {
    '치즈버거':   { bun: 1, patty_beef: 1, cheese: 1, pickle: 3, lettuce: 20, mayo: 15, pack: 1 },
    '불고기버거': { bun: 1, patty_bulgogi: 1, lettuce: 20, mayo: 15, bulgogi_sauce: 20, pack: 1 },
    '새우버거':   { bun: 1, patty_shrimp: 1, lettuce: 20, pickle: 3, tartar: 20, pack: 1 },
    '햄버거':     { bun: 1, patty_beef: 1, lettuce: 20, pickle: 3, mayo: 15, pack: 1 },
    '감자튀김':   { potato: 150, pack: 1 },
    '콜라':       { cola: 300, pack: 1 },
    '사이다':     { cider: 300, pack: 1 }
};

window.MockData.BURGER_STAGES = [
    { key: 'ordered', label: '접수', next: 'cooking',   nextLabel: '조리 지시' },
    { key: 'cooking', label: '조리중', next: 'done',    nextLabel: '완성 처리' },
    { key: 'done',    label: '완성',  next: null,       nextLabel: null }
];

// ── 주문 금액 계산 (관리자가 설정한 단품/세트 가격 기준) ──
window.MockData.calcBurgerOrderTotal = function(order) {
    if (!order) return 0;
    var unit = this.getBurgerUnitPrice(order.menu, order.isSet);
    var qty = Math.max(1, Math.floor(Number(order.qty) || 1));
    return unit * qty;
};

// ── 주문 소요 자재 계산 (세트 · 수량 포함) ──
window.MockData.getBurgerOrderBOM = function(order) {
    var need = {};
    var self = this;
    var add = function(name, times) {
        var bom = self.burgerBOM[name];
        if (!bom) return;
        Object.keys(bom).forEach(function(k) { need[k] = (need[k] || 0) + bom[k] * times; });
    };
    if (!order) return need;
    var qty = Math.max(1, Math.floor(Number(order.qty) || 1));
    add(order.menu, qty);
    if (order.isSet) {
        add('감자튀김', qty);
        add(order.drink || '콜라', qty);
    }
    return need;
};

// ── 주문 ──
window.MockData.getBurgerOrders = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.BURGER_ORDER_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.saveBurgerOrders = function(list) {
    var arr = Array.isArray(list) ? list : [];
    if (arr.length > 300) arr = arr.slice(arr.length - 300);
    try { localStorage.setItem(this.BURGER_ORDER_KEY, JSON.stringify(arr)); } catch (e) {}
    return arr;
};

window.MockData.getBurgerOrder = function(id) {
    var hit = this.getBurgerOrders().filter(function(o) { return o && String(o.id) === String(id); });
    return hit.length ? hit[0] : null;
};

/**
 * 주문 생성 (관리자 카운터 접수 / 고객 주문 화면 공용)
 * @param {Object} payload { menu, isSet, drink, qty, tableId, source, userId, userName,
 *                           paymentMethod, paymentStatus, shopRecordId }
 */
window.MockData.createBurgerOrder = function(payload) {
    var p = payload || {};
    var menuName = p.menu && this.burgerMenus[p.menu] ? p.menu : '치즈버거';
    var menu = this.burgerMenus[menuName];
    var isSet = this.isBurgerSetMenu(menuName) ? !!p.isSet : false;
    var now = new Date();
    var order = {
        id: 'BQ-' + now.getTime() + '-' + Math.floor(Math.random() * 100),
        no: 'BQ' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0'),
        menu: menuName,
        type: menu.type,
        isSet: isSet,
        qty: Math.max(1, Math.floor(Number(p.qty) || 1)),
        drink: isSet ? (p.drink || '콜라') : (menu.type === 'drink' ? menuName : null),
        tableId: p.tableId || ('테이블 ' + (Math.floor(Math.random() * 12) + 1)),
        source: p.source || 'counter',
        groupNo: p.groupNo || null,
        userId: p.userId !== undefined && p.userId !== null ? String(p.userId) : null,
        userName: p.userName || null,
        paymentMethod: p.paymentMethod || null,     // online_settlement | offline | null
        paymentStatus: p.paymentStatus || null,     // paid | offline_waiting | pending
        shopRecordId: p.shopRecordId || null,
        status: 'ordered',
        assignedTo: null,
        assignedName: null,
        orderedAt: now.toISOString(),
        cookStartedAt: null,
        doneAt: null,
        receivedAt: null,
        cancelledAt: null
    };
    order.unitPrice = this.getBurgerUnitPrice(menuName, isSet);
    order.total = this.calcBurgerOrderTotal(order);
    var list = this.getBurgerOrders();
    list.push(order);
    this.saveBurgerOrders(list);
    return order;
};

window.MockData.updateBurgerOrder = function(id, updates) {
    var list = this.getBurgerOrders();
    var target = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].id) === String(id)) { target = list[i]; break; }
    }
    if (!target) return { ok: false, error: 'notfound' };
    Object.keys(updates || {}).forEach(function(k) { target[k] = updates[k]; });
    this.saveBurgerOrders(list);
    return { ok: true, order: target };
};

// 작업자가 조리 착수
window.MockData.startBurgerOrder = function(id, worker) {
    var w = worker || {};
    return this.updateBurgerOrder(id, {
        status: 'cooking',
        assignedTo: w.id === undefined ? null : String(w.id),
        assignedName: w.name || '작업자',
        cookStartedAt: new Date().toISOString()
    });
};

/**
 * 주문 완성 처리 — 자재를 차감하고 매출을 확정한다.
 * @returns { ok, order, consumed, shortages }
 */
window.MockData.completeBurgerOrder = function(id, worker) {
    var order = this.getBurgerOrder(id);
    if (!order) return { ok: false, error: 'notfound' };
    if (order.status === 'done' || order.status === 'received') return { ok: false, error: 'already', order: order };
    if (order.status === 'cancelled') return { ok: false, error: 'cancelled', order: order };

    var need = this.getBurgerOrderBOM(order);
    var res = this.consumeBurgerInventory(need, '주문 완성 #' + (order.no || order.id));
    var w = worker || {};
    var upd = this.updateBurgerOrder(id, {
        status: 'done',
        doneAt: new Date().toISOString(),
        assignedTo: order.assignedTo || (w.id === undefined ? null : String(w.id)),
        assignedName: order.assignedName || w.name || '작업자',
        materialCost: res.cost,
        shortages: res.shortages
    });
    return { ok: true, order: upd.order, consumed: res.consumed, shortages: res.shortages, cost: res.cost };
};

window.MockData.cancelBurgerOrder = function(id, reason) {
    return this.updateBurgerOrder(id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: reason || '관리자 취소'
    });
};

window.MockData.getBurgerActiveOrders = function() {
    return this.getBurgerOrders().filter(function(o) {
        return o && (o.status === 'ordered' || o.status === 'cooking');
    });
};

// ══════════════════════════════════════════════════════════════
//  🛒 장바구니 (burger_order.html) · 여러 메뉴를 담아 한 번에 결제
// ══════════════════════════════════════════════════════════════
window.MockData.BURGER_CART_PREFIX = 'burger_cart_';

window.MockData.burgerCartKey = function(menu, isSet, drink) {
    return [menu, isSet ? 'set' : 'single', isSet ? (drink || '콜라') : '-'].join('|');
};

window.MockData.getBurgerCart = function(userId) {
    var key = this.BURGER_CART_PREFIX + String(userId || 'guest');
    try {
        var parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.saveBurgerCart = function(userId, items) {
    var key = this.BURGER_CART_PREFIX + String(userId || 'guest');
    try { localStorage.setItem(key, JSON.stringify(items || [])); } catch (e) {}
    return items || [];
};

window.MockData.addToBurgerCart = function(userId, item) {
    var it = item || {};
    var menu = it.menu;
    if (!menu || !this.burgerMenus[menu]) return { ok: false, error: 'menu' };
    var isSet = this.isBurgerSetMenu(menu) ? !!it.isSet : false;
    var drink = isSet ? (it.drink || '콜라') : null;
    var qty = Math.max(1, Math.min(20, Math.floor(Number(it.qty) || 1)));
    var lineKey = this.burgerCartKey(menu, isSet, drink);

    var cart = this.getBurgerCart(userId);
    var hit = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i] && cart[i].key === lineKey) { hit = cart[i]; break; } }
    if (hit) {
        hit.qty = Math.min(20, (Number(hit.qty) || 0) + qty);
    } else {
        cart.push({ key: lineKey, menu: menu, isSet: isSet, drink: drink, qty: qty, addedAt: new Date().toISOString() });
    }
    this.saveBurgerCart(userId, cart);
    return { ok: true, cart: cart };
};

window.MockData.updateBurgerCartQty = function(userId, lineKey, qty) {
    var cart = this.getBurgerCart(userId);
    var n = Math.floor(Number(qty) || 0);
    var out = [];
    cart.forEach(function(l) {
        if (!l) return;
        if (l.key === lineKey) {
            if (n > 0) { l.qty = Math.min(20, n); out.push(l); }
            // n <= 0 이면 항목 제거
        } else { out.push(l); }
    });
    this.saveBurgerCart(userId, out);
    return out;
};

window.MockData.removeFromBurgerCart = function(userId, lineKey) {
    var cart = this.getBurgerCart(userId).filter(function(l) { return l && l.key !== lineKey; });
    this.saveBurgerCart(userId, cart);
    return cart;
};

window.MockData.clearBurgerCart = function(userId) {
    var key = this.BURGER_CART_PREFIX + String(userId || 'guest');
    try { localStorage.removeItem(key); } catch (e) {}
    return [];
};

// 장바구니 합계 (현재 관리자 가격 기준으로 매번 계산)
window.MockData.getBurgerCartSummary = function(userId) {
    var self = this;
    var lines = this.getBurgerCart(userId).map(function(l) {
        var unit = self.getBurgerUnitPrice(l.menu, l.isSet);
        var qty = Math.max(1, Number(l.qty) || 1);
        return {
            key: l.key, menu: l.menu, isSet: !!l.isSet, drink: l.drink, qty: qty,
            name: l.menu + (l.isSet ? ' 세트' : ' 단품'),
            img: (self.burgerMenuMeta[l.menu] || {}).img || './images/burger_500.png',
            unitPrice: unit, subtotal: unit * qty
        };
    });
    return {
        lines: lines,
        count: lines.reduce(function(s, l) { return s + l.qty; }, 0),
        total: lines.reduce(function(s, l) { return s + l.subtotal; }, 0)
    };
};

/**
 * 장바구니 일괄 주문 (한 번 결제 → 메뉴별 주방 주문 + 통합 쇼핑 이력 1건)
 * @param {Object} payload { items:[{menu,isSet,drink,qty}], userId, userName, tableId, paymentMethod, paymentStatus }
 * @returns { ok, groupNo, orders, record, total }
 */
window.MockData.createBurgerCartOrder = function(payload) {
    var p = payload || {};
    var items = Array.isArray(p.items) ? p.items : [];
    if (items.length === 0) return { ok: false, error: 'empty' };

    var now = new Date();
    var groupNo = 'BQ' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
        + String(now.getSeconds()).padStart(2, '0');
    var shopRecordId = this.BURGER_SHOP_PREFIX + groupNo;
    var self = this;

    var orders = items.map(function(it) {
        return self.createBurgerOrder({
            menu: it.menu, isSet: it.isSet, drink: it.drink, qty: it.qty,
            source: 'customer',
            userId: p.userId, userName: p.userName,
            tableId: p.tableId || '픽업 카운터',
            paymentMethod: p.paymentMethod || null,
            paymentStatus: p.paymentStatus || null,
            groupNo: groupNo,
            shopRecordId: shopRecordId
        });
    });

    var record = this.buildBurgerGroupShopRecord(groupNo, orders);
    return {
        ok: true, groupNo: groupNo, orders: orders, record: record,
        total: record.price
    };
};

window.MockData.clearBurgerOrders = function() {
    try { localStorage.removeItem(this.BURGER_ORDER_KEY); } catch (e) {}
    return [];
};

// ══════════════════════════════════════════════════════════════
//  고객 주문 ↔ 나의 쇼핑(kimp_shop_history) 미러 동기화
//  burger_order.html 에서 주문하면 주방 주문(burger_order_history)과
//  쇼핑 이력(kimp_shop_history)이 함께 만들어지고, 이후 상태가 서로 반영된다.
// ══════════════════════════════════════════════════════════════
window.MockData.BURGER_SHOP_PREFIX = 'burger_';

// 주방 상태 → 쇼핑 이력 상태
window.MockData.mapBurgerStatusToShop = function(order) {
    if (!order) return { status: 'pending', kitchenStatus: 'queued' };
    if (order.status === 'cancelled') return { status: 'cancelled', kitchenStatus: 'cancelled' };
    if (order.status === 'received') return { status: 'completed', kitchenStatus: 'received' };
    if (order.status === 'done') return { status: 'pending', kitchenStatus: 'ready' };
    if (order.status === 'cooking') return { status: 'pending', kitchenStatus: 'preparing' };
    return { status: 'pending', kitchenStatus: 'queued' };
};

// 고객 주문의 쇼핑 이력 레코드 생성용 데이터
window.MockData.buildBurgerShopRecord = function(order) {
    var map = this.mapBurgerStatusToShop(order);
    var meta = this.burgerMenuMeta[order.menu] || {};
    var name = order.menu + (order.isSet ? ' 세트' : ' 단품');
    return {
        id: this.BURGER_SHOP_PREFIX + order.no,
        orderNo: order.no,
        productName: name,
        productId: 'burger_' + (order.isSet ? 'set' : 'single'),
        brandName: 'BurgerQueen',
        workId: 7,
        price: Number(order.total) || 0,
        unitPrice: Number(order.unitPrice) || Number(order.total) || 0,
        qty: Math.max(1, Number(order.qty) || 1),
        img: meta.img || './images/burger_500.png',
        payMethod: order.paymentMethod === 'online_settlement' ? '온라인 정산 금액 결제'
            : (order.paymentMethod === 'offline' ? '현장 결제' : '나중에 결제'),
        status: map.status,
        kitchenStatus: map.kitchenStatus,
        orderType: 'dine_in',
        fulfillmentType: 'pickup',
        tableId: order.tableId,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        userId: order.userId || null,
        orderedAt: order.orderedAt,
        createdAt: order.orderedAt,
        shouldShowSpendAmount: order.status !== 'cancelled'
    };
};

// 여러 메뉴를 한 번에 결제한 경우의 통합 쇼핑 이력 상태
window.MockData.mapBurgerGroupStatus = function(orders) {
    var list = (orders || []).filter(Boolean);
    if (list.length === 0) return { status: 'pending', kitchenStatus: 'queued' };

    var alive = list.filter(function(o) { return o.status !== 'cancelled'; });
    if (alive.length === 0) return { status: 'cancelled', kitchenStatus: 'cancelled' };

    var allReceived = alive.every(function(o) { return o.status === 'received'; });
    if (allReceived) return { status: 'completed', kitchenStatus: 'received' };

    var allReady = alive.every(function(o) { return o.status === 'done' || o.status === 'received'; });
    if (allReady) return { status: 'pending', kitchenStatus: 'ready' };

    var anyCooking = alive.some(function(o) { return o.status === 'cooking' || o.status === 'done' || o.status === 'received'; });
    if (anyCooking) return { status: 'pending', kitchenStatus: 'preparing' };

    return { status: 'pending', kitchenStatus: 'queued' };
};

// 통합 주문(장바구니) 쇼핑 이력 레코드
window.MockData.buildBurgerGroupShopRecord = function(groupNo, orders) {
    var list = (orders || []).filter(Boolean);
    var first = list[0] || {};
    var map = this.mapBurgerGroupStatus(list);
    var meta = this.burgerMenuMeta[first.menu] || {};
    var firstName = first.menu + (first.isSet ? ' 세트' : ' 단품');
    var extra = list.length - 1;
    var totalQty = list.reduce(function(s, o) { return s + Math.max(1, Number(o.qty) || 1); }, 0);
    var total = list.reduce(function(s, o) { return s + (Number(o.total) || 0); }, 0);

    return {
        id: this.BURGER_SHOP_PREFIX + groupNo,
        orderNo: groupNo,
        productName: extra > 0 ? (firstName + ' 외 ' + extra + '종') : firstName,
        productId: 'burger_' + (list.length > 1 ? 'cart' : (first.isSet ? 'set' : 'single')),
        brandName: 'BurgerQueen',
        workId: 7,
        price: total,
        unitPrice: Number(first.unitPrice) || total,
        qty: totalQty,
        img: meta.img || './images/burger_500.png',
        payMethod: first.paymentMethod === 'online_settlement' ? '온라인 정산 금액 결제'
            : (first.paymentMethod === 'offline' ? '현장 결제' : '나중에 결제'),
        status: map.status,
        kitchenStatus: map.kitchenStatus,
        orderType: 'dine_in',
        fulfillmentType: 'pickup',
        tableId: first.tableId,
        paymentStatus: first.paymentStatus,
        paymentMethod: first.paymentMethod,
        userId: first.userId || null,
        orderedAt: first.orderedAt,
        createdAt: first.orderedAt,
        items: list.map(function(o) {
            return {
                name: o.menu + (o.isSet ? ' 세트' : ' 단품'),
                quantity: Math.max(1, Number(o.qty) || 1),
                unit: '개',
                price: Number(o.unitPrice) || 0,
                subtotal: Number(o.total) || 0
            };
        }),
        shouldShowSpendAmount: map.status !== 'cancelled'
    };
};

window.MockData.getBurgerOrdersByShopRecord = function(recordId) {
    return this.getBurgerOrders().filter(function(o) {
        return o && String(o.shopRecordId) === String(recordId);
    });
};

window.MockData.getShopHistoryRaw = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem('kimp_shop_history') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.saveShopHistoryRaw = function(list) {
    try { localStorage.setItem('kimp_shop_history', JSON.stringify(list || [])); } catch (e) {}
    return list || [];
};

/**
 * 주방 주문 상태를 쇼핑 이력에 반영하고,
 * 쇼핑 이력(마이페이지 · 탐색)에서 취소/수령한 결과를 주방 주문에 반영한다.
 * 장바구니로 한 번에 결제한 주문은 여러 주방 주문이 하나의 쇼핑 이력을 공유한다.
 * @returns { updatedShop, cancelledOrders, receivedOrders }
 */
window.MockData.syncBurgerShopRecords = function() {
    var orders = this.getBurgerOrders();
    var customerOrders = orders.filter(function(o) { return o && o.shopRecordId; });
    if (customerOrders.length === 0) return { updatedShop: 0, cancelledOrders: 0, receivedOrders: 0 };

    // shopRecordId 별로 묶기
    var groups = {};
    customerOrders.forEach(function(o) {
        var k = String(o.shopRecordId);
        if (!groups[k]) groups[k] = [];
        groups[k].push(o);
    });

    var history = this.getShopHistoryRaw();
    var byId = {};
    history.forEach(function(h) { if (h && h.id) byId[String(h.id)] = h; });

    var self = this;
    var updatedShop = 0, cancelledOrders = 0, receivedOrders = 0, ordersDirty = false;

    Object.keys(groups).forEach(function(recId) {
        var list = groups[recId];
        var rec = byId[recId];
        if (!rec) return;

        var map = self.mapBurgerGroupStatus(list);

        // 1) 쇼핑 이력에서 먼저 취소된 경우 → 조리 착수 전 항목만 취소
        if (rec.status === 'cancelled' && map.status !== 'cancelled') {
            var started = list.filter(function(o) {
                return o.status !== 'ordered' && o.status !== 'cancelled';
            });
            if (started.length === 0) {
                list.forEach(function(o) {
                    if (o.status === 'ordered') {
                        o.status = 'cancelled';
                        o.cancelledAt = rec.cancelledAt || new Date().toISOString();
                        o.cancelReason = '고객 취소';
                        cancelledOrders++;
                        ordersDirty = true;
                    }
                });
            } else {
                // 이미 조리에 들어간 항목이 있으면 취소 불가 → 쇼핑 이력을 되돌린다
                rec.status = map.status;
                rec.kitchenStatus = map.kitchenStatus;
                rec.shouldShowSpendAmount = true;
                rec.paymentDisplayLabel = '';
                delete rec.cancelledAt;
                updatedShop++;
            }
            return;
        }

        // 2) 쇼핑 이력에서 수령 완료한 경우 → 준비된 주문을 수령 완료로
        if (rec.status === 'completed' && map.kitchenStatus === 'ready') {
            list.forEach(function(o) {
                if (o.status === 'done') {
                    o.status = 'received';
                    o.receivedAt = rec.completedAt || new Date().toISOString();
                    receivedOrders++;
                    ordersDirty = true;
                }
            });
            return;
        }

        // 3) 그 외에는 주방 상태를 쇼핑 이력에 반영
        if (rec.status !== map.status || rec.kitchenStatus !== map.kitchenStatus) {
            rec.status = map.status;
            rec.kitchenStatus = map.kitchenStatus;
            rec.shouldShowSpendAmount = map.status !== 'cancelled';
            if (map.status === 'cancelled') {
                rec.cancelledAt = rec.cancelledAt || (list[0] && list[0].cancelledAt);
                rec.paymentDisplayLabel = '주문취소됨';
            }
            updatedShop++;
        }
    });

    if (updatedShop > 0) {
        this.saveShopHistoryRaw(history);
        // FactoryStore 메모리 상태도 함께 갱신
        try {
            if (window.FactoryStore && typeof window.FactoryStore.dispatch === 'function'
                && !window.FactoryStore.isSaving()) {
                window.FactoryStore.dispatch({ type: 'SYNC_FROM_STORAGE' });
            }
        } catch (e) {}
    }
    if (ordersDirty) this.saveBurgerOrders(orders);
    return { updatedShop: updatedShop, cancelledOrders: cancelledOrders, receivedOrders: receivedOrders };
};

// 통합 주문 취소 (조리 착수 전에만 가능)
window.MockData.cancelBurgerOrderGroup = function(recordId, reason) {
    var list = this.getBurgerOrdersByShopRecord(recordId).filter(function(o) { return o.status !== 'cancelled'; });
    if (list.length === 0) return { ok: false, error: 'notfound' };
    var started = list.filter(function(o) { return o.status !== 'ordered'; });
    if (started.length > 0) return { ok: false, error: 'cooking', started: started };
    var self = this;
    list.forEach(function(o) { self.cancelBurgerOrder(o.id, reason || '고객 취소'); });
    return { ok: true, cancelled: list.length };
};

// 통합 주문 수령 완료
window.MockData.receiveBurgerOrderGroup = function(recordId) {
    var list = this.getBurgerOrdersByShopRecord(recordId)
        .filter(function(o) { return o.status === 'done'; });
    if (list.length === 0) return { ok: false, error: 'notready' };
    var self = this;
    list.forEach(function(o) { self.receiveBurgerOrder(o.id); });
    return { ok: true, received: list.length };
};

// 고객이 상품을 수령 완료 (주문 화면 · 마이페이지 공용)
window.MockData.receiveBurgerOrder = function(id) {
    var order = this.getBurgerOrder(id);
    if (!order) return { ok: false, error: 'notfound' };
    if (order.status !== 'done') return { ok: false, error: 'notready', order: order };
    var upd = this.updateBurgerOrder(id, { status: 'received', receivedAt: new Date().toISOString() });
    return { ok: true, order: upd.order };
};

// ── 재고 ──
window.MockData.getBurgerInventory = function() {
    var defaults = this.burgerInventoryDefaults;
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(this.BURGER_INVENTORY_KEY) || 'null'); } catch (e) {}
    if (!Array.isArray(saved)) {
        var init = defaults.map(function(d) { return Object.assign({}, d); });
        this.saveBurgerInventory(init);
        return init;
    }
    // 기본 품목이 추가된 경우 병합
    var byId = {};
    saved.forEach(function(s) { if (s && s.id) byId[s.id] = s; });
    var merged = defaults.map(function(d) {
        return Object.assign({}, d, byId[d.id] || {});
    });
    return merged;
};

window.MockData.saveBurgerInventory = function(list) {
    try { localStorage.setItem(this.BURGER_INVENTORY_KEY, JSON.stringify(list || [])); } catch (e) {}
    return list || [];
};

window.MockData.getBurgerInventoryItem = function(itemId) {
    var hit = this.getBurgerInventory().filter(function(i) { return i.id === itemId; });
    return hit.length ? hit[0] : null;
};

window.MockData.getBurgerInventoryLog = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.BURGER_INVENTORY_LOG_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.addBurgerInventoryLog = function(entry) {
    var logs = this.getBurgerInventoryLog();
    logs.push(Object.assign({ at: new Date().toISOString() }, entry || {}));
    if (logs.length > 400) logs.shift();
    try { localStorage.setItem(this.BURGER_INVENTORY_LOG_KEY, JSON.stringify(logs)); } catch (e) {}
    return logs;
};

// 입고 (매입) — 매입비용이 손익에 반영된다
window.MockData.restockBurgerItem = function(itemId, qty, memo) {
    var n = Math.floor(Number(qty) || 0);
    if (n <= 0) return { ok: false, error: 'qty' };
    var inv = this.getBurgerInventory();
    var target = null;
    for (var i = 0; i < inv.length; i++) { if (inv[i].id === itemId) { target = inv[i]; break; } }
    if (!target) return { ok: false, error: 'notfound' };
    target.stock = Math.max(0, Number(target.stock) || 0) + n;
    this.saveBurgerInventory(inv);
    var cost = n * (Number(target.unitCost) || 0);
    this.addBurgerInventoryLog({
        type: 'in', itemId: itemId, itemName: target.name,
        qty: n, unit: target.unit, cost: cost, memo: memo || '입고'
    });
    return { ok: true, item: target, cost: cost };
};

// 수동 조정 (폐기 · 실사 반영)
window.MockData.adjustBurgerStock = function(itemId, newStock, memo) {
    var inv = this.getBurgerInventory();
    var target = null;
    for (var i = 0; i < inv.length; i++) { if (inv[i].id === itemId) { target = inv[i]; break; } }
    if (!target) return { ok: false, error: 'notfound' };
    var before = Number(target.stock) || 0;
    var after = Math.max(0, Math.floor(Number(newStock) || 0));
    target.stock = after;
    this.saveBurgerInventory(inv);
    this.addBurgerInventoryLog({
        type: 'adjust', itemId: itemId, itemName: target.name,
        qty: after - before, unit: target.unit,
        cost: (after - before) < 0 ? (after - before) * (Number(target.unitCost) || 0) : 0,
        memo: memo || '재고 조정'
    });
    return { ok: true, item: target, delta: after - before };
};

/**
 * 자재 소진 (주문 완성 시)
 * @param {Object} need { itemId: qty }
 * @returns { consumed, shortages, cost }
 */
window.MockData.consumeBurgerInventory = function(need, memo) {
    var inv = this.getBurgerInventory();
    var byId = {};
    inv.forEach(function(i) { byId[i.id] = i; });
    var consumed = {}, shortages = [], cost = 0;

    Object.keys(need || {}).forEach(function(id) {
        var item = byId[id];
        var want = Number(need[id]) || 0;
        if (!item || want <= 0) return;
        var have = Number(item.stock) || 0;
        var take = Math.min(have, want);
        item.stock = have - take;
        consumed[id] = take;
        cost += take * (Number(item.unitCost) || 0);
        if (take < want) shortages.push({ itemId: id, name: item.name, short: want - take, unit: item.unit });
    });

    this.saveBurgerInventory(inv);
    this.addBurgerInventoryLog({
        type: 'out', itemId: null, itemName: '주문 소진',
        qty: 0, cost: cost, memo: memo || '주문 완성 자재 소진',
        detail: consumed
    });
    return { consumed: consumed, shortages: shortages, cost: cost };
};

// 부족 · 임박 자재
window.MockData.getBurgerLowStock = function() {
    return this.getBurgerInventory().filter(function(i) {
        return (Number(i.stock) || 0) <= (Number(i.safety) || 0);
    });
};

window.MockData.resetBurgerInventory = function() {
    try {
        localStorage.removeItem(this.BURGER_INVENTORY_KEY);
        localStorage.removeItem(this.BURGER_INVENTORY_LOG_KEY);
    } catch (e) {}
    return this.getBurgerInventory();
};

// ── 근무자 현황 (작업자 단말이 주기적으로 갱신) ──
window.MockData.getBurgerStaffMap = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.BURGER_STAFF_KEY) || '{}');
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
};

window.MockData.upsertBurgerStaff = function(payload) {
    var p = payload || {};
    var key = String(p.userId === undefined || p.userId === null ? 'guest' : p.userId);
    var map = this.getBurgerStaffMap();
    map[key] = Object.assign({}, map[key], {
        userId: key,
        name: p.name || '작업자',
        status: p.status || 'working',      // working | resting
        startedAt: p.startedAt || (map[key] && map[key].startedAt) || new Date().toISOString(),
        workSec: Number(p.workSec) || 0,
        restSec: Number(p.restSec) || 0,
        completed: Number(p.completed) || 0,
        currentOrder: p.currentOrder || null,
        updatedAt: new Date().toISOString()
    });
    try { localStorage.setItem(this.BURGER_STAFF_KEY, JSON.stringify(map)); } catch (e) {}
    return map[key];
};

window.MockData.removeBurgerStaff = function(userId) {
    var map = this.getBurgerStaffMap();
    delete map[String(userId)];
    try { localStorage.setItem(this.BURGER_STAFF_KEY, JSON.stringify(map)); } catch (e) {}
    return map;
};

/**
 * 근무자 목록. 60초 이상 갱신이 없으면 offline 로 표시한다.
 */
window.MockData.getBurgerStaffList = function() {
    var map = this.getBurgerStaffMap();
    var now = Date.now();
    return Object.keys(map).map(function(k) {
        var s = map[k];
        var age = Math.floor((now - new Date(s.updatedAt).getTime()) / 1000);
        return Object.assign({}, s, { staleSec: age, online: age <= 60 });
    }).sort(function(a, b) { return String(a.name).localeCompare(String(b.name)); });
};

// ── 손익 ──
/**
 * 손익 집계
 * @param {Object} opts { todayOnly: true }
 * @returns 매출 / 자재원가 / 매입비 / 인건비 / 영업이익
 */
window.MockData.getBurgerFinance = function(opts) {
    var o = opts || {};
    var todayOnly = o.todayOnly !== false;
    var self = this;
    var isToday = function(iso) {
        if (!iso) return false;
        var d = new Date(iso), n = new Date();
        return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    };

    var orders = this.getBurgerOrders().filter(function(x) {
        if (!x || (x.status !== 'done' && x.status !== 'received')) return false;
        return todayOnly ? isToday(x.doneAt || x.orderedAt) : true;
    });

    var revenue = 0, materialCost = 0, menuCount = {};
    orders.forEach(function(x) {
        revenue += Number(x.total) || self.calcBurgerOrderTotal(x);
        if (Number.isFinite(Number(x.materialCost))) {
            materialCost += Number(x.materialCost);
        } else {
            var need = self.getBurgerOrderBOM(x);
            Object.keys(need).forEach(function(id) {
                var it = self.getBurgerInventoryItem(id);
                if (it) materialCost += need[id] * (Number(it.unitCost) || 0);
            });
        }
        menuCount[x.menu] = (menuCount[x.menu] || 0) + 1;
    });

    var purchaseCost = 0;
    this.getBurgerInventoryLog().forEach(function(l) {
        if (!l || l.type !== 'in') return;
        if (todayOnly && !isToday(l.at)) return;
        purchaseCost += Number(l.cost) || 0;
    });

    var wasteCost = 0;
    this.getBurgerInventoryLog().forEach(function(l) {
        if (!l || l.type !== 'adjust') return;
        if (todayOnly && !isToday(l.at)) return;
        if ((Number(l.cost) || 0) < 0) wasteCost += Math.abs(Number(l.cost));
    });

    var laborSec = 0;
    this.getBurgerStaffList().forEach(function(s) {
        laborSec += Math.max(0, Number(s.workSec) || 0);
    });
    var laborCost = Math.round(laborSec / 3600 * this.BURGER_HOURLY_WAGE);

    var operatingProfit = revenue - materialCost - laborCost - wasteCost;
    return {
        orderCount: orders.length,
        revenue: revenue,
        materialCost: materialCost,
        purchaseCost: purchaseCost,
        wasteCost: wasteCost,
        laborSec: laborSec,
        laborCost: laborCost,
        grossProfit: revenue - materialCost,
        operatingProfit: operatingProfit,
        margin: revenue > 0 ? Math.round(operatingProfit / revenue * 1000) / 10 : 0,
        menuCount: menuCount
    };
};

// ── 작업자 활동 로그 (bmanager 에서도 열람) ──
window.MockData.getBurgerWorkerLogs = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.BURGER_WORKER_LOG_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.addBurgerWorkerLog = function(entry) {
    var logs = this.getBurgerWorkerLogs();
    var now = new Date();
    logs.push(Object.assign({
        time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
            + ':' + String(now.getSeconds()).padStart(2, '0'),
        createdAt: now.toISOString()
    }, entry || {}));
    if (logs.length > 300) logs.shift();
    try { localStorage.setItem(this.BURGER_WORKER_LOG_KEY, JSON.stringify(logs)); } catch (e) {}
    return logs;
};

// ── 도움 요청 (작업자 → 관리자) ──
window.MockData.getBurgerHelpRequests = function() {
    try {
        var parsed = JSON.parse(localStorage.getItem(this.BURGER_HELP_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
};

window.MockData.saveBurgerHelpRequests = function(list) {
    var arr = Array.isArray(list) ? list : [];
    if (arr.length > 200) arr = arr.slice(arr.length - 200);
    try { localStorage.setItem(this.BURGER_HELP_KEY, JSON.stringify(arr)); } catch (e) {}
    return arr;
};

window.MockData.getBurgerHelpPending = function() {
    return this.getBurgerHelpRequests().filter(function(r) { return r && r.status === 'pending'; });
};

window.MockData.getBurgerHelpPendingFor = function(workerId) {
    var wid = String(workerId === undefined || workerId === null ? '' : workerId);
    var hit = this.getBurgerHelpRequests().filter(function(r) {
        return r && r.status === 'pending' && String(r.workerId) === wid;
    });
    return hit.length ? hit[hit.length - 1] : null;
};

window.MockData.getBurgerHelpRequest = function(id) {
    var hit = this.getBurgerHelpRequests().filter(function(r) { return r && r.id === id; });
    return hit.length ? hit[0] : null;
};

window.MockData.createBurgerHelpRequest = function(payload) {
    var p = payload || {};
    var workerId = String(p.workerId === undefined || p.workerId === null ? 'guest' : p.workerId);
    var already = this.getBurgerHelpPendingFor(workerId);
    if (already) return { ok: false, error: 'pending', request: already };

    var now = new Date();
    var req = {
        id: 'bhelp-' + now.getTime() + '-' + Math.floor(Math.random() * 1000),
        workerId: workerId,
        workerName: p.workerName || '작업자',
        position: p.position || '조리 라인',
        reason: p.reason || '작업 도움 요청',
        orderNo: p.orderNo || null,
        status: 'pending',
        createdAt: now.toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        durationSec: null
    };
    var list = this.getBurgerHelpRequests();
    list.push(req);
    this.saveBurgerHelpRequests(list);
    this.addBurgerWorkerLog({
        text: '[도움요청] 관리자에게 도움을 요청했습니다.' + (req.orderNo ? ' (주문 ' + req.orderNo + ')' : ''),
        kind: 'warn', workerName: req.workerName
    });
    return { ok: true, request: req };
};

window.MockData.resolveBurgerHelpRequest = function(id, by) {
    var list = this.getBurgerHelpRequests();
    var target = null;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id === id) { target = list[i]; break; } }
    if (!target) return { ok: false, error: 'notfound' };
    if (target.status !== 'pending') return { ok: false, error: 'already', request: target };

    var now = new Date();
    target.status = 'resolved';
    target.resolvedAt = now.toISOString();
    target.resolvedBy = by || '관리자';
    target.durationSec = Math.max(0, Math.floor((now.getTime() - new Date(target.createdAt).getTime()) / 1000));
    this.saveBurgerHelpRequests(list);
    this.addBurgerWorkerLog({
        text: '[도움요청] 해결 완료 처리 (' + target.resolvedBy + ') · 소요 '
            + Math.floor(target.durationSec / 60) + '분 ' + (target.durationSec % 60) + '초',
        kind: 'ok', workerName: target.workerName
    });
    return { ok: true, request: target };
};

window.MockData.cancelBurgerHelpRequest = function(id) {
    var list = this.getBurgerHelpRequests();
    var target = null;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id === id) { target = list[i]; break; } }
    if (!target) return { ok: false, error: 'notfound' };
    if (target.status !== 'pending') return { ok: false, error: 'already', request: target };
    target.status = 'cancelled';
    target.resolvedAt = new Date().toISOString();
    this.saveBurgerHelpRequests(list);
    this.addBurgerWorkerLog({ text: '[도움요청] 요청을 취소했습니다.', kind: 'info', workerName: target.workerName });
    return { ok: true, request: target };
};

/* ============================================================
 * 작업 진입 페이지(체험/실제 근무) 단일 관리
 *
 * 위생 체크 페이지(kimp_virt.html / kimp_virt2.html)에서 다음 페이지로
 * 넘어갈 때 체험용(kimp_ex0.html)과 실제 근무용(kimp_ex1.html)을 혼동하지
 * 않도록, 목적지를 workDetailJSON 의 expPage / realPage 로 데이터화하고
 * 진입 모드를 sessionStorage 에 저장해 두었다가 그대로 사용한다.
 * ============================================================ */
window.MockData.WORK_ENTRY_MODES = { EXPERIENCE: 'experience', REAL: 'real' };
window.MockData.WORK_ENTRY_CONTEXT_KEY = 'work_entry_context';

// 데이터가 비어 있을 때의 최종 폴백
window.MockData.WORK_ENTRY_FALLBACK = { experience: 'kimp_ex0.html', real: 'kimp_ex1.html' };

window.MockData.normalizeWorkEntryMode = function(mode) {
    return String(mode) === this.WORK_ENTRY_MODES.REAL
        ? this.WORK_ENTRY_MODES.REAL
        : this.WORK_ENTRY_MODES.EXPERIENCE;
};

/**
 * 진입 모드/작업 ID 저장. (체험 출근인지, 실제 근무 출근인지)
 */
window.MockData.setWorkEntryContext = function(workId, mode) {
    var context = {
        workId: String(workId || '1'),
        mode: this.normalizeWorkEntryMode(mode),
        savedAt: new Date().toISOString()
    };
    try {
        sessionStorage.setItem(this.WORK_ENTRY_CONTEXT_KEY, JSON.stringify(context));
    } catch (e) {}
    return context;
};

window.MockData.getWorkEntryContext = function() {
    try {
        var raw = sessionStorage.getItem(this.WORK_ENTRY_CONTEXT_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.mode) {
                return {
                    workId: String(parsed.workId || '1'),
                    mode: this.normalizeWorkEntryMode(parsed.mode)
                };
            }
        }
    } catch (e) {}
    return null;
};

window.MockData.clearWorkEntryContext = function() {
    try {
        sessionStorage.removeItem(this.WORK_ENTRY_CONTEXT_KEY);
    } catch (e) {}
};

/**
 * workDetailJSON 의 expPage(체험) / realPage(실제 근무) 를 읽어 목적지 반환.
 */
window.MockData.getWorkEntryPage = function(workId, mode) {
    var resolvedMode = this.normalizeWorkEntryMode(mode);
    var detail = null;
    try {
        var detailMap = (window.FactoryStore && typeof window.FactoryStore.getWorkDetails === 'function')
            ? window.FactoryStore.getWorkDetails()
            : JSON.parse(this.workDetailJSON);
        detail = detailMap[String(workId || '1')] || null;
    } catch (e) {}

    if (detail) {
        if (resolvedMode === this.WORK_ENTRY_MODES.REAL && detail.realPage) return detail.realPage;
        if (resolvedMode === this.WORK_ENTRY_MODES.EXPERIENCE && detail.expPage) return detail.expPage;
        // 한쪽만 등록된 작업은 등록된 페이지를 그대로 사용한다.
        if (detail.realPage) return detail.realPage;
        if (detail.expPage) return detail.expPage;
    }
    return this.WORK_ENTRY_FALLBACK[resolvedMode];
};

/**
 * 저장된 진입 모드로 목적지를 결정한다.
 * 저장값이 없으면 호출한 페이지가 넘긴 기본 모드/작업 ID 를 사용한다.
 */
window.MockData.resolveWorkEntryPage = function(defaultMode, defaultWorkId) {
    var context = this.getWorkEntryContext();
    var mode = context ? context.mode : this.normalizeWorkEntryMode(defaultMode);
    var workId = context ? context.workId : String(defaultWorkId || '1');
    return this.getWorkEntryPage(workId, mode);
};
