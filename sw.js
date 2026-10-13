/* Safwan Treats – Service Worker (অফলাইনে চালানোর জন্য)
   আপডেট দিলে নিচের VERSION বদলে দিন, তাহলে পুরনো ক্যাশ মুছে নতুন ফাইল আসবে। */
var VERSION = 'v2';
var CACHE = 'safwan-treats-' + VERSION;
var FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('safwan-treats-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  /* অন্য সাইটের রিকোয়েস্ট (যেমন Firebase সিঙ্ক) সরাসরি যাবে, ক্যাশ হবে না */
  if (url.origin !== self.location.origin) return;

  /* পেজ: আগে নেটওয়ার্ক, না পেলে ক্যাশ */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () { return caches.match('index.html'); })
    );
    return;
  }

  /* বাকি ফাইল: আগে ক্যাশ, না পেলে নেটওয়ার্ক */
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
