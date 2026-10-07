/* Finanças Lulis: funcionamento offline.
   O app (index.html) é buscado na internet primeiro, para receber atualizações,
   e cai na cópia salva quando estiver sem conexão. Ícones e fontes vêm da cópia salva. */
const VERSION='lulis-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-512-maskable.png','icons/favicon-32.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  /* cotações: sempre da internet, nunca da cópia */
  if(url.hostname.endsWith('brapi.dev'))return;
  /* abertura do app: internet primeiro, cópia salva se estiver offline */
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return r})
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return;
  }
  /* fontes e arquivos do app: cópia salva primeiro, atualiza em segundo plano */
  if(url.origin===location.origin||url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
