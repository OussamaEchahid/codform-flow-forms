// Lightweight Web Vitals measurement without external deps
// Exposes results on window.__WEB_VITALS and logs via console.info

export type WebVital = {
  name: 'LCP' | 'CLS' | 'INP';
  value: number;
  entries?: PerformanceEntry[];
  at: number;
};

declare global {
  interface Window { __WEB_VITALS?: Record<string, WebVital> }
}

export const initWebVitals = () => {
  try {
    window.__WEB_VITALS = window.__WEB_VITALS || {};

    // LCP
    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as any;
          if (!last) return;
          const value = last.renderTime || last.loadTime || last.startTime || 0;
          const metric: WebVital = { name: 'LCP', value, entries, at: Date.now() };
          window.__WEB_VITALS!['LCP'] = metric;
          console.info('[Vitals] LCP:', Math.round(value), 'ms');
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true as any });
      } catch {}
    }

    // CLS
    try {
      let clsValue = 0;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
            const metric: WebVital = { name: 'CLS', value: clsValue, at: Date.now() };
            window.__WEB_VITALS!['CLS'] = metric;
            console.info('[Vitals] CLS:', Number(clsValue.toFixed(3)));
          }
        }
      });
      po.observe({ type: 'layout-shift', buffered: true as any });
    } catch {}

    // INP (Event Timing). Fallback to first-input if not supported
    try {
      const type = (PerformanceEventTiming && 'interactionId' in PerformanceEventTiming.prototype) ? 'event' : 'first-input';
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        if (!entries.length) return;
        // For INP, we consider worst latency observed
        const maxLatency = Math.max(...entries.map((e) => (e.processingEnd || e.startTime) - e.startTime));
        const metric: WebVital = { name: 'INP', value: maxLatency, entries, at: Date.now() };
        window.__WEB_VITALS!['INP'] = metric;
        console.info('[Vitals] INP:', Math.round(maxLatency), 'ms');
      });
      po.observe({ type, buffered: true as any });
    } catch {}
  } catch {}
};
