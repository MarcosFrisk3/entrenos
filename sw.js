// ============================================================
// EntreNós — Service Worker
//
// Faz duas coisas:
//   1) deixa o app abrir mesmo com internet ruim;
//   2) recebe as notificações (ligadas na Etapa 2).
//
// IMPORTANTE: ao publicar uma versão nova do app, troque o
// número da VERSAO abaixo. É isso que faz o celular baixar
// os arquivos novos em vez de usar os antigos.
// ============================================================

const VERSAO = 'entrenos-v2';

const ARQUIVOS = [
  './',
  './index.html',
  './css/estilo.css',
  './js/app.js',
  './js/conta.js',
  './js/pin.js',
  './js/config.js',
  './manifest.json'
];


// ---------- Instalação ----------
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(ARQUIVOS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});


// ---------- Limpeza das versões antigas ----------
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});


// ---------- Busca dos arquivos ----------
self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;

  // Nada de guardar chamadas ao Supabase nem conteúdo privado
  if (pedido.method !== 'GET') return;
  if (pedido.url.includes('supabase.co')) return;

  // Páginas: tenta a internet primeiro, usa o guardado se faltar
  if (pedido.mode === 'navigate') {
    evento.respondWith(
      fetch(pedido).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto: usa o guardado e atualiza por trás
  evento.respondWith(
    caches.match(pedido).then(guardado => {
      const rede = fetch(pedido).then(resposta => {
        if (resposta && resposta.status === 200 && resposta.type === 'basic') {
          const copia = resposta.clone();
          caches.open(VERSAO).then(c => c.put(pedido, copia));
        }
        return resposta;
      }).catch(() => guardado);

      return guardado || rede;
    })
  );
});


// ============================================================
// NOTIFICAÇÕES — ligadas na Etapa 2
// A notificação nunca carrega o conteúdo da mensagem.
// ============================================================

self.addEventListener('push', (evento) => {
  let dados = {};
  try { dados = evento.data ? evento.data.json() : {}; } catch { dados = {}; }

  const titulo = dados.titulo || 'EntreNós';
  const corpo  = dados.corpo  || 'Tem algo especial pra você…';

  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: './icones/icone-192.png',
      badge: './icones/icone-192.png',
      vibrate: [60, 40, 60],
      tag: 'entrenos-sinal',
      renotify: true,
      data: { url: './index.html' }
    })
  );
});


self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || './index.html';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
      for (const janela of janelas) {
        if ('focus' in janela) return janela.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
