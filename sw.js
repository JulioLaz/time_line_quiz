/*
  sw.js — Service Worker para Línea del Tiempo Global (PWA)
  Estrategia: Cache-First para uso offline completo.
  Versión: 1.0.0
  Cambios:
    1.0.0 — Creación inicial: precache de assets, estrategia cache-first,
             activación inmediata y limpieza de caches antiguos.
*/

const CACHE_NAME = 'linea-tiempo-v1';

// Todos los assets a precargar en instalación
const ASSETS = [
  '/time_line/',
  '/time_line/index.html',
  '/time_line/manifest.json',
  '/time_line/icon.png',
  // Fuentes de Google — se cachean en runtime (ver fetch handler)
];

// ── INSTALL: precachea los assets locales ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activa el SW inmediatamente
  );
});

// ── ACTIVATE: limpia caches viejos ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // toma control de todas las tabs abiertas
  );
});

// ── FETCH: Cache-First con fallback a red ──
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // No está en cache → buscar en red y guardar para próxima vez
      return fetch(event.request)
        .then(response => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200) return response;

          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          // Sin red y sin cache → para navegación, devolver index.html
          if (event.request.destination === 'document') {
            return caches.match('/time_line/index.html');
          }
        });
    })
  );
});
