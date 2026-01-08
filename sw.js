// [중요] importScripts는 반드시 최상단에 위치해야 합니다.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ✅ 배포할 때마다 버전만 바꿔주세요 (이게 캐시 강제 갱신 트리거)
const CACHE_VERSION = '2026-01-08-1';
const CACHE_NAME = `msl-safety-${CACHE_VERSION}`;

// ✅ GitHub Pages 프로젝트 경로(/msl-safety-system/) 자동 계산
const SCOPE_PATH = new URL(self.registration.scope).pathname; // "/msl-safety-system/"
const toScopeUrl = (p) => new URL(p, self.registration.scope).toString();

const urlsToCache = [
  toScopeUrl('./'),
  toScopeUrl('./index.html'),
  toScopeUrl('./styles.css'),
  toScopeUrl('./icon-192.png')
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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1) 백그라운드 메시지
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || '긴급 알림';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다.',
    icon: toScopeUrl('./icon-192.png'),
    badge: toScopeUrl('./icon-192.png'),
    tag: 'msl-notification',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2) 알림 클릭
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/msl-safety-system/') && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow('https://mslcomp.github.io/msl-safety-system/');
      })
  );
});

// 설치
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 활성화 (✅ 오래된 캐시 전부 정리 + claim)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        }))
      ),
      self.clients.claim()
    ])
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // firebase/확장프로그램 제외
  if (url.href.includes('firebase') || url.href.includes('chrome-extension')) return;

  // ✅ (핵심) HTML 네비게이션은 Network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match(toScopeUrl('./index.html'))))
    );
    return;
  }

  // ✅ CSS/이미지 등은 Cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
