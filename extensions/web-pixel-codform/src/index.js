// CODFORM Web Pixel Extension
// Tracks essential storefront events and CODFORM interactions

export default function register(api) {
  const safe = (fn) => {
    try { fn && fn(); } catch (_) {}
  };

  const publish = (name, payload = {}) => {
    try {
      if (api?.analytics?.publish) api.analytics.publish(name, payload);
    } catch (_) {}
  };

  // Subscribe to common Shopify analytics events (no PII)
  const subscribe = (event) => {
    safe(() => api?.subscribe?.(event, (e) => publish(`codform:${event}`, { ...e }))); // generic
    safe(() => api?.analytics?.subscribe?.(event, (e) => publish(`codform:${event}`, { ...e }))); // legacy
  };

  [
    'page_viewed',
    'product_viewed',
    'collection_viewed',
    'search_submitted',
    'checkout_started',
    'checkout_completed'
  ].forEach(subscribe);

  // Track CODFORM submit clicks by watching DOM for our button
  const attachCodformListeners = () => {
    document.querySelectorAll('.codform-submit-btn').forEach((el) => {
      if (el.dataset.codformTracked) return;
      el.dataset.codformTracked = '1';
      el.addEventListener('click', () => {
        publish('codform:submit_clicked', { ts: Date.now() });
      });
    });
  };

  // Initial attach + observe dynamic renders
  safe(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachCodformListeners);
    } else {
      attachCodformListeners();
    }

    const mo = new MutationObserver(() => attachCodformListeners());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  });
}
