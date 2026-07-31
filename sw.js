const CACHE_NAME = 'smartfactory-pwa-v8-20260731';
const APP_BASE_URL = new URL('./', self.location.href);

const CORE_ASSETS = [
  '',
  'index.html',
  'main.html',
  'manifest.json',
  'css/styles2.css',
  'css/underCover.css',
  'js/auth.js',
  'js/auth-guard.js',
  'js/pwa.js',
  'js/ratio-feed.js',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
].map((path) => new URL(path, APP_BASE_URL).toString());

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
        await cache.add(new Request(url, { cache: 'no-store' }));
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
 * 네트워크 요청 시 브라우저 HTTP 캐시를 우회한다.
 *
 * 개발 서버가 `Cache-Control: max-age=3600` 을 보내면 서비스 워커의
 * fetch(request) 조차 디스크 캐시의 낡은 파일을 그대로 받는다. 그러면
 * js/store.js 처럼 데이터가 들어있는 파일을 수정해도 최대 1시간 동안
 * 화면에 반영되지 않는다(예: workDetailJSON 의 expPage 를 추가했는데도
 * work_detail.html 이 체험 페이지를 못 찾는 문제).
 *
 * navigate 요청은 RequestInit 를 덧붙여 재구성할 수 없으므로 그대로 보낸다.
 * (문서 요청은 새로고침 시 브라우저가 이미 재검증한다.)
 */
function fetchFresh(request) {
  /*
   * navigate 요청은 mode 를 바꿀 수 없어 new Request(request, init) 가 TypeError 를 낸다.
   * (링크나 location.href 로 이동하는 문서 요청은 재검증 없이 디스크 캐시를 쓰기 때문에,
   *  이 경우도 우회해야 수정한 HTML 이 바로 보인다.)
   * 그래서 URL 문자열로 새 요청을 만들어 캐시를 우회한다.
   */
  if (request.mode === 'navigate') {
    return fetch(request.url, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'follow'
    });
  }
  try {
    return fetch(new Request(request, { cache: 'no-store' }));
  } catch (error) {
    return fetch(request);
  }
}

/*
 * 네트워크 우선 + 캐시 폴백.
 * 오프라인 상태의 문서 요청에는 캐시된 화면을 돌려주어, 설치형 앱으로서
 * 최소한의 오프라인 동작을 보장한다.
 */
function getCacheKey(request) {
  const url = new URL(request.url);
  const canonicalDestinations = ['style', 'script', 'font', 'image', 'manifest'];
  if (request.mode === 'navigate' || canonicalDestinations.includes(request.destination)) {
    // ?v=... 값마다 오래된 사본이 쌓이지 않도록 정적 자산은 경로당 최신 한 개만 보관한다.
    url.search = '';
    return new Request(url.toString(), {
      method: 'GET',
      credentials: 'same-origin'
    });
  }
  return request;
}

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_PWA_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
    );
  }
});

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
        const response = await fetchFresh(request);

        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          const cacheKey = getCacheKey(request);
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(cacheKey, responseToCache))
            .catch(() => { });
        }

        return response;
      } catch (error) {
        // 쿼리스트링(?v=1.0.2) 이 붙은 정적 자산도 맞히도록 ignoreSearch 사용
        const cached = await caches.match(getCacheKey(request));
        if (cached) {
          return cached;
        }

        if (request.mode === 'navigate') {
          const shell = await caches.match(new URL('index.html', APP_BASE_URL).toString());
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
