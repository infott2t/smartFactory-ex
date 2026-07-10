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

# 1. Patch kimp_ex1.html - step.type === 'report' visualization logic to include product QR
target_report_visual = """            else if (step.type === 'report') {
                visualElement = `
                <div class="hmi-input-group">
                    <div class="input-row">
                        <label>양품 (정상)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-good', -1)"><i class="bi bi-dash"></i></button>
                            <input type="number" id="input-good" value="0" readonly />
                            <button onclick="changeValue('input-good', 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <div class="input-row defect">
                        <label>불량 (폐기)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-defect', -1)"><i class="bi bi-dash"></i></button>
                            <input type="number" id="input-defect" value="0" readonly />
                            <button onclick="changeValue('input-defect', 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <hr style="border:0; border-top:2px dashed var(--border-color); margin: 8px 0;">
                    <div class="input-row" style="margin-bottom:0;">
                        <label>총 무게 (kg)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-weight', -0.5)"><i class="bi bi-dash"></i></button>
                            <input type="number" step="0.1" id="input-weight" value="15.0" readonly />
                            <button onclick="changeValue('input-weight', 0.5)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                </div>
            `;
            }"""

replacement_report_visual = """            else if (step.type === 'report') {
                let prdQRHtml = '';
                if (String(appData.activeStageId) === "3") {
                    prdQRHtml = `
                    <hr style="border:0; border-top:2px dashed var(--border-color); margin: 8px 0;">
                    <div class="input-row" style="margin-bottom:12px; flex-direction:column; align-items:stretch;">
                        <label style="margin-bottom:6px; font-weight:bold;">제품 QR코드 스캔</label>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="product-qr-input" placeholder="제품 QR코드를 스캔하세요" readonly style="flex:1; padding:8px; border:1px solid var(--border-color); border-radius:6px; background:#f1f5f9; text-align:center; font-family:var(--font-outfit); font-weight:bold; font-size:14px;" />
                            <button class="btn btn-primary" onclick="simulateProductQRScan()" style="padding:0 12px; display:flex; align-items:center; justify-content:center; background:var(--primary); color:#fff; border:none; border-radius:6px;"><i class="bi bi-qr-code-scan"></i></button>
                        </div>
                        <div id="product-qr-success" style="display:none; color:var(--success); font-size:12px; font-weight:bold; margin-top:4px; text-align:left;"><i class="bi bi-patch-check-fill"></i> QR코드 인증 완료</div>
                    </div>
                    `;
                }

                visualElement = `
                <div class="hmi-input-group">
                    <div class="input-row">
                        <label>양품 (정상)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-good', -1)"><i class="bi bi-dash"></i></button>
                            <input type="number" id="input-good" value="0" readonly />
                            <button onclick="changeValue('input-good', 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <div class="input-row defect">
                        <label>불량 (폐기)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-defect', -1)"><i class="bi bi-dash"></i></button>
                            <input type="number" id="input-defect" value="0" readonly />
                            <button onclick="changeValue('input-defect', 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    ${prdQRHtml}
                    <hr style="border:0; border-top:2px dashed var(--border-color); margin: 8px 0;">
                    <div class="input-row" style="margin-bottom:0;">
                        <label>총 무게 (kg)</label>
                        <div class="number-stepper">
                            <button onclick="changeValue('input-weight', -0.5)"><i class="bi bi-dash"></i></button>
                            <input type="number" step="0.1" id="input-weight" value="15.0" readonly />
                            <button onclick="changeValue('input-weight', 0.5)"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                </div>
            `;
            }"""

patch_file(os.path.join(base_dir, "kimp_ex1.html"), target_report_visual, replacement_report_visual)


# 2. Patch kimp_ex1.html - nextStep validation logic injection
target_nextstep = """        function nextStep() {
            let workflow;"""

replacement_nextstep = """        function nextStep() {
            // 💡 [추가] Stage 3 수량 및 무게재기 시 제품 QR 스캔 여부 유효성 검사
            if (String(appData.activeStageId) === "3" && currentStepIndex === 5) {
                const qrInput = document.getElementById("product-qr-input");
                if (qrInput && (!qrInput.value || qrInput.value === "")) {
                    alert("제품 QR코드를 스캔하여 인증을 완료해 주세요.");
                    return;
                }
            }
            let workflow;"""

patch_file(os.path.join(base_dir, "kimp_ex1.html"), target_nextstep, replacement_nextstep)


# 3. Patch kimp_ex1.html - simulateProductQRScan helper function definition
target_camera = """        function simulateFinalCamera() {
            playShutterSound();"""

replacement_camera = """        function simulateProductQRScan() {
            if (!appData.currentOrder || !appData.currentOrder.id) return;
            const mockQR = "PRD-" + appData.currentOrder.id;
            const qrInput = document.getElementById("product-qr-input");
            const successDiv = document.getElementById("product-qr-success");
            if (qrInput && successDiv) {
                qrInput.value = mockQR;
                successDiv.style.display = "block";
                addLog(`[제품 QR] 제품 일치 여부 확인 완료: ${mockQR}`);
            }
        }
        function simulateFinalCamera() {
            playShutterSound();"""

patch_file(os.path.join(base_dir, "kimp_ex1.html"), target_camera, replacement_camera)
