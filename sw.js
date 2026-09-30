'use strict';
const CACHE = 'five-cards-offline-2bec0431de28';
const ENTRY = new URL('./index.html', self.location.href).href;
const ASSETS = ['index.html','manifest.webmanifest','icon-192.png','icon-512.png'].map(name=>new URL(name,self.location.href).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('five-cards-offline-')&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(), 3000);
      try {
        const response = await fetch(event.request,{signal:controller.signal});
        if (!response.ok) throw new Error('Navigation failed');
        await cache.put(ENTRY,response.clone());
        return response;
      } catch (error) {
        const stored = await cache.match(ENTRY);
        if (stored) return stored;
        throw error;
      } finally { clearTimeout(timer); }
    })());
  } else if (ASSETS.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});
