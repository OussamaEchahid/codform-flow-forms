// Disable noisy console methods in production-like environments
(() => {
  try {
    const host = window.location.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    const debugEnabled = localStorage.getItem('DEBUG') === 'true';

    if (isLocal || debugEnabled) return;

    const noop = () => {};
    // Keep info/warn/error for important messages
    console.log = noop;
    console.debug = noop;
    console.trace = noop;
  } catch {
    // ignore
  }
})();
