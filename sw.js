// sw.js - Service Worker for Push Notifications
self.addEventListener('push', function(event) {
    let payload = { title: "Agro Assist Notification", body: "You have a new update." };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch(e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: 'favicon.ico', // generic icon path
        badge: 'favicon.ico',
        data: payload.url || '/'
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
