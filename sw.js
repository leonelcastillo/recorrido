// Guarda la app en el teléfono para que abra sin señal.
const VERSION = 'v20261115123355';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'planos.enc', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero lo guardado (abre sin señal); si hay internet, actualiza por detrás.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const guardado = await c.match(e.request, {ignoreSearch: true});
    const red = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return guardado || (await red) || (e.request.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
