/* AgriBridge — service worker : cache des contenus publics pour connexions lentes */
const VERSION = "agb-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon.svg", "/icons/icon-192.png"];
// Pages publiques mises en cache (stratégie réseau d'abord, cache en secours)
const PUBLIC_PREFIXES = ["/", "/opportunites", "/academy", "/market", "/expert", "/communaute", "/blog", "/faq", "/a-propos", "/partenaires", "/contact", "/conditions", "/confidentialite"];
const PRIVATE_PREFIXES = ["/tableau-de-bord", "/partenaire", "/admin", "/onboarding", "/auth", "/api", "/connexion", "/inscription"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Ressources statiques versionnées : cache d'abord
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(STATIC_CACHE).then((c) => c.put(req, copy)); return res; })),
    );
    return;
  }

  if (req.mode === "navigate") {
    const isPrivate = PRIVATE_PREFIXES.some((p) => url.pathname.startsWith(p));
    const isPublic = !isPrivate && PUBLIC_PREFIXES.some((p) => (p === "/" ? url.pathname === "/" : url.pathname.startsWith(p)));
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (isPublic && res.ok) { const copy = res.clone(); caches.open(PAGE_CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(async () => (isPublic && (await caches.match(req))) || (await caches.match(OFFLINE_URL))),
    );
  }
});
