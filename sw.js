/* Offline cache. Bump CACHE on every release so phones pick up the new version, and set
   APP_VERSION in js/core.js to the same number (it's shown on the Home screen). */
const CACHE = 'fightcamp-v14';
// The video-check tracker has its own cache so app updates don't download its 20 MB again.
// Change the name only when the files in js/vendor/mediapipe change.
const TRACKER = 'fightcamp-tracker-mediapipe-1.1.1';
const SHELL = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'js/core.js', 'js/charts.js', 'js/techniques.js', 'js/fighters.js', 'js/camp.js', 'js/learn.js',
  'js/moves.js', 'js/moves3d.js', 'js/art.js', 'js/timer.js', 'js/video.js', 'js/ui.js',
  'js/vendor/three.module.min.js', 'js/vendor/three.core.js',
];

self.addEventListener('install', e => {
  // (cache: 'reload' skips the browser's own short-term copy, so a new version never saves old files)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== TRACKER).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// App files: cache first. Everything else (Wikipedia etc.) goes straight to the network.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // The video-check tracker (about 20 MB) is too big to download up front: keep a copy the first time it's used
  if (url.pathname.includes('/js/vendor/mediapipe/')) {
    e.respondWith(caches.open(TRACKER).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
