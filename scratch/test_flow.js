/**
 * 스마트팩토리 팩토리-HMI 통합 디버깅 시나리오 검증기 (Full Stage 1~6, 교대, 헬퍼, 정산)
 */

const storage = {};
const localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// 헬퍼: 데이터 도우미 함수들
function getOrders() {
    return JSON.parse(localStorage.getItem("kimp_production_orders") || "{}");
}
function saveOrders(orders) {
    localStorage.setItem("kimp_production_orders", JSON.stringify(orders));
}
function getApprovalRequests() {
    return JSON.parse(localStorage.getItem("kimp_approval_requests") || "[]");
}
function saveApprovalRequests(reqs) {
    localStorage.setItem("kimp_approval_requests", JSON.stringify(reqs));
}
function getHelperQueue() {
    return JSON.parse(localStorage.getItem("kimp_helper_queue") || "[]");
}
function saveHelperQueue(q) {
    localStorage.setItem("kimp_helper_queue", JSON.stringify(q));
}

// 1. 배추 단가 실시간 설정 & 정산
console.log("=== 1단계: 배추 단가 설정 및 원자재 창고 세팅 ===");
localStorage.setItem("kimp_cabbage_unit_price", "3500");
const cabbagePrice = parseInt(localStorage.getItem("kimp_cabbage_unit_price") || "2500");
console.log(`[OK] 배추 1포기당 단가 설정: ${cabbagePrice}원`);

const initialInventory = {
    cabbage: { heads: 100, totalWeight: 250, unitPrice: cabbagePrice },
    seasoning: { weight: 10.0 },
    redPepperPowder: { weight: 30.0 },
    flour: { weight: 20.0 },
    anchovySauce: { volume: 50.0 }
};
localStorage.setItem("kimp_factory_inventory", JSON.stringify(initialInventory));

// 2. 신규 지시서 등록 & Stage 1 전달
console.log("\n=== 2단계: 신규 지시서 발행 및 Stage 1 전달 ===");
const orderId = "260712-15-1";
const ordersObj = {};
ordersObj[orderId] = {
    orderId: orderId,
    productId: "p1kg",
    productName: "1kg 포기김치",
    quantity: 15,
    status: "in_progress",
    progressStatus: "생산 대기 (Stage 1 대기)",
    currentTask: "1",
    createdTime: "오후 5:10:00",
    stages: {
        "1": { operator: "", startTime: null, endTime: null, workLogs: [], statusSubmitted: false }
    }
};
saveOrders(ordersObj);

// Stage 1 전달 시 배추 재고 차감 및 시작시각 기록
function sendOrderToStage1(oId) {
    let orders = getOrders();
    let o = orders[oId];
    if (!o) return;
    
    // 배추 차감
    let inv = JSON.parse(localStorage.getItem("kimp_factory_inventory") || "{}");
    const headsToUse = o.quantity || 15;
    inv.cabbage.heads = Math.max(0, inv.cabbage.heads - (headsToUse || 0));
    inv.cabbage.totalWeight = inv.cabbage.heads * 2.5;
    localStorage.setItem("kimp_factory_inventory", JSON.stringify(inv));
    
    o.progressStatus = "생산중 (Stage 1 대기)";
    o.stages["1"].startTime = "오후 5:12:00";
    saveOrders(orders);
    console.log(`[OK] 지시서 ${oId} Stage 1로 전송 완료 ➡️ 배추 ${headsToUse}포기 차감 (남은 배추: ${inv.cabbage.heads}포기)`);
}
sendOrderToStage1(orderId);


// 3. 최수아 작업자가 Stage 1 진행 ➡️ 완료 승인 요청
console.log("\n=== 3단계: 최수아 작업자 Stage 1 승인 요청 ===");
function requestCompletionApproval(oId, stageId, worker) {
    let reqs = getApprovalRequests();
    reqs.push({
        id: "COMP-" + Date.now(),
        type: "completion",
        orderId: oId,
        stageNum: stageId,
        userName: worker,
        status: "pending",
        submittedTime: "오후 5:15:30",
        postWorkQty: 15,
        defectQty: 0,
        imageUrl: `./images/cabbage_zone_a.png`, // Stage 1 맞춤 이미지
        weight: 37.5
    });
    saveApprovalRequests(reqs);
    console.log(`[OK] 작업자 ${worker} 가 Stage ${stageId} 완료 승인을 요청했습니다.`);
}
requestCompletionApproval(orderId, "1", "최수아");


