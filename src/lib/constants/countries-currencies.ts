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
  }
];

export const CURRENCIES: Currency[] = [
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: '﷼'
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'د.إ'
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    symbol: 'ج.م'
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    symbol: 'ر.ق'
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    symbol: 'د.ك'
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    symbol: 'د.ب'
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    symbol: 'ر.ع'
  },
  {
    code: 'JOD',
    name: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    symbol: 'د.أ'
  },
  {
    code: 'LBP',
    name: 'Lebanese Pound',
    nameAr: 'ليرة لبنانية',
    symbol: 'ل.ل'
  },
  {
    code: 'MAD',
    name: 'Moroccan Dirham',
    nameAr: 'درهم مغربي',
    symbol: 'د.م'
  },
  {
    code: 'TND',
    name: 'Tunisian Dinar',
    nameAr: 'دينار تونسي',
    symbol: 'د.ت'
  },
  {
    code: 'DZD',
    name: 'Algerian Dinar',
    nameAr: 'دينار جزائري',
    symbol: 'د.ج'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$'
  },
  {
    code: 'EUR',
    name: 'Euro',
    nameAr: 'يورو',
    symbol: '€'
  },
  {
    code: 'GBP',
    name: 'British Pound',
    nameAr: 'جنيه إسترليني',
    symbol: '£'
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    nameAr: 'دولار كندي',
    symbol: 'C$'
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    nameAr: 'دولار أسترالي',
    symbol: 'A$'
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