/**
 * معدلات تحويل العملات المدعومة - نظام موحد
 * جميع المعدلات محسوبة بالنسبة للدولار الأمريكي (USD)
 * متطابقة مع src/lib/constants/countries-currencies.ts
 */
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
  'MAD': 10.0, // ✅ توحيد: 1 USD = 10 MAD (متطابق مع النظام الأساسي)
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
  'LYD': 4.48
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
  
  if (fromCurrency === toCurrency) return amount;
  
  const rates = window.CodformCurrencyRates;
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`⚠️ Currency not supported: ${fromCurrency} -> ${toCurrency}`);
    return amount;
  }
  
  // تحويل إلى USD أولاً، ثم إلى العملة المطلوبة
  const usdAmount = amount / rates[fromCurrency];
  const convertedAmount = usdAmount * rates[toCurrency];
  
  console.log(`✅ Converted: ${amount} ${fromCurrency} -> ${convertedAmount.toFixed(2)} ${toCurrency}`);
  return convertedAmount;
};