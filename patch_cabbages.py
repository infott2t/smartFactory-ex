import os

def patch_file(filepath, target, replacement):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    target_lf = target.replace('\r\n', '\n')
    target_crlf = target.replace('\n', '\r\n').replace('\r\r\n', '\r\n')
    replacement_lf = replacement.replace('\r\n', '\n')
    replacement_crlf = replacement.replace('\n', '\r\n').replace('\r\r\n', '\r\n')

    if target_crlf in content:
        content = content.replace(target_crlf, replacement_crlf)
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print(f"Successfully patched (CRLF) {os.path.basename(filepath)}")
        return True
    elif target_lf in content:
        content = content.replace(target_lf, replacement_lf)
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print(f"Successfully patched (LF) {os.path.basename(filepath)}")
        return True
    else:
        print(f"Target not found in {os.path.basename(filepath)}")
        return False

# Base directory
base_dir = r"c:\Users\ee323\.gemini\antigravity\scratch\smartf2E\smartFactory-ex"
filepath = os.path.join(base_dir, "manager.html")

# 1. Patch manager.html - workLogs integration on manager approvals
target_approvals = """                                orders[orderId].stages[3].postWorkQty = req.postWorkQty || 30;
                                orders[orderId].stages[3].postWorkWeight = req.weight || 24.0;
                                orders[orderId].stages[3].endTime = new Date().toLocaleTimeString();

                                orders[orderId].stages[3].dryingStatus = "wait_timer";

                                orders[orderId].currentTask = 3;
                                orders[orderId].progressStatus = "생산중(Stage3-1 세척 완료)";
                            } else if (stageNum === 32) {
                                if (!orders[orderId].stages[3]) {
                                    orders[orderId].stages[3] = {};
                                }
                                if (!orders[orderId].stages[3].stage32) {
                                    orders[orderId].stages[3].stage32 = {};
                                }
                                let s32 = orders[orderId].stages[3].stage32;
                                s32.statusSubmitted = true;
                                s32.step1Done = true;
                                s32.step2Done = true;
                                s32.step3Done = true;
                                s32.step4Done = true;
                                s32.step5Done = true;
                                s32.step2Status = "approved";
                                s32.step3Status = "approved";
                                s32.postWorkQty = req.postWorkQty || 15;
                                s32.postWorkWeight = req.weight || 12.0;
                                s32.endTime = new Date().toLocaleTimeString();

                                orders[orderId].stages[3].dryingStatus = "completed";
                                orders[orderId].stages[3].refrigeratorStoredTime = Date.now();

                                orders[orderId].currentTask = 4;
                                orders[orderId].progressStatus = "생산중 (Stage 3 완료)";
                            } else {
                                if (!orders[orderId].stages[stageNum]) {
                                    orders[orderId].stages[stageNum] = {};
                                }
                                orders[orderId].stages[stageNum].statusSubmitted = true;
                                orders[orderId].stages[stageNum].step1Done = true;
                                orders[orderId].stages[stageNum].step2Done = true;
                                orders[orderId].stages[stageNum].step3Done = true;
                                orders[orderId].stages[stageNum].step4Done = true;
                                orders[orderId].stages[stageNum].step5Done = true;
                                orders[orderId].stages[stageNum].step2Status = "approved";
                                orders[orderId].stages[stageNum].step3Status = "approved";
                                orders[orderId].stages[stageNum].postWorkQty = req.postWorkQty || 5;
                                orders[orderId].stages[stageNum].postWorkWeight = req.weight || 4.0;
                                orders[orderId].stages[stageNum].endTime = new Date().toLocaleTimeString();"""

