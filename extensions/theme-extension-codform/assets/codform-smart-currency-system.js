/**
 * CODFORM SMART CURRENCY SYSTEM - النظام الذكي للعملات
 * يقرأ إعدادات العملة من قاعدة البيانات ويطبقها بذكاء
 */

(function() {
  'use strict';
  try { console.warn('🟣 codform-smart-currency-system.js loaded'); } catch(_){}

  // ✅ CRITICAL FIX: إجبار تحديث GBP من 0.75 إلى 0.79
  try {
    const savedRates = localStorage.getItem('codform_custom_currency_rates');
    if (savedRates) {
      const rates = JSON.parse(savedRates);
      let updated = false;

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

  // ✅ معدلات تحويل موحدة - مطابقة للنظام الموحد
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
      this.customRates = {}; // ✅ إضافة معدلات التحويل المخصصة
      this.isInitialized = false;
      this.formId = null;
      this.shopId = null;
      this.disabled = false; // ✅ إيقاف عند وجود نظام عملات آخر
    }

    /**
     * تهيئة النظام بناءً على معرف النموذج والمتجر
     */
    async initialize(formId, shopId) {
      console.log('🔄 Smart Currency System: Initializing...');

      // حماية من التهيئة المتعددة
      if (this.isInitialized) {
        console.log('✅ Smart Currency System: Already initialized, skipping...');
        return true;
      }

      this.formId = formId;
      this.shopId = shopId;

      // انتظار سياق العملة أو أنظمة أخرى لمنع التضارب
      const ctx = await this.waitForCurrencyContext(1800);

      // إذا كان هناك نظام عملات آخر نشط، قم بتعطيل هذا النظام لتجنب التضارب
      if (window.CodformUnifiedCurrency || window.CodformUltimateCurrency || window.CodformCurrencyManager) {
        console.log('🛑 Smart Currency disabled: another currency system is active');
        this.disabled = true;
        this.isInitialized = false;
        return true;
      }

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
      // ✅ أولاً: تحقق من البيانات المحلية
      const detected = (window.CodformFormData && window.CodformFormData.currency) || null;
      if (detected) {
        console.log(`📋 Using detected form currency: ${detected}`);
        return detected;
      }

      // ✅ ثانياً: استخدم API للحصول على النموذج الافتراضي للمتجر
      if (this.shopId) {
        try {
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-default?shop=${encodeURIComponent(this.shopId)}`);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.form && data.form.currency) {
              console.log(`📋 Form currency from DB: ${data.form.currency}`);
              return data.form.currency;
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch form currency from API');
        }
      }

      // ✅ ثالثاً: استخدم API للحصول على نموذج محدد إذا كان لدينا form ID
      if (this.formId) {
        try {
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-forms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: this.formId })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.form && data.form.currency) {
              console.log(`📋 Specific form currency from DB: ${data.form.currency}`);
              return data.form.currency;
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch specific form currency');
        }
      }

      console.log('⚠️ No currency found, using GBP as default');
      return 'GBP';
    }

    /**
     * قراءة إعدادات العرض من قاعدة البيانات
     */
    async getDisplaySettings() {
      // Prefer settings from CurrencyService/CurrencyManager/localStorage before remote fetch
      try {
        if (window.CurrencyService && typeof window.CurrencyService.getDisplaySettings === 'function') {
          const svc = window.CurrencyService.getDisplaySettings();
          if (svc) {
            // pick up customSymbols too if provided by CurrencyService
            this.customSymbols = svc.customSymbols || svc.custom_symbols || this.customSymbols;
            return {
              showSymbol: svc.showSymbol !== false,
              symbolPosition: svc.symbolPosition || 'before',
              decimalPlaces: (typeof svc.decimalPlaces === 'number') ? svc.decimalPlaces : 2
            };
          }
        }
      } catch (_) {}

      try {
        if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getDisplaySettings === 'function') {
          const ds = window.CodformCurrencyManager.getDisplaySettings();
          if (ds) {
            this.customSymbols = ds.customSymbols || this.customSymbols;
            return {
              showSymbol: (ds.showSymbol !== false) && (ds.show_symbol !== false),
              symbolPosition: ds.symbolPosition || ds.symbol_position || 'before',
              decimalPlaces: (ds.decimalPlaces ?? ds.decimal_places ?? 2)
            };
          }
        }
      } catch (_) {}

      try {
        const saved = localStorage.getItem('codform_currency_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.displaySettings) {
            const ds = parsed.displaySettings;
            this.customSymbols = parsed.customSymbols || this.customSymbols;
            return {
              showSymbol: ds.showSymbol !== false,
              symbolPosition: ds.symbolPosition || 'before',
              decimalPlaces: (ds.decimalPlaces ?? 2)
            };
          }
        }
      } catch (_) {}

      // Remote fetch fallback
      if (!this.shopId) {
        return this.getDefaultDisplaySettings();
      }

      try {
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/currency-settings?shop=${encodeURIComponent(this.shopId)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.display_settings) {
            console.log('📋 Display settings from DB:', data.display_settings);

            if (data.custom_symbols) {
              this.customSymbols = data.custom_symbols;
              console.log('💰 Loaded custom symbols:', this.customSymbols);
            }

            if (data.all_rates) {
              this.customRates = data.all_rates;
              console.log('💱 Loaded all rates:', this.customRates);
            } else if (data.custom_rates) {
              this.customRates = { ...EXCHANGE_RATES, ...data.custom_rates };
              console.log('💱 Loaded custom rates merged with defaults:', this.customRates);
            }

            return {
              showSymbol: data.display_settings.show_symbol ?? true,
              symbolPosition: data.display_settings.symbol_position || 'before',
              decimalPlaces: data.display_settings.decimal_places ?? 2
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
        showSymbol: true, // إظهار الكود كافتراضي (تم توحيد الإعدادات)
        symbolPosition: 'before',
        decimalPlaces: 0
      };
    }

    // ينتظر توافر سياق العملة أو النظام الموحد لفترة قصيرة قبل التهيئة
    async waitForCurrencyContext(timeoutMs = 1500) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (window.CodformUnifiedCurrency || window.CodformUltimateCurrency || window.CodformCurrencyManager) {
          return { manager: true };
        }
        const detected = (window.CodformFormData && window.CodformFormData.currency) || null;
        if (detected) {
          this.currentCurrency = detected;
          return { currency: detected };
        }
        await new Promise(r => setTimeout(r, 100));
      }
      return null;
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
        // ✅ CRITICAL FIX: فصل السعر الحقيقي عن طريقة العرض
        // لا نقوم بتقريب السعر الحقيقي، فقط نغير طريقة العرض
        formattedAmount = convertedAmount.toFixed(this.displaySettings.decimalPlaces);
      }

      const rtl = (typeof document !== 'undefined' && document.documentElement && document.documentElement.dir === 'rtl');

      // Show Code mode (apply custom symbol/code if provided)
      if (!this.displaySettings.showSymbol) {
        const codeOrCustom = this.customSymbols[this.currentCurrency] || this.currentCurrency;
        const hasRTLChars = /[\u0590-\u08FF]/.test(codeOrCustom);
        if (rtl || hasRTLChars) {
          const LRM = '\u200E';
          const LRI = '\u2066';
          const PDI = '\u2069';
          if (this.displaySettings.symbolPosition === 'after') {
            const inner = `${LRM}${formattedAmount}${LRM} ${codeOrCustom}`;
            return `${LRI}${inner}${PDI}`;
          } else {
            const inner = `${codeOrCustom} ${LRM}${formattedAmount}`;
            return `${LRI}${inner}${PDI}`;
          }
        }
        // LTR with non-RTL symbol: simple formatting
        return this.displaySettings.symbolPosition === 'before'
          ? `${codeOrCustom} ${formattedAmount}`
          : `${formattedAmount} ${codeOrCustom}`;
      }

      // Show Symbol mode
      const symbol = this.customSymbols[this.currentCurrency] || CURRENCY_SYMBOLS[this.currentCurrency] || this.currentCurrency;
      const actualSymbol = this.customSymbols[this.currentCurrency] || CURRENCY_SYMBOLS[this.currentCurrency] || this.currentCurrency;
      const result = this.displaySettings.symbolPosition === 'before' ?
        `${actualSymbol} ${formattedAmount}` :
        `${formattedAmount} ${actualSymbol}`;
      return rtl ? `\u2066${result}\u2069` : result;
    }

    /**
     * تحويل العملات
     */
    convertCurrency(amount, fromCurrency, toCurrency) {
      if (fromCurrency === toCurrency) return amount;
      
      // ✅ استخدام المعدلات المخصصة أولاً، ثم الافتراضية
      const allRates = { ...UNIFIED_EXCHANGE_RATES, ...this.customRates };
      
      const fromRate = allRates[fromCurrency] || EXCHANGE_RATES[fromCurrency] || 1;
      const toRate = allRates[toCurrency] || EXCHANGE_RATES[toCurrency] || 1;
      
      console.log(`💱 Converting ${amount} from ${fromCurrency} (rate: ${fromRate}) to ${toCurrency} (rate: ${toRate})`);
      
      // التحويل عبر الدولار كعملة أساسية
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      
      console.log(`💱 Result: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
      return convertedAmount;
    }

    /**
     * تطبيق التنسيق على جميع العناصر الموجودة
     */
    applyToAllElements() {
      if (this.disabled) { console.log('🛑 Smart Currency disabled - skipping apply'); return; }
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
        const offers = container.querySelectorAll('.offer-price, [data-price], .quantity-offer-price, .price');
        offers.forEach(element => {
          const amount = parseFloat(element.getAttribute('data-price') || element.getAttribute('data-original-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
          const originalCurrency = element.getAttribute('data-currency') || element.getAttribute('data-original-currency') || this.currentCurrency || 'GBP';
          
          if (!isNaN(amount)) {
            const formatted = this.formatCurrency(amount, originalCurrency);
            element.textContent = formatted;
            element.setAttribute('data-currency', this.currentCurrency);
            element.setAttribute('data-currency-amount', amount);
            console.log(`💰 Updated quantity offer: ${amount} ${originalCurrency} → ${formatted}`);
          }
        });
      });

      // تحديث عروض الكمية المدمجة في النموذج
      document.querySelectorAll('.codform-quantity-offer-price, .codform-offer-price, .offer-price, .quantity-offer-price').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-original-price') || element.getAttribute('data-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
        const originalCurrency = element.getAttribute('data-original-currency') || element.getAttribute('data-currency') || this.currentCurrency || 'GBP';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          element.setAttribute('data-currency-amount', amount);
          console.log(`💰 Updated inline quantity offer: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });

      // تحديث جميع العناصر التي تحتوي على أسعار
      document.querySelectorAll('[data-currency-amount]').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-currency-amount'));
        const originalCurrency = element.getAttribute('data-currency') || this.currentCurrency || 'GBP';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          console.log(`💰 Updated currency amount: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });

      // البحث عن أي عنصر يحتوي على نص مع أسعار في عروض الكمية
      document.querySelectorAll('.quantity-offers-container, [class*="quantity"], [class*="offer"]').forEach(container => {
        const elements = container.querySelectorAll('*');
        elements.forEach(element => {
          if (element.children.length === 0 && element.textContent.trim()) {
            const text = element.textContent;
            const priceMatch = text.match(/(\d+(?:\.\d{1,2})?)\s*(MAD|SAR|AED|USD|ر\.س|د\.م|د\.إ|\$)/);
            if (priceMatch) {
              const amount = parseFloat(priceMatch[1]);
              let currency = priceMatch[2];
              
              // تحويل الرموز إلى أكواد العملات
              if (currency === 'ر.س') currency = 'SAR';
              else if (currency === 'د.م') currency = 'MAD';
              else if (currency === 'د.إ') currency = 'AED';
              else if (currency === '$') currency = 'USD';
              
              const formatted = this.formatCurrency(amount, currency);
              element.textContent = text.replace(priceMatch[0], formatted);
              element.setAttribute('data-currency-amount', amount);
              element.setAttribute('data-currency', this.currentCurrency);
              console.log(`💰 Updated quantity offer text: ${text} → ${element.textContent}`);
            }
          }
        });
      });
    }

    updateCartSummary() {
      document.querySelectorAll('.cart-summary-price, [data-cart-price]').forEach(element => {
        const amount = parseFloat(element.getAttribute('data-cart-price') || element.textContent.match(/\d+(\.\d+)?/)?.[0]);
        const originalCurrency = element.getAttribute('data-currency') || this.currentCurrency || 'GBP';
        
        if (!isNaN(amount)) {
          const formatted = this.formatCurrency(amount, originalCurrency);
          element.textContent = formatted;
          element.setAttribute('data-currency', this.currentCurrency);
          console.log(`💰 Updated cart summary: ${amount} ${originalCurrency} → ${formatted}`);
        }
      });
    }

    updateGeneralElements() {
      if (this.disabled) return;
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
      if (this.disabled) { console.log('🛑 Smart Currency disabled - skipping monitor'); return; }
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