/* Offline cache. Bump CACHE on every release so phones pick up the new version. */
const CACHE = 'fightcamp-v7';
const SHELL = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'js/core.js', 'js/charts.js', 'js/techniques.js', 'js/fighters.js', 'js/camp.js', 'js/learn.js',
  'js/moves.js', 'js/moves3d.js', 'js/timer.js', 'js/ui.js',
  'js/vendor/three.module.min.js', 'js/vendor/three.core.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// App files: cache first. Everything else (Wikipedia etc.) goes straight to the network.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
