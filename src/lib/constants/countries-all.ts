// Unified comprehensive countries list (ISO 3166-1), compact seed
// We will expand iteratively. Each entry: code (alpha-2), currency (ISO 4217), phonePrefix, flag

export interface CountryAll {
  code: string;
  name: string;
  nameAr?: string;
  phonePrefix: string;
  currency: string;
  flag: string;
}

export const COUNTRIES_ALL: CountryAll[] = [
  // Americas
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', phonePrefix: '+1', currency: 'USD', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', phonePrefix: '+1', currency: 'CAD', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', nameAr: 'المكسيك', phonePrefix: '+52', currency: 'MXN', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل', phonePrefix: '+55', currency: 'BRL', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', nameAr: 'الأرجنتين', phonePrefix: '+54', currency: 'ARS', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', nameAr: 'تشيلي', phonePrefix: '+56', currency: 'CLP', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', nameAr: 'كولومبيا', phonePrefix: '+57', currency: 'COP', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', nameAr: 'بيرو', phonePrefix: '+51', currency: 'PEN', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', nameAr: 'أوروغواي', phonePrefix: '+598', currency: 'UYU', flag: '🇺🇾' },
  { code: 'EC', name: 'Ecuador', nameAr: 'الإكوادور', phonePrefix: '+593', currency: 'USD', flag: '🇪🇨' },

  // Europe (sample subset)
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', phonePrefix: '+44', currency: 'GBP', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', phonePrefix: '+49', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', phonePrefix: '+33', currency: 'EUR', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', phonePrefix: '+34', currency: 'EUR', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', phonePrefix: '+39', currency: 'EUR', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', nameAr: 'هولندا', phonePrefix: '+31', currency: 'EUR', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', nameAr: 'السويد', phonePrefix: '+46', currency: 'SEK', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', nameAr: 'النرويج', phonePrefix: '+47', currency: 'NOK', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', nameAr: 'الدنمارك', phonePrefix: '+45', currency: 'DKK', flag: '🇩🇰' },
  { code: 'PL', name: 'Poland', nameAr: 'بولندا', phonePrefix: '+48', currency: 'PLN', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czechia', nameAr: 'التشيك', phonePrefix: '+420', currency: 'CZK', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', nameAr: 'المجر', phonePrefix: '+36', currency: 'HUF', flag: '🇭🇺' },

  // MENA & Gulf
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', phonePrefix: '+966', currency: 'SAR', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', phonePrefix: '+971', currency: 'AED', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', phonePrefix: '+974', currency: 'QAR', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', phonePrefix: '+965', currency: 'KWD', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', phonePrefix: '+973', currency: 'BHD', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان', phonePrefix: '+968', currency: 'OMR', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', phonePrefix: '+962', currency: 'JOD', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', phonePrefix: '+961', currency: 'LBP', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', phonePrefix: '+964', currency: 'IQD', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', nameAr: 'إيران', phonePrefix: '+98', currency: 'IRR', flag: '🇮🇷' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', phonePrefix: '+90', currency: 'TRY', flag: '🇹🇷' },
  { code: 'IL', name: 'Israel', nameAr: 'إسرائيل', phonePrefix: '+972', currency: 'ILS', flag: '🇮🇱' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', phonePrefix: '+970', currency: 'ILS', flag: '🇵🇸' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', phonePrefix: '+20', currency: 'EGP', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', phonePrefix: '+212', currency: 'MAD', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', phonePrefix: '+216', currency: 'TND', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', phonePrefix: '+213', currency: 'DZD', flag: '🇩🇿' },

  // Africa (subset including CFA zones)
  { code: 'NG', name: 'Nigeria', nameAr: 'نيجيريا', phonePrefix: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', nameAr: 'جنوب أفريقيا', phonePrefix: '+27', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', nameAr: 'كينيا', phonePrefix: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', nameAr: 'غانا', phonePrefix: '+233', currency: 'GHS', flag: '🇬🇭' },
  { code: 'ET', name: 'Ethiopia', nameAr: 'إثيوبيا', phonePrefix: '+251', currency: 'ETB', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', nameAr: 'تنزانيا', phonePrefix: '+255', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', nameAr: 'أوغندا', phonePrefix: '+256', currency: 'UGX', flag: '🇺🇬' },
  { code: 'ZW', name: 'Zimbabwe', nameAr: 'زيمبابوي', phonePrefix: '+263', currency: 'ZWL', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', nameAr: 'زامبيا', phonePrefix: '+260', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'RW', name: 'Rwanda', nameAr: 'رواندا', phonePrefix: '+250', currency: 'RWF', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', nameAr: 'السنغال', phonePrefix: '+221', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", nameAr: 'ساحل العاج', phonePrefix: '+225', currency: 'XOF', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali', nameAr: 'مالي', phonePrefix: '+223', currency: 'XOF', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', nameAr: 'بوركينا فاسو', phonePrefix: '+226', currency: 'XOF', flag: '🇧🇫' },
  { code: 'CM', name: 'Cameroon', nameAr: 'الكاميرون', phonePrefix: '+237', currency: 'XAF', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', nameAr: 'الغابون', phonePrefix: '+241', currency: 'XAF', flag: '🇬🇦' },
  { code: 'TD', name: 'Chad', nameAr: 'تشاد', phonePrefix: '+235', currency: 'XAF', flag: '🇹🇩' },

  // Asia Pacific (subset)
  { code: 'IN', name: 'India', nameAr: 'الهند', phonePrefix: '+91', currency: 'INR', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا', phonePrefix: '+62', currency: 'IDR', flag: '🇮🇩' },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان', phonePrefix: '+92', currency: 'PKR', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش', phonePrefix: '+880', currency: 'BDT', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', nameAr: 'سريلانكا', phonePrefix: '+94', currency: 'LKR', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', nameAr: 'نيبال', phonePrefix: '+977', currency: 'NPR', flag: '🇳🇵' },
  { code: 'BT', name: 'Bhutan', nameAr: 'بوتان', phonePrefix: '+975', currency: 'BTN', flag: '🇧🇹' },
  { code: 'MM', name: 'Myanmar', nameAr: 'ميانمار', phonePrefix: '+95', currency: 'MMK', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', nameAr: 'كمبوديا', phonePrefix: '+855', currency: 'KHR', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', nameAr: 'لاوس', phonePrefix: '+856', currency: 'LAK', flag: '🇱🇦' },
  { code: 'VN', name: 'Vietnam', nameAr: 'فيتنام', phonePrefix: '+84', currency: 'VND', flag: '🇻🇳' },
  { code: 'TH', name: 'Thailand', nameAr: 'تايلاند', phonePrefix: '+66', currency: 'THB', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا', phonePrefix: '+60', currency: 'MYR', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', nameAr: 'سنغافورة', phonePrefix: '+65', currency: 'SGD', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', nameAr: 'هونغ كونغ', phonePrefix: '+852', currency: 'HKD', flag: '🇭🇰' },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية', phonePrefix: '+82', currency: 'KRW', flag: '🇰🇷' },
  { code: 'CN', name: 'China', nameAr: 'الصين', phonePrefix: '+86', currency: 'CNY', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان', phonePrefix: '+81', currency: 'JPY', flag: '🇯🇵' },
  { code: 'NZ', name: 'New Zealand', nameAr: 'نيوزيلندا', phonePrefix: '+64', currency: 'NZD', flag: '🇳🇿' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', phonePrefix: '+61', currency: 'AUD', flag: '🇦🇺' },
];

