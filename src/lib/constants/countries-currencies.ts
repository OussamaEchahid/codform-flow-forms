// Country and currency constants for forms

export interface Country {
  code: string;
  name: string;
  nameAr: string;
  phonePrefix: string;
  currency: string;
  flag: string;
}

export interface Currency {
  code: string;
  name: string;
  nameAr: string;
  symbol: string;
  exchangeRate: number; // معدل التحويل مقابل الدولار الأمريكي
}

export const COUNTRIES: Country[] = [
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    phonePrefix: '+966',
    currency: 'SAR',
    flag: '🇸🇦'
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    phonePrefix: '+971',
    currency: 'AED',
    flag: '🇦🇪'
  },
  {
    code: 'EG',
    name: 'Egypt',
    nameAr: 'مصر',
    phonePrefix: '+20',
    currency: 'EGP',
    flag: '🇪🇬'
  },
  {
    code: 'QA',
    name: 'Qatar',
    nameAr: 'قطر',
    phonePrefix: '+974',
    currency: 'QAR',
    flag: '🇶🇦'
  },
  {
    code: 'KW',
    name: 'Kuwait',
    nameAr: 'الكويت',
    phonePrefix: '+965',
    currency: 'KWD',
    flag: '🇰🇼'
  },
  {
    code: 'BH',
    name: 'Bahrain',
    nameAr: 'البحرين',
    phonePrefix: '+973',
    currency: 'BHD',
    flag: '🇧🇭'
  },
  {
    code: 'OM',
    name: 'Oman',
    nameAr: 'عُمان',
    phonePrefix: '+968',
    currency: 'OMR',
    flag: '🇴🇲'
  },
  {
    code: 'JO',
    name: 'Jordan',
    nameAr: 'الأردن',
    phonePrefix: '+962',
    currency: 'JOD',
    flag: '🇯🇴'
  },
  {
    code: 'LB',
    name: 'Lebanon',
    nameAr: 'لبنان',
    phonePrefix: '+961',
    currency: 'LBP',
    flag: '🇱🇧'
  },
  {
    code: 'MA',
    name: 'Morocco',
    nameAr: 'المغرب',
    phonePrefix: '+212',
    currency: 'MAD',
    flag: '🇲🇦'
  },
  {
    code: 'TN',
    name: 'Tunisia',
    nameAr: 'تونس',
    phonePrefix: '+216',
    currency: 'TND',
    flag: '🇹🇳'
  },
  {
    code: 'DZ',
    name: 'Algeria',
    nameAr: 'الجزائر',
    phonePrefix: '+213',
    currency: 'DZD',
    flag: '🇩🇿'
  },
  {
    code: 'US',
    name: 'United States',
    nameAr: 'الولايات المتحدة',
    phonePrefix: '+1',
    currency: 'USD',
    flag: '🇺🇸'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nameAr: 'المملكة المتحدة',
    phonePrefix: '+44',
    currency: 'GBP',
    flag: '🇬🇧'
  },
  {
    code: 'CA',
    name: 'Canada',
    nameAr: 'كندا',
    phonePrefix: '+1',
    currency: 'CAD',
    flag: '🇨🇦'
  },
  {
    code: 'AU',
    name: 'Australia',
    nameAr: 'أستراليا',
    phonePrefix: '+61',
    currency: 'AUD',
    flag: '🇦🇺'
  },
  // دول أمريكا اللاتينية
  {
    code: 'MX',
    name: 'Mexico',
    nameAr: 'المكسيك',
    phonePrefix: '+52',
    currency: 'MXN',
    flag: '🇲🇽'
  },
  {
    code: 'BR',
    name: 'Brazil',
    nameAr: 'البرازيل',
    phonePrefix: '+55',
    currency: 'BRL',
    flag: '🇧🇷'
  },
  {
    code: 'AR',
    name: 'Argentina',
    nameAr: 'الأرجنتين',
    phonePrefix: '+54',
    currency: 'ARS',
    flag: '🇦🇷'
  },
  {
    code: 'CL',
    name: 'Chile',
    nameAr: 'تشيلي',
    phonePrefix: '+56',
    currency: 'CLP',
    flag: '🇨🇱'
  },
  {
    code: 'CO',
    name: 'Colombia',
    nameAr: 'كولومبيا',
    phonePrefix: '+57',
    currency: 'COP',
    flag: '🇨🇴'
  },
  {
    code: 'PE',
    name: 'Peru',
    nameAr: 'بيرو',
    phonePrefix: '+51',
    currency: 'PEN',
    flag: '🇵🇪'
  },
  {
    code: 'VE',
    name: 'Venezuela',
    nameAr: 'فنزويلا',
    phonePrefix: '+58',
    currency: 'VES',
    flag: '🇻🇪'
  },
  {
    code: 'UY',
    name: 'Uruguay',
    nameAr: 'الأوروغواي',
    phonePrefix: '+598',
    currency: 'UYU',
    flag: '🇺🇾'
  },
  {
    code: 'EC',
    name: 'Ecuador',
    nameAr: 'الإكوادور',
    phonePrefix: '+593',
    currency: 'USD',
    flag: '🇪🇨'
  },
  // دول الخليج الإضافية
  {
    code: 'IQ',
    name: 'Iraq',
    nameAr: 'العراق',
    phonePrefix: '+964',
    currency: 'IQD',
    flag: '🇮🇶'
  },
  {
    code: 'IR',
    name: 'Iran',
    nameAr: 'إيران',
    phonePrefix: '+98',
    currency: 'IRR',
    flag: '🇮🇷'
  },
  // دول الشرق الأوسط الإضافية
  {
    code: 'TR',
    name: 'Turkey',
    nameAr: 'تركيا',
    phonePrefix: '+90',
    currency: 'TRY',
    flag: '🇹🇷'
  },
  {
    code: 'IL',
    name: 'Israel',
    nameAr: 'إسرائيل',
    phonePrefix: '+972',
    currency: 'ILS',
    flag: '🇮🇱'
  },
  {
    code: 'PS',
    name: 'Palestine',
    nameAr: 'فلسطين',
    phonePrefix: '+970',
    currency: 'ILS',
    flag: '🇵🇸'
  },
  {
    code: 'SY',
    name: 'Syria',
    nameAr: 'سوريا',
    phonePrefix: '+963',
    currency: 'SYP',
    flag: '🇸🇾'
  },
  {
    code: 'YE',
    name: 'Yemen',
    nameAr: 'اليمن',
    phonePrefix: '+967',
    currency: 'YER',
    flag: '🇾🇪'
  },
  // دول أفريقيا
  {
    code: 'NG',
    name: 'Nigeria',
    nameAr: 'نيجيريا',
    phonePrefix: '+234',
    currency: 'NGN',
    flag: '🇳🇬'
  },
  {
    code: 'ZA',
    name: 'South Africa',
    nameAr: 'جنوب أفريقيا',
    phonePrefix: '+27',
    currency: 'ZAR',
    flag: '🇿🇦'
  },
  {
    code: 'KE',
    name: 'Kenya',
    nameAr: 'كينيا',
    phonePrefix: '+254',
    currency: 'KES',
    flag: '🇰🇪'
  },
  {
    code: 'GH',
    name: 'Ghana',
    nameAr: 'غانا',
    phonePrefix: '+233',
    currency: 'GHS',
    flag: '🇬🇭'
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    nameAr: 'إثيوبيا',
    phonePrefix: '+251',
    currency: 'ETB',
    flag: '🇪🇹'
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    nameAr: 'تنزانيا',
    phonePrefix: '+255',
    currency: 'TZS',
    flag: '🇹🇿'
  },
  {
    code: 'UG',
    name: 'Uganda',
    nameAr: 'أوغندا',
    phonePrefix: '+256',
    currency: 'UGX',
    flag: '🇺🇬'
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    nameAr: 'زيمبابوي',
    phonePrefix: '+263',
    currency: 'ZWL',
    flag: '🇿🇼'
  },
  {
    code: 'ZM',
    name: 'Zambia',
    nameAr: 'زامبيا',
    phonePrefix: '+260',
    currency: 'ZMW',
    flag: '🇿🇲'
  },
  {
    code: 'RW',
    name: 'Rwanda',
    nameAr: 'رواندا',
    phonePrefix: '+250',
    currency: 'RWF',
    flag: '🇷🇼'
  },
  {
    code: 'SN',
    name: 'Senegal',
    nameAr: 'السنغال',
    phonePrefix: '+221',
    currency: 'XOF',
    flag: '🇸🇳'
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    nameAr: 'ساحل العاج',
    phonePrefix: '+225',
    currency: 'XOF',
    flag: '🇨🇮'
  },
  {
    code: 'ML',
    name: 'Mali',
    nameAr: 'مالي',
    phonePrefix: '+223',
    currency: 'XOF',
    flag: '🇲🇱'
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    nameAr: 'بوركينا فاسو',
    phonePrefix: '+226',
    currency: 'XOF',
    flag: '🇧🇫'
  },
  {
    code: 'CM',
    name: 'Cameroon',
    nameAr: 'الكاميرون',
    phonePrefix: '+237',
    currency: 'XAF',
    flag: '🇨🇲'
  },
  {
    code: 'GA',
    name: 'Gabon',
    nameAr: 'الغابون',
    phonePrefix: '+241',
    currency: 'XAF',
    flag: '🇬🇦'
  },
  {
    code: 'TD',
    name: 'Chad',
    nameAr: 'تشاد',
    phonePrefix: '+235',
    currency: 'XAF',
    flag: '🇹🇩'
  }
];

