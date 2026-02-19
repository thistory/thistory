self.addEventListener("install", function (event) {
  console.log("[SW] Installing, skip waiting");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("[SW] Activated, claiming clients");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  console.log("[SW] Push received:", event.data ? event.data.text() : "no data");

  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
    return;
  }

  var options = {
    body: data.body || "Time for your daily reflection",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "thistory-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/chat",
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "This Story",
      options
    )
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/chat";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
