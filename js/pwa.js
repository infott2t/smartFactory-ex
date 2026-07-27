/**
 * 공용 PWA 부트스트랩.
 * 모든 페이지에서 동일한 서비스 워커를 등록해, 어느 페이지에서 들어와도
 * 브라우저 주소창의 "앱 설치" 버튼이 뜨도록 만든다.
 */
(function () {
    'use strict';

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(function (error) {
                    console.warn('[pwa] 서비스 워커 등록 실패:', error);
                });
        });
    }

    /*
     * beforeinstallprompt 는 설치 요건(HTTPS 또는 localhost, manifest, 아이콘,
     * fetch 핸들러를 가진 서비스 워커)이 모두 충족될 때만 발생한다.
     * preventDefault() 는 호출하지 않는다. 호출하면 브라우저 기본 설치 UI 동작을
     * 가로채기 때문에, 주소창 설치 버튼을 그대로 쓰려면 기본 동작을 유지해야 한다.
     */
    window.addEventListener('beforeinstallprompt', function (event) {
        window.__pwaInstallPrompt = event;
        document.documentElement.classList.add('pwa-installable');
    });

    window.addEventListener('appinstalled', function () {
        window.__pwaInstallPrompt = null;
        document.documentElement.classList.remove('pwa-installable');
    });

    /** 인앱 설치 버튼을 붙이고 싶을 때 호출한다. */
    window.promptPwaInstall = function () {
        var deferred = window.__pwaInstallPrompt;
        if (!deferred) return Promise.resolve(null);
        deferred.prompt();
        return deferred.userChoice.then(function (choice) {
            window.__pwaInstallPrompt = null;
            return choice;
        });
    };
})();
