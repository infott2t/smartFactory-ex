/**
 * AuthManager - 스마트 팩토리 사용자 세션 및 권한 관리 모듈
 */
(function() {
    const AuthManager = {
        // 테스트용 Mock 데이터 회원 목록
         mockUsers: window.MockData ? window.MockData.users : [],

        /**
         * 현재 로그인한 세션 사용자 객체 반환
         */
        getCurrentUser() {
            const userJson = sessionStorage.getItem("user");
            if (!userJson) return null;
            try {
                return JSON.parse(userJson);
            } catch (e) {
                console.error("세션 파싱 에러:", e);
                return null;
            }
        },

        /**
         * 세션 사용자 ID 반환
         */
        getUserId() {
            return sessionStorage.getItem("user-id") || "guest";
        },

        /**
         * 이메일 기반 Mock 로그인 처리
         */
        login(email) {
            const userObj = this.mockUsers.find(u => u.email === email);
            if (!userObj) {
                return false;
            }

            const resolvedUserId = "local-" + userObj.email;
            sessionStorage.setItem("user-id", resolvedUserId);

            // 시뮬레이터 초기 플래그 세팅
            sessionStorage.setItem("virt-0-mapChk", 'false');
            sessionStorage.setItem("virt-0-qrChk", 'false');
            sessionStorage.setItem("virt-0-clothesChk", 'false');
            sessionStorage.setItem("virt-0-handChk", 'false');
            sessionStorage.setItem("completeStep1", 'false');
            sessionStorage.setItem("virt-1-mapChk", 'false');
            sessionStorage.setItem("work-stars", "false");

            const user = {
                id: userObj.id,
                name: userObj.name,
                email: userObj.email,
                picture: "",
                role: userObj.role,
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            };

            const userInfo = {
                id: 100 + userObj.id,
                addr: userObj.address,
                tel: userObj.tel,
                email: userObj.email,
                password: "",
                isDel: "N",
                gender: userObj.gender,
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                user: user
            };

            const workerProfile = {
                profileId: userObj.id,
                userId: userObj.id,
                workedHours: userObj.workedHours,
                healthCertificateImage: userObj.certImage,
                healthCertificateStatus: userObj.certStatus,
                isManagerQualified: userObj.workedHours >= 30 && userObj.certStatus === "approved"
            };

            sessionStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("user_info", JSON.stringify(userInfo));
            sessionStorage.setItem("kimp_worker_profile", JSON.stringify(workerProfile));

            if (typeof window.addAppLog === 'function') {
                window.addAppLog(user.name + " 님이 간편 로그인 하였습니다.");
            }

            return true;
        },

        /**
         * 로그아웃 처리
         */
        logout() {
            sessionStorage.clear();
            alert("로그아웃 되었습니다.");
            window.location.href = "./login.html";
        },

        /**
         * 각 페이지 접근 시 가드 및 권한 체크
         */
        checkGuard() {
            const user = this.getCurrentUser();
            const currentPath = window.location.pathname;

            const isLoginPage = currentPath.includes("login.html");
            const isIndexPage = currentPath.includes("index.html") || currentPath.endsWith("/smart2/") || currentPath.endsWith("/smartf2-html/") || currentPath.endsWith("/");
            const isMainPage = currentPath.includes("main.html");

            if (!user) {
                // 미인증 사용자 보호 페이지 접근 제한
                if (!isLoginPage && !isIndexPage && !isMainPage) {
                    alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
                    window.location.href = "login.html";
                    return false;
                }
            } else {
                // 인증된 사용자가 로그인 페이지 재진입 방지
                if (isLoginPage) {
                    window.location.href = "main.html";
                    return true;
                }

                // 역할/등급 기반 권한 검증
                const role = user.role;
                if (currentPath.includes("manager.html")) {
                    if (role !== "ROLE_MANAGER") {
                        alert("매니저 권한이 필요합니다. 메인 페이지로 이동합니다.");
                        window.location.href = "main.html";
                        return false;
                    }
                } else if (currentPath.includes("kimp_helper.html")) {
                    if (role !== "ROLE_HELPER" && role !== "ROLE_MANAGER") {
                        alert("헬퍼 권한이 필요합니다. 메인 페이지로 이동합니다.");
                        window.location.href = "main.html";
                        return false;
                    }
                }
            }
            return true;
        }
    };

    // 전역 객체 등록
    window.AuthManager = AuthManager;
})();
