// 🔔 MSL 안전보건 Service Worker
const CACHE_NAME = 'msl-safety-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker 설치됨');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화됨');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 구 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 🚨 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('🔔 푸시 알림 수신:', event);
  
  let data = {
    title: '🚨 긴급 신고',
    body: '긴급 상황이 발생했습니다.',
    icon: '/msl-safety-system/msl_logo_small.jpg',
    badge: '/msl-safety-system/msl_logo_small.jpg',
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200, 100, 200, 100, 200, 100, 200],
    tag: 'emergency-notification',
    requireInteraction: true,  // 사용자가 직접 닫을 때까지 유지
    renotify: true,
    silent: false,
    data: {
      url: data.url || 'https://mslcomp.github.io/msl-safety-system/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: '📱 확인하기',
        icon: data.icon
      },
      {
        action: 'close',
        title: '✖️ 닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ 알림 클릭:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // 이미 열린 창이 있으면 포커스
          for (let client of clientList) {
            if (client.url.includes('msl-safety-system') && 'focus' in client) {
              return client.focus();
            }
          }
          // 없으면 새 창 열기
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request);
      })
  );
});
