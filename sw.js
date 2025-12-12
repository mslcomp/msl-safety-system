// [중요] importScripts는 반드시 최상단에 위치해야 합니다.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Service Worker - MSL 안전 시스템
const CACHE_NAME = 'msl-safety-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/icon-192.png' // 아이콘도 캐시 목록에 추가 추천
];

// Firebase 설정 (본인의 설정값 유지)
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

// ■■■ 1. 백그라운드 메시지 수신 및 배지 설정 ■■■
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '긴급 알림';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다.',
    icon: '/icon-192.png', // 알림창 우측 큰 이미지
    badge: '/icon-192.png', // 안드로이드 상단바 작은 아이콘 (투명 배경 권장)
    tag: 'msl-notification',
    data: payload.data
  };

  // (1) 알림 표시
  self.registration.showNotification(notificationTitle, notificationOptions);

  // (2) ★ 앱 아이콘 배지 설정 (숫자 1 표시) ★
  if (navigator.setAppBadge) {
    console.log('[SW] 앱 배지 설정 시도');
    // 숫자를 1로 설정하거나, 클라이언트에서 받은 데이터를 활용할 수 있습니다.
    navigator.setAppBadge(1).catch(error => {
      console.error('[SW] 배지 설정 실패:', error);
    });
  }
});

// ■■■ 2. 알림 클릭 시 배지 초기화 ■■■
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // ★ 알림을 클릭하면 배지(숫자) 지우기 ★
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge();
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (let client of clientList) {
          if (client.url.includes('msl-safety-system') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('https://mslcomp.github.io/msl-safety-system/');
        }
      })
  );
});

// 설치 이벤트
self.addEventListener('install', event => {
  self.skipWaiting(); // 대기 없이 즉시 활성화
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(name => {
        if (name !== CACHE_NAME) return caches.delete(name);
      })
    ))
  );
  return self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  if (event.request.url.includes('firebase') || event.request.url.includes('chrome-extension')) return;
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
