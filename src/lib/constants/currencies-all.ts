// Unified comprehensive currency list (ISO 4217)
// Note: exchangeRate here is fallback only; real rates come from CurrencyService/custom rates

export interface CurrencyAll {
  code: string;
  name: string;
  symbol: string; // fallback symbol; if unknown, use code
  exchangeRate: number; // fallback vs USD
}

// Seed with a broad, but compact, initial set. We'll expand incrementally to keep PR small.
// IMPORTANT: Keep lines under 300 in this initial file; future expansions will be appended via str-replace-editor.
export const CURRENCIES_ALL: CurrencyAll[] = [
  // Major
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 149 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 7.24 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', exchangeRate: 92.5 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.57 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.43 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', exchangeRate: 0.89 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', exchangeRate: 7.8 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRate: 1.35 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', exchangeRate: 1345 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', exchangeRate: 1.69 },

  // MENA & Gulf
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', exchangeRate: 10.0 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', exchangeRate: 3.75 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', exchangeRate: 3.64 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', exchangeRate: 0.31 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', exchangeRate: 0.38 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', exchangeRate: 0.38 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', exchangeRate: 30850/1000 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', exchangeRate: 0.71 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', exchangeRate: 3.67 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', exchangeRate: 42100 },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', exchangeRate: 1310 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', exchangeRate: 34.15 },

  // Africa
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', exchangeRate: 655.96 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', exchangeRate: 655.96 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exchangeRate: 1675 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 18.45 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchangeRate: 130.5 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', exchangeRate: 15.85 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', exchangeRate: 125.5 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', exchangeRate: 2515 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', exchangeRate: 3785 },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', exchangeRate: 27.85 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', exchangeRate: 1385 },

  // South/Southeast Asia extras
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', exchangeRate: 15850 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', exchangeRate: 280 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', exchangeRate: 110 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', exchangeRate: 300 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', exchangeRate: 133 },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', exchangeRate: 83 },
  { code: 'MMK', name: 'Burmese Kyat', symbol: 'K', exchangeRate: 2100 },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', exchangeRate: 4100 },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', exchangeRate: 20000 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', exchangeRate: 24000 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', exchangeRate: 36 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', exchangeRate: 4.7 },
];

