// Service Worker - MSL 안전 시스템 (Firebase Messaging 제거)
const CACHE_NAME = 'msl-safety-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css'
];

console.log('[SW] Service Worker 로드 시작 - v4');

// ========== 1️⃣ 설치 이벤트 ==========
self.addEventListener('install', event => {
  console.log('[SW] 설치 중... v4');
  self.skipWaiting(); // 대기 없이 즉시 활성화
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 캐시 열림');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] 캐시 추가 실패:', err);
      })
  );
});

// ========== 2️⃣ 활성화 이벤트 ==========
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중... v4');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// ========== 3️⃣ Fetch 이벤트 (캐싱) ==========
self.addEventListener('fetch', event => {
  // Firebase 관련 요청은 캐시하지 않음
  if (event.request.url.includes('firebasestorage') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(err => {
        console.error('[SW] Fetch 실패:', err);
      })
  );
});

// ========== 4️⃣ 알림 클릭 이벤트 ==========
self.addEventListener('notificationclick', event => {
  console.log('[SW] 알림 클릭:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // 이미 열린 창이 있으면 포커스
        for (let client of clientList) {
          if (client.url.includes('msl-safety-system') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow('https://mslcomp.github.io/msl-safety-system/');
        }
      })
  );
});

// ========== 5️⃣ 클라이언트 메시지 수신 ==========
self.addEventListener('message', event => {
  console.log('[SW] 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // 배지 업데이트 메시지
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).then(() => {
          console.log(`[SW] 배지 업데이트: ${count}`);
        }).catch(err => {
          console.error('[SW] 배지 설정 실패:', err);
        });
      } else {
        navigator.clearAppBadge().then(() => {
          console.log('[SW] 배지 제거');
        }).catch(err => {
          console.error('[SW] 배지 제거 실패:', err);
        });
      }
    }
  }
});

console.log('[SW] Service Worker 초기화 완료 - v4');
