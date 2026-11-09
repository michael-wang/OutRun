// Vite stamps the release and playable files after producing the bundles.
const release = 'BUILD_REVISION';
const files = /* BUILD_FILES */ [];
const scope = self.registration.scope;
const prefix = 'outrun:' + scope + ':';
const cacheName = prefix + release;
const urls = new Set(files.map(path => new URL(path, scope).href));
const entry = new URL('index.html', scope).href;
const scopeOrigin = new URL(scope).origin;

// A waiting worker cannot replace a cache-first predecessor while its game tab
// remains open. Precache the *complete* new build before activating it.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...urls].map(url => new Request(url, {cache: 'no-cache'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const versions = keys.filter(name => name.startsWith(prefix) && name !== cacheName);
    // Retain the immediately preceding build for still-open game tabs. They
    // may request an old hashed lazy chunk before their next navigation.
    const previous = versions.at(-1);
    await Promise.all(keys.filter(name =>
      (name.startsWith(prefix) && name !== cacheName && name !== previous) ||
      (new URL(scope).pathname === '/' && name === 'coast-drive-v09-mobile-1')
    ).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (url.origin !== scopeOrigin || !url.href.startsWith(scope)) return;
  const key = url.href === scope && event.request.mode === 'navigate' ? entry : url.href;

  // On reload, always check the published HTML instead of silently replaying
  // an old cache. Offline navigation still uses the complete precached build.
  if (event.request.mode === 'navigate' && (key === entry || url.href === scope)) {
    event.respondWith((async () => {
      try {
        const live = await fetch(event.request, {cache: 'no-cache'});
        if (live.ok) return live;
      } catch { /* Offline: serve the precached shell. */ }
      return (await (await caches.open(cacheName)).match(entry)) || Response.error();
    })());
    return;
  }

  if (urls.has(key)) {
    event.respondWith(caches.open(cacheName).then(async cache =>
      (await cache.match(key)) || fetch(event.request)
    ));
    return;
  }

  // A tab still running the previous release may lazy-load its old hashed
  // assets after the update. Keep those requests working until it reloads.
  event.respondWith(caches.match(key).then(hit => hit || fetch(event.request)));
});
