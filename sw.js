const CACHE='stack-v28';
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(['./','./index.html','./app.js','./logic.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-1024.png','./icons/apple-touch-icon.png','./icons/favicon-32.png','./fonts/YanoneKaffeesatz.ttf','./fonts/Commissioner.ttf','./fonts/DrukTextCyr-Bold.otf','./fonts/RAYDIS.woff2']);await c.addAll('A 2 3 4 5 6 7 8 9 10 J Q K'.split(' ').flatMap(r=>['C','D','H','S'].map(s=>'./cards/'+r+s+'.webp')));})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE&&key.startsWith('stack-'))await caches.delete(key);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith((async()=>{const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;return fetch(event.request)})())});

self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
