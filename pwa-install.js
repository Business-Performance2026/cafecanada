// Registers the service worker so browsers allow "Add to Home Screen" / "Install app"
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed:', err));
  });
}