replacement_approvals = """                                orders[orderId].stages[3].postWorkQty = req.postWorkQty || 30;
                                orders[orderId].stages[3].postWorkWeight = req.weight || 24.0;
                                orders[orderId].stages[3].endTime = new Date().toLocaleTimeString();
                                if (!orders[orderId].stages[3].workLogs) orders[orderId].stages[3].workLogs = [];
                                orders[orderId].stages[3].workLogs.push(`${orderId} Stage3 세척승인완료 ${new Date().toLocaleTimeString()} 양품:${req.postWorkQty || 30} | 무게:${req.weight || 24.0}`);

                                orders[orderId].stages[3].dryingStatus = "wait_timer";

                                orders[orderId].currentTask = 3;
                                orders[orderId].progressStatus = "생산중(Stage3-1 세척 완료)";
                            } else if (stageNum === 32) {
                                if (!orders[orderId].stages[3]) {
                                    orders[orderId].stages[3] = {};
                                }
                                if (!orders[orderId].stages[3].stage32) {
                                    orders[orderId].stages[3].stage32 = {};
                                }
                                let s32 = orders[orderId].stages[3].stage32;
                                s32.statusSubmitted = true;
                                s32.step1Done = true;
                                s32.step2Done = true;
                                s32.step3Done = true;
                                s32.step4Done = true;
                                s32.step5Done = true;
                                s32.step2Status = "approved";
                                s32.step3Status = "approved";
                                s32.postWorkQty = req.postWorkQty || 15;
                                s32.postWorkWeight = req.weight || 12.0;
                                s32.endTime = new Date().toLocaleTimeString();
                                if (!s32.workLogs) s32.workLogs = [];
                                s32.workLogs.push(`${orderId} Stage3-2 무게재기승인완료 ${new Date().toLocaleTimeString()} 양품:${req.postWorkQty || 15} | 무게:${req.weight || 12.0}`);

                                orders[orderId].stages[3].dryingStatus = "completed";
                                orders[orderId].stages[3].refrigeratorStoredTime = Date.now();

                                orders[orderId].currentTask = 4;
                                orders[orderId].progressStatus = "생산중 (Stage 3 완료)";
                            } else {
                                if (!orders[orderId].stages[stageNum]) {
                                    orders[orderId].stages[stageNum] = {};
                                }
                                orders[orderId].stages[stageNum].statusSubmitted = true;
                                orders[orderId].stages[stageNum].step1Done = true;
                                orders[orderId].stages[stageNum].step2Done = true;
                                orders[orderId].stages[stageNum].step3Done = true;
                                orders[orderId].stages[stageNum].step4Done = true;
                                orders[orderId].stages[stageNum].step5Done = true;
                                orders[orderId].stages[stageNum].step2Status = "approved";
                                orders[orderId].stages[stageNum].step3Status = "approved";
                                orders[orderId].stages[stageNum].postWorkQty = req.postWorkQty || 5;
                                orders[orderId].stages[stageNum].postWorkWeight = req.weight || 4.0;
                                orders[orderId].stages[stageNum].endTime = new Date().toLocaleTimeString();
                                if (!orders[orderId].stages[stageNum].workLogs) orders[orderId].stages[stageNum].workLogs = [];
                                orders[orderId].stages[stageNum].workLogs.push(`${orderId} Stage${stageNum} 승인완료 ${new Date().toLocaleTimeString()} 양품:${req.postWorkQty || 5} | 무게:${req.weight || 4.0}`);"""

patch_file(filepath, target_approvals, replacement_approvals)


# 2. Patch manager.html - Inject detailed history buttons to order list rows
target_buttons = """                if (o.status === "pending") {
                    actionBtn = `<button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; background-color: var(--accent-purple-bg); color: var(--accent-purple);" onclick="sendOrderToStage1('${o.orderId}')">Stage 1로 전달</button><span class="info-tooltip-wrap"><i class="bi bi-info-circle" style="color: var(--accent-blue); font-size: 14px;"></i><span class="info-tooltip-text">Stage 1에 작업지시서를 전달해주세요.</span></span> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; margin-left: 4px;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button>`;
                } else if (o.status === "in_progress") {
                    actionBtn = `<div style="display: flex; align-items: center; gap: 6px;"><span style="font-size:11px; color: var(--text-secondary);">작업 중</span> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button></div>`;
                } else if (o.status === "completed") {
                    actionBtn = `<div style="display: flex; align-items: center; gap: 6px;"><i class="bi bi-check-circle-fill" style="color: var(--accent-green); font-size: 16px;"></i> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button></div>`;
                }"""

