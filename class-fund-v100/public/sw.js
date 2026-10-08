// Service worker toi thieu, an toan cho Next.js:
// - Khong cache API, khong cache dieu huong trang (network-only)
// - Chi cache static da hash (_next/static) va asset cong khai theo kieu stale-while-revalidate
const CACHE = "classfund-v100-static";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Khong bao gio cache API hoac HTML trang (tranh loi stale build)
  if (url.pathname.startsWith("/api")) return;
  if (req.mode === "navigate") return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
