// 🔔 MSL 안전보건 Service Worker
const CACHE_NAME = 'msl-safety-v1';
const urlsToCache = [
  './',
  './index.html'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ 캐시 저장 완료');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
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
    icon: 'https://raw.githubusercontent.com/mslcomp/msl-safety-system/main/msl_logo_small.jpg',
    badge: 'https://raw.githubusercontent.com/mslcomp/msl-safety-system/main/msl_logo_small.jpg'
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
    requireInteraction: true,
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
          for (let client of clientList) {
            if (client.url.includes('msl-safety-system') && 'focus' in client) {
              return client.focus();
            }
          }
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
        return response || fetch(event.request);
      })
  );
});