// 4. 매니저가 Stage 1 승인 ➡️ 최수아가 Stage 2 진행
console.log("\n=== 4단계: 매니저 Stage 1 승인 및 Stage 2 시작 ===");
function approveRequest(oId, stageId) {
    let reqs = getApprovalRequests();
    let req = reqs.find(r => r.orderId === oId && String(r.stageNum) === String(stageId) && r.status === "pending");
    if (req) {
        req.status = "approved";
        saveApprovalRequests(reqs);
    }
    
    let orders = getOrders();
    let o = orders[oId];
    if (o) {
        o.stages[stageId].operator = req.userName;
        o.stages[stageId].endTime = "오후 5:18:00";
        o.stages[stageId].statusSubmitted = true;
        o.stages[stageId].postWorkQty = req.postWorkQty;
        o.stages[stageId].defectQty = req.defectQty;
        o.stages[stageId].postWorkWeight = req.weight;
        o.stages[stageId].workLogs.push(`[승인] Stage${stageId} 작업자:${req.userName} 완료 (양품:${req.postWorkQty} | 불량:${req.defectQty})`);
        
        // 다음 스테이지 준비
        if (String(stageId) === "1") {
            o.currentTask = "2";
            o.progressStatus = "생산중 (Stage 2 대기)";
            o.stages["2"] = { operator: "", startTime: "오후 5:19:00", endTime: null, workLogs: [], statusSubmitted: false };
        } else if (String(stageId) === "2") {
            o.currentTask = "3";
            o.progressStatus = "생산중 (Stage 3 대기)";
        } else {
            const nextVal = parseInt(stageId) + 1;
            o.currentTask = isNaN(nextVal) ? "5-2" : String(nextVal);
            o.progressStatus = `생산중 (Stage ${o.currentTask} 대기)`;
        }
        saveOrders(orders);
        console.log(`[OK] 매니저가 Stage ${stageId} 승인 완료 ➡️ 다음 Stage 전이.`);
    }
}
approveRequest(orderId, "1");


// 5. Stage 2 진행 중 김영희 작업자와 교대(Handover) 진행
console.log("\n=== 5단계: 최수아 ➡️ 김영희 P2P 교대(Handover) 진행 ===");
// 최수아가 교대 요청 생성
function triggerHandoverRequest(oId, stageId, currentWorker) {
    localStorage.setItem("kimp_handover_req", JSON.stringify({
        orderId: oId,
        stage: stageId,
        fromWorker: currentWorker,
        timestamp: Date.now(),
        message: `Stage ${stageId} 절임 상태 양호, 물 10L 추가 투입함. 교대 요청 드립니다.`
    }));
    console.log(`[HMI] ${currentWorker} 작업자가 교대 요청을 생성하여 로컬스토리지에 등록했습니다.`);
}
triggerHandoverRequest(orderId, "2", "최수아");

// 김영희가 교대 요청 수락
function acceptHandover(targetWorker) {
    let req = JSON.parse(localStorage.getItem("kimp_handover_req") || "{}");
    if (!req.orderId) return;
    
    let orders = getOrders();
    let o = orders[req.orderId];
    if (o && o.stages[req.stage]) {
        // 기존 작업 이력 로그에 기록
        o.stages[req.stage].workLogs.push(`[교대] 오후 5:25:00 작업자:${req.fromWorker} ➡️ 작업자:${targetWorker} (사유: ${req.message})`);
        // 현재 인계받은 작업자로 설정
        o.stages[req.stage].operator = targetWorker;
        saveOrders(orders);
        
        localStorage.removeItem("kimp_handover_req");
        console.log(`[OK] 헬퍼/작업자 ${targetWorker} 가 교대를 수락했습니다 ➡️ Stage ${req.stage} 작업자가 ${targetWorker} 로 갱신되었습니다.`);
    }
}
acceptHandover("김영희");


// 6. 김영희가 Stage 2 완료 승인 요청
console.log("\n=== 6단계: 김영희 작업자 Stage 2 완료 승인 요청 ===");
requestCompletionApproval(orderId, "2", "김영희");


// 7. 매니저가 Stage 2 승인 ➡️ 절임 배치 자동 생성
console.log("\n=== 7단계: 매니저 Stage 2 승인 및 절임 배치 추가 ===");
function approveStage2AndCreateSalting(oId) {
    approveRequest(oId, "2");
    
    // 절임 배치 추가 로직 모사
    let saltingBatches = JSON.parse(localStorage.getItem("kimp_factory_salting") || "[]");
    saltingBatches.push({
        batchId: "SALT-" + Date.now(),
        orderId: oId,
        status: "salting",
        startTime: Date.now(),
        durationHours: 6,
        flipCount: 0
    });
    localStorage.setItem("kimp_factory_salting", JSON.stringify(saltingBatches));
    console.log(`[OK] Stage 2 완료 승인 ➡️ 절임(salting) 배치 정상 생성되었습니다.`);
}
approveStage2AndCreateSalting(orderId);


