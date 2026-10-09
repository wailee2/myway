/* MYWAY service worker: keeps the essentials usable on a weak or missing connection.
 * - Pages you have opened (booking, trips, safety…) are cached after each successful visit, so your
 *   pickup, plate, boarding code and contacts still open offline. The data itself lives on the phone.
 * - Static assets are cached the first time they are used.
 * - Nothing here caches API responses or payments. Keep it that way.
 */
const PAGES = "myway-pages-v1";
const ASSETS = "myway-assets-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keep = [PAGES, ASSETS];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(PAGES);
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(req)) || (await cache.match("/app/trips")) || (await cache.match("/app")) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(?:svg|png|woff2?|webmanifest)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(ASSETS);
      const hit = await cache.match(req);
      if (hit) return hit;
      const fresh = await fetch(req);
      if (fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    })());
  }
});
