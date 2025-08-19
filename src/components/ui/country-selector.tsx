import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

// قائمة أعلام الدول للعرض فقط (Country Tags)
const countryFlags = [
  { code: 'SA', name: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪' },
  { code: 'EG', name: 'مصر', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: 'MA', name: 'المغرب', nameEn: 'Morocco', flag: '🇲🇦' },
  { code: 'DZ', name: 'الجزائر', nameEn: 'Algeria', flag: '🇩🇿' },
  { code: 'TN', name: 'تونس', nameEn: 'Tunisia', flag: '🇹🇳' },
  { code: 'LY', name: 'ليبيا', nameEn: 'Libya', flag: '🇱🇾' },
  { code: 'SD', name: 'السودان', nameEn: 'Sudan', flag: '🇸🇩' },
  { code: 'JO', name: 'الأردن', nameEn: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'لبنان', nameEn: 'Lebanon', flag: '🇱🇧' },
  { code: 'SY', name: 'سوريا', nameEn: 'Syria', flag: '🇸🇾' },
  { code: 'IQ', name: 'العراق', nameEn: 'Iraq', flag: '🇮🇶' },
  { code: 'KW', name: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', nameEn: 'Qatar', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'عمان', nameEn: 'Oman', flag: '🇴🇲' },
  { code: 'YE', name: 'اليمن', nameEn: 'Yemen', flag: '🇾🇪' },
  { code: 'PS', name: 'فلسطين', nameEn: 'Palestine', flag: '🇵🇸' },
  { code: 'US', name: 'أمريكا', nameEn: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'بريطانيا', nameEn: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'فرنسا', nameEn: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'ألمانيا', nameEn: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'إيطاليا', nameEn: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'إسبانيا', nameEn: 'Spain', flag: '🇪🇸' },
  { code: 'TR', name: 'تركيا', nameEn: 'Turkey', flag: '🇹🇷' },
  { code: 'IR', name: 'إيران', nameEn: 'Iran', flag: '🇮🇷' },
  { code: 'PK', name: 'باكستان', nameEn: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', name: 'الهند', nameEn: 'India', flag: '🇮🇳' },
  { code: 'BD', name: 'بنغلاديش', nameEn: 'Bangladesh', flag: '🇧🇩' },
  { code: 'ID', name: 'إندونيسيا', nameEn: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'ماليزيا', nameEn: 'Malaysia', flag: '🇲🇾' },
  { code: 'CN', name: 'الصين', nameEn: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'اليابان', nameEn: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'كوريا الجنوبية', nameEn: 'South Korea', flag: '🇰🇷' },
  { code: 'RU', name: 'روسيا', nameEn: 'Russia', flag: '🇷🇺' },
  { code: 'CA', name: 'كندا', nameEn: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'أستراليا', nameEn: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'البرازيل', nameEn: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'المكسيك', nameEn: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'الأرجنتين', nameEn: 'Argentina', flag: '🇦🇷' },
  { code: 'ZA', name: 'جنوب أفريقيا', nameEn: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'نيجيريا', nameEn: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'كينيا', nameEn: 'Kenya', flag: '🇰🇪' },
  { code: 'ET', name: 'إثيوبيا', nameEn: 'Ethiopia', flag: '🇪🇹' },
  { code: 'CI', name: 'ساحل العاج', nameEn: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'SN', name: 'السنغال', nameEn: 'Senegal', flag: '🇸🇳' },
  { code: 'ML', name: 'مالي', nameEn: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'بوركينا فاسو', nameEn: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'NE', name: 'النيجر', nameEn: 'Niger', flag: '🇳🇪' },
  { code: 'TD', name: 'تشاد', nameEn: 'Chad', flag: '🇹🇩' },
  { code: 'CM', name: 'الكاميرون', nameEn: 'Cameroon', flag: '🇨🇲' },
  { code: 'GA', name: 'الغابون', nameEn: 'Gabon', flag: '🇬🇦' },
  { code: 'CG', name: 'الكونغو', nameEn: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'الكونغو الديمقراطية', nameEn: 'DR Congo', flag: '🇨🇩' },
  { code: 'CF', name: 'أفريقيا الوسطى', nameEn: 'Central African Republic', flag: '🇨🇫' },
  { code: 'GQ', name: 'غينيا الاستوائية', nameEn: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'DJ', name: 'جيبوتي', nameEn: 'Djibouti', flag: '🇩🇯' },
  { code: 'SO', name: 'الصومال', nameEn: 'Somalia', flag: '🇸🇴' },
  { code: 'ER', name: 'إريتريا', nameEn: 'Eritrea', flag: '🇪🇷' },
  { code: 'UG', name: 'أوغندا', nameEn: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'تنزانيا', nameEn: 'Tanzania', flag: '🇹🇿' },
  { code: 'RW', name: 'رواندا', nameEn: 'Rwanda', flag: '🇷🇼' },
  { code: 'BI', name: 'بوروندي', nameEn: 'Burundi', flag: '🇧🇮' },
  { code: 'MW', name: 'مالاوي', nameEn: 'Malawi', flag: '🇲🇼' },
  { code: 'ZM', name: 'زامبيا', nameEn: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'زيمبابوي', nameEn: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'BW', name: 'بوتسوانا', nameEn: 'Botswana', flag: '🇧🇼' },
  { code: 'NA', name: 'ناميبيا', nameEn: 'Namibia', flag: '🇳🇦' },
  { code: 'SZ', name: 'إسواتيني', nameEn: 'Eswatini', flag: '🇸🇿' },
  { code: 'LS', name: 'ليسوتو', nameEn: 'Lesotho', flag: '🇱🇸' },
  { code: 'MZ', name: 'موزمبيق', nameEn: 'Mozambique', flag: '🇲🇿' },
  { code: 'MG', name: 'مدغشقر', nameEn: 'Madagascar', flag: '🇲🇬' },
  { code: 'MU', name: 'موريشيوس', nameEn: 'Mauritius', flag: '🇲🇺' },
  { code: 'SC', name: 'سيشل', nameEn: 'Seychelles', flag: '🇸🇨' },
  { code: 'KM', name: 'جزر القمر', nameEn: 'Comoros', flag: '🇰🇲' },
  { code: 'CV', name: 'الرأس الأخضر', nameEn: 'Cape Verde', flag: '🇨🇻' },
  { code: 'ST', name: 'ساو تومي وبرينسيبي', nameEn: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'GH', name: 'غانا', nameEn: 'Ghana', flag: '🇬🇭' },
  { code: 'TG', name: 'توغو', nameEn: 'Togo', flag: '🇹🇬' },
  { code: 'BJ', name: 'بنين', nameEn: 'Benin', flag: '🇧🇯' },
  { code: 'LR', name: 'ليبيريا', nameEn: 'Liberia', flag: '🇱🇷' },
  { code: 'SL', name: 'سيراليون', nameEn: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'GN', name: 'غينيا', nameEn: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'غينيا بيساو', nameEn: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GM', name: 'غامبيا', nameEn: 'Gambia', flag: '🇬🇲' },
  { code: 'MR', name: 'موريتانيا', nameEn: 'Mauritania', flag: '🇲🇷' }
];

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (countryCode: string) => void;
  placeholder?: string;
  language?: 'ar' | 'en';
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange,
  language = 'ar'
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCountry = countryFlags.find(country => country.code === value);

  const filteredCountries = countryFlags.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (countryCode: string) => {
    onValueChange?.(countryCode);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {selectedCountry ? (
            <span className="text-lg">{selectedCountry.flag}</span>
          ) : (
            <span className="text-xs text-muted-foreground">🌍</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center">
        <div className="border-b p-3">
          <Input
            placeholder={language === 'ar' ? "البحث عن بلد..." : "Search country..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country.code)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted text-right"
              >
                <span className="text-lg">{country.flag}</span>
                <div className="flex-1 text-right">
                  <div className="font-medium">{language === 'ar' ? country.name : country.nameEn}</div>
                  <div className="text-xs text-muted-foreground">{country.code}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};