// 8. 숙성 완료 처리 (HMI Stage 3 진행을 위해 matured 로 변경)
console.log("\n=== 8단계: 절임 배추 숙성 완료 처리 ===");
function matureSaltingBatch(oId) {
    let saltingBatches = JSON.parse(localStorage.getItem("kimp_factory_salting") || "[]");
    let batch = saltingBatches.find(b => b.orderId === oId);
    if (batch) {
        batch.status = "matured";
        localStorage.setItem("kimp_factory_salting", JSON.stringify(saltingBatches));
        
        // 숙성 완료 포기 수 추가
        let maturedCount = parseInt(localStorage.getItem("kimp_factory_matured_cabbages") || "0");
        maturedCount += 15;
        localStorage.setItem("kimp_factory_matured_cabbages", maturedCount.toString());
        console.log(`[OK] 절임 배추 완숙 완료! (보유 절임 배추: ${maturedCount}포기)`);
    }
}
matureSaltingBatch(orderId);


// 9. 김영희가 Stage 3 진행 및 완료
console.log("\n=== 9단계: 김영희 작업자 Stage 3 진행 및 완료 승인 ===");
let orders = getOrders();
orders[orderId].stages["3"] = { operator: "김영희", startTime: "오후 5:35:00", endTime: null, workLogs: [], statusSubmitted: false };
saveOrders(orders);

requestCompletionApproval(orderId, "3", "김영희");
approveRequest(orderId, "3");


// 10. Stage 4 진행 중 헬퍼 도움 호출 ➡️ 김영희 헬퍼 지원 ➡️ 스텝 자동 완료
console.log("\n=== 10단계: Stage 4 진행 중 헬퍼 지원 및 스텝 자동 완수 ===");
orders = getOrders();
orders[orderId].currentTask = "4";
orders[orderId].stages["4"] = { operator: "김영희", startTime: "오후 5:45:00", endTime: null, workLogs: [], statusSubmitted: false };
saveOrders(orders);

// 김영희가 헬퍼 호출
// 김영희가 헬퍼 호출
let req = {
    requester: "김영희",
    stage: "4",
    stageName: "김치버무림",
    order: orderId,
    status: "requested",
    time: "오후 5:35:00",
    timestamp: Date.now()
};
localStorage.setItem("kimp_help_request", JSON.stringify(req));
console.log("[HMI] 김영희가 Stage 4에서 헬퍼 지원을 요청했습니다.");

// 헬퍼(홍길동)가 수락 및 완료 처리
let reqStr = localStorage.getItem("kimp_help_request");
if (reqStr) {
    let r = JSON.parse(reqStr);
    r.status = "completed";
    r.helperName = "홍길동";
    r.duration = 30;
    localStorage.setItem("kimp_help_request", JSON.stringify(r));
    console.log("[Lounge] 헬퍼 홍길동이 김영희의 요청을 수락하여 30초간 돕고 완료했습니다.");
}

// 김영희 HMI에서 완료 감지 ➡️ 스텝 자동 완료
let freshReqStr = localStorage.getItem("kimp_help_request");
if (freshReqStr) {
    let completedReq = JSON.parse(freshReqStr);
    if (completedReq.status === "completed") {
        console.log(`[HMI 액션] 헬퍼 ${completedReq.helperName} 도움 완료 수신! 현재 스텝이 자동으로 해결되어 다음 단계로 진행합니다.`);
        localStorage.removeItem("kimp_help_request");
    }
}

requestCompletionApproval(orderId, "4", "김영희");
approveRequest(orderId, "4");


// 11. Stage 5-1 양념용 지시서 발행 및 5-1 진행/완료 (자재 차감 및 완제 양념 증가)
console.log("\n=== 11단계: 양념용 지시서 발행 및 Stage 5-1 전달 자재 차감 ===");
const seasoningOrderId = "260712-1900-1";
let allOrders = getOrders();
allOrders[seasoningOrderId] = {
    orderId: seasoningOrderId,
    productId: "seasoning",
    productName: "양념 만들기 (Stage 5-1)",
    quantity: 1900, // 1900g
    status: "in_progress",
    currentTask: "5-1-pending",
    ingredients: { chili: 300, paste: 1000, fishsauce: 150 } // g 단위
};
saveOrders(allOrders);

