import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'chunk_load_reload';

/** Deploy sonrası eski hash’li chunk 404 olunca bir kez hard reload */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return mod;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isChunkError =
        /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk|Importing a module script failed/i.test(
          msg,
        );
      if (isChunkError) {
        try {
          if (!sessionStorage.getItem(RELOAD_KEY)) {
            sessionStorage.setItem(RELOAD_KEY, '1');
            window.location.reload();
            return new Promise(() => {
              /* reload pending */
            });
          }
          sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* ignore */
        }
      }
      throw err;
    }
  });
}
