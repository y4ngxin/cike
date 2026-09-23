/**
 * 「此刻」Service Worker 离线缓存引擎
 * 实现全站资源完全离线访问，打造原生 App 级本地加载速度
 */

const CACHE_NAME = 'cike-v1.0.0';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/audio.js',
    './js/skills-data.js',
    './js/store.js',
    './js/router.js',
    './js/app.js',
    './js/pages/home.js',
    './js/pages/morning-checkin.js',
    './js/pages/evening-reflection.js',
    './js/pages/mirror.js',
    './js/pages/new-record.js',
    './js/pages/direction.js',
    './js/pages/goal-detail.js',
    './js/pages/new-goal.js',
    './js/pages/skills.js',
    './js/pages/skill-detail.js',
    './js/pages/unit-learning.js',
    './js/pages/plan.js',
    './js/pages/focus.js',
    './js/pages/focus-timer.js',
    './js/pages/settings.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // 离线备用
                return caches.match('./index.html');
            });
        })
    );
});
