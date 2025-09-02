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

  // ✅ CRITICAL FIX: إجبار تحديث GBP من 0.75 إلى 0.79
  try {
    const savedRates = localStorage.getItem('codform_custom_currency_rates');
    if (savedRates) {
      const rates = JSON.parse(savedRates);
      let updated = false;

      // فحص وتحديث جميع المعدلات التي تحتوي على 0.75
      Object.keys(rates).forEach(code => {
        if (rates[code] && typeof rates[code] === 'object' && rates[code].rate === 0.75 && code === 'GBP') {
          console.log(`🔧 FORCE UPDATE: Updating ${code} from 0.75 to 0.79`);
          rates[code].rate = 0.79;
          rates[code].updatedAt = new Date().toISOString();
          updated = true;
        } else if (typeof rates[code] === 'number' && rates[code] === 0.75 && code === 'GBP') {
          console.log(`🔧 FORCE UPDATE: Updating ${code} from 0.75 to 0.79`);
          rates[code] = 0.79;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('codform_custom_currency_rates', JSON.stringify(rates));
        console.log('✅ GBP rate force updated to 0.79');
      }
    }
  } catch (error) {
    console.error('❌ Error force updating GBP rate:', error);
  }

  // =================== الإعدادات الثابتة ===================
  
  const UNIFIED_EXCHANGE_RATES = {
    // العملات الرئيسية
    'USD': 1.0000, 'EUR': 0.9200, 'GBP': 0.7900, 'JPY': 149.0000, 'CNY': 7.2400,
    'INR': 83.0000, 'RUB': 92.5000, 'AUD': 1.5700, 'CAD': 1.4300, 'CHF': 0.8900,
    'HKD': 7.8000, 'SGD': 1.3500, 'KRW': 1345.0000, 'NZD': 1.6900,

    // عملات الشرق الأوسط
    'SAR': 3.7500, 'AED': 3.6700, 'QAR': 3.6400, 'KWD': 0.3100, 'BHD': 0.3800,
    'OMR': 0.3800, 'EGP': 30.8500, 'JOD': 0.7100, 'ILS': 3.6700, 'IRR': 42100.0000,
    'IQD': 1310.0000, 'TRY': 34.1500, 'LBP': 89500.0000, 'SYP': 13000.0000, 'YER': 250.0000,

    // عملات أفريقيا
    'MAD': 10.0000, 'XOF': 655.9600, 'XAF': 655.9600, 'NGN': 1675.0000, 'ZAR': 18.4500,
    'KES': 130.5000, 'GHS': 15.8500, 'ETB': 125.5000, 'TZS': 2515.0000, 'UGX': 3785.0000,
    'ZMW': 27.8500, 'RWF': 1385.0000,

    // عملات آسيا
    'IDR': 15850.0000, 'PKR': 280.0000, 'BDT': 110.0000, 'LKR': 300.0000, 'NPR': 133.0000,
    'BTN': 83.0000, 'MMK': 2100.0000, 'KHR': 4100.0000, 'LAK': 20000.0000, 'VND': 24000.0000,
    'THB': 36.0000, 'MYR': 4.7000, 'PHP': 56.0000,

    // عملات أمريكا اللاتينية
    'MXN': 20.1500, 'BRL': 6.0500, 'ARS': 1005.5000, 'CLP': 975.2000, 'COP': 4285.5000,
    'PEN': 3.7500, 'VES': 36500000.0000, 'UYU': 40.2500
  };

  const CURRENCY_SYMBOLS = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'MAD': 'د.م',
    'AED': 'د.إ', 'EGP': 'ج.م', 'CAD': 'C$', 'AUD': 'A$', 'JPY': '¥',
    'INR': '₹', 'IDR': 'Rp', 'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': '₨',
    'BTN': 'Nu.', 'MMK': 'K', 'KHR': '៛', 'LAK': '₭', 'VND': '₫', 'THB': '฿',
    'MYR': 'RM', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'CNY': '¥',
    'XOF': 'CFA', 'XAF': 'FCFA'
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
        if (this.shopId && !this.shopId.includes('.myshopify.com')) {
          this.shopId = `${this.shopId}.myshopify.com`;
        }
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
        const sid = (this.shopId && this.shopId.includes('.myshopify.com')) ? this.shopId : `${this.shopId}.myshopify.com`;
        const response = await fetch(
          `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${encodeURIComponent(sid)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
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
      
      // ✅ CRITICAL FIX: فصل السعر الحقيقي عن طريقة العرض
      // لا نقوم بتقريب السعر الحقيقي، فقط نغير طريقة العرض
      const formattedAmount = this.settings.decimalPlaces === 0 ?
        Math.round(convertedAmount).toString() :
        convertedAmount.toFixed(this.settings.decimalPlaces);

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
      
      const rates = { ...UNIFIED_EXCHANGE_RATES, ...this.customRates };
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

      // 🔧 FIX: استخدام المتجر الحقيقي بدلاً من default-shop
      return 'astrem.myshopify.com';
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