/**
 * CODFORM ULTIMATE CURRENCY SYSTEM
 * النظام النهائي والموحد لإدارة العملات
 * - نظام واحد موحد بدون تضارب
 * - تحديث فوري وموثوق
 * - تطبيق شامل على جميع العناصر
 * - إعدادات افتراضية ثابتة
 */

(function() {
  'use strict';

  // =================== الإعدادات الثابتة ===================
  
  const EXCHANGE_RATES = {
    'USD': 1.0, 'EUR': 0.85, 'GBP': 0.79, 'SAR': 3.75, 'MAD': 10.0,
    'AED': 3.67, 'EGP': 30.85, 'CAD': 1.35, 'AUD': 1.52, 'JPY': 110.0
  };

  const CURRENCY_SYMBOLS = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'MAD': 'د.م',
    'AED': 'د.إ', 'EGP': 'ج.م', 'CAD': 'C$', 'AUD': 'A$', 'JPY': '¥'
  };

  const DEFAULT_SETTINGS = {
    showSymbol: true,
    symbolPosition: 'before',
    decimalPlaces: 2,
    currentCurrency: 'SAR'
  };

  // =================== النظام الرئيسي ===================

  class UltimateCurrencySystem {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.customSymbols = {};
      this.customRates = {};
      this.isInitialized = false;
      this.shopId = null;
      this.updateQueue = [];
      this.isUpdating = false;
      this.updateListeners = [];
      
      console.log('🚀 Ultimate Currency System: Starting...');
    }

    // =============== التهيئة الرئيسية ===============
    
    async initialize(shopId = null) {
      try {
        this.shopId = shopId || this._detectShopId();
        console.log(`🔄 Initializing Ultimate Currency for shop: ${this.shopId}`);

        // تحميل الإعدادات من المخدم
        await this._loadSettings();
        
        // تطبيق فوري على جميع العناصر
        this._applyToAllElements();
        
        // بدء المراقبة
        this._startMonitoring();
        
        // تسجيل كونه النظام الرئيسي
        this._registerAsMainSystem();
        
        this.isInitialized = true;
        console.log('✅ Ultimate Currency System: Fully initialized');
        
        return true;
      } catch (error) {
        console.error('❌ Ultimate Currency initialization failed:', error);
        this._useDefaultSettings();
        return false;
      }
    }

    // =============== إدارة الإعدادات ===============
    
    async _loadSettings() {
      if (!this.shopId) {
        console.log('⚠️ No shop ID, using defaults');
        return;
      }

      try {
        const response = await fetch(
          `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shopId=${encodeURIComponent(this.shopId)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📥 Loaded settings from server:', data);
          
          if (data.success && data.display_settings) {
            this.settings = {
              showSymbol: data.display_settings.show_symbol !== false,
              symbolPosition: data.display_settings.symbol_position || 'before',
              decimalPlaces: data.display_settings.decimal_places || 2,
              currentCurrency: this.settings.currentCurrency // الحفاظ على العملة الحالية
            };
            
            this.customSymbols = data.custom_symbols || {};
            this.customRates = data.custom_rates || {};
            
            console.log('✅ Settings updated:', this.settings);
            this._notifyListeners();
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load settings from server:', error);
      }
    }

    async saveSettings() {
      if (!this.shopId) return false;

      try {
        const response = await fetch(
          'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/save-currency-settings',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              shop_id: this.shopId,
              display_settings: {
                show_symbol: this.settings.showSymbol,
                symbol_position: this.settings.symbolPosition,
                decimal_places: this.settings.decimalPlaces
              },
              custom_symbols: this.customSymbols,
              custom_rates: this.customRates
            })
          }
        );

        if (response.ok) {
          console.log('✅ Settings saved to server');
          // تطبيق فوري للتغييرات
          this._applyToAllElements();
          this._notifyListeners();
          return true;
        }
      } catch (error) {
        console.error('❌ Error saving settings:', error);
      }
      
      return false;
    }

    // =============== تنسيق العملة ===============
    
    formatCurrency(amount, originalCurrency = 'SAR') {
      if (!amount || isNaN(amount)) return '0';

      // تحويل العملة
      const convertedAmount = this.convertCurrency(amount, originalCurrency, this.settings.currentCurrency);
      
      // تطبيق المنازل العشرية
      const roundedAmount = this.settings.decimalPlaces === 0 ? 
        Math.round(convertedAmount) : 
        parseFloat(convertedAmount.toFixed(this.settings.decimalPlaces));
      
      const formattedAmount = this.settings.decimalPlaces === 0 ? 
        roundedAmount.toString() : 
        roundedAmount.toFixed(this.settings.decimalPlaces);

      // إضافة الرمز إذا مطلوب
      if (!this.settings.showSymbol) {
        return formattedAmount;
      }

      const symbol = this.customSymbols[this.settings.currentCurrency] || 
                    CURRENCY_SYMBOLS[this.settings.currentCurrency] || 
                    this.settings.currentCurrency;

      return this.settings.symbolPosition === 'before' ? 
        `${symbol} ${formattedAmount}` : 
        `${formattedAmount} ${symbol}`;
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
      if (fromCurrency === toCurrency) return amount;
      
      const rates = { ...EXCHANGE_RATES, ...this.customRates };
      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;
      
      return (amount / fromRate) * toRate;
    }

    // =============== تطبيق على العناصر ===============
    
    _applyToAllElements() {
      if (this.isUpdating) {
        console.log('⚠️ Update already in progress, queuing...');
        this.updateQueue.push(() => this._applyToAllElements());
        return;
      }

      this.isUpdating = true;
      console.log('🔄 Applying currency to all elements...');

      try {
        // تحديث جميع أنواع العناصر
        this._updateQuantityOffers();
        this._updateCartSummary();
        this._updateGeneralPrices();
        this._updateFormPrices();
        
        console.log('✅ All elements updated successfully');
        
        // معالجة القائمة المعلقة
        this._processUpdateQueue();
        
      } catch (error) {
        console.error('❌ Error updating elements:', error);
      }
      
      this.isUpdating = false;
    }

    _updateQuantityOffers() {
      console.log('🎯 Updating Quantity Offers...');
      
      // العثور على جميع حاويات عروض الكمية
      const containers = document.querySelectorAll([
        '[id*="quantity-offers"]',
        '[class*="quantity-offers"]',
        '[data-offers]',
        '.offers-container'
      ].join(','));

      containers.forEach(container => {
        // العثور على عناصر الأسعار
        const priceElements = container.querySelectorAll([
          '[data-price]',
          '[data-amount]',
          '.price',
          '.offer-price',
          '.discounted-price',
          '.original-price',
          '[style*="color: #059669"]', // الأسعار الخضراء
          '[style*="text-decoration: line-through"]' // الأسعار المشطوبة
        ].join(','));

        priceElements.forEach(element => {
          this._updatePriceElement(element, 'quantity-offer');
        });

        // البحث في النصوص عن أسعار
        this._updateTextPrices(container, 'quantity-offer');
      });
    }

    _updateCartSummary() {
      console.log('🛒 Updating Cart Summary...');
      
      const summaryElements = document.querySelectorAll([
        '.cart-summary-field',
        '[class*="cart-summary"]',
        '[id*="cart-summary"]',
        '[data-field-type="cart_summary"]'
      ].join(','));

      summaryElements.forEach(summary => {
        const valueElements = summary.querySelectorAll([
          '.summary-value',
          '[data-amount]',
          '[data-cart-price]',
          '.subtotal-value',
          '.discount-value',
          '.shipping-value',
          '.total-value',
          '[class*="price"]',
          '[class*="amount"]'
        ].join(','));

        valueElements.forEach(element => {
          this._updatePriceElement(element, 'cart-summary');
        });

        this._updateTextPrices(summary, 'cart-summary');
      });
    }

    _updateGeneralPrices() {
      console.log('💰 Updating General Prices...');
      
      const priceElements = document.querySelectorAll([
        '[data-codform-price]',
        '.codform-price',
        '.money',
        '[class*="price"]',
        '[data-price]',
        '[data-amount]'
      ].join(','));

      priceElements.forEach(element => {
        this._updatePriceElement(element, 'general');
      });
    }

    _updateFormPrices() {
      console.log('📋 Updating Form Prices...');
      
      // البحث في جميع النماذج
      const forms = document.querySelectorAll('form, .codform-form, [class*="form"]');
      
      forms.forEach(form => {
        this._updateTextPrices(form, 'form');
      });
    }

    _updatePriceElement(element, type) {
      if (!element || !element.textContent) return;

      const originalText = element.textContent.trim();
      if (!originalText) return;

      // الحصول على المبلغ والعملة
      let amount = null;
      let currency = 'SAR'; // افتراضي

      // محاولة 1: من الـ attributes
      if (element.dataset.amount) {
        amount = parseFloat(element.dataset.amount);
        currency = element.dataset.currency || currency;
      } else if (element.dataset.price) {
        amount = parseFloat(element.dataset.price);
        currency = element.dataset.currency || currency;
      } else {
        // محاولة 2: استخراج من النص
        const priceMatch = originalText.match(/(\d+(?:[.,]\d+)?)/);
        if (priceMatch) {
          amount = parseFloat(priceMatch[1].replace(',', '.'));
        }
      }

      if (amount && !isNaN(amount) && amount > 0) {
        const formattedPrice = this.formatCurrency(amount, currency);
        
        // الحفاظ على العلامات الخاصة
        let finalText = formattedPrice;
        if (originalText.includes('-') && !formattedPrice.includes('-')) {
          finalText = `-${formattedPrice}`;
        }

        if (originalText !== finalText) {
          element.textContent = finalText;
          
          // حفظ البيانات الأصلية
          if (!element.dataset.originalAmount) {
            element.dataset.originalAmount = amount;
            element.dataset.originalCurrency = currency;
          }
          
          console.log(`💰 Updated ${type}: "${originalText}" → "${finalText}"`);
        }
      }
    }

    _updateTextPrices(container, type) {
      const priceRegex = /(\d+(?:[.,]\d{1,2})?)\s*(MAD|SAR|AED|USD|ر\.س|د\.م|د\.إ|\$|€|£)/g;
      
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return node.parentNode.children.length === 0 ? 
              NodeFilter.FILTER_ACCEPT : 
              NodeFilter.FILTER_SKIP;
          }
        }
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (priceRegex.test(node.textContent)) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const originalText = textNode.textContent;
        const newText = originalText.replace(priceRegex, (match, amount, currency) => {
          const numAmount = parseFloat(amount.replace(',', '.'));
          let fromCurrency = currency;
          
          // تحويل الرموز إلى أكواد
          const currencyMap = {
            'ر.س': 'SAR', 'د.م': 'MAD', 'د.إ': 'AED',
            '$': 'USD', '€': 'EUR', '£': 'GBP'
          };
          
          fromCurrency = currencyMap[currency] || currency;
          
          return this.formatCurrency(numAmount, fromCurrency);
        });
        
        if (newText !== originalText) {
          textNode.textContent = newText;
          console.log(`🔄 Updated ${type} text: "${originalText}" → "${newText}"`);
        }
      });
    }

    // =============== المراقبة والتحديث التلقائي ===============
    
    _startMonitoring() {
      console.log('👁️ Starting DOM monitoring...');
      
      const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const hasPrice = node.querySelector && (
                  node.querySelector('[data-price]') ||
                  node.querySelector('[data-amount]') ||
                  node.querySelector('.price') ||
                  node.matches && (
                    node.matches('[data-price]') ||
                    node.matches('[data-amount]') ||
                    node.matches('.price')
                  )
                );
                
                if (hasPrice) {
                  needsUpdate = true;
                }
              }
            });
          }
        });
        
        if (needsUpdate) {
          // تأخير قصير لضمان استقرار DOM
          setTimeout(() => {
            console.log('🔄 DOM changed, updating currency...');
            this._applyToAllElements();
          }, 250);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // مراقبة تغييرات التخزين المحلي
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('currency')) {
          console.log('📱 Storage changed, reloading settings...');
          this._loadSettings();
        }
      });
    }

    // =============== واجهة برمجة التطبيقات العامة ===============
    
    updateSettings(newSettings) {
      console.log('🔧 Updating settings:', newSettings);
      
      this.settings = { ...this.settings, ...newSettings };
      
      // حفظ وتطبيق فوري
      this.saveSettings();
      
      console.log('✅ Settings updated and applied');
    }

    changeSymbolDisplay(show) {
      this.updateSettings({ showSymbol: show });
    }

    changeSymbolPosition(position) {
      this.updateSettings({ symbolPosition: position });
    }

    changeDecimalPlaces(places) {
      this.updateSettings({ decimalPlaces: places });
    }

    changeCurrency(currency) {
      this.updateSettings({ currentCurrency: currency });
    }

    // =============== مساعدات النظام ===============
    
    _detectShopId() {
      const sources = [
        () => window.Shopify?.shop,
        () => window.codformConfig?.shop,
        () => localStorage.getItem('current_shopify_store'),
        () => window.location.hostname.includes('.myshopify.com') ? 
             window.location.hostname : null
      ];

      for (const source of sources) {
        try {
          const shopId = source();
          if (shopId && typeof shopId === 'string') {
            return shopId.replace('.myshopify.com', '') + '.myshopify.com';
          }
        } catch (e) {}
      }

      return 'default-shop.myshopify.com';
    }

    _useDefaultSettings() {
      console.log('⚠️ Using default settings');
      this.settings = { ...DEFAULT_SETTINGS };
      this.isInitialized = true;
    }

    _processUpdateQueue() {
      if (this.updateQueue.length > 0) {
        console.log(`📋 Processing ${this.updateQueue.length} queued updates...`);
        const updates = [...this.updateQueue];
        this.updateQueue = [];
        
        setTimeout(() => {
          updates.forEach(update => update());
        }, 100);
      }
    }

    _registerAsMainSystem() {
      // تسجيل النظام كالنظام الرئيسي
      window.CODFORM_CURRENCY_SYSTEM = 'ULTIMATE';
      
      // إيقاف الأنظمة الأخرى
      if (window.CodformSmartCurrency) {
        console.log('🛑 Disabling Smart Currency System');
        window.CodformSmartCurrency.disabled = true;
      }
      
      if (window.CodformCurrencyManager) {
        console.log('🛑 Disabling Currency Manager');
        window.CodformCurrencyManager.disabled = true;
      }
      
      if (window.CodformUnifiedSystem) {
        console.log('🛑 Disabling Unified System');
        window.CodformUnifiedSystem.disabled = true;
      }
    }

    subscribe(listener) {
      this.updateListeners.push(listener);
      
      // استدعاء فوري إذا تم التهيئة
      if (this.isInitialized) {
        setTimeout(() => listener(this.settings), 0);
      }

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
          listener(this.settings);
        } catch (error) {
          console.error('❌ Error in listener:', error);
        }
      });
    }

    // =============== معلومات النظام ===============
    
    getInfo() {
      return {
        system: 'Ultimate Currency System',
        version: '1.0.0',
        initialized: this.isInitialized,
        shopId: this.shopId,
        settings: this.settings,
        customSymbols: this.customSymbols,
        customRates: this.customRates
      };
    }
  }

  // =================== التهيئة والتصدير ===================
  
  // إنشاء النسخة الوحيدة
  const ultimateSystem = new UltimateCurrencySystem();

  // تصدير النظام للاستخدام العام
  window.CodformUltimateCurrency = {
    // واجهة برمجة التطبيقات الرئيسية
    initialize: (shopId) => ultimateSystem.initialize(shopId),
    formatCurrency: (amount, currency) => ultimateSystem.formatCurrency(amount, currency),
    convertCurrency: (amount, from, to) => ultimateSystem.convertCurrency(amount, from, to),
    
    // إعدادات سريعة
    showSymbol: (show) => ultimateSystem.changeSymbolDisplay(show),
    symbolPosition: (position) => ultimateSystem.changeSymbolPosition(position),
    decimalPlaces: (places) => ultimateSystem.changeDecimalPlaces(places),
    changeCurrency: (currency) => ultimateSystem.changeCurrency(currency),
    
    // معلومات ومراقبة
    getSettings: () => ultimateSystem.settings,
    getInfo: () => ultimateSystem.getInfo(),
    subscribe: (listener) => ultimateSystem.subscribe(listener),
    
    // تحكم متقدم
    updateSettings: (settings) => ultimateSystem.updateSettings(settings),
    saveSettings: () => ultimateSystem.saveSettings(),
    refresh: () => ultimateSystem._applyToAllElements(),
    
    // الوصول للنظام الداخلي (للتطوير)
    _system: ultimateSystem
  };

  // تهيئة تلقائية عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => ultimateSystem.initialize(), 1000);
    });
  } else {
    setTimeout(() => ultimateSystem.initialize(), 1000);
  }

  console.log('🎯 Ultimate Currency System loaded and ready!');

})();