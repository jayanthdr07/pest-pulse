/* PestPulse service worker: caches the app shell so it opens instantly and offline.
   API calls always go to the network (live data); the app shows its last view if offline. */
const CACHE = "pestpulse-v2";
const SHELL = ["./", "index.html", "styles.css", "app.js", "demo.js", "kb.js", "bg.svg", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.pathname.includes("/api/") || u.pathname.includes("/img/")) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && u.origin === location.origin) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
