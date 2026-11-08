// Vite stamps the release and the playable files after producing the bundles.
const release = 'BUILD_REVISION';
const files = /* BUILD_FILES */ [];
const scope = self.registration.scope;
const prefix = 'outrun:' + scope + ':';
const cacheName = prefix + release;
const urls = new Set(files.map(path => new URL(path, scope).href));
const entry = new URL('index.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll([...urls].map(url => new Request(url, {cache: 'no-cache'})))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(name =>
      (name.startsWith(prefix) && name !== cacheName) ||
      (new URL(scope).pathname === '/' && name === 'coast-drive-v09-mobile-1')
    );
    await Promise.all(old.map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  const key = url.href === scope && event.request.mode === 'navigate' ? entry : url.href;
  if (!urls.has(key)) return;
  event.respondWith(caches.open(cacheName).then(async cache =>
    (await cache.match(key)) || fetch(event.request)
  ));
});
