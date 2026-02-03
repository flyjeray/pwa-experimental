// Cache version for global invalidation
const CACHE_VERSION = "v1";

const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Resolve the app base path from the service worker scope
const BASE_PATH = new URL(self.registration.scope).pathname;

// INSTALL event fires when the SW is first registered or updated
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll([
          BASE_PATH,
          `${BASE_PATH}index.html`,
          `${BASE_PATH}manifest.webmanifest`,
        ])
      )
  );
});

// ACTIVATE event fires after install and when old SWs are replaced
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => ![STATIC_CACHE, HTML_CACHE, IMAGE_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// FETCH event intercepts every network request from controlled pages
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, HTML_CACHE));
    return;
  }

  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
});

// Network-first strategy ensures fresh HTML when online
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return caches.match(request);
  }
}

// Stale-while-revalidate serves cache immediately and refreshes in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Cache-first prioritizes speed for rarely changing assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }

  return response;
}
