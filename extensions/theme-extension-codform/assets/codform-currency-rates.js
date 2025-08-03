/**
 * معدلات تحويل العملات المدعومة
 * جميع المعدلات محسوبة بالنسبة للدولار الأمريكي (USD)
 */
window.CodformCurrencyRates = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.79,
  'JPY': 110.0,
  'CAD': 1.25,
  'AUD': 1.35,
  'CHF': 0.92,
  'CNY': 6.45,
  'SEK': 8.85,
  'NZD': 1.48,
  'MXN': 20.1,
  'SGD': 1.35,
  'HKD': 7.8,
  'NOK': 8.54,
  'TRY': 8.6,
  'ZAR': 14.8,
  'BRL': 5.2,
  'INR': 74.5,
  'KRW': 1180.0,
  'SAR': 3.75,
  'AED': 3.67,
  'MAD': 10.0,
  'EGP': 15.7,
  'QAR': 3.64,
  'KWD': 0.3,
  'BHD': 0.377,
  'OMR': 0.385,
  'LBP': 1500.0,
  'JOD': 0.708,
  'ILS': 3.25,
  'TND': 2.8,
  'DZD': 134.0,
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