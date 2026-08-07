/* Armazón en caché para que la app abra sin cobertura.
   Los ficheros de datos se piden a la red primero y se guardan de reserva. */
const CACHE = "diario-v2";
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.host === "api.github.com") return;      // siempre en directo

  // Navegación: red primero y, si falla, el index guardado.
  // Cubre entrar por /app/ sin nombre de fichero.
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).catch(() =>
        caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Datos del viaje: red primero, caché de reserva.
  if(url.pathname.includes("/data/")){
    e.respondWith(
      fetch(req)
        .then(r => {
          if(r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Tipografías y resto: caché primero, y se guarda lo que llegue.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if(res.ok && (url.host.includes("fonts.") || url.origin === location.origin)){
        const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c));
      }
      return res;
    }))
  );
});
