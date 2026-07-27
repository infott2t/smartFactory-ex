const CACHE_NAME = 'smartfactory-pv-v2';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/main.html',
  '/manifest.json',
  '/css/styles2.css',
  '/css/underCover.css',
  '/js/auth.js',
  '/js/auth-guard.js',
  '/js/pwa.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

/*
 * 자산을 하나씩 캐시에 담는다.
 * cache.addAll() 은 목록 중 하나만 404 여도 전체가 실패하고, 그러면 install
 * 이벤트가 실패해 서비스 워커가 활성화되지 않는다. 서비스 워커가 없으면
 * 브라우저는 설치 버튼을 표시하지 않으므로 개별 처리로 내구성을 확보한다.
 */
async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    CORE_ASSETS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (error) {
        console.warn('[sw] 사전 캐시 건너뜀:', url, error);
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
      await self.clients.claim();
    })()
  );
});

/*
 * 네트워크 우선 + 캐시 폴백.
 * 오프라인 상태의 문서 요청에는 캐시된 화면을 돌려주어, 설치형 앱으로서
 * 최소한의 오프라인 동작을 보장한다.
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);

        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache))
            .catch(() => { });
        }

        return response;
      } catch (error) {
        // 쿼리스트링(?v=1.0.2) 이 붙은 정적 자산도 맞히도록 ignoreSearch 사용
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) {
          return cached;
        }

        if (request.mode === 'navigate') {
          const shell = await caches.match('/main.html');
          if (shell) {
            return shell;
          }
        }

        return new Response('오프라인 상태입니다. 네트워크를 확인해 주세요.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })()
  );
});
