const CACHE_NAME = 'easecalci-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './test.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Let the client handle API requests specifically for currencies
    if (event.request.url.includes('open.er-api.com')) return;

    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Try fetching from network
            return fetch(event.request).then(networkResponse => {
                // Cache the newly fetched resource if it's opaque (like fonts or tailwind CDN) or successful
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    if (networkResponse && networkResponse.type === 'opaque') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));

                return networkResponse;
            }).catch(error => {
                console.log('Network request failed, user is offline and resource is not cached.', error);
            });
        })
    );
});
