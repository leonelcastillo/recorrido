// Guarda la app en el teléfono para que abra sin señal. Cada obra tiene su propia caché.
const PREFIJO = 'rec-raiz-';
const VERSION = PREFIJO + '20261118225341';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'planos.enc', 'icon-192.png', 'icon-512.png', 'jspdf.umd.min.js'];
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  const vieja = k => k !== VERSION && (k.startsWith(PREFIJO) || /^v\d{14}$/.test(k));
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(vieja).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero lo guardado (abre sin señal); si hay internet, actualiza por detrás.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (!u.pathname.startsWith(BASE) || u.pathname.slice(BASE.length).includes('/')) return;   // otra obra: no es mía
  if (u.pathname.endsWith('planos.enc')){   // planos y plan: primero internet (para que llegue el plan nuevo), si no hay, lo guardado
    e.respondWith(fetch(e.request).then(r => { if (r.ok){ const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); } return r; })
      .catch(() => caches.open(VERSION).then(c => c.match(e.request, {ignoreSearch: true}))));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c => {
    const guardado = await c.match(e.request, {ignoreSearch: true});
    const red = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return guardado || (await red) || (e.request.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
