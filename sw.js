/* Safwan Treats – অফলাইন সাপোর্ট (Service Worker)
   - পেজ খোলার সময় আগে ইন্টারনেট থেকে নতুন ভার্শন আনে; ইন্টারনেট না থাকলে সেভ করা কপি দেখায়।
   - তাই index.html বদলালে নতুন ভার্শন নিজে থেকেই আসে, ক্যাশ ভার্শন বদলাতে হয় না।
   - Firebase বা অন্য সাইটের রিকোয়েস্টে হাত দেয় না (ক্লাউড সিঙ্ক অক্ষত থাকে)। */
var CACHE = 'safwan-treats-v20261015';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* Firebase ইত্যাদি সরাসরি যাবে */
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        if (req.mode === 'navigate') {
          return caches.match('index.html').then(function (h) { return h || caches.match('./'); });
        }
        return Response.error();
      });
    })
  );
});
