/**
 * 공용 PWA 부트스트랩.
 * GitHub Pages의 프로젝트 하위 경로에서도 같은 범위의 서비스 워커를 등록하고,
 * 지원되는 브라우저에서는 사용자 설치 버튼을 활성화한다.
 */
(function () {
    'use strict';

    var SERVICE_WORKER_URL = './sw.js?v=20260801-pwa-v10-bulgogi';
    var SERVICE_WORKER_SCOPE = './';
    var refreshingForNewWorker = false;
    var deferredInstallPrompt = null;
    var installRequestPending = false;
    var installRequestTimer = null;
    var installRequestTimedOut = false;

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
            var persistent = container.hasAttribute('data-pwa-install-persistent');

            if (standalone) {
                container.hidden = true;
                return;
            }

            if (!persistent && !deferredInstallPrompt && !ios && !android) {
                container.hidden = true;
                return;
            }

            container.hidden = false;

            if (persistent && installRequestPending) {
                if (note) note.textContent = '브라우저의 설치 가능 상태를 확인하고 있습니다. 설치창이 열릴 때까지 잠시만 기다려 주세요.';
                if (button) {
                    button.disabled = true;
                    button.classList.remove('is-ready');
                    button.innerHTML = '<i class="bi bi-hourglass-split"></i> 설치 준비 중...';
                }
                return;
            }

            if (deferredInstallPrompt) {
                if (note) note.textContent = '설치 준비가 완료되었습니다. 버튼을 눌러 앱으로 추가하세요.';
                if (button) {
                    button.disabled = false;
                    button.classList.add('is-ready');
                    button.innerHTML = persistent
                        ? '<i class="bi bi-download"></i> PWA 앱 설치하기'
                        : '<i class="bi bi-download"></i> 앱 설치';
                }
                return;
            }

            if (ios) {
                if (note) note.textContent = 'Safari의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택하세요.';
                if (button) {
                    button.disabled = false;
                    button.classList.remove('is-ready');
                    button.innerHTML = persistent
                        ? '<i class="bi bi-download"></i> PWA 앱 설치하기'
                        : '<i class="bi bi-box-arrow-up"></i> 설치 방법';
                }
                return;
            }

            if (note) {
                note.textContent = installRequestTimedOut
                    ? '자동 설치창을 열 수 없습니다. 이미 설치되었거나 브라우저에서 설치가 제한된 상태인지 확인해 주세요.'
                    : '버튼을 누르면 설치 가능 상태를 확인한 뒤 앱 설치창을 바로 엽니다.';
            }
            if (button) {
                button.disabled = false;
                button.classList.remove('is-ready');
                button.innerHTML = persistent
                    ? '<i class="bi bi-download"></i> PWA 앱 설치하기'
                    : '<i class="bi bi-info-circle"></i> 설치 안내';
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
        installRequestTimedOut = false;

        if (installRequestPending) {
            installRequestPending = false;
            if (installRequestTimer) window.clearTimeout(installRequestTimer);
            installRequestTimer = null;
            window.promptPwaInstall();
            return;
        }

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

        var shouldInstall = window.confirm('스마트 팩토리 PWA 앱을 설치하시겠습니까?');
        if (!shouldInstall) return;

        if (deferredInstallPrompt) {
            window.promptPwaInstall();
            return;
        }

        if (isIos()) {
            window.alert('Safari 하단의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택해 주세요.');
            return;
        }

        var container = button.closest('[data-pwa-install-container]');
        if (container && container.hasAttribute('data-pwa-install-persistent')) {
            installRequestPending = true;
            installRequestTimedOut = false;
            updateInstallUi();

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then(function (registration) {
                        return registration.update();
                    })
                    .catch(function () {});
            }

            if (installRequestTimer) window.clearTimeout(installRequestTimer);
            installRequestTimer = window.setTimeout(function () {
                installRequestPending = false;
                installRequestTimedOut = true;
                installRequestTimer = null;
                updateInstallUi();
            }, 8000);
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
