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

# Target block in manager.html to update the loop logic for isLast/InProgress
target_loop = """            stagesList.forEach(s => {
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
            });"""

replacement_loop = """            let hasShownActiveInProgress = false;

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

                let borderStyle = "";
                let iconColor = "";
                let statusText = "";

                if (isActivated) {
                    if (endTime !== "-") {
                        statusText = "<span style='color:#34d399; font-weight:700;'>완료</span>";
                        borderStyle = "border-color: #c084fc; background: #1a1b24;";
                        iconColor = "color: #38bdf8;";
                    } else {
                        if (!hasShownActiveInProgress) {
                            statusText = "<span style='color:#fbbf24; font-weight:700;'>진행 중</span>";
                            borderStyle = "border-color: #fbbf24; background: #1a1b24;";
                            iconColor = "color: #fbbf24;";
                            hasShownActiveInProgress = true;
                        } else {
                            statusText = "<span style='color:#718096;'>대기 중</span>";
                            borderStyle = "border-color: #2d2f3f; background: #13141a; opacity: 0.65;";
                            iconColor = "color: #718096;";
                        }
                    }
                } else {
                    statusText = "<span style='color:#718096;'>대기 중</span>";
                    borderStyle = "border-color: #2d2f3f; background: #13141a; opacity: 0.65;";
                    iconColor = "color: #718096;";
                }

                html += `
                    <div style="position: relative; padding: 12px; border: 1px solid #3f4257; border-radius: 8px; ${borderStyle}">
                        <div style="position: absolute; left: -28px; top: 14px; width: 14px; height: 14px; border-radius: 50%; background: #13141a; border: 2px solid ${isActivated && endTime !== '-' ? '#c084fc' : (isActivated && borderStyle.includes('fbbf24') ? '#fbbf24' : '#3f4257')};"></div>
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
            });"""

patch_file(os.path.join(base_dir, "manager.html"), target_loop, replacement_loop)
