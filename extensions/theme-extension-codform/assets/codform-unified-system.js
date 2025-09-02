/**
 * CODFORM UNIFIED SYSTEM
 * نظام موحد يربط بين جميع المكونات لحل مشكلة التضارب في العملات
 */

(function() {
  'use strict';

  // ✅ إيقاف السجلات المزعجة
  const ENABLE_DEBUG_LOGS = false;
  
  function debugLog(message, data = null) {
    if (ENABLE_DEBUG_LOGS) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * نظام إدارة العملة الموحد
   */
  class UnifiedCurrencySystem {
    constructor() {
      this.isInitialized = false;
      this.currentSettings = null;
      this.updateListeners = [];
      this.initializationPromise = null;
    }

    async initialize() {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }

      this.initializationPromise = this._doInitialize();
      return this.initializationPromise;
    }

    async _doInitialize() {
      if (this.isInitialized) return;

      try {
        debugLog('🔄 Initializing Unified Currency System...');
        
        // الحصول على shop ID
        const shopId = this._getShopId();
        if (!shopId) {
          debugLog('⚠️ No shop ID found, using default settings');
          this._useDefaultSettings();
          return;
        }

        // تحميل الإعدادات من API
        await this._loadSettingsFromAPI(shopId);
        
        this.isInitialized = true;
        debugLog('✅ Unified Currency System initialized');
        
        // إشعار المستمعين
        this._notifyListeners();

      } catch (error) {
        debugLog('❌ Error initializing currency system:', error);
        this._useDefaultSettings();
      }
    }

    _getShopId() {
      // البحث في عدة مصادر للعثور على shop ID
      const sources = [
        () => (window.Shopify && (window.Shopify.shop || window.Shopify.shop_domain)),
        () => window.shop,
        () => document.body.getAttribute('data-shop'),
        () => localStorage.getItem('shopify_shop_domain') || localStorage.getItem('current_shopify_store'),
        () => this._extractFromHostname()
      ];

      for (const source of sources) {
        try {
          const shopId = source();
          if (shopId && typeof shopId === 'string') {
            return shopId.replace('.myshopify.com', '');
          }
        } catch (e) {
          // تجاهل الأخطاء والمتابعة للمصدر التالي
        }
      }

      return null;
    }

    _extractFromHostname() {
      if (window.location.hostname.includes('.myshopify.com')) {
        return window.location.hostname.split('.')[0];
      }
      return null;
    }

    async _loadSettingsFromAPI(shopId) {
      try {
        const response = await fetch(
          `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${encodeURIComponent(shopId + '.myshopify.com')}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.display_settings) {
          this.currentSettings = {
            showSymbol: data.display_settings.show_symbol ?? true,
            symbolPosition: data.display_settings.symbol_position || 'before',
            decimalPlaces: data.display_settings.decimal_places ?? 1,
            customSymbols: data.custom_symbols || {},
            customRates: data.custom_rates || {}
          };
          
          debugLog('✅ Settings loaded from API:', this.currentSettings);
          
          // ✅ حفظ الإعدادات في localStorage للاستخدام الفوري
          this._saveToLocalStorage();
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        debugLog('❌ Failed to load settings from API:', error);
        this._useDefaultSettings();
      }
    }

    _useDefaultSettings() {
      this.currentSettings = {
        showSymbol: true,
        symbolPosition: 'before',
        decimalPlaces: 1,
        customSymbols: {
          'SAR': 'ر.س',
          'USD': '$',
          'MAD': 'د.م',
          'AED': 'د.إ'
        },
        customRates: {
          'USD': 1.0,
          'SAR': 3.75,
          'MAD': 10.0,
          'AED': 3.67
        }
      };
      this.isInitialized = true;
      this._saveToLocalStorage();
    }

    /**
     * حفظ الإعدادات في localStorage
     */
    _saveToLocalStorage() {
      try {
        const settings = {
          currency: this.getPreferredCurrency(),
          exchangeRates: this.currentSettings.customRates,
          displaySettings: {
            showSymbol: this.currentSettings.showSymbol,
            symbolPosition: this.currentSettings.symbolPosition,
            decimalPlaces: this.currentSettings.decimalPlaces
          },
          customSymbols: this.currentSettings.customSymbols
        };
        
        localStorage.setItem('codform_currency_settings', JSON.stringify(settings));
        debugLog('💾 Settings saved to localStorage:', settings);
      } catch (error) {
        debugLog('❌ Error saving to localStorage:', error);
      }
    }

  /**
   * تحديد العملة المفضلة للنظام
   */
  getPreferredCurrency() {
    // ✅ القوة الكاملة للنظام الموحد - لا نقبل تغييرات خارجية
    const forcedCurrency = localStorage.getItem('codform_forced_currency');
    if (forcedCurrency) {
      debugLog(`🔒 Using forced currency: ${forcedCurrency}`);
      return forcedCurrency;
    }

    // ✅ الأولوية للإعدادات المحفوظة في API
    if (this.isInitialized && this.currentSettings && this.currentSettings.preferredCurrency) {
      return this.currentSettings.preferredCurrency;
    }

    // الافتراضي
    return 'USD';
  }

  /**
   * فرض عملة معينة (تجاهل جميع المصادر الأخرى)
   */
  forceCurrency(currencyCode) {
    debugLog(`🔒 FORCING currency to: ${currencyCode}`);
    localStorage.setItem('codform_forced_currency', currencyCode);
    
    // تحديث الحالة
    if (this.currentSettings) {
      this.currentSettings.preferredCurrency = currencyCode;
    }
    
    // إشعار جميع المستمعين بالتغيير
    this._notifyListeners();
    
    // تحديث جميع العناصر فوراً
    this.refreshAllComponents();
  }

  /**
   * تنسيق العملة الموحد مع فرض العملة المفضلة
   */
  formatCurrency(amount, originalCurrency, language = 'ar') {
    const preferredCurrency = this.getPreferredCurrency();

    // ✅ تحويل إلى العملة المفضلة دائماً
    const convertedAmount = this.convertCurrency(amount, originalCurrency, preferredCurrency);

    const rtl = (language === 'ar') || (typeof document !== 'undefined' && document.documentElement && document.documentElement.dir === 'rtl');

    // ✅ Use the centralized CurrencyManager if available to keep one source of truth
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
      try {
        return window.CodformCurrencyManager.formatCurrency(convertedAmount, preferredCurrency, language);
      } catch (e) {
        // fall back to local formatting below
        console.warn('UnifiedSystem: CurrencyManager.formatCurrency failed, falling back', e);
      }
    }

    if (!this.isInitialized || !this.currentSettings) {
      // استخدام تنسيق أساسي إذا لم يتم التهيئة بعد
      const symbol = preferredCurrency === 'SAR' ? 'ر.س' :
                     preferredCurrency === 'USD' ? '$' :
                     preferredCurrency === 'MAD' ? 'د.م' :
                     preferredCurrency === 'AED' ? 'د.إ' : preferredCurrency;
      const base = `${Math.round(convertedAmount)} ${symbol}`;
      return rtl ? `\u2066${base}\u2069` : base;
    }

    const settings = this.currentSettings;
    const symbol = settings.customSymbols[preferredCurrency] || preferredCurrency;

    // ✅ CRITICAL FIX: فصل السعر الحقيقي عن طريقة العرض
    // لا نقوم بتقريب السعر الحقيقي، فقط نغير طريقة العرض
    const formattedAmount = settings.decimalPlaces === 0 ?
      Math.round(convertedAmount).toString() :
      convertedAmount.toFixed(settings.decimalPlaces);

    // تطبيق موضع الرمز
    let result;
    if (settings.showSymbol) {
      result = settings.symbolPosition === 'before' ? `${symbol} ${formattedAmount}` : `${formattedAmount} ${symbol}`;
    } else {
      result = formattedAmount;
    }
    // ✅ ضمان اتجاه LTR للمبالغ حتى في صفحات RTL لمنع انقلاب الترتيب
    return rtl ? `\u2066${result}\u2069` : result;
  }

  /**
   * تحويل العملات
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // ✅ استخدام معدلات التحويل الحقيقية من CurrencyManager أولاً
    let exchangeRates = {};
    
    // محاولة الحصول على المعدلات من CurrencyManager
    if (window.CodformCurrencyManager && window.CodformCurrencyManager.getRates) {
      const currencyManagerRates = window.CodformCurrencyManager.getRates();
      if (currencyManagerRates && Object.keys(currencyManagerRates).length > 0) {
        exchangeRates = currencyManagerRates;
        debugLog('🔄 Using CurrencyManager rates:', exchangeRates);
      }
    }
    
    // إذا لم نحصل على معدلات من CurrencyManager، استخدم المعدلات المحفوظة
    if (Object.keys(exchangeRates).length === 0) {
      exchangeRates = this.currentSettings?.customRates || {};
    }
    
    // إضافة المعدلات الافتراضية للعملات غير المتوفرة
    const defaultRates = {
      'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'SAR': 3.75, 'MAD': 15, 'AED': 3.67, 'EGP': 30.85,
      'CAD': 1.43, 'AUD': 1.57, 'JPY': 149, 'CHF': 0.89, 'CNY': 7.24, 'INR': 83.12, 'BRL': 6.05,
      'RUB': 92.5, 'TRY': 34.15, 'KRW': 1345, 'SGD': 1.35, 'HKD': 7.8, 'NOK': 10.85, 'SEK': 10.62,
      'DKK': 6.89, 'PLN': 4.12, 'CZK': 22.85, 'HUF': 365, 'ILS': 3.67, 'ZAR': 18.45, 'MXN': 20.15,
      'THB': 35.2, 'MYR': 4.68, 'IDR': 15850, 'PHP': 56.2, 'VND': 24350, 'QAR': 3.64, 'KWD': 0.31,
      'BHD': 0.38, 'OMR': 0.38, 'JOD': 0.71, 'LBP': 89500, 'TND': 3.15, 'DZD': 134.25, 'IQD': 1310,
      'IRR': 42100, 'SYP': 13000, 'YER': 250, 'NGN': 1675, 'KES': 130.5, 'GHS': 15.85, 'ETB': 125.5,
      'TZS': 2515, 'UGX': 3785, 'ZWL': 322, 'ZMW': 27.85, 'RWF': 1385, 'XOF': 655.96, 'XAF': 655.96,
      'ARS': 1005.5, 'CLP': 975.2, 'COP': 4285.5, 'PEN': 3.75, 'VES': 36500000, 'UYU': 40.25
    };
    
    // دمج المعدلات المخصصة مع الافتراضية (المخصصة لها الأولوية)
    exchangeRates = { ...defaultRates, ...exchangeRates };
    
    // التحويل عبر الدولار كعملة أساسية
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  /**
   * تحديث جميع المكونات
   */
  refreshAllComponents() {
    debugLog('🔄 Refreshing all components with unified currency...');
    // استدعاء الدوال المعرفة خارج الـ class
    setTimeout(() => {
      updateQuantityOffersWithUnifiedSystem();
      updateCartSummaryWithUnifiedSystem();
      updateCartItemsWithUnifiedSystem();
      updateGeneralElementsWithUnifiedSystem();
    }, 100);
  }

    /**
     * الاشتراك في تحديثات الإعدادات
     */
    subscribe(listener) {
      this.updateListeners.push(listener);
      
      // إذا تم التهيئة بالفعل، استدعاء المستمع فوراً
      if (this.isInitialized) {
        setTimeout(() => listener(this.currentSettings), 0);
      }

      // إرجاع دالة إلغاء الاشتراك
      return () => {
        const index = this.updateListeners.indexOf(listener);
        if (index > -1) {
          this.updateListeners.splice(index, 1);
        }
      };
    }

    _notifyListeners() {
      this.updateListeners.forEach(listener => {
        try {
          listener(this.currentSettings);
        } catch (error) {
          debugLog('❌ Error in currency settings listener:', error);
        }
      });
    }

    getSettings() {
      return this.currentSettings;
    }
  }

  /**
   * إنشاء نسخة واحدة من النظام الموحد
   */
  const unifiedSystem = new UnifiedCurrencySystem();

  /**
   * تحديث Quantity Offers لاستخدام النظام الموحد
   */
  function updateQuantityOffersWithUnifiedSystem() {
    debugLog('🔄 Updating Quantity Offers with unified system...');
    
    // البحث عن جميع العروض المعروضة
    document.querySelectorAll('[id^="quantity-offers-before-"]').forEach(container => {
      if (container.children.length > 0) {
        debugLog('🔄 Found quantity offers container, updating...');
        
        // إعادة تطبيق تنسيق العملة على كل عنصر سعر
        container.querySelectorAll('[data-price]').forEach(priceElement => {
          const amount = parseFloat(priceElement.getAttribute('data-price'));
          const currency = priceElement.getAttribute('data-currency') || 'SAR';
          
          if (!isNaN(amount)) {
            const formattedPrice = unifiedSystem.formatCurrency(amount, currency);
            priceElement.textContent = formattedPrice;
            debugLog(`💰 Updated price: ${amount} ${currency} → ${formattedPrice}`);
          }
        });
      }
    });
  }

  /**
   * تحديث Cart Summary لاستخدام النظام الموحد
   */
  function updateCartSummaryWithUnifiedSystem() {
    debugLog('🔄 Updating Cart Summary with unified system...');
    
    // البحث عن عناصر الأسعار في Cart Summary
    document.querySelectorAll('[data-cart-price]').forEach(priceElement => {
      const amount = parseFloat(priceElement.getAttribute('data-cart-price'));
      const currency = priceElement.getAttribute('data-currency') || 'SAR';
      
      if (!isNaN(amount)) {
        const formattedPrice = unifiedSystem.formatCurrency(amount, currency);
        priceElement.textContent = formattedPrice;
        debugLog(`💰 Updated cart price: ${amount} ${currency} → ${formattedPrice}`);
      }
    });
  }

  /**
   * تهيئة النظام الموحد وربطه بالمكونات
   */
  async function initializeUnifiedSystem() {
    debugLog('🚀 Starting unified system initialization...');
    
    // تهيئة النظام الموحد
    await unifiedSystem.initialize();
    
    // الاشتراك في تحديثات الإعدادات
    unifiedSystem.subscribe((settings) => {
      debugLog('🔄 Currency settings updated, refreshing components...');
      updateQuantityOffersWithUnifiedSystem();
      updateCartSummaryWithUnifiedSystem();
      updateCartItemsWithUnifiedSystem();
    });
    
    // تحديث المكونات فوراً
    updateQuantityOffersWithUnifiedSystem();
    updateCartSummaryWithUnifiedSystem();
    updateCartItemsWithUnifiedSystem();
    
    debugLog('✅ Unified system fully initialized and connected');
  }

  /**
   * تحديث Cart Items لاستخدام النظام الموحد
   */
  function updateCartItemsWithUnifiedSystem() {
    debugLog('🔄 Updating Cart Items with unified system...');
    
    // البحث عن عناصر الأسعار في Cart Items
    document.querySelectorAll('.codform-cart-items .cart-items-price').forEach(priceElement => {
      const cartContainer = priceElement.closest('.codform-cart-items');
      const quantityElement = cartContainer?.querySelector('.cart-items-quantity');
      const quantity = quantityElement ? parseInt(quantityElement.textContent || '1') : 1;
      
      // الحصول على السعر الأصلي من عدة مصادر
      const originalPrice = window.CodformProductData?.price || 
                           window.cachedProductPrice || 
                           parseFloat(priceElement.getAttribute('data-base-price')) || 
                           29.99;
      const originalCurrency = window.CodformProductData?.currency || 
                              window.cachedCurrency || 
                              priceElement.getAttribute('data-base-currency') || 
                              'SAR';
      
      if (!isNaN(originalPrice)) {
        const totalPrice = originalPrice * quantity;
        const formattedPrice = unifiedSystem.formatCurrency(totalPrice, originalCurrency);
        
        priceElement.textContent = formattedPrice;
        priceElement.setAttribute('data-currency', unifiedSystem.getPreferredCurrency());
        priceElement.setAttribute('data-base-price', originalPrice.toString());
        priceElement.setAttribute('data-base-currency', originalCurrency);
        
        debugLog(`💰 Updated cart items price: ${originalPrice} x ${quantity} = ${totalPrice} ${originalCurrency} → ${formattedPrice}`);
      }
    });
  }

  /**
   * تحديث العناصر العامة
   */
  function updateGeneralElementsWithUnifiedSystem() {
    debugLog('🔄 Updating general elements with unified system...');
    
    // البحث عن جميع عناصر الأسعار العامة
    document.querySelectorAll('[data-codform-price]').forEach(element => {
      const amount = parseFloat(element.getAttribute('data-amount'));
      const currency = element.getAttribute('data-original-currency') || 'USD';
      
      if (!isNaN(amount)) {
        const formattedPrice = unifiedSystem.formatCurrency(amount, currency);
        element.textContent = formattedPrice;
        debugLog(`💰 Updated general price: ${amount} ${currency} → ${formattedPrice}`);
      }
    });
  }

  // تصدير النظام الموحد
  window.CodformUnifiedSystem = {
    initialize: initializeUnifiedSystem,
    formatCurrency: (amount, currency) => unifiedSystem.formatCurrency(amount, currency),
    convertCurrency: (amount, fromCurrency, toCurrency) => unifiedSystem.convertCurrency(amount, fromCurrency, toCurrency),
    subscribe: (listener) => unifiedSystem.subscribe(listener),
    getSettings: () => unifiedSystem.getSettings(),
    getPreferredCurrency: () => unifiedSystem.getPreferredCurrency(),
    forceCurrency: (currency) => {
      debugLog(`🔒 Forcing currency to ${currency} via API`);
      unifiedSystem.forceCurrency(currency);
    },
    updateQuantityOffers: updateQuantityOffersWithUnifiedSystem,
    updateCartSummary: updateCartSummaryWithUnifiedSystem,
    updateCartItems: updateCartItemsWithUnifiedSystem,
    updateGeneralElements: updateGeneralElementsWithUnifiedSystem,
    refreshAll: () => unifiedSystem.refreshAllComponents(),
    updateAllElements: () => {
      updateQuantityOffersWithUnifiedSystem();
      updateCartSummaryWithUnifiedSystem();
      updateCartItemsWithUnifiedSystem();
      updateGeneralElementsWithUnifiedSystem();
    }
  };

  // تهيئة تلقائية
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnifiedSystem);
  } else {
    initializeUnifiedSystem();
  }

  debugLog('✅ Unified Currency System loaded and ready');

})();