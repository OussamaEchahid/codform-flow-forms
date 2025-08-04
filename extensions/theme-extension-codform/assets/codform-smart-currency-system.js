/**
 * CODFORM SMART CURRENCY SYSTEM - النظام الذكي للعملات
 * يقرأ إعدادات العملة من قاعدة البيانات ويطبقها بذكاء
 */

(function() {
  'use strict';

  // ✅ إعدادات ثابتة للتحويل - محدثة بعملات عالمية
  const EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.79,
    'SAR': 3.75,
    'MAD': 10.0,
    'AED': 3.67,
    'EGP': 30.85,
    'CAD': 1.35,
    'AUD': 1.52,
    'JPY': 110.0,
    'CHF': 0.92,
    'CNY': 6.45,
    'INR': 74.5,
    'BRL': 5.2,
    'RUB': 75.0,
    'TRY': 8.5,
    'KRW': 1180.0,
    'SGD': 1.35,
    'HKD': 7.8,
    'NOK': 8.6,
    'SEK': 8.9,
    'DKK': 6.3,
    'PLN': 3.9,
    'CZK': 21.5,
    'HUF': 295.0,
    'ILS': 3.2,
    'ZAR': 14.8,
    'MXN': 20.1,
    'THB': 33.2,
    'MYR': 4.15,
    'IDR': 14250.0,
    'PHP': 50.5,
    'VND': 22800.0
  };

  const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'SAR': 'ر.س',
    'MAD': 'د.م',
    'AED': 'د.إ',
    'EGP': 'ج.م',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹',
    'BRL': 'R$',
    'RUB': '₽',
    'TRY': '₺',
    'KRW': '₩',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NOK': 'kr',
    'SEK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'ILS': '₪',
    'ZAR': 'R',
    'MXN': '$',
    'THB': '฿',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫'
  };

  /**
   * النظام الذكي لإدارة العملات
   */
  class SmartCurrencySystem {
    constructor() {
      this.currentCurrency = null;
      this.displaySettings = null;
      this.customSymbols = {};
      this.isInitialized = false;
      this.formId = null;
      this.shopId = null;
    }

    /**
     * تهيئة النظام بناءً على معرف النموذج والمتجر
     */
    async initialize(formId, shopId) {
      console.log('🔄 Smart Currency System: Initializing...');
      
      this.formId = formId;
      this.shopId = shopId;

      try {
        // ✅ الخطوة 1: قراءة إعدادات النموذج
        const formCurrency = await this.getFormCurrency();
        
        // ✅ الخطوة 2: قراءة إعدادات العرض
        const displaySettings = await this.getDisplaySettings();
        
        // ✅ الخطوة 3: تطبيق الإعدادات
        this.currentCurrency = formCurrency;
        this.displaySettings = displaySettings;
        
        console.log(`✅ Smart Currency: Using ${this.currentCurrency} with settings:`, this.displaySettings);
        
        this.isInitialized = true;
        
        // ✅ الخطوة 4: تطبيق العملة على جميع العناصر
        this.applyToAllElements();
        
        // ✅ الخطوة 5: بدء المراقبة
        this.startMonitoring();
        
        return true;
      } catch (error) {
        console.error('❌ Smart Currency initialization failed:', error);
        return false;
      }
    }

    /**
     * قراءة عملة النموذج من قاعدة البيانات
     */
    async getFormCurrency() {
      if (!this.formId) {
        console.log('⚠️ No form ID, using USD as default');
        return 'USD';
      }

      try {
        // استدعاء API للحصول على بيانات النموذج مع shop parameter
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-default?form_id=${this.formId}&shop=${encodeURIComponent(this.shopId || 'astrem.myshopify.com')}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.form && data.form.currency) {
            console.log(`📋 Form currency from DB: ${data.form.currency}`);
            return data.form.currency;
          }
        }
      } catch (error) {
        console.log('⚠️ Could not fetch form currency, using USD');
      }

      return 'USD';
    }

    /**
     * قراءة إعدادات العرض من قاعدة البيانات
     */
    async getDisplaySettings() {
      if (!this.shopId) {
        return this.getDefaultDisplaySettings();
      }

      try {
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/currency-settings?shop=${encodeURIComponent(this.shopId)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.display_settings) {
            console.log('📋 Display settings from DB:', data.display_settings);
            
            // حفظ الرموز المخصصة
            if (data.custom_symbols) {
              this.customSymbols = data.custom_symbols;
            }
            
            return {
              showSymbol: data.display_settings.show_symbol ?? true,
              symbolPosition: data.display_settings.symbol_position || 'before',
              decimalPlaces: data.display_settings.decimal_places ?? 0
            };
          }
        }
      } catch (error) {
        console.log('⚠️ Could not fetch display settings, using defaults');
      }

      return this.getDefaultDisplaySettings();
    }

    getDefaultDisplaySettings() {
      return {
        showSymbol: true,
        symbolPosition: 'before',
        decimalPlaces: 0
      };
    }

    /**
     * تنسيق العملة بناءً على الإعدادات المحفوظة
     */
    formatCurrency(amount, originalCurrency = 'USD') {
      if (!this.isInitialized) {
        return amount.toString();
      }

      // ✅ تحويل إلى العملة المطلوبة
      const convertedAmount = this.convertCurrency(amount, originalCurrency, this.currentCurrency);
      
      // ✅ تطبيق عدد المنازل العشرية بشكل صحيح
      let formattedAmount;
      
      if (this.displaySettings.decimalPlaces === 0) {
        // عدم إظهار منازل عشرية على الإطلاق
        formattedAmount = Math.round(convertedAmount).toString();
      } else {
        // تطبيق العدد المحدد من المنازل العشرية
        const roundedAmount = Math.round(convertedAmount * Math.pow(10, this.displaySettings.decimalPlaces)) / Math.pow(10, this.displaySettings.decimalPlaces);
        formattedAmount = roundedAmount.toFixed(this.displaySettings.decimalPlaces);
      }

      // ✅ إضافة رمز العملة إذا كان مطلوباً
      if (!this.displaySettings.showSymbol) {
        return formattedAmount;
      }

      const symbol = this.customSymbols[this.currentCurrency] || CURRENCY_SYMBOLS[this.currentCurrency] || this.currentCurrency;
      
      return this.displaySettings.symbolPosition === 'before' ? 
        `${symbol} ${formattedAmount}` : 
        `${formattedAmount} ${symbol}`;
    }

    /**
     * تحويل العملات
     */
    convertCurrency(amount, fromCurrency, toCurrency) {
      if (fromCurrency === toCurrency) return amount;
      
      const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
      const toRate = EXCHANGE_RATES[toCurrency] || 1;
      
      // التحويل عبر الدولار كعملة أساسية
      const usdAmount = amount / fromRate;
      return usdAmount * toRate;
    }

    /**
     * تطبيق التنسيق على جميع العناصر الموجودة
     */
    applyToAllElements() {
      console.log('🔄 Smart Currency: Applying to all elements...');
      
      // ✅ معالجة Quantity Offers
      this.updateQuantityOffers();
      
      // ✅ معالجة Cart Summary
      this.updateCartSummary();
      
      // ✅ معالجة العناصر العامة
      this.updateGeneralElements();
    }

    updateQuantityOffers() {
      // تحديث عروض الكمية الرئيسية
      document.querySelectorAll('[id^="quantity-offers-before-"]').forEach(container => {
        const offers = container.querySelectorAll('.offer-price, [data-price]');
        offers.forEach(element => {
          const amount = parseFloat(element.getAttribute('data-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
          const originalCurrency = element.getAttribute('data-currency') || 'SAR';
          
          if (!isNaN(amount)) {
            const formatted = this.formatCurrency(amount, originalCurrency);
            element.textContent = formatted;
            element.setAttribute('data-currency', this.currentCurrency);
            console.log(`💰 Updated quantity offer: ${amount} ${originalCurrency} → ${formatted}`);
          }
        });
      });

      // تحديث عروض الكمية المدمجة في النموذج
      document.querySelectorAll('.codform-quantity-offer-price, .codform-offer-price').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-original-price') || element.getAttribute('data-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
        const originalCurrency = element.getAttribute('data-original-currency') || element.getAttribute('data-currency') || 'SAR';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          console.log(`💰 Updated inline quantity offer: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });

      // تحديث جميع العناصر التي تحتوي على أسعار
      document.querySelectorAll('[data-currency-amount]').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-currency-amount'));
        const originalCurrency = element.getAttribute('data-currency') || 'SAR';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          console.log(`💰 Updated currency amount: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });
    }

    updateCartSummary() {
      document.querySelectorAll('.cart-summary-price, [data-cart-price]').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-cart-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
        const originalCurrency = element.getAttribute('data-currency') || 'SAR';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          console.log(`💰 Updated cart summary: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });
    }

    updateGeneralElements() {
      // البحث عن أي نصوص تحتوي على أسعار وتحديثها
      const priceRegex = /(\d+(?:\.\d{1,2})?)\s*(MAD|SAR|AED|USD|ر\.س|د\.م|د\.إ|\$)/g;
      
      document.querySelectorAll('*').forEach(element => {
        if (element.children.length === 0 && element.textContent.trim()) {
          const originalText = element.textContent;
          const newText = originalText.replace(priceRegex, (match, amount, currency) => {
            const numAmount = parseFloat(amount);
            let fromCurrency = currency;
            
            // تحويل الرموز إلى أكواد العملات
            if (currency === 'ر.س') fromCurrency = 'SAR';
            else if (currency === 'د.م') fromCurrency = 'MAD';
            else if (currency === 'د.إ') fromCurrency = 'AED';
            else if (currency === '$') fromCurrency = 'USD';
            
            return this.formatCurrency(numAmount, fromCurrency);
          });
          
          if (newText !== originalText) {
            element.textContent = newText;
            console.log(`🔄 Updated text: ${originalText} → ${newText}`);
          }
        }
      });
    }

    /**
     * مراقبة تغييرات DOM وتطبيق التنسيق على العناصر الجديدة
     */
    startMonitoring() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // تطبيق التنسيق على العناصر الجديدة
                setTimeout(() => this.processNewElement(node), 100);
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // ✅ تحسين المراقبة: فقط عند الحاجة بدلاً من التحديث الدوري
      // إزالة التحديث الدوري كل 5 ثوان لمنع التضارب
      console.log('🔧 Smart Currency: Optimized monitoring without periodic interference');

      console.log('👁️ Smart Currency: Monitoring started');
    }

    processNewElement(element) {
      // معالجة العناصر الجديدة
      if (element.matches && (
        element.matches('[id^="quantity-offers-before-"]') ||
        element.matches('.cart-summary-price') ||
        element.matches('[data-price]') ||
        element.matches('[data-cart-price]')
      )) {
        this.applyToAllElements();
      }
    }

    /**
     * إعادة تهيئة النظام مع عملة جديدة
     */
    changeCurrency(newCurrency) {
      console.log(`🔄 Smart Currency: Changing to ${newCurrency}`);
      this.currentCurrency = newCurrency;
      this.applyToAllElements();
    }

    /**
     * الحصول على العملة الحالية
     */
    getCurrentCurrency() {
      return this.currentCurrency;
    }
  }

  // ✅ إنشاء النظام الذكي
  const smartCurrencySystem = new SmartCurrencySystem();

  // ✅ تصدير النظام للاستخدام العام
  window.CodformSmartCurrency = {
    initialize: (formId, shopId) => smartCurrencySystem.initialize(formId, shopId),
    formatCurrency: (amount, currency) => smartCurrencySystem.formatCurrency(amount, currency),
    changeCurrency: (currency) => smartCurrencySystem.changeCurrency(currency),
    getCurrentCurrency: () => smartCurrencySystem.getCurrentCurrency(),
    system: smartCurrencySystem
  };

  console.log('✅ Smart Currency System loaded');

})();