(function() {
    const userJson = sessionStorage.getItem("user");
    const currentPath = window.location.pathname;
    
    const isLoginPage = currentPath.includes("login.html");
    const isIndexPage = currentPath.includes("index.html") || currentPath.endsWith("/smart2/") || currentPath.endsWith("/smartf2-html/") || currentPath.endsWith("/");
    const isMainPage = currentPath.includes("main.html");
    
    if (!userJson) {
        if (!isLoginPage && !isIndexPage && !isMainPage) {
            alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
            window.location.href = "login.html";
        }
    } else {
        if (isLoginPage) {
            window.location.href = "main.html";
        }
    }
})();

// Global Partitioned LocalStorage helpers
window.getStorageKey = function(key) {
    // Keep reservations and production orders database global/shared
    if (key === 'kimp_reservations_db' || key === 'kimp_production_orders') {
        return key;
    }
    const userId = sessionStorage.getItem("user-id") || "guest";
    return key + "_" + userId;
};

window.getPartitionedItem = function(key) {
    return localStorage.getItem(window.getStorageKey(key));
};

window.setPartitionedItem = function(key, value) {
    localStorage.setItem(window.getStorageKey(key), value);
};

window.removePartitionedItem = function(key) {
    localStorage.removeItem(window.getStorageKey(key));
};

// App Activity Logging helper
window.addAppLog = function(actionDescription) {
    let logs = JSON.parse(localStorage.getItem("app_activity_logs") || "[]");
    
    // Get current user information
    let userName = "GUEST";
    const userJson = sessionStorage.getItem("user");
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            userName = user.name || user.email || "사용자";
        } catch(e) {
            userName = "사용자";
        }
    }
    
    // Get current page filename
    const pathParts = window.location.pathname.split("/");
    let pageName = pathParts[pathParts.length - 1] || "index.html";
    if (pageName === "") pageName = "index.html";
    
    // Get current date & time
    const now = new Date();
    const formattedTime = now.getFullYear() + "-" + 
                          String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                          String(now.getDate()).padStart(2, '0') + " " + 
                          String(now.getHours()).padStart(2, '0') + ":" + 
                          String(now.getMinutes()).padStart(2, '0') + ":" + 
                          String(now.getSeconds()).padStart(2, '0');
    
    // Create log entry
    const entry = {
        userName: userName,
        pageName: pageName,
        time: formattedTime,
        action: actionDescription
    };
    
    // Add to logs and cap size
    logs.push(entry);
    if (logs.length > 200) {
        logs.shift(); // Remove oldest
    }
    
    localStorage.setItem("app_activity_logs", JSON.stringify(logs));
};

// Automatically log page view on script execution
(function() {
    // Avoid double logging on redirects by checking readyState
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            window.addAppLog("페이지에 접속했습니다.");
        });
    } else {
        window.addAppLog("페이지에 접속했습니다.");
    }
})();
