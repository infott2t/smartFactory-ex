/**
 * 공용 PWA 부트스트랩.
 * GitHub Pages의 프로젝트 하위 경로에서도 같은 범위의 서비스 워커를 등록하고,
 * 지원되는 브라우저에서는 사용자 설치 버튼을 활성화한다.
 */
(function () {
    'use strict';

    var SERVICE_WORKER_URL = './sw.js?v=20260731-pwa-v8';
    var SERVICE_WORKER_SCOPE = './';
    var refreshingForNewWorker = false;
    var deferredInstallPrompt = null;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    function isIos() {
        var userAgent = window.navigator.userAgent || '';
        return /iphone|ipad|ipod/i.test(userAgent)
            || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    }

    function isAndroid() {
        return /android/i.test(window.navigator.userAgent || '');
    }

    function installContainers() {
        return document.querySelectorAll('[data-pwa-install-container]');
    }

    function updateInstallUi() {
        var containers = installContainers();
        var standalone = isStandalone();
        var ios = isIos();
        var android = isAndroid();

        Array.prototype.forEach.call(containers, function (container) {
            var button = container.querySelector('[data-pwa-install]');
            var note = container.querySelector('[data-pwa-install-note]');

            if (standalone || (!deferredInstallPrompt && !ios && !android)) {
                container.hidden = true;
                return;
            }

            container.hidden = false;

            if (deferredInstallPrompt) {
                if (note) note.textContent = '설치 준비가 완료되었습니다. 버튼을 눌러 앱으로 추가하세요.';
                if (button) {
                    button.disabled = false;
                    button.classList.add('is-ready');
                    button.innerHTML = '<i class="bi bi-download"></i> 앱 설치';
                }
                return;
            }

            if (ios) {
                if (note) note.textContent = 'Safari의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택하세요.';
                if (button) {
                    button.disabled = false;
                    button.classList.remove('is-ready');
                    button.innerHTML = '<i class="bi bi-box-arrow-up"></i> 설치 방법';
                }
                return;
            }

            if (note) note.textContent = '브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택할 수 있습니다.';
            if (button) {
                button.disabled = false;
                button.classList.remove('is-ready');
                button.innerHTML = '<i class="bi bi-info-circle"></i> 설치 안내';
            }
        });
    }

    function activateWaitingWorker(registration) {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    function registerServiceWorker() {
        navigator.serviceWorker.register(SERVICE_WORKER_URL, {
            scope: SERVICE_WORKER_SCOPE,
            updateViaCache: 'none'
        })
            .then(function (registration) {
                activateWaitingWorker(registration);
                registration.addEventListener('updatefound', function () {
                    var installingWorker = registration.installing;
                    if (!installingWorker) return;
                    installingWorker.addEventListener('statechange', function () {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            activateWaitingWorker(registration);
                        }
                    });
                });
                registration.update().catch(function () {});
            })
            .catch(function (error) {
                console.warn('[pwa] 서비스 워커 등록 실패:', error);
            });
    }

    if ('serviceWorker' in navigator) {
        if (document.readyState === 'complete') {
            registerServiceWorker();
        } else {
            window.addEventListener('load', registerServiceWorker, { once: true });
        }

        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshingForNewWorker) return;
            refreshingForNewWorker = true;
            window.location.reload();
        });
    }

    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        deferredInstallPrompt = event;
        window.__pwaInstallPrompt = event;
        document.documentElement.classList.add('pwa-installable');
        updateInstallUi();
    });

    window.addEventListener('appinstalled', function () {
        deferredInstallPrompt = null;
        window.__pwaInstallPrompt = null;
        document.documentElement.classList.remove('pwa-installable');
        updateInstallUi();
    });

    window.promptPwaInstall = function () {
        var promptEvent = deferredInstallPrompt;
        if (!promptEvent) return Promise.resolve(null);

        deferredInstallPrompt = null;
        window.__pwaInstallPrompt = null;
        promptEvent.prompt();

        return promptEvent.userChoice.then(function (choice) {
            updateInstallUi();
            return choice;
        });
    };

    document.addEventListener('click', function (event) {
        var button = event.target.closest('[data-pwa-install]');
        if (!button) return;

        if (deferredInstallPrompt) {
            window.promptPwaInstall();
            return;
        }

        if (isIos()) {
            window.alert('Safari 하단의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택해 주세요.');
            return;
        }

        window.alert('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택해 주세요.');
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateInstallUi, { once: true });
    } else {
        updateInstallUi();
    }
})();
