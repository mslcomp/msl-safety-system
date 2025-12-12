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

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '긴급 알림';
    const options = {
        body: data.body || '긴급 상황이 발생했습니다!',
        icon: '/msl-safety-system/msl_logo_small.jpg',
        badge: '/msl-safety-system/msl_logo_small.jpg',
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://mslcomp.github.io/msl-safety-system/')
    );
});
```

---

## 🎯 **테스트 절차**

1. **3개 파일 수정 완료 후 Commit**
2. **2~3분 대기 (배포)**
3. **시크릿 모드로 접속**
4. **F12 → Console 확인:**
```