replacement_buttons = """                if (o.status === "pending") {
                    actionBtn = `<button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; background-color: var(--accent-purple-bg); color: var(--accent-purple);" onclick="sendOrderToStage1('${o.orderId}')">Stage 1로 전달</button><span class="info-tooltip-wrap"><i class="bi bi-info-circle" style="color: var(--accent-blue); font-size: 14px;"></i><span class="info-tooltip-text">Stage 1에 작업지시서를 전달해주세요.</span></span> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; margin-left: 4px;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; margin-left: 4px; background-color: var(--accent-blue-bg); color: var(--accent-blue);" onclick="openOrderHistoryModal('${o.orderId}')">상세 이력</button>`;
                } else if (o.status === "in_progress") {
                    actionBtn = `<div style="display: flex; align-items: center; gap: 6px;"><span style="font-size:11px; color: var(--text-secondary);">작업 중</span> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex; background-color: var(--accent-blue-bg); color: var(--accent-blue);" onclick="openOrderHistoryModal('${o.orderId}')">상세 이력</button></div>`;
                } else if (o.status === "completed") {
                    actionBtn = `<div style="display: flex; align-items: center; gap: 6px;"><i class="bi bi-check-circle-fill" style="color: var(--accent-green); font-size: 16px;"></i> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex;" onclick="printOrderSheet('${o.orderId}')">[인쇄하기]</button> <button class="top-action-btn" style="padding: 4px 8px; font-size: 11px; display: inline-flex; background-color: var(--accent-blue-bg); color: var(--accent-blue);" onclick="openOrderHistoryModal('${o.orderId}')">상세 이력</button></div>`;
                }"""

patch_file(filepath, target_buttons, replacement_buttons)


# 3. Patch manager.html - Append modal markup and history definition at the end
target_end = """            // 오늘/어제 주문 실적 카드 싱크
            const statsOrdersComp = document.getElementById("stats-orders-comp");
            if (statsOrdersComp) {
                let todayTotal = 0, yesterdayTotal = 0;
                Object.keys(products).forEach(k => {
                    todayTotal += products[k].todayOrders || 0;
                    yesterdayTotal += products[k].yesterdayOrders || 0;
                });
                statsOrdersComp.textContent = `${todayTotal + orders.length}건 / ${yesterdayTotal}건`;
            }
        }

    </script>
</body>

</html>"""

