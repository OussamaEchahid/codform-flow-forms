/**
 * UNIFIED EXCHANGE RATES SYSTEM
 * نظام معدلات التحويل الموحد - مصدر واحد للحقيقة
 * جميع المعدلات محسوبة بالنسبة للدولار الأمريكي (USD = 1.0)
 */

export interface UnifiedExchangeRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // معدل التحويل مقابل USD
  lastUpdated?: string;
}

// ✅ المعدلات الافتراضية الموحدة - مصدر واحد للحقيقة
export const UNIFIED_EXCHANGE_RATES: Record<string, UnifiedExchangeRate> = {
  // العملات الرئيسية
  'USD': { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000 },
  'EUR': { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.9200 },
  'GBP': { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.8000 },
  'JPY': { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.0000 },
  'CNY': { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.2400 },
  'INR': { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.0000 },
  'RUB': { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 92.5000 },
  'AUD': { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.5700 },
  'CAD': { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.4300 },
  'CHF': { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.8900 },
  'HKD': { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.8000 },
  'SGD': { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.3500 },
  'KRW': { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1345.0000 },
  'NZD': { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.6900 },

  // عملات الشرق الأوسط
  'SAR': { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', rate: 3.7500 },
  'AED': { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.6700 },
  'QAR': { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', rate: 3.6400 },
  'KWD': { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', rate: 0.3100 },
  'BHD': { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', rate: 0.3800 },
  'OMR': { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', rate: 0.3800 },
  'EGP': { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', rate: 30.8500 },
  'JOD': { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', rate: 0.7100 },
  'ILS': { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.6700 },
  'IRR': { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 42100.0000 },
  'IQD': { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', rate: 1310.0000 },
  'TRY': { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 34.1500 },
  'LBP': { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', rate: 89500.0000 },
  'SYP': { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س', rate: 13000.0000 },
  'YER': { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', rate: 250.0000 },

  // عملات أفريقيا
  'MAD': { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م', rate: 10.0000 },
  'XOF': { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', rate: 655.9600 },
  'XAF': { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', rate: 655.9600 },
  'NGN': { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1675.0000 },
  'ZAR': { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.4500 },
  'KES': { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 130.5000 },
  'GHS': { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 15.8500 },
  'ETB': { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 125.5000 },
  'TZS': { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 2515.0000 },
  'UGX': { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 3785.0000 },
  'ZMW': { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', rate: 27.8500 },
  'RWF': { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', rate: 1385.0000 },

  // عملات آسيا
  'IDR': { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 15850.0000 },
  'PKR': { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 280.0000 },
  'BDT': { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0000 },
  'LKR': { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', rate: 300.0000 },
  'NPR': { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', rate: 133.0000 },
  'BTN': { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu', rate: 83.0000 },
  'MMK': { code: 'MMK', name: 'Burmese Kyat', symbol: 'K', rate: 2100.0000 },
  'KHR': { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', rate: 4100.0000 },
  'LAK': { code: 'LAK', name: 'Lao Kip', symbol: '₭', rate: 20000.0000 },
  'VND': { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 24000.0000 },
  'THB': { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 36.0000 },
  'MYR': { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.7000 },
  'PHP': { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 56.0000 },

  // عملات أمريكا اللاتينية
  'MXN': { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 20.1500 },
  'BRL': { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 6.0500 },
  'ARS': { code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 1005.5000 },
  'CLP': { code: 'CLP', name: 'Chilean Peso', symbol: '$', rate: 975.2000 },
  'COP': { code: 'COP', name: 'Colombian Peso', symbol: '$', rate: 4285.5000 },
  'PEN': { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', rate: 3.7500 },
  'VES': { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', rate: 36500000.0000 },
  'UYU': { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', rate: 40.2500 },
};

/**
 * دالة تحويل العملة الموحدة
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // استخدام المعدلات المخصصة أولاً، ثم الافتراضية
  const allRates = { ...UNIFIED_EXCHANGE_RATES, ...customRates };

  const fromRate = customRates?.[fromCurrency] || UNIFIED_EXCHANGE_RATES[fromCurrency]?.rate || 1;
  const toRate = customRates?.[toCurrency] || UNIFIED_EXCHANGE_RATES[toCurrency]?.rate || 1;

  // التحويل عبر USD كعملة أساسية
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;

  // 🚨 DEBUG: تفاصيل التحويل
  console.log('🔄 CONVERSION DETAILS:', {
    amount,
    fromCurrency,
    toCurrency,
    fromRate,
    toRate,
    usdAmount,
    convertedAmount,
    calculation: `${amount} ÷ ${fromRate} × ${toRate} = ${convertedAmount}`
  });

  return convertedAmount;
}

/**
 * الحصول على معدل التحويل لعملة معينة
 */
export function getExchangeRate(
  currencyCode: string,
  customRates?: Record<string, number>
): number {
  return customRates?.[currencyCode] || UNIFIED_EXCHANGE_RATES[currencyCode]?.rate || 1;
}

/**
 * الحصول على معلومات العملة
 */
export function getCurrencyInfo(currencyCode: string): UnifiedExchangeRate | null {
  return UNIFIED_EXCHANGE_RATES[currencyCode] || null;
}

/**
 * الحصول على جميع العملات المدعومة
 */
export function getAllSupportedCurrencies(): UnifiedExchangeRate[] {
  return Object.values(UNIFIED_EXCHANGE_RATES);
}

/**
 * تنسيق العملة مع الرمز المناسب
 */
export function formatCurrency(
  amount: number, 
  currencyCode: string, 
  customSymbols?: Record<string, string>
): string {
  const currencyInfo = UNIFIED_EXCHANGE_RATES[currencyCode];
  const symbol = customSymbols?.[currencyCode] || currencyInfo?.symbol || currencyCode;
  
  // تنسيق خاص لبعض العملات
  if (currencyCode === 'JPY' || currencyCode === 'KRW' || currencyCode === 'VND') {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
}
