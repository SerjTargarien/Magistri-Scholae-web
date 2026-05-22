/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = "magistri-scholae-v1";

// Install event - skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - claim clients to control right away
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Core fetch event - network first, fallback to cache, update cache on success
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS, skip browser extensions or chrome-extension URLs
  if (!event.request.url.startsWith("http")) return;

  // Skip POST or other non-GET methods
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone and save it to our cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) - try to get it from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a main page reload navigation failed (offline and not cached yet)
          if (event.request.mode === "navigate") {
            return caches.match("/");
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
