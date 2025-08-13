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
   * تهيئة إدارة العملة - محسنة لمنع التضارب
   */
  function initializeCurrencyManager() {
    if (isInitialized) {
      console.log('⚠️ Currency Manager already initialized, skipping...');
      return;
    }
    
    try {
      // تحميل الإعدادات مرة واحدة فقط
      loadSettingsFromAPI();
      
      isInitialized = true;
      console.log('✅ Currency Manager initialized (no conflict mode)');
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
      const shopId = getShopIdFromAllSources();
      
      if (!shopId) {
        console.warn('⚠️ Shop ID not found, cannot load settings from API');
        return false;
      }
      
      console.log(`🔄 Loading currency settings from API for shop: ${shopId}`);
      
      // استدعاء edge function مع headers محسنة
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/currency-settings?shop=${encodeURIComponent(shopId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Raw API response:', data);
      
      if (data.success) {
        // تحديث الإعدادات مع debugging مفصل
        if (data.display_settings) {
          const newSettings = {
            showSymbol: data.display_settings.show_symbol !== false,
            symbolPosition: data.display_settings.symbol_position || 'before',
            // Use explicit check so 0 is respected
            decimalPlaces: (typeof data.display_settings.decimal_places === 'number') ? data.display_settings.decimal_places : 2,
            customSymbols: data.custom_symbols || {}
          };
          
          console.log('🔄 Updating currency settings:', {
            old: currencySettings,
            new: newSettings
          });
          
          currencySettings = newSettings;
          
          // حفظ في localStorage لضمان الاستمرارية
          saveSettingsToLocalStorage();
        }
        
        if (data.all_rates) {
          // Use full rates from backend (includes defaults + custom)
          customRates = data.all_rates;
          console.log('💰 Updated all rates from API:', customRates);
          saveSettingsToLocalStorage();
        } else if (data.custom_rates) {
          // Merge custom overrides with local defaults
          customRates = { ...DEFAULT_RATES, ...data.custom_rates };
          console.log('💰 Updated custom rates merged with defaults:', customRates);
          // Persist updated rates so subsequent reloads don't overwrite them with stale values
          saveSettingsToLocalStorage();
        }
        
        console.log('✅ Currency settings successfully loaded and applied from API');
        
        // تطبيق فوري للتنسيق
        setTimeout(() => {
          reapplyCurrencyFormatting();
          notifySystemUpdates();
          // Notify listeners that currency settings changed
          try { window.dispatchEvent(new CustomEvent('currencySettingsUpdated', { detail: { source: 'currency-manager' } })); } catch (e) {}
          // Recalculate cart items totals using latest rates
          if (window.CodformCartItems && typeof window.CodformCartItems.updatePriceDisplay === 'function') {
            const qty = parseInt(document.querySelector('.codform-cart-items .cart-items-quantity')?.textContent || '1');
            window.CodformCartItems.updatePriceDisplay(qty || 1);
          }
        }, 100);
        
        return true;
        
      } else {
        console.warn('⚠️ API returned error:', data.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error loading currency settings from API:', error);
      // استخدام الإعدادات المحلية كبديل
      loadCustomSettings();
      return false;
    }
  }
  
  /**
   * الحصول على shop_id من جميع المصادر المتاحة
   */
  function getShopIdFromAllSources() {
    console.log('🔍 Searching for shop ID from all available sources...');
    
    // المصادر المرتبة حسب الأولوية
    const sources = [
      () => window.Shopify?.shop,
      () => window.codformConfig?.shop,
      () => window.parent?.Shopify?.shop,
      () => window.top?.Shopify?.shop,
      () => {
        // استخراج من hostname
        const hostname = location.hostname;
        if (hostname.includes('myshopify.com')) {
          return hostname;
        }
        return null;
      },
      () => {
        // البحث في localStorage
        const stored = localStorage.getItem('current_shopify_store') || 
                      localStorage.getItem('shopify_store');
        return stored;
      },
      () => {
        // محاولة الوصول للـ parent window
        try {
          if (window.parent !== window) {
            return window.parent.location.hostname.includes('myshopify.com') ? 
                   window.parent.location.hostname : null;
          }
        } catch (e) {
          // Cross-origin restriction
        }
        return null;
      }
    ];
    
    for (const source of sources) {
      try {
        const shopId = source();
        if (shopId && shopId !== 'auto-detect') {
          console.log(`✅ Found shop ID: ${shopId}`);
          return shopId;
        }
      } catch (error) {
        console.warn('⚠️ Error accessing shop source:', error);
      }
    }
    
    console.error('❌ Could not find shop ID from any source');
    console.log('Available global objects:', Object.keys(window).filter(k => 
      k.toLowerCase().includes('shop') || k.toLowerCase().includes('codform')
    ));
    
    return null;
  }
  
  /**
   * حفظ الإعدادات في localStorage
   */
  function saveSettingsToLocalStorage() {
    try {
      localStorage.setItem('codform_currency_settings', JSON.stringify(currencySettings));
      localStorage.setItem('codform_custom_rates', JSON.stringify(customRates));
      console.log('💾 Settings saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }
  
  /**
   * إعادة تطبيق تنسيق العملة على جميع العناصر - محسن
   */
  function reapplyCurrencyFormatting() {
    console.log('🔄 Reapplying currency formatting with current settings:', currencySettings);
    
    // التأكد من تحديث الإعدادات أولاً
    loadCustomSettings();
    
    // تحديد العناصر بدقة أكبر
    const selectors = {
      cartSummary: [
        '.cart-summary-field [data-amount]',
        '.cart-summary-field .summary-value',
        '.subtotal-value', '.discount-value', '.shipping-value', '.total-value',
        '[class*="cart-summary"] [class*="price"]',
        '[class*="cart-summary"] [class*="amount"]'
      ],
      quantityOffers: [
        '[id*="quantity-offers"] [style*="color: #059669"]',
        '[id*="quantity-offers"] [style*="font-weight: bold"]',
        '[id*="quantity-offers"] .offer-price',
        '[id*="quantity-offers"] .original-price',
        '[id*="quantity-offers"] .discounted-price'
      ],
      general: [
        '[data-price]', '[data-amount]', 
        '.price', '.money', '.amount',
        '.codform-price', '.unit-price', '.total-price',
        '.offer-price', '.savings-amount',
        '[class*="price"]', '[class*="amount"]'
      ]
    };
    
    let totalUpdated = 0;
    
    // معالجة كل نوع من العناصر
    Object.entries(selectors).forEach(([type, typeSelectors]) => {
      console.log(`🔍 Processing ${type} elements...`);
      
      const elements = document.querySelectorAll(typeSelectors.join(', '));
      console.log(`Found ${elements.length} ${type} elements`);
      
      elements.forEach((element, index) => {
        const updated = updateElementCurrency(element, type, index);
        if (updated) totalUpdated++;
      });
    });
    
    // معالجة خاصة لعناصر محددة
    updateCartSummaryPrices();
    updateQuantityOffersPrices();
    
    // إشعار الأنظمة الأخرى
    notifySystemUpdates();
    
    console.log(`✅ Currency formatting completed: ${totalUpdated} elements updated`);
  }
  
  /**
   * تحديث عنصر واحد
   */
  function updateElementCurrency(element, type, index) {
    const originalText = element.textContent || '';
    if (!originalText.trim()) return false;
    
    // الحصول على العملة من مصادر مختلفة
    const currency = element.dataset.currency || 
                    element.getAttribute('data-currency') ||
                    (element.closest('[data-currency]')?.dataset.currency) ||
                    (element.closest('[data-form-currency]')?.dataset.formCurrency) ||
                    'MAD';
    
    console.log(`📝 Processing ${type} element ${index + 1}: "${originalText}" (currency: ${currency})`);
    
    // استخراج المبلغ بطرق مختلفة
    let amount = null;
    
    // محاولة 1: من data-amount
    if (element.dataset.amount) {
      amount = parseFloat(element.dataset.amount);
    }
    
    // محاولة 2: استخراج من النص
    if (amount === null || isNaN(amount)) {
      const priceMatches = originalText.match(/(\d+(?:[.,]\d+)?)/g);
      if (priceMatches && priceMatches.length > 0) {
        // أخذ أكبر رقم (عادة يكون السعر الرئيسي)
        amount = Math.max(...priceMatches.map(p => parseFloat(p.replace(',', '.'))));
      }
    }
    
    if (amount && !isNaN(amount) && amount > 0) {
      const formattedPrice = formatCurrency(amount, currency);
      
      if (originalText !== formattedPrice) {
        // الحفاظ على التنسيق الخاص (مثل علامة الناقص للخصم)
        let finalText = formattedPrice;
        if (originalText.includes('-') && !formattedPrice.includes('-')) {
          finalText = `-${formattedPrice}`;
        }
        
        element.textContent = finalText;
        console.log(`💰 Updated ${type}: "${originalText}" → "${finalText}"`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * تحديث أسعار Cart Summary تحديداً - محسن
   */
  function updateCartSummaryPrices() {
    console.log('🛒 Updating Cart Summary prices specifically...');
    
    // البحث عن عناصر Cart Summary بطرق مختلفة
    const cartSelectors = [
      '.cart-summary-field',
      '[class*="cart-summary"]',
      '[id*="cart-summary"]',
      '[data-field-type="cart_summary"]'
    ];
    
    cartSelectors.forEach(selector => {
      const cartElements = document.querySelectorAll(selector);
      
      cartElements.forEach(field => {
        // الحصول على العملة من مصادر مختلفة
        const currency = field.dataset.currency || 
                        field.dataset.formCurrency ||
                        field.closest('[data-currency]')?.dataset.currency ||
                        field.closest('[data-form-currency]')?.dataset.formCurrency ||
                        'MAD';
        
        console.log(`🔍 Processing cart summary field with currency: ${currency}`);
        
        // البحث عن عناصر القيم
        const valueSelectors = [
          '.summary-value',
          '[data-amount]',
          '[class*="price"]',
          '[class*="amount"]',
          '[class*="value"]'
        ];
        
        valueSelectors.forEach(valueSelector => {
          const valueElements = field.querySelectorAll(valueSelector);
          
          valueElements.forEach(valueElement => {
            updateCartValueElement(valueElement, currency);
          });
        });
      });
    });
  }
  
  /**
   * تحديث عنصر قيمة في Cart Summary
   */
  function updateCartValueElement(valueElement, currency) {
    // الحصول على المبلغ من مصادر مختلفة
    let amount = null;
    
    if (valueElement.dataset.amount) {
      amount = parseFloat(valueElement.dataset.amount);
    } else if (valueElement.dataset.price) {
      amount = parseFloat(valueElement.dataset.price);
    } else {
      // استخراج من النص
      const text = valueElement.textContent || '';
      const match = text.match(/(\d+(?:[.,]\d+)?)/);
      if (match) {
        amount = parseFloat(match[1].replace(',', '.'));
      }
    }
    
    if (amount && !isNaN(amount) && amount > 0) {
      const originalText = valueElement.textContent || '';
      const formattedPrice = formatCurrency(amount, currency);
      
      // الحفاظ على العلامات الخاصة
      let finalText = formattedPrice;
      if (originalText.includes('-') && !formattedPrice.includes('-')) {
        finalText = `-${formattedPrice}`;
      }
      
      if (originalText !== finalText) {
        valueElement.textContent = finalText;
        console.log(`🛒 Updated Cart Summary value: "${originalText}" → "${finalText}"`);
      }
    }
  }
  
  /**
   * تحديث أسعار عروض الكمية تحديداً - محسن
   */
  function updateQuantityOffersPrices() {
    console.log('🎯 Updating Quantity Offers prices specifically...');
    
    // البحث عن حاويات عروض الكمية بطرق مختلفة
    const offerSelectors = [
      '[id*="quantity-offers"]',
      '[class*="quantity-offers"]',
      '[data-field-type="quantity_offers"]'
    ];
    
    offerSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      
      containers.forEach(container => {
        // الحصول على العملة
        const currency = container.dataset.currency ||
                        container.dataset.formCurrency ||
                        container.closest('[data-currency]')?.dataset.currency ||
                        container.closest('[data-form-currency]')?.dataset.formCurrency ||
                        'MAD';
        
        console.log(`🔍 Processing quantity offers container with currency: ${currency}`);
        
        // البحث عن عناصر الأسعار بطرق مختلفة
        const priceSelectors = [
          '[style*="color: #059669"]',  // الأسعار المخفضة (خضراء)
          '[style*="text-decoration: line-through"]',  // الأسعار الأصلية (مشطوبة)
          '[class*="price"]',
          '[class*="amount"]',
          '[data-price]',
          '[data-amount]'
        ];
        
        const priceElements = container.querySelectorAll(priceSelectors.join(', '));
        
        priceElements.forEach(priceElement => {
          updateQuantityOfferElement(priceElement, currency);
        });
      });
    });
  }
  
  /**
   * تحديث عنصر واحد في عروض الكمية
   */
  function updateQuantityOfferElement(priceElement, currency) {
    const originalText = priceElement.textContent || '';
    if (!originalText.trim()) return;
    
    // استخراج المبلغ
    let amount = null;
    
    if (priceElement.dataset.amount) {
      amount = parseFloat(priceElement.dataset.amount);
    } else if (priceElement.dataset.price) {
      amount = parseFloat(priceElement.dataset.price);
    } else {
      const priceMatch = originalText.match(/(\d+(?:[.,]\d+)?)/);
      if (priceMatch) {
        amount = parseFloat(priceMatch[1].replace(',', '.'));
      }
    }
    
    if (amount && !isNaN(amount) && amount > 0) {
      const formattedPrice = formatCurrency(amount, currency);
      
      // الحفاظ على التنسيق الأصلي قدر الإمكان
      let finalText;
      
      if (originalText.includes('line-through') || priceElement.style.textDecoration === 'line-through') {
        // للأسعار المشطوبة، نستبدل الرقم فقط
        finalText = originalText.replace(/\d+(?:[.,]\d+)?/, formattedPrice.replace(/[^\d.,]/g, ''));
      } else {
        // للأسعار العادية
        finalText = formattedPrice;
      }
      
      if (originalText !== finalText) {
        priceElement.textContent = finalText;
        console.log(`🎯 Updated Quantity Offer: "${originalText}" → "${finalText}"`);
      }
    }
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
        // Give precedence to in-memory (fresh) rates to avoid stale LS overriding
        customRates = { ...parsed, ...customRates };
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
   * تنسيق العملة - محسن مع debugging مفصل
   */
  function formatCurrency(amount, currencyCode, language = 'ar') {
    console.log('🔧 formatCurrency called:', { amount, currencyCode, language, currentSettings: currencySettings });
    
    // تحديث الإعدادات أولاً
    loadCustomSettings();
    
    // محاولة استخدام CurrencyService من النافذة الرئيسية
    if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
      try {
        console.log('✅ Using CurrencyService from main window');
        const result = window.CurrencyService.formatCurrency(amount, currencyCode, language);
        console.log('✅ CurrencyService result:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ Error using CurrencyService:', error);
      }
    }
    
    // محاولة استخدام CurrencyService من parent window
    if (window.parent && window.parent.CurrencyService && typeof window.parent.CurrencyService.formatCurrency === 'function') {
      try {
        console.log('✅ Using CurrencyService from parent window');
        const result = window.parent.CurrencyService.formatCurrency(amount, currencyCode, language);
        console.log('✅ Parent CurrencyService result:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ Error using parent CurrencyService:', error);
      }
    }
    
    // التنسيق المحلي كحل احتياطي
    console.log('🔄 Using local formatting with settings:', currencySettings);
    
    const formattedAmount = amount.toFixed(currencySettings.decimalPlaces);
    let symbol = currencySettings.customSymbols[currencyCode] || currencyCode;
    
    // تطبيق رموز افتراضية إضافية
    if (!currencySettings.customSymbols[currencyCode]) {
      const defaultSymbols = {
        'MAD': 'د.م',
        'USD': '$',
        'EUR': '€',
        'SAR': 'ر.س',
        'AED': 'د.إ'
      };
      symbol = defaultSymbols[currencyCode] || currencyCode;
    }
    
    let result;
    if (currencySettings.showSymbol) {
      if (currencySettings.symbolPosition === 'before') {
        result = `${symbol}${formattedAmount}`;
      } else {
        result = `${formattedAmount} ${symbol}`;
      }
    } else {
      result = `${formattedAmount} ${currencyCode}`;
    }
    
    console.log(`🎨 Final formatted result: "${result}"`);
    return result;
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
  
  // ✅ إزالة التحميل الدوري المتضارب نهائياً
  // سبب المشكلة: التحميل التلقائي كان يعيد تطبيق MAD كل 10 ثوان
  console.log('🚫 Automatic periodic reloading disabled to prevent currency conflicts');
  
  console.log('📋 Codform Currency Manager loaded with enhanced debugging');
})();