// Careo Service Worker — Web Push 対応
// eslint-disable-next-line no-undef
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Careo";
  const options = {
    body: data.body ?? "",
    icon: "/icon-new.svg",
    badge: "/icon-new.svg",
    tag: data.tag ?? "careo-notification",
    data: { url: data.url ?? "/" },
  };
  event.waitUntil(
    // eslint-disable-next-line no-undef
    self.registration.showNotification(title, options)
  );
});

// eslint-disable-next-line no-undef
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      // eslint-disable-next-line no-undef
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
