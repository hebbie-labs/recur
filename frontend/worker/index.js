// Bundled into the generated service worker by next-pwa's customWorkerSrc
// (see next.config.ts / node_modules/@ducanh2912/next-pwa "worker/index.{js,ts}"
// convention). Without this, PushNotificationService on the backend still
// delivers the encrypted push message to the browser, but nothing ever
// calls showNotification() - so no notification is ever visible.
self.addEventListener("push", (event) => {
  const { title, body } = event.data.json();
  event.waitUntil(self.registration.showNotification(title, { body }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
