const CACHE_NAME = 'hmi-cache-v2';

// 💡 캐시할 파일 목록 (경로에 주의하세요!)
const URLS_TO_CACHE = [
  './kimp_ex0.html',
  './css/kimp_ex0.css',
  // 사용하신 폰트와 부트스트랩 아이콘, 제이쿼리 등도 추가하면 완벽한 오프라인이 됩니다.
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://actions.google.com/sounds/v1/alarms/camera_shutter.ogg'
];

// 1. 설치 (Install) - 파일을 스마트폰에 저장합니다.
// 1. 설치 (Install) - 안전한 방식으로 변경
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('안전한 캐싱 시작');
      for (let url of URLS_TO_CACHE) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('❌ 이 파일은 없어서 캐시 안 함 (앱은 정상 작동):', url);
        }
      }
    })
  );
  self.skipWaiting(); // 즉시 활성화
});

// 2. 활성화 (Activate) - 이전 버전의 낡은 캐시를 지웁니다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제됨');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 네트워크 요청 가로채기 (Fetch)
// 전략: 인터넷이 연결되어 있으면 새 코드를 가져오고(Network First), 끊겨있으면 저장된 파일(Cache)을 보여줍니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 성공 시 캐시 업데이트
        if(response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시(인터넷 끊김) 캐시에서 가져오기
        return caches.match(event.request);
      })
  );
});