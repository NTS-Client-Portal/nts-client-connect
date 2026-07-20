/**
 * Kill-switch service worker.
 *
 * At some point in the past, a build was deployed that registered a
 * service worker on shipper-connect.com. That SW is now permanently
 * installed in browsers that visited during that window and intercepts
 * fetches, serving stale/broken cached JavaScript that predates recent
 * fixes (e.g. the two-provider `_app.tsx` fix).
 *
 * The current codebase does not use a service worker. This file exists
 * only so that when a browser with the old SW installed re-visits the
 * site, it fetches this /sw.js update, activates it, and immediately
 * unregisters itself + purges every cache it created. From then on the
 * app runs directly against the network like a normal SSR Next.js app.
 *
 * Once this has been in production long enough that you're confident
 * every returning visitor has been healed (a few weeks is plenty),
 * this file can be deleted.
 */

self.addEventListener('install', () => {
  // Take control ASAP so we can uninstall on the current page load.
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  event.waitUntil(
    (async () => {
      // Delete every cache the previous SW may have created.
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Unregister this SW so the browser stops intercepting fetches.
      await self.registration.unregister();

      // Force a full reload of every open tab controlled by this SW so
      // users immediately get fresh chunks (with the correct providers)
      // instead of whatever the old SW previously served.
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});

// Passthrough: don't intercept anything while we're still alive during
// the activation tick.
self.addEventListener('fetch', () => {});
