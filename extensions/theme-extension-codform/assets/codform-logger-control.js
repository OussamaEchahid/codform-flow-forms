/**
 * CODFORM PROFESSIONAL LOGGER SYSTEM
 * نظام سجلات احترافي للإنتاج مع إمكانية التطوير
 */

(function() {
  'use strict';

  // ✅ تحديد وضع التطوير
  let debugEnabled = false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    debugEnabled = (
      window.CODFORM_DEBUG === true ||
      localStorage.getItem('codform_debug') === '1' ||
      params.has('codformDebug') ||
      params.get('debug') === '1' ||
      window.location.hostname === 'localhost'
    );
  } catch (_) { /* ignore */ }

  // ✅ حفظ الدوال الأصلية
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;

  // ✅ إذا كان وضع التطوير مفعل، اترك كل شيء كما هو
  if (debugEnabled) {
    originalConsoleLog('🔊 CODFORM Debug Mode: All logs enabled');
    window.allowImportantLog = function(message, data = null) {
      if (data) { originalConsoleLog(message, data); } else { originalConsoleLog(message); }
    };
    return; // لا تحجب أي سجلات في وضع التطوير
  }

  // ✅ قائمة السجلات المسموحة في الإنتاج (فقط الأساسية)
  const allowedProductionLogs = [
    'codform cod form - overall: loading page builder complete',
    'form loaded successfully',
    'form submission successful',
    'quantity offers available',
    'no quantity offers found',
    'cart summary initialized'
  ];

  // ✅ دالة للتحقق من السجلات المسموحة
  function isAllowedLog(message) {
    if (!message || typeof message !== 'string') return false;
    const lowerMessage = message.toLowerCase();
    return allowedProductionLogs.some(allowed =>
      lowerMessage.includes(allowed.toLowerCase())
    );
  }

  // ✅ استبدال console.log بنسخة احترافية
  console.log = function(...args) {
    const message = args.map(v => (typeof v === 'string' ? v : tryStringify(v))).join(' ');

    // السماح فقط بالسجلات المهمة
    if (isAllowedLog(message)) {
      originalConsoleLog.apply(console, args);
    }
  };

  // ✅ استبدال console.info و console.warn أيضاً
  console.info = function(...args) {
    const message = args.map(v => (typeof v === 'string' ? v : tryStringify(v))).join(' ');
    if (isAllowedLog(message)) {
      originalConsoleInfo.apply(console, args);
    }
  };

  console.warn = function(...args) {
    const message = args.map(v => (typeof v === 'string' ? v : tryStringify(v))).join(' ');
    if (isAllowedLog(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };

  function tryStringify(v){
    try { return JSON.stringify(v); } catch(_) { return String(v); }
  }

  // ✅ دالة للسجلات المهمة (للاستخدام في الكود)
  window.allowImportantLog = function(message, data = null) {
    if (data) {
      originalConsoleLog(message, data);
    } else {
      originalConsoleLog(message);
    }
  };

  // ✅ دالة لتفعيل وضع التطوير من Console
  window.enableDebug = function() {
    localStorage.setItem('codform_debug', '1');
    originalConsoleLog('🔊 Debug mode enabled! Reload page to see all logs.');
  };

  window.disableDebug = function() {
    localStorage.removeItem('codform_debug');
    originalConsoleLog('🔇 Debug mode disabled! Reload page for clean logs.');
  };

  // ✅ رسالة تأكيد النظام
  originalConsoleLog('✅ CODFORM Professional Logger: Production mode active');

})();