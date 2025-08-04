/**
 * CODFORM CURRENCY MANAGER
 * نظام موحد لإدارة العملات في متجر شوبيفاي
 * يتصل مع CurrencyService من التطبيق الرئيسي أو يستخدم نظام احتياطي
 */

(function() {
  'use strict';
  
  // إعدادات العملة الافتراضية (احتياطية)
  const DEFAULT_SETTINGS = {
    showSymbol: true,
    symbolPosition: 'before', // 'before' | 'after'
    decimalPlaces: 2,
    customSymbols: {
      'MAD': 'Dh',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'USD': '$',
      'EUR': '€'
    }
  };
  
  // معدلات التحويل الافتراضية
  const DEFAULT_RATES = {
    'USD': 1.0,
    'SAR': 3.75,
    'AED': 3.67,
    'EGP': 30.85,
    'MAD': 10.0,
    'EUR': 0.85,
    'GBP': 0.75
  };
  
  let currencySettings = { ...DEFAULT_SETTINGS };
  let customRates = { ...DEFAULT_RATES };
  let isInitialized = false;
  
  /**
   * تهيئة إدارة العملة
   */
  function initializeCurrencyManager() {
    if (isInitialized) return;
    
    try {
      // محاولة الوصول إلى CurrencyService من التطبيق الرئيسي
      loadCurrencyService();
      
      // تحميل الإعدادات المخصصة
      loadCustomSettings();
      
      isInitialized = true;
      console.log('✅ Currency Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Currency Manager:', error);
    }
  }
  
  /**
   * محاولة تحميل CurrencyService من التطبيق الرئيسي
   */
  function loadCurrencyService() {
    try {
      // البحث في النوافذ المختلفة
      const sources = [window.parent, window.top, window];
      
      for (const source of sources) {
        if (source && source.CurrencyService) {
          window.CurrencyService = source.CurrencyService;
          console.log('✅ CurrencyService loaded successfully');
          
          // تهيئة الخدمة
          if (typeof window.CurrencyService.initialize === 'function') {
            window.CurrencyService.initialize();
          }
          
          // تحميل الإعدادات المخصصة
          loadSettingsFromService();
          return true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load CurrencyService:', error);
    }
    
    return false;
  }
  
  /**
   * تحميل الإعدادات من CurrencyService
   */
  function loadSettingsFromService() {
    try {
      // محاولة 1: استخدام CurrencyService مباشرة
      if (window.CurrencyService) {
        const displaySettings = window.CurrencyService.getDisplaySettings();
        if (displaySettings) {
          currencySettings = { ...currencySettings, ...displaySettings };
          console.log('✅ Display settings loaded from CurrencyService:', displaySettings);
        }
        
        const serviceRates = window.CurrencyService.getCustomRates();
        if (serviceRates && serviceRates.size > 0) {
          serviceRates.forEach((rate, currency) => {
            customRates[currency] = rate.rate;
          });
          console.log('✅ Custom rates loaded from CurrencyService:', serviceRates.size);
        }
      }
      
      // محاولة 2: استخدام CurrencyServiceStorage للوصول المباشر لـ localStorage
      if (window.CurrencyServiceStorage) {
        const displaySettings = window.CurrencyServiceStorage.getDisplaySettings();
        if (displaySettings) {
          currencySettings = { ...currencySettings, ...displaySettings };
          console.log('✅ Display settings loaded from Storage:', displaySettings);
        }
        
        const storageRates = window.CurrencyServiceStorage.getCustomRates();
        if (storageRates && Object.keys(storageRates).length > 0) {
          Object.entries(storageRates).forEach(([currency, rateData]) => {
            customRates[currency] = rateData.rate;
          });
          console.log('✅ Custom rates loaded from Storage:', Object.keys(storageRates).length);
        }
      }
      
      console.log('✅ Final currency settings:', currencySettings);
      console.log('✅ Final custom rates:', customRates);
    } catch (error) {
      console.warn('⚠️ Error loading settings from CurrencyService:', error);
    }
  }
  
  /**
   * تحميل الإعدادات المخصصة من localStorage
   */
  function loadCustomSettings() {
    try {
      const savedSettings = localStorage.getItem('codform_currency_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        currencySettings = { ...currencySettings, ...parsed };
      }
      
      const savedRates = localStorage.getItem('codform_custom_rates');
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        customRates = { ...customRates, ...parsed };
      }
    } catch (error) {
      console.warn('⚠️ Error loading custom settings:', error);
    }
  }
  
  /**
   * تحويل العملة
   */
  function convertCurrency(amount, fromCurrency, toCurrency) {
    // استخدام CurrencyService إذا كان متاحاً
    if (window.CurrencyService && typeof window.CurrencyService.convertCurrency === 'function') {
      return window.CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
    }
    
    // التحويل الاحتياطي
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = customRates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1;
    const toRate = customRates[toCurrency] || DEFAULT_RATES[toCurrency] || 1;
    
    // تحويل عبر USD
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }
  
  /**
   * تنسيق العملة
   */
  function formatCurrency(amount, currencyCode, language = 'ar') {
    // استخدام CurrencyService إذا كان متاحاً
    if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
      return window.CurrencyService.formatCurrency(amount, currencyCode, language);
    }
    
    // التنسيق المخصص
    const formattedAmount = amount.toFixed(currencySettings.decimalPlaces);
    const symbol = currencySettings.customSymbols[currencyCode] || currencyCode;
    
    if (currencySettings.showSymbol) {
      if (currencySettings.symbolPosition === 'before') {
        return `${symbol} ${formattedAmount}`;
      } else {
        return `${formattedAmount} ${symbol}`;
      }
    }
    
    return `${formattedAmount} ${currencyCode}`;
  }
  
  /**
   * الحصول على معدل التحويل
   */
  function getExchangeRate(currencyCode) {
    if (window.CurrencyService && typeof window.CurrencyService.getExchangeRate === 'function') {
      return window.CurrencyService.getExchangeRate(currencyCode);
    }
    
    return customRates[currencyCode] || DEFAULT_RATES[currencyCode] || 1;
  }
  
  // تصدير الدوال عالمياً
  window.CodformCurrencyManager = {
    initialize: initializeCurrencyManager,
    convertCurrency: convertCurrency,
    formatCurrency: formatCurrency,
    getExchangeRate: getExchangeRate,
    getSettings: () => currencySettings,
    getRates: () => customRates
  };
  
  // ربط الدوال العالمية للتوافق مع الكود القديم
  window.convertCurrency = convertCurrency;
  window.formatCurrencyAmount = formatCurrency;
  window.getExchangeRate = getExchangeRate;
  
  // إعادة تحميل الإعدادات عند تحديثها
  function reloadSettings() {
    loadCurrencyService();
    loadCustomSettings();
    console.log('🔄 Currency settings reloaded');
  }
  
  // مراقبة تحديثات localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === 'codform_currency_display_settings' || e.key === 'codform_custom_currency_rates') {
      reloadSettings();
    }
  });
  
  // تهيئة تلقائية
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCurrencyManager);
  } else {
    initializeCurrencyManager();
  }
  
  // إعادة تحميل كل 5 ثوان للتأكد من التحديثات
  setInterval(reloadSettings, 5000);
  
  console.log('📋 Codform Currency Manager loaded');
})();