/**
 * CODFORM FORCE USD SYSTEM - نظام قسري لفرض الدولار الأمريكي
 * هذا النظام يلغي تماماً جميع المصادر الخارجية ويفرض USD
 */

(function() {
  'use strict';

  // ✅ إعدادات ثابتة لا تتغير
  const FORCED_CURRENCY = 'USD';
  const EXCHANGE_RATES = {
    'USD': 1.0,
    'SAR': 3.75,
    'MAD': 10.0,
    'AED': 3.67,
    'EGP': 30.85
  };

  // ✅ منع أي استدعاءات لـ currency-settings API
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('currency-settings')) {
      console.log('🚫 BLOCKED: Currency settings API call');
      // إرجاع إعدادات ثابتة بدلاً من الاستدعاء الحقيقي
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          display_settings: {
            show_symbol: false,
            decimal_places: 0,
            symbol_position: 'before'
          },
          custom_rates: {},
          custom_symbols: {}
        })
      });
    }
    return originalFetch.apply(this, args);
  };

  /**
   * نظام تنسيق العملة المطلق
   */
  class ForceUSDSystem {
    constructor() {
      this.initialized = false;
      this.init();
    }

    init() {
      console.log('🔒 FORCE USD SYSTEM: Initializing...');
      
      // فرض USD في جميع المخازن المحتملة
      localStorage.setItem('codform_forced_currency', FORCED_CURRENCY);
      localStorage.setItem('preferred_currency', FORCED_CURRENCY);
      sessionStorage.setItem('current_currency', FORCED_CURRENCY);
      
      // إعادة كتابة جميع دوال تنسيق العملة
      this.overrideCurrencyFunctions();
      
      // تشغيل المراقب
      this.startMonitoring();
      
      this.initialized = true;
      console.log('✅ FORCE USD SYSTEM: Ready');
    }

    overrideCurrencyFunctions() {
      // ✅ إعادة كتابة CurrencyService إذا كان موجوداً
      if (window.CurrencyService) {
        const originalFormat = window.CurrencyService.formatPrice;
        window.CurrencyService.formatPrice = (amount, currency) => {
          return this.formatCurrency(amount, currency || FORCED_CURRENCY);
        };
        console.log('🔒 Overridden CurrencyService.formatPrice');
      }

      // ✅ إعادة كتابة CurrencyManager إذا كان موجوداً
      if (window.CodformCurrencyManager) {
        window.CodformCurrencyManager.formatCurrency = (amount, currency) => {
          return this.formatCurrency(amount, currency || FORCED_CURRENCY);
        };
        console.log('🔒 Overridden CodformCurrencyManager.formatCurrency');
      }

      // ✅ إعادة كتابة UnifiedSystem إذا كان موجوداً
      if (window.CodformUnifiedSystem) {
        window.CodformUnifiedSystem.formatCurrency = (amount, currency) => {
          return this.formatCurrency(amount, currency || FORCED_CURRENCY);
        };
        window.CodformUnifiedSystem.getPreferredCurrency = () => FORCED_CURRENCY;
        console.log('🔒 Overridden CodformUnifiedSystem functions');
      }
    }

    formatCurrency(amount, originalCurrency = 'USD') {
      // ✅ تحويل إلى USD دائماً
      const convertedAmount = this.convertToUSD(amount, originalCurrency);
      
      // ✅ تنسيق USD بدون رمز العملة (حسب الإعدادات المحفوظة)
      return Math.round(convertedAmount).toString();
    }

    convertToUSD(amount, fromCurrency) {
      if (fromCurrency === 'USD') return amount;
      
      const rate = EXCHANGE_RATES[fromCurrency];
      if (rate) {
        return amount / rate;
      }
      return amount; // إذا لم توجد العملة، نفترض أنها USD
    }

    startMonitoring() {
      // ✅ مراقبة تغييرات DOM للأسعار
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.processNewElements(node);
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // ✅ مراقبة دورية للتأكد من عدم تغيير العملة
      setInterval(() => {
        this.enforceUSD();
      }, 2000);

      console.log('🔒 FORCE USD SYSTEM: Monitoring started');
    }

    processNewElements(element) {
      // البحث عن عناصر الأسعار وتحديثها
      const priceElements = element.querySelectorAll('[data-price], [data-cart-price], [data-codform-price]');
      priceElements.forEach(el => this.updatePriceElement(el));

      // البحث عن نصوص تحتوي على MAD أو SAR وتغييرها
      this.findAndReplaceCurrencyText(element);
    }

    updatePriceElement(element) {
      const amount = parseFloat(element.getAttribute('data-price') || 
                              element.getAttribute('data-cart-price') || 
                              element.getAttribute('data-amount'));
      const currency = element.getAttribute('data-currency') || 'SAR';
      
      if (!isNaN(amount)) {
        const formattedPrice = this.formatCurrency(amount, currency);
        element.textContent = formattedPrice;
        element.setAttribute('data-currency', 'USD');
      }
    }

    findAndReplaceCurrencyText(element) {
      // البحث عن نصوص تحتوي على أسماء العملات وتغييرها
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodesToUpdate = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        if (text.includes('MAD') || text.includes('د.م') || text.includes('ر.س') || text.includes('SAR')) {
          textNodesToUpdate.push(node);
        }
      }

      textNodesToUpdate.forEach(textNode => {
        let newText = textNode.textContent;
        
        // استخراج الرقم من النص
        const numberMatch = newText.match(/(\d+(?:\.\d{1,2})?)/);
        if (numberMatch) {
          const amount = parseFloat(numberMatch[1]);
          let originalCurrency = 'SAR'; // افتراضي
          
          if (newText.includes('MAD') || newText.includes('د.م')) {
            originalCurrency = 'MAD';
          } else if (newText.includes('SAR') || newText.includes('ر.س')) {
            originalCurrency = 'SAR';
          }
          
          const convertedAmount = this.convertToUSD(amount, originalCurrency);
          const formattedAmount = Math.round(convertedAmount);
          
          // استبدال النص بالكامل
          newText = formattedAmount.toString();
          textNode.textContent = newText;
          
          console.log(`🔄 FORCE USD: Converted ${amount} ${originalCurrency} → ${formattedAmount} USD`);
        }
      });
    }

    enforceUSD() {
      // ✅ فرض USD في جميع العناصر الموجودة
      document.querySelectorAll('[data-price], [data-cart-price], [data-codform-price]').forEach(el => {
        this.updatePriceElement(el);
      });

      // ✅ البحث عن عروض الكمية وتحديثها
      document.querySelectorAll('[id^="quantity-offers-before-"] .quantity-offer-price').forEach(el => {
        this.findAndReplaceCurrencyText(el.parentElement);
      });

      // ✅ البحث عن Cart Summary وتحديثه
      document.querySelectorAll('[data-cart-summary] .price, .cart-summary-price').forEach(el => {
        this.findAndReplaceCurrencyText(el.parentElement);
      });

      // ✅ تأكد من localStorage
      if (localStorage.getItem('codform_forced_currency') !== FORCED_CURRENCY) {
        localStorage.setItem('codform_forced_currency', FORCED_CURRENCY);
        console.log('🔒 FORCE USD: Reset localStorage currency');
      }
    }

    // ✅ API عام للاستخدام الخارجي
    getCurrency() {
      return FORCED_CURRENCY;
    }

    formatPrice(amount, currency) {
      return this.formatCurrency(amount, currency);
    }
  }

  // ✅ إنشاء وتشغيل النظام القسري
  const forceUSDSystem = new ForceUSDSystem();

  // ✅ تصدير النظام للاستخدام العام
  window.CodformForceUSD = {
    formatCurrency: (amount, currency) => forceUSDSystem.formatCurrency(amount, currency),
    getCurrency: () => forceUSDSystem.getCurrency(),
    enforceUSD: () => forceUSDSystem.enforceUSD(),
    system: forceUSDSystem
  };

  // ✅ تشغيل فوري عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => forceUSDSystem.enforceUSD(), 500);
    });
  } else {
    setTimeout(() => forceUSDSystem.enforceUSD(), 500);
  }

  console.log('✅ FORCE USD SYSTEM: Loaded and active');

})();