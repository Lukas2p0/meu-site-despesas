// Este service worker é um placeholder para tornar a PWA instalável.
// Ele não faz nada de complexo, apenas regista-se com sucesso.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado');
});

self.addEventListener('fetch', (event) => {
  // Apenas para cumprir o requisito de installability.
  // Não intercepta nenhum pedido.
});