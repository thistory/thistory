self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Time for your daily reflection",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "thistory-daily",
    renotify: true,
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
