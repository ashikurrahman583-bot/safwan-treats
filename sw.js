/* Safwan Treats – অফলাইন সাপোর্ট (Service Worker)
   - পেজ খোলার সময় আগে ইন্টারনেট থেকে নতুন ভার্শন আনে (ব্রাউজারের পুরোনো HTTP ক্যাশ এড়িয়ে);
     ইন্টারনেট না থাকলে সেভ করা কপি দেখায়।
   - তাই index.html বদলালে নতুন ভার্শন নিজে থেকেই আসে।
   - Firebase বা অন্য সাইটের রিকোয়েস্টে হাত দেয় না (ক্লাউড সিঙ্ক অক্ষত থাকে)।
   - index.html-এর APP_VERSION বদলালে এখানকার CACHE-এর তারিখও বদলে দিন (পুরোনো ক্যাশ মুছে যাবে)। */
var CACHE = 'safwan-treats-v20261026';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (res) { if (res && res.ok) return c.put(u, res); }).catch(function () {});
      }));
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
    fetch(req, { cache: 'no-cache' }).then(function (res) {
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
