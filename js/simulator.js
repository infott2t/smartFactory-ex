// js/simulator.js

(function () {
    // ── 1. 공장 초기 데이터 정의 및 세팅 ──
    function initFactoryState() {
        if (!localStorage.getItem("kimp_factory_initialized")) {
            // 원재료 및 부자재 초기 재고
            const initialInventory = {
                cabbage: {
                    heads: 200,
                    unitPrice: 2500, // 1포기당 단가
                    totalWeight: 500, // 200포기 * 2.5kg = 500kg
                    origin: "강원도 평창 고랭지",
                    supplier: "대관령 유통",
                    route: "루트-1",
                    expiry: "2026-06-25",
                    status: "신선도 최상"
                },
                seasoning: {
                    weight: 60.0, // kg
                    expiry: "2026-07-10",
                    status: "적절"
                },
                redPepperPowder: {
                    weight: 35.0, // kg
                    expiry: "2026-08-15"
                },
                flour: {
                    weight: 20.0, // kg
                    expiry: "2026-09-01"
                },
                anchovySauce: {
                    volume: 25.0, // L
                    expiry: "2026-10-10"
                },
                packaging: {
                    p300g: 200, // 개
                    p1kg: 150, // 개
                    p3kg: 100, // 개
                    p5kg: 60,  // 개
                    p10kg: 30  // 개
                },
                ppe: {
                    gloves: 300, // 개
                    hairnets: 150 // 개
                }
            };
            localStorage.setItem("kimp_factory_inventory", JSON.stringify(initialInventory));

            // 완제품 상품 카탈로그 및 재고
            const initialCatalog = {
                p300g: { name: "300g 맛김치 팩", price: 3000, stock: 50, todayOrders: 14, yesterdayOrders: 20, img: "./images/kimchi_product_300g.png", desc: "1인 가구용 실속형 맛김치" },
                p1kg: { name: "1kg 포기김치 팩", price: 8000, stock: 30, todayOrders: 22, yesterdayOrders: 25, img: "./images/kimchi_product_1kg.png", desc: "가정용 표준 포장 프리미엄 김치" },
                p3kg: { name: "3kg 대용량 김치 팩", price: 20000, stock: 15, todayOrders: 8, yesterdayOrders: 12, img: "./images/kimchi_product_3kg.png", desc: "다인가구 및 김장 보관용 실용 김치" },
                p5kg: { name: "5kg 실속 김치 팩", price: 32000, stock: 10, todayOrders: 5, yesterdayOrders: 7, img: "./images/kimchi_product_1kg.png", desc: "대가족 및 업소용 실속 포장" },
                p10kg: { name: "10kg 업소용 김치", price: 60000, stock: 5, todayOrders: 2, yesterdayOrders: 3, img: "./images/kimchi_product_3kg.png", desc: "업소/단체급식 전용 대용량 김치" }
            };
            localStorage.setItem("kimp_factory_products", JSON.stringify(initialCatalog));

            // 냉장 숙성/절임실 초기 배치 (17시간 절임 타이머 테스트용)
            // 시작 시간을 밀리초 단위로 역산하여 저장
            const now = Date.now();
            const initialSaltingBatches = [
                { id: "SALT-260610-01", orderId: "260619-15-1", cabbageHeads: 15, startTime: now - 16.8 * 3600 * 1000, saltingTimeLimit: 17 * 3600 * 1000, status: "salting" },
                { id: "SALT-260610-02", orderId: "260619-15-2", cabbageHeads: 15, startTime: now - 10.0 * 3600 * 1000, saltingTimeLimit: 17 * 3600 * 1000, status: "salting" },
                { id: "SALT-260610-03", orderId: "260619-15-3", cabbageHeads: 15, startTime: now - 5.0 * 3600 * 1000, saltingTimeLimit: 17 * 3600 * 1000, status: "salting" },
                { id: "SALT-260610-04", orderId: "SALT-EXP-04", cabbageHeads: 15, startTime: now - 19.0 * 3600 * 1000, saltingTimeLimit: 17 * 3600 * 1000, status: "matured", maturedTime: now - 2.0 * 3600 * 1000 },
                { id: "SALT-260610-05", orderId: "SALT-EXP-05", cabbageHeads: 15, startTime: now - 22.0 * 3600 * 1000, saltingTimeLimit: 17 * 3600 * 1000, status: "matured", maturedTime: now - 5.0 * 3600 * 1000 }
            ];
            localStorage.setItem("kimp_factory_salting", JSON.stringify(initialSaltingBatches));
            localStorage.setItem("kimp_factory_matured_cabbages", "30"); // 이미 숙성 완료된 배추 포기 수 (배치4: 15 + 배치5: 15)

            // 당일 주문/출하/배송 현황 (포장 규격 5종)
            const initialDailyOrders = {
                p300g: { ordered: 10, shipped: 8, price: 3000 },
                p1kg:  { ordered: 20, shipped: 16, price: 8000 },
                p3kg:  { ordered: 10, shipped: 8, price: 20000 },
                p5kg:  { ordered: 10, shipped: 8, price: 32000 },
                p10kg: { ordered: 1, shipped: 0, price: 60000 }
            };
            localStorage.setItem("kimp_daily_orders", JSON.stringify(initialDailyOrders));

            // 설비 고장 및 가동 제어 상태
            const initialFacility = {
                task1: "normal", // normal (정상가동), broken (고장정지)
                task2: "normal",
                task3: "normal",
                task4: "normal",
                task5: "normal"
            };
            localStorage.setItem("kimp_factory_facility", JSON.stringify(initialFacility));

            // 오너(Owner) 결재 승인 요청 대기열
            const initialOwnerApprovals = [
                { id: "REQ-260610-01", type: "purchase", title: "국산 배추 100포기 추가 수급 요청", cost: 250000, status: "pending", submittedTime: "22:01:05" },
                { id: "REQ-260610-02", type: "repair", title: "Task 3 절임수조 히터 고장 수리 요청", cost: 120000, status: "pending", submittedTime: "22:03:15" }
            ];
            localStorage.setItem("kimp_owner_approvals", JSON.stringify(initialOwnerApprovals));

            // 가상/실제 작업자 상태 리스트
            // 가상/실제 작업자 상태 리스트 (최초 대기 상태 3인 설정)
            const initialWorkersProgress = {
                "capegon21@gmail.com": {
                    userId: "capegon21@gmail.com",
                    userName: "최수아",
                    currentStep: 0,
                    stepName: "대기 중",
                    status: "waiting",
                    location: "대기실",
                    checkInTime: null,
                    accumWorkSeconds: 0,
                    accumBreakSeconds: 0,
                    completedOrdersCount: 0,
                    lastActiveTime: new Date().toISOString()
                },
                "capegon23@gmail.com": {
                    userId: "capegon23@gmail.com",
                    userName: "김수민",
                    currentStep: 0,
                    stepName: "대기 중",
                    status: "waiting",
                    location: "대기실",
                    checkInTime: null,
                    accumWorkSeconds: 0,
                    accumBreakSeconds: 0,
                    completedOrdersCount: 0,
                    lastActiveTime: new Date().toISOString()
                },
                "local-helper-kim": {
                    userId: "local-helper-kim",
                    userName: "김영희",
                    currentStep: 0,
                    stepName: "대기 중",
                    status: "waiting",
                    location: "대기실",
                    checkInTime: null,
                    accumWorkSeconds: 0,
                    accumBreakSeconds: 0,
                    completedOrdersCount: 0,
                    lastActiveTime: new Date().toISOString(),
                    isHelper: true
                }
            };
            localStorage.setItem("kimp_workers_progress", JSON.stringify(initialWorkersProgress));

            // 재정 통계 (수익 / 지출 비용)
            const initialFinance = {
                revenue: 194500, // 누적 수익
                cost: 87600      // 누적 지출 (근로자 시급 + 재료비 등)
            };
            localStorage.setItem("kimp_factory_finance", JSON.stringify(initialFinance));

            // 매니저(최현일) 본인 상태
            const initialManagerOwnState = {
                location: "office", // office (사무실), workshop (작업장)
                activity: "supervising", // supervising (감독), participating (참여), helper (헬퍼지원)
                assignedTask: null, // null, 1 ~ 5
                checkInTime: "22:00:00"
            };
            localStorage.setItem("kimp_manager_own_state", JSON.stringify(initialManagerOwnState));

            localStorage.setItem("kimp_factory_initialized", "true");
        }
    }

    function runSimulationStep() {
        const now = Date.now();
        const lastTick = parseInt(localStorage.getItem("kimp_last_sim_tick") || "0");
        if (now - lastTick < 950) {
            return;
        }
        localStorage.setItem("kimp_last_sim_tick", now.toString());

        // A. 2시간 시프트 타이머(Countdown) 실제 현재시간 동기화 업데이트
        function getShiftTimeRemaining() {
            var now = new Date();
            var currentMins = now.getHours() * 60 + now.getMinutes();
            var currentSecs = currentMins * 60 + now.getSeconds();

            var shifts = [
                { start: 8*60, end: 10*60 },
                { start: 10*60, end: 12*60 },
                { start: 12*60, end: 13*60 },
                { start: 13*60, end: 15*60 },
                { start: 15*60, end: 17*60 },
                { start: 17*60, end: 19*60 },
                { start: 19*60, end: 21*60 },
                { start: 21*60, end: 23*60 },
                { start: 23*60, end: 24*60 },
                { start: 0, end: 1*60 },
                { start: 1*60, end: 3*60 },
                { start: 3*60, end: 5*60 },
                { start: 5*60, end: 7*60 },
                { start: 7*60, end: 8*60 }
            ];

            var activeShift = null;
            for (var i = 0; i < shifts.length; i++) {
                if (currentMins >= shifts[i].start && currentMins < shifts[i].end) {
                    activeShift = shifts[i];
                    break;
                }
            }

            if (activeShift) {
                var endSecs = activeShift.end * 60;
                return endSecs - currentSecs;
            }
            return 7200;
        }

        let remaining = getShiftTimeRemaining();
        localStorage.setItem("kimp_remaining_seconds", remaining.toString());

        // B. 근로자 근무 시간 및 실시간 급여 정산
        let workers = {};
        try {
            workers = JSON.parse(localStorage.getItem("kimp_workers_progress") || "{}");
        } catch (e) {}

        let finance = { revenue: 194500, cost: 87600 };
        try {
            finance = JSON.parse(localStorage.getItem("kimp_factory_finance") || '{"revenue":194500,"cost":87600}');
        } catch (e) {}

        let totalSalaryAccumulatedThisSecond = 0;

        // 시급 정의
        const wageRates = {
            general: 10000, // 일반 시급 10,000원
            helper: 12000,  // 헬퍼 시급 12,000원
            manager: 15000  // 매니저 시급 15,000원
        };

        // 가상/실제 근로자 급여 누적
        Object.keys(workers).forEach(userId => {
            const w = workers[userId];
            if (w.checkInTime) {
                // 초당 수당 계산
                let rate = wageRates.general;
                if (w.isHelper) rate = wageRates.helper;
                else if (w.role === "MANAGER") rate = wageRates.manager;

                const perSecondWage = rate / 3600;

                if (w.status === "on_break") {
                    if (w.accumBreakSeconds === undefined) w.accumBreakSeconds = 0;
                    w.accumBreakSeconds++;
                    // 휴식시간에도 기본급 지급 (또는 무급 설정 가능하나 여기서는 실 근로시간에 대해서만 적립되도록 구현)
                } else {
                    if (w.accumWorkSeconds === undefined) w.accumWorkSeconds = 0;
                    w.accumWorkSeconds++;
                    totalSalaryAccumulatedThisSecond += perSecondWage;
                }
                w.lastActiveTime = new Date().toISOString();
            }
        });

        // 매니저 본인 급여 누적
        let mgrState = { location: "office", activity: "supervising", assignedTask: null, checkInTime: "22:00:00" };
        try {
            mgrState = JSON.parse(localStorage.getItem("kimp_manager_own_state") || "{}");
        } catch (e) {}

        if (mgrState.checkInTime) {
            const mgrPerSecondWage = wageRates.manager / 3600;
            totalSalaryAccumulatedThisSecond += mgrPerSecondWage;
        }

        // 지출 비용 누적
        finance.cost = Math.floor(finance.cost + totalSalaryAccumulatedThisSecond);
        localStorage.setItem("kimp_factory_finance", JSON.stringify(finance));
        localStorage.setItem("kimp_workers_progress", JSON.stringify(workers));

        // C. 6시간 절임실 타이머 처리 및 숙성완료 배추 연동
        let saltingBatches = [];
        try {
            saltingBatches = JSON.parse(localStorage.getItem("kimp_factory_salting") || "[]");
        } catch (e) {}

        let maturedCabbages = parseInt(localStorage.getItem("kimp_factory_matured_cabbages") || "15");
        let saltingChanged = false;

        saltingBatches.forEach(batch => {
            if (batch.status === "salting") {
                const elapsed = now - batch.startTime;
                if (elapsed >= batch.saltingTimeLimit) {
                    batch.status = "matured"; // 숙성 완료
                    batch.maturedTime = now;   // 숙성 완료 시각 기록
                    maturedCabbages += batch.cabbageHeads; // 사용가능 절임 배추로 적립
                    saltingChanged = true;
                }
            }
        });

        if (saltingChanged) {
            localStorage.setItem("kimp_factory_salting", JSON.stringify(saltingBatches));
            localStorage.setItem("kimp_factory_matured_cabbages", maturedCabbages.toString());
        }

        // D. 가상 자동 주문 유입 시뮬레이터 (약 20초마다 25% 확률로 완제품 판매 주문 발생)
        if (Math.random() < 0.05) { // 1초 루프에서 약 5% 확률
            let products = {};
            try {
                products = JSON.parse(localStorage.getItem("kimp_factory_products") || "{}");
            } catch (e) {}

            const choice = Math.random();
            let size = "p1kg";
            if (choice < 0.4) size = "p500g";
            else if (choice > 0.8) size = "p3kg";

            const item = products[size];
            if (item && item.stock > 0) {
                item.stock--;
                item.todayOrders++;
                finance.revenue += item.price; // 수익 증가
                localStorage.setItem("kimp_factory_products", JSON.stringify(products));
                localStorage.setItem("kimp_factory_finance", JSON.stringify(finance));
                
                // 전역 로그 추가
                if (window.addAppLog) {
                    window.addAppLog(`[주문 유입] 완제품 ${item.name} 1개 주문 출하 완료 (수익 +${item.price}원)`);
                }
            }
        }
    }

    // ── 3. 초기 실행 및 인터벌 구동 ──
    initFactoryState();
    setInterval(runSimulationStep, 1000);

    // 글로벌 네임스페이스에 노출 (수동 구동 가능하도록)
    window.initFactoryState = initFactoryState;
    window.runSimulationStep = runSimulationStep;
    console.log("[Simulator] Background factory simulation engine started.");
})();
