/**
 * Network status helpers.
 *
 * Thin wrappers over the browser online/offline signals so services and stores
 * can detect connectivity without touching `navigator`/`window` directly.
 */

/** Current connectivity. Assumes online where the API is unavailable (SSR). */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Subscribe to connectivity changes. Returns an unsubscribe function that
 * removes both listeners.
 */
export function onNetworkChange(
  handler: (online: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => handler(true);
  const onOffline = () => handler(false);

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