replacement_end = """            // 오늘/어제 주문 실적 카드 싱크
            const statsOrdersComp = document.getElementById("stats-orders-comp");
            if (statsOrdersComp) {
                let todayTotal = 0, yesterdayTotal = 0;
                Object.keys(products).forEach(k => {
                    todayTotal += products[k].todayOrders || 0;
                    yesterdayTotal += products[k].yesterdayOrders || 0;
                });
                statsOrdersComp.textContent = `${todayTotal + orders.length}건 / ${yesterdayTotal}건`;
            }
        }

        window.openOrderHistoryModal = function(orderId) {
            const orders = loadProductionOrders();
            const o = orders[orderId];
            if (!o) {
                alert("해당 지시서를 찾을 수 없습니다.");
                return;
            }

            const body = document.getElementById("order-history-modal-body");
            if (!body) return;

            let html = `
                <div style="padding: 14px; background: #1e1f29; border: 1px solid #3f4257; border-radius: 8px; margin-bottom: 8px;">
                    <div style="font-size: 12px; color: #a0aec0; font-weight: 600;"><i class="bi bi-tag-fill"></i> 지시서 코드</div>
                    <div style="font-size: 18px; font-weight: 800; color: #38bdf8; font-family: var(--font-outfit); margin-top: 2px;">${o.orderId}</div>
                    <div style="margin-top: 10px; font-size: 12px; color: #a0aec0; font-weight: 600;"><i class="bi bi-cart-check-fill"></i> 제품 및 수량</div>
                    <div style="font-size: 15px; font-weight: 700; color: #c084fc; margin-top: 2px;">${o.productName || o.product || '배추김치'} / ${o.quantity || 15}포기</div>
                </div>
                <h4 style="margin: 12px 0 6px 0; font-size: 14px; color: #fff; font-weight: 700;"><i class="bi bi-diagram-3" style="color: #c084fc;"></i> Stage별 생산 이력 타임라인</h4>
                <div style="display: flex; flex-direction: column; gap: 12px; position: relative; padding-left: 20px; border-left: 2px dashed #3f4257; margin-left: 10px; margin-top: 8px;">
            `;

            const stagesList = [
                { id: "1", name: "공급 및 적재" },
                { id: "2", name: "배추 절임" },
                { id: "3", name: "세척 및 탈수 (3-1 세척)" },
                { id: "32", name: "무게 및 수량재기 (3-2)" },
                { id: "4", name: "밀봉 및 보관" },
                { id: "5-1", name: "양념 버무림 (소포장)" },
                { id: "5-2", name: "양념 버무림 (대포장)" },
                { id: "6", name: "포장 및 출하 대기" }
            ];

            stagesList.forEach(s => {
                let stageData = null;
                if (s.id === "32") {
                    stageData = o.stages && o.stages[3] && o.stages[3].stage32;
                } else {
                    stageData = o.stages && o.stages[s.id];
                }

                let isActivated = !!stageData;
                let startTime = (stageData && stageData.startTime) || "-";
                let endTime = (stageData && stageData.endTime) || "-";
                let qty = (stageData && stageData.postWorkQty) || "-";
                let weight = (stageData && stageData.postWorkWeight) ? `${stageData.postWorkWeight}kg` : "-";
                
                // 작업자 이름 추출 (교대 명단)
                let operators = [];
                if (stageData && stageData.operator) {
                    operators.push(stageData.operator);
                }
                
                if (stageData && stageData.workLogs) {
                    stageData.workLogs.forEach(log => {
                        const matchOp = log.match(/작업자:\\s*([^\\s|]+)/) || log.match(/작업자:([^\\s|]+)/);
                        if (matchOp && !operators.includes(matchOp[1])) {
                            operators.push(matchOp[1]);
                        }
                    });
                }
                let opText = operators.length > 0 ? operators.join(", ") : "-";

                // 불량 개수 집계
                let defectVal = 0;
                if (stageData && stageData.workLogs) {
                    stageData.workLogs.forEach(log => {
                        const matchDef = log.match(/불량:\\s*(\\d+)/) || log.match(/불량:(\\d+)/);
                        if (matchDef) {
                            defectVal += parseInt(matchDef[1], 10);
                        }
                    });
                }
                let defectText = defectVal > 0 ? `<span style="color: #ff7675; font-weight: bold;">${defectVal}포기</span>` : "0포기";

                let borderStyle = isActivated ? "border-color: #c084fc; background: #1a1b24;" : "border-color: #2d2f3f; background: #13141a; opacity: 0.65;";
                let iconColor = isActivated ? "color: #38bdf8;" : "color: #718096;";
                let statusText = isActivated ? (endTime !== "-" ? "<span style='color:#34d399; font-weight:700;'>완료</span>" : "<span style='color:#fbbf24; font-weight:700;'>진행 중</span>") : "<span style='color:#718096;'>대기 중</span>";

                html += `
                    <div style="position: relative; padding: 12px; border: 1px solid #3f4257; border-radius: 8px; ${borderStyle}">
                        <div style="position: absolute; left: -28px; top: 14px; width: 14px; height: 14px; border-radius: 50%; background: #13141a; border: 2px solid ${isActivated ? '#c084fc' : '#3f4257'};"></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <strong style="${iconColor} font-size: 14px; font-weight: 700;">Stage ${s.id === '32' ? '3-2' : s.id}. ${s.name}</strong>
                            <span style="font-size: 11px; padding: 2px 6px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">${statusText}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #cbd5e1;">
                            <div>시작 시각: <span style="color:#ffffff; font-weight:600;">${startTime}</span></div>
                            <div>종료 시각: <span style="color:#ffffff; font-weight:600;">${endTime}</span></div>
                            <div>작업자(교대): <span style="color:#ffffff; font-weight:600;">${opText}</span></div>
                            <div>실적(무게): <span style="color:#ffffff; font-weight:600;">${qty !== "-" ? qty + "포기" : "-"} (${weight})</span></div>
                            <div style="grid-column: span 2;">누적 불량 수량: ${defectText}</div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            body.innerHTML = html;

            document.getElementById("order-history-modal").style.display = "flex";
        };

        window.closeOrderHistoryModal = function() {
            document.getElementById("order-history-modal").style.display = "none";
        };

    </script>

    <!-- ── 생산지시서 상세 이력 팝업 모달 마크업 ── -->
    <div class="modal-overlay" id="order-history-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
        <div class="modal-content" style="background-color: #13141a; border: 2px solid #3f4257; border-radius: 12px; width: 90%; max-width: 600px; height: 580px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);">
            <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #3f4257; display: flex; justify-content: space-between; align-items: center; background-color: #1a1b24;">
                <h3 style="margin: 0; color: #c084fc; font-size: 18px; font-weight: 700;"><i class="bi bi-clock-history"></i> 생산지시서 상세 이력 추적</h3>
                <button style="background: none; border: none; color: #a0aec0; cursor: pointer; font-size: 20px; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#a0aec0'" onclick="closeOrderHistoryModal()"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body" id="order-history-modal-body" style="padding: 20px; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 16px; background-color: #13141a;">
                <!-- 상세 이력 리스트 노출 -->
            </div>
        </div>
    </div>
</body>

</html>"""

patch_file(filepath, target_end, replacement_end)
