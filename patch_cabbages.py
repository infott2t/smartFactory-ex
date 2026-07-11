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

# Target block in js/store.js to preserve custom stage keys during database serialization
target_db = """        dbStages[4] = {
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
        return cloned;"""

replacement_db = """        dbStages[4] = {
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
        return cloned;"""

patch_file(os.path.join(base_dir, "js/store.js"), target_db, replacement_db)
