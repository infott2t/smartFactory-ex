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

# Target string in js/store.js
target_store = """                    let isLocalNewer = false;
                    if (localTask === 2) {
                        isLocalNewer = true;
                    } else if (localStatusPriority > storageStatusPriority) {
                        isLocalNewer = true;
                    } else if (localStatusPriority === storageStatusPriority) {
                        if (localProgressPriority > storageProgressPriority) {
                            isLocalNewer = true;
                        } else if (localProgressPriority === storageProgressPriority) {
                            if (localTask > storageTask) {
                                isLocalNewer = true;
                            }
                        }
                    }"""

replacement_store = """                    let isLocalNewer = false;
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
                    }"""

patch_file(os.path.join(base_dir, "js/store.js"), target_store, replacement_store)
