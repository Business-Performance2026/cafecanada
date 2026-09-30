// Minimal service worker — its presence is required by browsers to allow
// "Add to Home Screen" / "Install app". We don't need offline caching,
// so this just passes every request straight through to the network.
self.addEventListener('fetch', () => {});