export const CURRENCIES: Currency[] = [
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: '﷼',
    exchangeRate: 3.75
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'د.إ',
    exchangeRate: 3.67
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    symbol: 'ج.م',
    exchangeRate: 30.85
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    symbol: 'ر.ق',
    exchangeRate: 3.64
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    symbol: 'د.ك',
    exchangeRate: 0.31
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    symbol: 'د.ب',
    exchangeRate: 0.38
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    symbol: 'ر.ع',
    exchangeRate: 0.38
  },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    symbol: 'د.أ',
    exchangeRate: 0.71
  },
  {
    code: 'LBP',
    name: 'Lebanese Pound',
    nameAr: 'ليرة لبنانية',
    symbol: 'ل.ل',
    exchangeRate: 89500
  },
  {
    code: 'MAD',
    name: 'Moroccan Dirham',
    nameAr: 'درهم مغربي',
    symbol: 'د.م',
    exchangeRate: 10.0
  },
  {
    code: 'TND',
    name: 'Tunisian Dinar',
    nameAr: 'دينار تونسي',
    symbol: 'د.ت',
    exchangeRate: 3.15
  },
  {
    code: 'DZD',
    name: 'Algerian Dinar',
    nameAr: 'دينار جزائري',
    symbol: 'د.ج',
    exchangeRate: 134.25
  },
  {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$',
    exchangeRate: 1.0
  },
  {
    code: 'EUR',
    name: 'Euro',
    nameAr: 'يورو',
    symbol: '€',
    exchangeRate: 0.92
  },
  {
    code: 'GBP',
    name: 'British Pound',
    nameAr: 'جنيه إسترليني',
    symbol: '£',
    exchangeRate: 0.79
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    nameAr: 'دولار كندي',
    symbol: 'C$',
    exchangeRate: 1.43
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    nameAr: 'دولار أسترالي',
    symbol: 'A$',
    exchangeRate: 1.57
  },
  // عملات أمريكا اللاتينية
  {
    code: 'MXN',
    name: 'Mexican Peso',
    nameAr: 'بيزو مكسيكي',
    symbol: '$',
    exchangeRate: 20.15
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    nameAr: 'ريال برازيلي',
    symbol: 'R$',
    exchangeRate: 6.05
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    nameAr: 'بيزو أرجنتيني',
    symbol: '$',
    exchangeRate: 1005.5
  },
  {
    code: 'CLP',
    name: 'Chilean Peso',
    nameAr: 'بيزو تشيلي',
    symbol: '$',
    exchangeRate: 975.2
  },
  {
    code: 'COP',
    name: 'Colombian Peso',
    nameAr: 'بيزو كولومبي',
    symbol: '$',
    exchangeRate: 4285.5
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    nameAr: 'سول بيروفي',
    symbol: 'S/',
    exchangeRate: 3.75
  },
  {
    code: 'VES',
    name: 'Venezuelan Bolívar',
    nameAr: 'بوليفار فنزويلي',
    symbol: 'Bs.',
    exchangeRate: 36500000
  },
  {
    code: 'UYU',
    name: 'Uruguayan Peso',
    nameAr: 'بيزو أوروغوياني',
    symbol: '$U',
    exchangeRate: 40.25
  },
  // عملات الخليج والشرق الأوسط الإضافية
  {
    code: 'IQD',
    name: 'Iraqi Dinar',
    nameAr: 'دينار عراقي',
    symbol: 'ع.د',
    exchangeRate: 1310
  },
  {
    code: 'IRR',
    name: 'Iranian Rial',
    nameAr: 'ريال إيراني',
    symbol: '﷼',
    exchangeRate: 42100
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    nameAr: 'ليرة تركية',
    symbol: '₺',
    exchangeRate: 34.15
  },
  {
    code: 'ILS',
    name: 'Israeli Shekel',
    nameAr: 'شيكل إسرائيلي',
    symbol: '₪',
    exchangeRate: 3.67
  },
  {
    code: 'SYP',
    name: 'Syrian Pound',
    nameAr: 'ليرة سورية',
    symbol: 'ل.س',
    exchangeRate: 13000
  },
  {
    code: 'YER',
    name: 'Yemeni Rial',
    nameAr: 'ريال يمني',
    symbol: '﷼',
    exchangeRate: 250
  },
  // عملات أفريقيا
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    nameAr: 'نايرا نيجيرية',
    symbol: '₦',
    exchangeRate: 1675
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    nameAr: 'راند جنوب أفريقي',
    symbol: 'R',
    exchangeRate: 18.45
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    nameAr: 'شلن كيني',
    symbol: 'KSh',
    exchangeRate: 130.5
  },
  {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    nameAr: 'سيدي غاني',
    symbol: '₵',
    exchangeRate: 15.85
  },
  {
    code: 'ETB',
    name: 'Ethiopian Birr',
    nameAr: 'بر إثيوبي',
    symbol: 'Br',
    exchangeRate: 125.5
  },
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    nameAr: 'شلن تنزاني',
    symbol: 'TSh',
    exchangeRate: 2515
  },
  {
    code: 'UGX',
    name: 'Ugandan Shilling',
    nameAr: 'شلن أوغندي',
    symbol: 'USh',
    exchangeRate: 3785
  },
  {
    code: 'ZWL',
    name: 'Zimbabwean Dollar',
    nameAr: 'دولار زيمبابوي',
    symbol: 'Z$',
    exchangeRate: 322
  },
  {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    nameAr: 'كواشا زامبية',
    symbol: 'ZK',
    exchangeRate: 27.85
  },
  {
    code: 'RWF',
    name: 'Rwandan Franc',
    nameAr: 'فرنك رواندي',
    symbol: 'FRw',
    exchangeRate: 1385
  },
  {
    code: 'XOF',
    name: 'West African CFA Franc',
    nameAr: 'فرنك أفريقيا الغربية',
    symbol: 'CFA',
    exchangeRate: 655.96
  },
  {
    code: 'XAF',
    name: 'Central African CFA Franc',
    nameAr: 'فرنك أفريقيا الوسطى',
    symbol: 'FCFA',
    exchangeRate: 655.96
  }
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

