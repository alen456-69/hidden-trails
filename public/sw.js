const CACHE='hidden-trails-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.add('/offline.html'))));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));});
