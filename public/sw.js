// Careo Service Worker
// - 基本的なPWAインストール対応
// - Web Push 通知ハンドリング
// - オフライン時のフォールバック

const CACHE_VERSION = "careo-v1";

// インストール時: スキップ待機
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// アクティベート時: 古いキャッシュを削除＋全クライアントを即制御
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// fetch: ネットワークファースト、失敗時のみキャッシュ
self.addEventListener("fetch", (event) => {
  const { request } = event;
  // POST等はスキップ（キャッシュしない）
  if (request.method !== "GET") return;
  // API呼び出しはキャッシュしない
  if (request.url.includes("/api/")) return;
  // Next.js内部リソースもキャッシュしない
  if (request.url.includes("/_next/data/")) return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(request);
        // 静的リソースのみキャッシュ（HTMLはキャッシュしない）
        if (res.ok && (request.destination === "image" || request.destination === "style" || request.destination === "script")) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("offline");
      }
    })()
  );
});

// Web Push 通知
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Careo";
  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag ?? "careo-notification",
    data: { url: data.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
