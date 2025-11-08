var CACHE = `251108_1515`; // update cache name when changing assets, or old caches can linger.
var ASSETS = [
  ".",
  "index.html",
  "styles.css",
  "script.js",
  "manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});