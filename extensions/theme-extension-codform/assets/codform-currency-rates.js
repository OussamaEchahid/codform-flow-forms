/**
 * معدلات تحويل العملات المدعومة - نظام موحد
 * جميع المعدلات محسوبة بالنسبة للدولار الأمريكي (USD)
 * متطابقة مع src/lib/constants/countries-currencies.ts
 */
// استخدام CurrencyService إذا كان متاحاً، وإلا استخدام المعدلات الافتراضية
window.CodformCurrencyRates = {
  'USD': 1.0,
  'SAR': 3.75,
  'AED': 3.67,
  'EGP': 30.85,
  'JOD': 0.71,
  'KWD': 0.31,
  'BHD': 0.38,
  'QAR': 3.64,
  'OMR': 0.38,
  'LBP': 15000,
  'SYP': 2512,
  'IQD': 1310,
  'YER': 250,
  'MAD': 10.0,
  'TND': 3.08,
  'DZD': 134.5,
  'EUR': 0.85,
  'GBP': 0.75,
  'TRY': 27.8,
  'IRR': 42000,
  'AFN': 72,
  'PKR': 280,
  'INR': 83,
  'BDT': 110,
  'LKR': 300,
  'MVR': 15.4,
  'NPR': 133,
  'BTN': 83,
  'MMK': 2100,
  'KHR': 4100,
  'LAK': 20000,
  'VND': 24000,
  'THB': 36,
  'MYR': 4.7,
  'SGD': 1.35,
  'IDR': 15800,
  'PHP': 56,
  'BND': 1.35,
  'LYD': 4.48,
  'XOF': 655.96,
  'XAF': 655.96
};

// دالة للحصول على معدل التحويل (مع إعطاء الأولوية لـ CurrencyService)
window.getExchangeRate = function(currencyCode) {
  // استخدام CurrencyService إذا كان متاحاً
  if (window.CurrencyService && typeof window.CurrencyService.getExchangeRate === 'function') {
    return window.CurrencyService.getExchangeRate(currencyCode);
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
  
  // التحويل الاحتياطي باستخدام المعدلات الافتراضية
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = window.getExchangeRate(fromCurrency);
  const toRate = window.getExchangeRate(toCurrency);
  
  if (!fromRate || !toRate) {
    console.warn(`⚠️ Currency not supported: ${fromCurrency} -> ${toCurrency}`);
    return amount;
  }
  
  // تحويل إلى USD أولاً، ثم إلى العملة المطلوبة
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
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
    return `${currency} ${amount.toFixed(2)}`;
  }
};