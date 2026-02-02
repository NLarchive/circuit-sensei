export async function clearBrowserState(page) {
  // Clear cookies and storage
  try {
    await page.context().clearCookies();
  } catch (e) {
    // ignore
  }

  try {
    await page.evaluate(async () => {
      // Clear CacheStorage
      if (window.caches && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // Unregister service workers
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      // Clear storage
      try { localStorage.clear(); } catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}
    });
  } catch (e) {
    // ignore failures in test environments
  }

  // Give browser a tick to apply changes
  await page.waitForTimeout(50);
}
