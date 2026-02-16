/// <reference lib="webworker" />

const CACHE_NAME = 'paytrack-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/generated/favicon.dim_32x32.png',
  './assets/generated/paytrack-logo-transparent.dim_200x200.png',
  './assets/generated/paytrack-icon.dim_192x192.png',
];

const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event - cache resources
sw.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('[Service Worker] Failed to cache resources:', error);
        // Don't fail installation if some resources can't be cached
        return Promise.resolve();
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  sw.clients.claim();
});

// Fetch event - serve from cache, fallback to network
sw.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched resource for future use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Return a fallback response if available
        return caches.match('./index.html').then((fallback) => {
          return fallback || new Response('Offline - No cached content available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      });
    })
  );
});
