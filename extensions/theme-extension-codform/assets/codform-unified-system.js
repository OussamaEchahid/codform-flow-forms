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
        () => window.Shopify?.shop,
        () => window.shop,
        () => document.body.getAttribute('data-shop'),
        () => localStorage.getItem('shopify_shop_domain'),
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
          `https://tftklwisfteasdvdzsue.supabase.co/functions/v1/currency-settings?shop_id=${encodeURIComponent(shopId)}.myshopify.com`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
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
            decimalPlaces: data.display_settings.decimal_places ?? 0,
            customSymbols: data.custom_symbols || {},
            customRates: data.custom_rates || {}
          };
          
          debugLog('✅ Settings loaded from API:', this.currentSettings);
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
        decimalPlaces: 0,
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
    }

    /**
     * تنسيق العملة الموحد
     */
    formatCurrency(amount, currencyCode, language = 'ar') {
      if (!this.isInitialized || !this.currentSettings) {
        // استخدام تنسيق أساسي إذا لم يتم التهيئة بعد
        const symbol = currencyCode === 'SAR' ? 'ر.س' : currencyCode === 'USD' ? '$' : currencyCode;
        return `${Math.round(amount)} ${symbol}`;
      }

      const settings = this.currentSettings;
      const symbol = settings.customSymbols[currencyCode] || currencyCode;
      
      // تطبيق عدد المنازل العشرية
      const roundedAmount = Math.round(amount * Math.pow(10, settings.decimalPlaces)) / Math.pow(10, settings.decimalPlaces);
      const formattedAmount = settings.decimalPlaces === 0 ? 
        Math.round(roundedAmount).toString() : 
        roundedAmount.toFixed(settings.decimalPlaces);

      // تطبيق موضع الرمز
      if (settings.showSymbol) {
        return settings.symbolPosition === 'before' ? 
          `${symbol} ${formattedAmount}` : 
          `${formattedAmount} ${symbol}`;
      } else {
        return formattedAmount;
      }
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
    });
    
    // تحديث المكونات فوراً
    updateQuantityOffersWithUnifiedSystem();
    updateCartSummaryWithUnifiedSystem();
    
    debugLog('✅ Unified system fully initialized and connected');
  }

  // تصدير النظام الموحد
  window.CodformUnifiedSystem = {
    initialize: initializeUnifiedSystem,
    formatCurrency: (amount, currency) => unifiedSystem.formatCurrency(amount, currency),
    subscribe: (listener) => unifiedSystem.subscribe(listener),
    getSettings: () => unifiedSystem.getSettings(),
    updateQuantityOffers: updateQuantityOffersWithUnifiedSystem,
    updateCartSummary: updateCartSummaryWithUnifiedSystem
  };

  // تهيئة تلقائية
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnifiedSystem);
  } else {
    initializeUnifiedSystem();
  }

  debugLog('✅ Unified Currency System loaded and ready');

})();