// 5-1로 전달
function deliverToStage5_1Sim(oId) {
    let ords = getOrders();
    let o = ords[oId];
    o.currentTask = "5-1";
    o.stages = { "5-1": { operator: "", startTime: "오후 5:50:00", endTime: null, workLogs: [], statusSubmitted: false } };
    
    // 원부자재 차감
    let inv = JSON.parse(localStorage.getItem("kimp_factory_inventory") || "{}");
    const ing = o.ingredients || {};
    inv.redPepperPowder.weight = Math.max(0, inv.redPepperPowder.weight - (ing.chili / 1000.0));
    inv.flour.weight = Math.max(0, inv.flour.weight - (ing.paste / 1000.0));
    inv.anchovySauce.volume = Math.max(0, inv.anchovySauce.volume - (ing.fishsauce / 1000.0));
    localStorage.setItem("kimp_factory_inventory", JSON.stringify(inv));
    
    saveOrders(ords);
    console.log(`[OK] 양념용 지시서 ${oId} Stage 5-1 전송완료 ➡️ 원부재료 차감 완료!`);
}
deliverToStage5_1Sim(seasoningOrderId);

// 5-1 완료 ➡️ 완제 양념 가산
function completeStage5_1Sim(oId) {
    let ords = getOrders();
    let o = ords[oId];
    o.stages["5-1"].operator = "김영희";
    o.stages["5-1"].endTime = "오후 5:55:00";
    o.stages["5-1"].statusSubmitted = true;
    o.status = "completed";
    saveOrders(ords);
    
    // 메인 재고 가산
    let inv = JSON.parse(localStorage.getItem("kimp_factory_inventory") || "{}");
    inv.seasoning.weight += (o.quantity / 1000.0);
    localStorage.setItem("kimp_factory_inventory", JSON.stringify(inv));
    console.log(`[OK] Stage 5-1 양념 만들기 완료! ➡️ 제조 양념 재고량 ${inv.seasoning.weight}kg 로 가산 누적 완료.`);
}
completeStage5_1Sim(seasoningOrderId);


// 12. Stage 5-2 양념 바름 진행 및 완료
console.log("\n=== 12단계: 김영희 작업자 Stage 5-2 양념 바르기 진행 및 완료 ===");
orders = getOrders();
orders[orderId].currentTask = "5-2";
orders[orderId].stages["5-2"] = { operator: "김영희", startTime: "오후 5:56:00", endTime: null, workLogs: [], statusSubmitted: false };
saveOrders(orders);

requestCompletionApproval(orderId, "5-2", "김영희");
approveRequest(orderId, "5-2");


// 13. Stage 6 포장용 지시서 발행 및 포장 완료
console.log("\n=== 13단계: Stage 6 최종 포장완료 및 완제품 입고 ===");
orders = getOrders();
orders[orderId].currentTask = "6";
orders[orderId].stages["6"] = { operator: "김영희", startTime: "오후 6:00:00", endTime: null, workLogs: [], statusSubmitted: false };
saveOrders(orders);

requestCompletionApproval(orderId, "6", "김영희");

// 매니저 최종 승인 ➡️ 완제품 재고 가산 및 지시서 completed
function approveStage6AndComplete(oId) {
    approveRequest(oId, "6");
    
    let ords = getOrders();
    let o = ords[oId];
    o.status = "completed";
    o.progressStatus = "생산 완료";
    saveOrders(ords);
    
    // 완제품 재고 가산 및 완제 양념 차감 모사
    const qty = o.quantity || 15;
    let inv = JSON.parse(localStorage.getItem("kimp_factory_inventory") || "{}");
    const neededSauceKg = qty * 2.5 * 0.3;
    inv.seasoning.weight = Math.max(0, inv.seasoning.weight - neededSauceKg);
    localStorage.setItem("kimp_factory_inventory", JSON.stringify(inv));
    
    console.log(`[OK] 지시서 ${oId} 최종 출하 승인 완료! status: ${o.status} (양념 차감 후 재고: ${inv.seasoning.weight.toFixed(2)}kg)`);
}
approveStage6AndComplete(orderId);


// 14. 비품(냉장고) 추가 구매 연동
console.log("\n=== 14단계: 냉장고(설비) 추가 구매 ➡️ 지출 비용 가산 검증 ===");
localStorage.setItem("kimp_factory_finance", JSON.stringify({ revenue: 194500, cost: 87600 }));
localStorage.setItem("kimp_equipment_purchases_cost", "0");

