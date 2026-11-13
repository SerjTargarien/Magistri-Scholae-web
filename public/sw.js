/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A new name for the account app (R3.6): on activation every older
// "magistri-scholae-" cache, including the retired local app's, is deleted.
const CACHE_NAME = "magistri-scholae-account-v3";

// Install event - skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - claim clients to control right away
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(names => Promise.all(names.filter(name => name.startsWith("magistri-scholae-") && name !== CACHE_NAME).map(name => caches.delete(name)))),
  ]));
});

// Core fetch event - network first, fallback to cache, update cache on success
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS, skip browser extensions or chrome-extension URLs
  if (!event.request.url.startsWith("http")) return;

  // Account API/private media must always use the network, including offline.
  // Never serve an old cache entry for these routes.
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  if (pathname === "/api" || pathname.startsWith("/api/") ||
      pathname === "/media" || pathname.startsWith("/media/")) return;
  // Authenticated delivery is now possible. Cache only the same-origin shell
  // and built assets; arbitrary successful GETs must never enter this cache.
  if (url.origin !== self.location.origin || url.search ||
      !(["/", "/index.html", "/manifest.json", "/icon.svg"].includes(pathname) ||
        /^\/assets\/[A-Za-z0-9_.-]+\.(?:js|css|woff2|svg|png)$/.test(pathname))) return;

  // Skip POST or other non-GET methods
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone and save it to our cache
        const cacheControl = networkResponse?.headers.get("Cache-Control") || "";
        if (networkResponse && networkResponse.status === 200 && !/no-store|private/i.test(cacheControl)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) - try to get it from cache
        return caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a main page reload navigation failed (offline and not cached yet)
          if (event.request.mode === "navigate") {
            return caches.open(CACHE_NAME).then(cache => cache.match("/"));
          }
          // Respond with an empty response/error placeholder if nothing is found
          return new Response("Offline resource not available in cache yet.", {
            status: 503,
            statusText: "Service Unavailable (Offline)",
          });
        });
      })
  );
});
