// Service Worker mínimo — necesario para que las PWA shortcuts funcionen
// No cachea nada, solo pasa las peticiones directo a la red.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* pass-through */ });
