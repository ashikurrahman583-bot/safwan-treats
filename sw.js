/* Safwan Treats – Service Worker
   অ্যাপ অফলাইনে খোলার জন্য। নতুন সংস্করণ দিলে নিচের VERSION বদলে দিন। */
var VERSION = 'safwan-treats-v3';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      /* কোনো ফাইল না থাকলেও install যেন ব্যর্থ না হয় */
      return Promise.all(CORE.map(function (u) {
        return cache.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  /* Firebase সিঙ্ক ও অন্য সাইটের রিকোয়েস্ট ক্যাশ করা হয় না */
  if (url.origin !== self.location.origin) return;

  /* পেজ: আগে নেটওয়ার্ক (সবসময় নতুন), না পেলে ক্যাশ */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  /* অন্য ফাইল: ক্যাশ থেকে দ্রুত দেখায়, পেছনে আপডেট করে */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
