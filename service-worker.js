const CACHE="boost-cn-v7-20260714";
const CORE=["./","./index.html","./css/styles.css","./js/app.js","./manifest.json","./assets/boost-cn.png","./data/manifest-data.json","./data/base-at.json","./data/item-adt.json","./data/records-001.json","./data/records-002.json","./data/records-003.json","./data/records-004.json","./data/records-005.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match("./index.html"))))});
