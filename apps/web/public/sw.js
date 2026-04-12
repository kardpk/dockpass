// ═══════════════════════════════════════════════════════════════
// BoatCheckin Service Worker
// Handles: push notifications, static caching, offline pages
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = "dockpass-v1";
const STATIC_ASSETS = ["/", "/offline"];

// ─── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — claim all clients, purge old caches ───────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch — network-first for pages, cache-first for static ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls, auth, or Supabase
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  // HTML pages → network-first, fallback to cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/offline")))
    );
    return;
  }

  // Static assets → cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }
});

// ─── Push Notifications ───────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "BoatCheckin",
      body: event.data.text(),
      url: "/dashboard",
    };
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: payload.tag || "dockpass-notification",
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || "/dashboard" },
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(payload.title || "BoatCheckin", options));
});

// ─── Notification Click — open or focus the URL ────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if available
        for (const client of clientList) {
          if (new URL(client.url).pathname === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Push Subscription Change — rotate keys on server ──────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((newSub) =>
        fetch("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription?.endpoint,
            newSubscription: newSub.toJSON(),
          }),
        })
      )
  );
});
