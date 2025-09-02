/**
 * معدلات تحويل العملات المدعومة - نظام موحد
 * جميع المعدلات محسوبة بالنسبة للدولار الأمريكي (USD)
 * متطابقة مع src/lib/constants/countries-currencies.ts
 */
// معدلات تحويل موحدة - مطابقة للنظام الموحد
window.CodformCurrencyRates = {
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

// دالة للحصول على معدل التحويل (مع إعطاء الأولوية لـ CurrencyService)
window.getExchangeRate = function(currencyCode) {
  // استخدام CurrencyService إذا كان متاحاً
  if (window.CurrencyService && typeof window.CurrencyService.getExchangeRate === 'function') {
    return window.CurrencyService.getExchangeRate(currencyCode);
  }
  
  // محاولة الحصول على المعدل المخصص من CurrencyManager
  if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getExchangeRate === 'function') {
    return window.CodformCurrencyManager.getExchangeRate(currencyCode);
  }
  
  // استخدام المعدلات الافتراضية
  return window.CodformCurrencyRates[currencyCode] || 1.0;
};

/**
 * دالة تحويل العملة
 * @param {number} amount - المبلغ المراد تحويله
 * @param {string} fromCurrency - العملة المصدر
 * @param {string} toCurrency - العملة المستهدفة
 * @returns {number} المبلغ بعد التحويل
 */
window.convertCurrency = function(amount, fromCurrency, toCurrency) {
  console.log(`🔄 Converting: ${amount} from ${fromCurrency} to ${toCurrency}`);
  
  // استخدام CurrencyService إذا كان متاحاً
  if (window.CurrencyService && typeof window.CurrencyService.convertCurrency === 'function') {
    return window.CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }
  
  // محاولة استخدام CurrencyManager للتحويل
  if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function') {
    return window.CodformCurrencyManager.convertCurrency(amount, fromCurrency, toCurrency);
  }
  
  // التحويل الاحتياطي باستخدام المعدلات الافتراضية
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = window.getExchangeRate(fromCurrency);
  const toRate = window.getExchangeRate(toCurrency);
  
  if (!fromRate || !toRate) {
    console.warn(`⚠️ Currency not supported: ${fromCurrency} -> ${toCurrency}`);
    return amount;
  }
  
  // تحويل إلى USD أولاً، ثم إلى العملة المطلوبة
  const usdAmount = parseFloat(amount) / parseFloat(fromRate);
  const convertedAmount = usdAmount * parseFloat(toRate);
  
  console.log(`✅ Converted: ${amount} ${fromCurrency} -> ${convertedAmount.toFixed(2)} ${toCurrency}`);
  return convertedAmount;
};

// دالة تنسيق العملة مع إعطاء الأولوية لـ CurrencyService
window.formatCurrencyWithService = function(amount, currency, language = 'ar') {
  // استخدام CurrencyService إذا كان متاحاً
  if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
    return window.CurrencyService.formatCurrency(amount, currency, language);
  }
  
  // التنسيق الاحتياطي
  try {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error);

    // احترام إعدادات العرض عند الفشل
    let showSymbol = false;
    let symbolPosition = 'after';
    let decimalPlaces = 2;
    let customSymbols = {};

    try {
      if (window.CurrencyService && typeof window.CurrencyService.getDisplaySettings === 'function') {
        const s = window.CurrencyService.getDisplaySettings();
        showSymbol = s.showSymbol !== false;
        symbolPosition = s.symbolPosition || symbolPosition;
        decimalPlaces = (s.decimalPlaces ?? decimalPlaces);
        customSymbols = s.customSymbols || {};
      } else if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getDisplaySettings === 'function') {
        const s = window.CodformCurrencyManager.getDisplaySettings();
        showSymbol = s.showSymbol !== false && s.show_symbol !== false;
        symbolPosition = s.symbolPosition || s.symbol_position || symbolPosition;
        decimalPlaces = (s.decimalPlaces ?? s.decimal_places ?? decimalPlaces);
        customSymbols = s.customSymbols || s.custom_symbols || {};
      }
    } catch (_) {}

    const defaultSymbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'MAD': 'د.م' };
    const displayText = showSymbol ? (customSymbols[currency] || defaultSymbols[currency] || currency) : currency;
    const amt = Number.isFinite(amount) ? Number(amount).toFixed(decimalPlaces) : '0.00';

    return symbolPosition === 'before' ? `${displayText} ${amt}` : `${amt} ${displayText}`;
  }
};