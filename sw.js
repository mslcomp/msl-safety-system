// 1. 외부 스크립트 로드는 반드시 최상단에 있어야 합니다.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Service Worker - MSL 안전 시스템
const CACHE_NAME = 'msl-safety-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css'
];

// 2. Firebase 설정 및 초기화 (함수 밖에서 즉시 실행)
const firebaseConfig = {
  apiKey: "AIzaSyBxAustemE5X0pJa8wT37HrYlw3NpuztOs",
  authDomain: "msl-safety-system-7b8b2.firebaseapp.com",
  projectId: "msl-safety-system-7b8b2",
  storageBucket: "msl-safety-system-7b8b2.firebasestorage.app",
  messagingSenderId: "663726913730",
  appId: "1:663726913730:web:bc3e5f69f2c7f5e0e1c7e6"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
console.log('[SW] Firebase 초기화 완료');

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '긴급 알림';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'msl-notification', // 태그가 같으면 알림이 쌓이지 않고 갱신됨
    requireInteraction: true,
    data: payload.data
  };

  // 알림 표시
  self.registration.showNotification(notificationTitle, notificationOptions);

  // 실행 중인 페이지(클라이언트)가 있다면 배지 업데이트 요청
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'REFRESH_BADGE',
        payload: payload
      });
    });
  });
});

// --- 아래는 기존 캐싱 로직 유지 ---

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...');
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
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...');
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

// Fetch 이벤트
self.addEventListener('fetch', event => {
  // Firebase 관련 요청 및 확장 프로그램 요청 등은 캐시 제외
  if (event.request.url.includes('firebasestorage') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.startsWith('chrome-extension')) {
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
        // 오프라인이거나 네트워크 실패 시 에러 로그만 남김 (필요 시 오프라인 페이지 리턴 가능)
        console.error('[SW] Fetch 실패:', err);
      })
  );
});

// 알림 클릭 이벤트
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
        // 없으면 새 창 열기 (루트 경로)
        if (self.clients.openWindow) {
          return self.clients.openWindow('https://mslcomp.github.io/msl-safety-system/');
        }
      })
  );
});

// 메시지 수신 (클라이언트로부터)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker 로드 완료');
