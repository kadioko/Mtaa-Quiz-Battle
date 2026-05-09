/**
 * Mtaa Quiz Battle — Service Worker (Offline PWA)
 *
 * Strategy:
 *  - App shell (JS/CSS/HTML) → Cache-first (stale-while-revalidate on update)
 *  - Game assets (images, fonts, sounds) → Cache-first
 *  - API/external requests → Network-first with cache fallback
 *
 * Versioning: bump CACHE_VERSION on every production release.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `mtaa-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `mtaa-assets-${CACHE_VERSION}`;
const DATA_CACHE  = `mtaa-data-${CACHE_VERSION}`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_URLS).catch(() => {
        // Silently ignore if any shell URL is unavailable at install time
      })
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const valid = new Set([SHELL_CACHE, ASSET_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route-based caching strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin or known CDN requests
  if (request.method !== 'GET') return;

  // Static assets (JS, CSS, images, fonts, audio) → cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(ASSET_CACHE, request));
    return;
  }

  // App shell → stale-while-revalidate
  if (isShell(url)) {
    event.respondWith(staleWhileRevalidate(SHELL_CACHE, request));
    return;
  }

  // Everything else (external) → network-first with cache fallback
  event.respondWith(networkFirst(DATA_CACHE, request));
});

// ── Push notifications (daily challenge reminder) ─────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'Mtaa Quiz Battle 🇹🇿';
  const body  = data.body  ?? 'Changamoto ya Leo inakungoja! / Today\'s Challenge awaits!';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/assets/icon.png',
      badge: '/assets/favicon.png',
      tag: 'daily-challenge',
      renotify: true,
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|mp3|wav|ico)(\?.*)?$/.test(url.pathname);
}

function isShell(url) {
  return url.origin === self.location.origin && (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json')
  );
}

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached ?? fetchPromise;
}

async function networkFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
