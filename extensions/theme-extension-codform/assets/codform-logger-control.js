/**
 * CODFORM LOGGER CONTROL
 * للتحكم في السجلات المزعجة في وحدة التحكم
 */

(function() {
  'use strict';

  // ✅ إيقاف السجلات المزعجة المتعلقة بالعملات
  const originalConsoleLog = console.log;
  
  console.log = function(...args) {
    // تحويل الحجج إلى نص للفحص
    const message = args.join(' ').toLowerCase();
    
    // قائمة الكلمات المفتاحية للسجلات المزعجة
    const blockedKeywords = [
      'sar',
      'mad', 
      'using local formatting',
      'formatcurrency called',
      'final formatted result',
      'currency settings fetched',
      'state manager updated',
      'retrieved store from cache'
    ];
    
    // فحص إذا كان السجل يحتوي على كلمات مزعجة
    const shouldBlock = blockedKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    // إذا لم يكن مزعجاً، اظهر السجل
    if (!shouldBlock) {
      originalConsoleLog.apply(console, args);
    }
  };

  // ✅ السماح ببعض السجلات المهمة فقط
  window.allowImportantLog = function(message, data = null) {
    if (data) {
      originalConsoleLog(message, data);
    } else {
      originalConsoleLog(message);
    }
  };

  console.log('🔇 Logger control activated - annoying currency logs filtered');

})();