export const getCountryNameByCode = (code: string, language: 'en' | 'ar' = 'en'): string => {
  const country = getCountryByCode(code);
  if (!country) return code;
  return language === 'ar' ? country.nameAr : country.name;
};

export const getCurrencyNameByCode = (code: string, language: 'en' | 'ar' = 'en'): string => {
  const currency = getCurrencyByCode(code);
  if (!currency) return code;
  return language === 'ar' ? currency.nameAr : currency.name;
};

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  
  // Remove any existing country code
  let cleanPhone = phone.replace(/^\+?\d{1,4}/, '').replace(/^0+/, '');
  
  // Add the country's phone prefix
  return `${country.phonePrefix}${cleanPhone}`;
};

export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  
  // Basic validation - adjust patterns per country as needed
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  switch (countryCode) {
    case 'SA':
      return /^(966)?5\d{8}$/.test(cleanPhone);
    case 'AE':
      return /^(971)?[567]\d{8}$/.test(cleanPhone);
    case 'EG':
      return /^(20)?1[0125]\d{8}$/.test(cleanPhone);
    default:
      return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }
};

// دالة تحويل العملة
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const fromCurr = getCurrencyByCode(fromCurrency);
  const toCurr = getCurrencyByCode(toCurrency);
  
  if (!fromCurr || !toCurr) return amount;
  
  // تحويل للدولار أولاً ثم للعملة المطلوبة
  const usdAmount = amount / fromCurr.exchangeRate;
  return usdAmount * toCurr.exchangeRate;
};

// دالة تنسيق السعر حسب العملة
export const formatPrice = (amount: number, currencyCode: string, language: 'en' | 'ar' = 'en'): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return amount.toString();
  
  // تنسيق الرقم حسب العملة
  let formattedAmount = '';
  
  if (currency.code === 'KWD' || currency.code === 'BHD' || currency.code === 'OMR') {
    // العملات التي تستخدم 3 منازل عشرية
    formattedAmount = amount.toFixed(3);
  } else if (currency.code === 'CLP' || currency.code === 'VES' || currency.code === 'LBP') {
    // العملات التي لا تستخدم منازل عشرية
    formattedAmount = Math.round(amount).toString();
  } else {
    // باقي العملات (منزلتان عشريتان)
    formattedAmount = amount.toFixed(2);
  }
  
  // إضافة رمز العملة
  if (language === 'ar') {
    return `${formattedAmount} ${currency.symbol}`;
  } else {
    return `${currency.symbol} ${formattedAmount}`;
  }
};