const CACHE_VERSION = 'DEV';
const CACHE_NAME = `tap-pop-${CACHE_VERSION}`;
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './js/game.js',
  './js/data.js',
  './js/audio.js',
  './js/haptics.js',
  './js/update.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of SHELL) {
      try {
        await cache.add(url);
      } catch (err) {
        console.warn('tap-pop sw: skip', url, err);
      }
    }
    // First visit: become active so the shell is offline after this load.
    // Updates stay in waiting until the player taps Refresh.
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { ignoreSearch: true }).then((cached) => cached || fetch(req))
    );
    return;
  }

  const isVersion = url.pathname.endsWith('/version.json') || url.pathname.endsWith('version.json');
  if (isVersion) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./version.json', copy));
          return res;
        })
        .catch(() => caches.match('./version.json'))
    );
    return;
  }

  const cacheKey = new Request(url.pathname.replace(/\/index\.html$/, '/') || './', { headers: req.headers });
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return caches.match(cacheKey, { ignoreSearch: true }).then((alt) => {
        if (alt) return alt;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      });
    })
  );
});
