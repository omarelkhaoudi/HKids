const CACHE_VERSION = 'hkids-covers-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;
const MEDIA_CACHE = `${CACHE_VERSION}-media`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/HKidsimg.webp'
];

const STATIC_DESTINATIONS = new Set(['script', 'style', 'worker', 'font']);
const MEDIA_DESTINATIONS = new Set(['image', 'audio', 'video']);
const MAX_API_ENTRIES = 80;
const MAX_MEDIA_ENTRIES = 120;

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      if (cacheName === API_CACHE) trimCache(API_CACHE, MAX_API_ENTRIES);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) return caches.match(fallbackUrl);
    throw new Error('Network unavailable and no cached response exists.');
  }
}

async function navigationNetworkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return await cache.match(request)
      || await cache.match('/index.html')
      || await cache.match('/')
      || await caches.match('/offline.html')
      || new Response('Offline page unavailable', {
        status: 504,
        statusText: 'Gateway Timeout',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
        if (cacheName === MEDIA_CACHE) trimCache(MEDIA_CACHE, MAX_MEDIA_ENTRIES);
      }
      return response;
    })
    .catch(() => null);

  const response = cached || await refresh;
  return response || new Response('Offline cache miss', {
    status: 504,
    statusText: 'Gateway Timeout',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    if (request.headers.has('Authorization')) {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (MEDIA_DESTINATIONS.has(request.destination) || /\.(webp|png|jpe?g|gif|svg|mp3|m4a|wav|ogg|pdf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(MEDIA_CACHE)
        .then((cache) => Promise.all(
          event.data.urls.map((url) => fetch(url).then((response) => {
            if (response.ok) return cache.put(url, response);
            return null;
          }).catch(() => null))
        ))
    );
  }
});