function buyEquipmentSim(price) {
    let equipCost = parseInt(localStorage.getItem("kimp_equipment_purchases_cost") || "0");
    equipCost += price;
    localStorage.setItem("kimp_equipment_purchases_cost", equipCost.toString());

    let finance = JSON.parse(localStorage.getItem("kimp_factory_finance") || '{"revenue":194500,"cost":87600}');
    finance.cost += price;
    localStorage.setItem("kimp_factory_finance", JSON.stringify(finance));
    console.log(`[OK] 비품 구매 완료 (누적 비품 구매 비용: ${equipCost.toLocaleString()}원)`);
}
buyEquipmentSim(1850000); // 1,850,000원 지출


// 15. 상세 정보 모달 데이터 정합성 자체 Asserts 검증
console.log("\n=== 15단계: 상세 이력 타임라인 데이터 정합성 검증 (Timeline Asserts) ===");
const finalOrders = getOrders();
const targetOrder = finalOrders[orderId];

// 검증 1: Stage 1 시작/종료 시간
console.log(`[검증 1] Stage 1 시각 기록: 시작(${targetOrder.stages["1"].startTime}) / 종료(${targetOrder.stages["1"].endTime})`);
if (targetOrder.stages["1"].startTime !== "오후 5:12:00" || targetOrder.stages["1"].endTime !== "오후 5:18:00") {
    throw new Error("Stage 1 시작/종료 시각 정합성 실패");
}

// 검증 2: Stage 2 교대 작업자 정보
const stage2Logs = targetOrder.stages["2"].workLogs;
console.log(`[검증 2] Stage 2 교대 로그: \n  ${stage2Logs.join('\n  ')}`);
let hasHandoverLog = false;
stage2Logs.forEach(log => {
    if (log.includes("작업자:최수아 ➡️ 작업자:김영희")) hasHandoverLog = true;
});
if (!hasHandoverLog) {
    throw new Error("교대(Handover) 히스토리 로그 기재 누락");
}

// 검증 3: 양품 수량 및 무게 필드 온전성
console.log(`[검증 3] Stage 1 실적 필드: 수량(${targetOrder.stages["1"].postWorkQty}포기) / 무게(${targetOrder.stages["1"].postWorkWeight}kg)`);
if (targetOrder.stages["1"].postWorkQty !== 15 || targetOrder.stages["1"].postWorkWeight !== 37.5) {
    throw new Error("실적량 및 무게 데이터 정합성 실패");
}

// 검증 4: 최종 완제품 입고 시 완제 양념 재고량 정상 차감 검증
const finalInv = JSON.parse(localStorage.getItem("kimp_factory_inventory"));
console.log(`[검증 4] 최종 양념 재고: ${finalInv.seasoning.weight.toFixed(2)}kg`);
if (parseFloat(finalInv.seasoning.weight.toFixed(2)) !== 0.65) { // 11.9 - 11.25 = 0.65kg
    throw new Error("최종 완제품 생산 시 완제 양념 재고 차감 정합성 실패");
}

// 검증 5: 배송 라벨 일괄 출력 HTML 빌드 정합성 검증
console.log("\n=== 16단계: 배송 라벨 일괄 인쇄 HTML 조립 검증 ===");
const testOrders = [
    { orderId: "ORD-1", customerName: "이순신", address: "전남 여수시 좌수영로", productId: "p300g", quantity: 5, price: 3000, status: "입금 완료" }
];
localStorage.setItem("kimp_delivery_orders", JSON.stringify(testOrders));

function simulatePrintHtml() {
    const orders = JSON.parse(localStorage.getItem("kimp_delivery_orders"));
    const fallbackMemos = ["문 앞에 놔주세요."];
    let labelHtml = "";
    orders.forEach((o, index) => {
        const phone = o.phone || "010-****-****";
        const memo = o.memo || o.message || fallbackMemos[index % fallbackMemos.length];
        labelHtml += `
        <div class="label-card">
            <span class="label-logo">📦 AFOOD KIMCHI FACTORY</span>
            <span class="info-val font-bold">${o.customerName} (${phone})</span>
            <span class="info-val font-bold">${o.address}</span>
            <p class="memo-content">${memo}</p>
        </div>
        `;
    });
    return labelHtml;
}

const htmlResult = simulatePrintHtml();
console.log(`[조립된 HTML 미리보기]:\n\${htmlResult.trim()}`);

if (!htmlResult.includes("이순신") || !htmlResult.includes("전남 여수시") || !htmlResult.includes("문 앞에 놔주세요.")) {
    throw new Error("배송 라벨 HTML 조립 정합성 검사 실패");
}
console.log("[OK] 배송 라벨 HTML 조립 및 고객 요청사항(문의사항) 정상 매핑 완료!");

console.log("\n*** [SUCCESS] 다중 작업자 Full-Chain 공정 및 교대(Handover) 통합 디버깅 테스트 완벽 통과! 💮 ***");
