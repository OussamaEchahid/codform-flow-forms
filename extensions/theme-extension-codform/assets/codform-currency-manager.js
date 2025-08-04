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
      'MAD': 'MAD',
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
      
      // تحميل الإعدادات من API
      loadSettingsFromAPI();
      
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
          
          return true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load CurrencyService:', error);
    }
    
    return false;
  }
  
  /**
   * تحميل الإعدادات من API
   */
  async function loadSettingsFromAPI() {
    try {
      // الحصول على shop من المتغيرات العامة - مع تتبع أفضل
      console.log('🔍 Available shop sources:', {
        'window.Shopify.shop': window.Shopify?.shop,
        'window.codformConfig.shop': window.codformConfig?.shop,
        'location.hostname': location.hostname,
        'window.location.href': window.location.href
      });
      
      // تجربة مصادر مختلفة للحصول على shop_id
      let shopId = window.Shopify?.shop || window.codformConfig?.shop;
      
      // إذا لم نجد shop_id، حاول استخراجه من URL أو hostname
      if (!shopId && location.hostname.includes('myshopify.com')) {
        shopId = location.hostname;
        console.log(`📍 Extracted shop from hostname: ${shopId}`);
      }
      
      // إذا كان في iframe، حاول الحصول عليه من parent
      if (!shopId && window.parent !== window) {
        try {
          shopId = window.parent.Shopify?.shop || window.parent.location.hostname;
          if (shopId) console.log(`🔗 Got shop from parent: ${shopId}`);
        } catch (e) {
          console.warn('Could not access parent window:', e);
        }
      }
      
      if (!shopId) {
        console.warn('⚠️ Shop ID not found after all attempts, using fallback settings');
        console.log('Available global objects:', Object.keys(window).filter(k => k.toLowerCase().includes('shop')));
        return;
      }
      
      console.log(`🔄 Loading currency settings for shop: ${shopId}`);
      
      // استدعاء edge function
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/currency-settings?shop=${encodeURIComponent(shopId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // تحديث الإعدادات المحلية
        if (data.display_settings) {
          currencySettings = {
            showSymbol: data.display_settings.show_symbol !== false,
            symbolPosition: data.display_settings.symbol_position || 'before',
            decimalPlaces: data.display_settings.decimal_places || 2,
            customSymbols: data.custom_symbols || {}
          };
        }
        
        if (data.custom_rates) {
          customRates = { ...DEFAULT_RATES, ...data.custom_rates };
        }
        
        console.log('✅ Currency settings loaded from API:', {
          settings: currencySettings,
          rates: Object.keys(customRates).length
        });
        
        // إعادة تطبيق التنسيق على العناصر الموجودة
        reapplyCurrencyFormatting();
        
      } else {
        console.warn('⚠️ API returned error, using default settings:', data.error);
      }
      
    } catch (error) {
      console.error('❌ Error loading currency settings from API:', error);
      // استخدام الإعدادات المحلية كبديل
      loadCustomSettings();
    }
  }
  
  /**
   * إعادة تطبيق تنسيق العملة على جميع العناصر
   */
  function reapplyCurrencyFormatting() {
    console.log('🔄 Reapplying currency formatting...');
    
    // العناصر المحددة للـ Cart Summary
    const cartSummarySelectors = [
      '.cart-summary-field .summary-value',
      '.subtotal-value', '.discount-value', '.shipping-value', '.total-value'
    ];
    
    // العناصر المحددة لعروض الكمية
    const quantityOffersSelectors = [
      '[id^="quantity-offers-before-"] [style*="font-weight: bold"]',
      '[id^="quantity-offers-before-"] [style*="color: #059669"]'
    ];
    
    // العناصر العامة للأسعار
    const generalPriceSelectors = [
      '[data-price]', '.price', '.money', 
      '.codform-price', '.unit-price', '.total-price',
      '.offer-price', '.savings-amount'
    ];
    
    const allSelectors = [...cartSummarySelectors, ...quantityOffersSelectors, ...generalPriceSelectors];
    const priceElements = document.querySelectorAll(allSelectors.join(', '));
    
    console.log(`🔍 Found ${priceElements.length} potential price elements to update`);
    
    let updatedCount = 0;
    
    priceElements.forEach((element, index) => {
      const originalText = element.textContent || '';
      const currency = element.dataset.currency || 
                      (element.closest('[data-currency]')?.dataset.currency) || 
                      'MAD';
      
      console.log(`📝 Processing element ${index + 1}: "${originalText}"`);
      
      // استخراج الرقم من النص - تحسين regex
      const priceMatch = originalText.match(/(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        const amount = parseFloat(priceMatch[1]);
        if (!isNaN(amount) && amount > 0) {
          // تطبيق التنسيق الجديد
          const formattedPrice = formatCurrency(amount, currency);
          
          // التحقق من أن التنسيق مختلف
          if (originalText !== formattedPrice) {
            element.textContent = formattedPrice;
            updatedCount++;
            console.log(`💰 Updated price: "${originalText}" → "${formattedPrice}"`);
          }
        }
      }
    });
    
    // معالجة خاصة للـ Cart Summary
    updateCartSummaryPrices();
    
    // معالجة خاصة لعروض الكمية
    updateQuantityOffersPrices();
    
    // إشعار الأنظمة الأخرى بالتحديث
    notifySystemUpdates();
    
    console.log(`✅ Currency formatting applied: ${updatedCount} elements updated out of ${priceElements.length} found`);
  }
  
  /**
   * تحديث أسعار Cart Summary تحديداً
   */
  function updateCartSummaryPrices() {
    const cartSummaryFields = document.querySelectorAll('.cart-summary-field');
    
    cartSummaryFields.forEach(field => {
      const currency = field.dataset.currency || 'MAD';
      const summaryValues = field.querySelectorAll('.summary-value');
      
      summaryValues.forEach(valueElement => {
        const dataAmount = valueElement.dataset.amount;
        if (dataAmount && !isNaN(parseFloat(dataAmount))) {
          const amount = parseFloat(dataAmount);
          const formattedPrice = formatCurrency(amount, currency);
          
          // الحفاظ على العلامات الخاصة مثل علامة السالب للخصم
          if (valueElement.textContent.includes('-')) {
            valueElement.textContent = `-${formattedPrice}`;
          } else {
            valueElement.textContent = formattedPrice;
          }
          
          console.log(`🛒 Updated Cart Summary: ${dataAmount} → ${formattedPrice}`);
        }
      });
    });
  }
  
  /**
   * تحديث أسعار عروض الكمية تحديداً
   */
  function updateQuantityOffersPrices() {
    const quantityOfferContainers = document.querySelectorAll('[id^="quantity-offers-before-"]');
    
    quantityOfferContainers.forEach(container => {
      const priceElements = container.querySelectorAll('[style*="color: #059669"], [style*="text-decoration: line-through"]');
      
      priceElements.forEach(priceElement => {
        const text = priceElement.textContent || '';
        const priceMatch = text.match(/(\d+(?:\.\d+)?)/);
        
        if (priceMatch) {
          const amount = parseFloat(priceMatch[1]);
          if (!isNaN(amount) && amount > 0) {
            const currency = 'MAD'; // العملة الافتراضية
            const formattedPrice = formatCurrency(amount, currency);
            
            // الحفاظ على التنسيق الأصلي مع استبدال السعر فقط
            priceElement.textContent = text.replace(priceMatch[0], formattedPrice.split(' ')[0]);
            console.log(`🎯 Updated Quantity Offer: ${priceMatch[0]} → ${formattedPrice}`);
          }
        }
      });
    });
  }
  
  /**
   * إشعار الأنظمة الأخرى بالتحديثات
   */
  function notifySystemUpdates() {
    // إشعار State Manager بالتحديث إذا كان متاحاً
    if (window.CodformStateManager && typeof window.CodformStateManager.notifyStateChange === 'function') {
      window.CodformStateManager.notifyStateChange();
    }
    
    // إشعار UI Updates بالتحديث إذا كان متاحاً  
    if (window.CodformUIUpdates && typeof window.CodformUIUpdates.updateUI === 'function') {
      const currentState = window.CodformStateManager ? window.CodformStateManager.getState() : {};
      window.CodformUIUpdates.updateUI(currentState);
    }
    
    // إشعار الكود الأساسي للنموذج
    if (window.CodformFormCore && typeof window.CodformFormCore.updatePriceDisplay === 'function') {
      window.CodformFormCore.updatePriceDisplay();
    }
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
    // تحديث الإعدادات من localStorage قبل التنسيق
    loadCustomSettings();
    
    // استخدام CurrencyService إذا كان متاحاً مع ضمان استخدام الإعدادات المحدثة
    if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
      // تحديث إعدادات CurrencyService من localStorage
      const savedSettings = localStorage.getItem('codform_currency_display_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (window.CurrencyService.saveDisplaySettings) {
            window.CurrencyService.saveDisplaySettings(settings);
          }
        } catch (e) {
          console.warn('Failed to parse saved currency settings:', e);
        }
      }
      
      return window.CurrencyService.formatCurrency(amount, currencyCode, language);
    }
    
    // التنسيق المخصص كحل احتياطي
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
  
  // إعادة تحميل كل 3 ثوان للتأكد من التحديثات وفرض التطبيق
  setInterval(() => {
    console.log('🔄 Auto-reloading currency settings...');
    loadSettingsFromAPI().then(() => {
      // فرض إعادة تطبيق التنسيق بعد تحميل الإعدادات
      setTimeout(reapplyCurrencyFormatting, 500);
    });
  }, 3000);
  
  console.log('📋 Codform Currency Manager loaded');
})();