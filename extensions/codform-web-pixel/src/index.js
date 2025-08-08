import { register } from "@shopify/web-pixels-extension";

register(({ analytics, init, settings }) => {
  const safe = (fn) => {
    try { return fn && fn(); } catch (_) { /* no-op */ }
  };

  const publish = (name, payload = {}) => safe(() => analytics?.publish?.(name, payload));
  const debug = (name, payload = {}) => {
    try { console.log(`[CODFORM Pixel] ${name}`, payload); } catch (_) { /* no-op */ }
  };

  const subscribe = (event) => safe(() =>
    analytics?.subscribe?.(event, (e) => {
      debug(event, e);
      publish(`codform:${event}`, { ...e, accountID: settings?.accountID || null });
    })
  );

  [
    'page_viewed',
    'product_viewed',
    'collection_viewed',
    'search_submitted',
    'checkout_started',
    'checkout_completed',
  ].forEach(subscribe);

  const attachCodformListeners = () => {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.codform-submit-btn').forEach((el) => {
      if (el.dataset.codformTracked) return;
      el.dataset.codformTracked = '1';
      el.addEventListener('click', () => {
        const payload = { ts: Date.now(), accountID: settings?.accountID || null };
        debug('submit_clicked', payload);
        publish('codform:submit_clicked', payload);
      });
    });
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachCodformListeners);
    } else {
      attachCodformListeners();
    }

    safe(() => {
      const mo = new MutationObserver(() => attachCodformListeners());
      mo.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  safe(() => init?.());
});

