import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

// قائمة أعلام الدول بـ HTML entities للعرض فقط (Country Tags)
const countryFlags = [
  { code: 'SA', name: 'السعودية', nameEn: 'Saudi Arabia', flagHtml: '&#127480;&#127462;' }, // 🇸🇦
  { code: 'AE', name: 'الإمارات', nameEn: 'UAE', flagHtml: '&#127462;&#127466;' }, // 🇦🇪
  { code: 'EG', name: 'مصر', nameEn: 'Egypt', flagHtml: '&#127466;&#127468;' }, // 🇪🇬
  { code: 'MA', name: 'المغرب', nameEn: 'Morocco', flagHtml: '&#127474;&#127462;' }, // 🇲🇦
  { code: 'DZ', name: 'الجزائر', nameEn: 'Algeria', flagHtml: '&#127465;&#127487;' }, // 🇩🇿
  { code: 'TN', name: 'تونس', nameEn: 'Tunisia', flagHtml: '&#127481;&#127475;' }, // 🇹🇳
  { code: 'LY', name: 'ليبيا', nameEn: 'Libya', flagHtml: '&#127473;&#127486;' }, // 🇱🇾
  { code: 'SD', name: 'السودان', nameEn: 'Sudan', flagHtml: '&#127480;&#127465;' }, // 🇸🇩
  { code: 'JO', name: 'الأردن', nameEn: 'Jordan', flagHtml: '&#127471;&#127476;' }, // 🇯🇴
  { code: 'LB', name: 'لبنان', nameEn: 'Lebanon', flagHtml: '&#127473;&#127463;' }, // 🇱🇧
  { code: 'SY', name: 'سوريا', nameEn: 'Syria', flagHtml: '&#127480;&#127486;' }, // 🇸🇾
  { code: 'IQ', name: 'العراق', nameEn: 'Iraq', flagHtml: '&#127470;&#127478;' }, // 🇮🇶
  { code: 'KW', name: 'الكويت', nameEn: 'Kuwait', flagHtml: '&#127472;&#127484;' }, // 🇰🇼
  { code: 'QA', name: 'قطر', nameEn: 'Qatar', flagHtml: '&#127478;&#127462;' }, // 🇶🇦
  { code: 'BH', name: 'البحرين', nameEn: 'Bahrain', flagHtml: '&#127463;&#127469;' }, // 🇧🇭
  { code: 'OM', name: 'عمان', nameEn: 'Oman', flagHtml: '&#127476;&#127474;' }, // 🇴🇲
  { code: 'YE', name: 'اليمن', nameEn: 'Yemen', flagHtml: '&#127486;&#127466;' }, // 🇾🇪
  { code: 'PS', name: 'فلسطين', nameEn: 'Palestine', flagHtml: '&#127477;&#127480;' }, // 🇵🇸
  { code: 'US', name: 'أمريكا', nameEn: 'United States', flagHtml: '&#127482;&#127480;' }, // 🇺🇸
  { code: 'GB', name: 'بريطانيا', nameEn: 'United Kingdom', flagHtml: '&#127468;&#127463;' }, // 🇬🇧
  { code: 'FR', name: 'فرنسا', nameEn: 'France', flagHtml: '&#127467;&#127479;' }, // 🇫🇷
  { code: 'DE', name: 'ألمانيا', nameEn: 'Germany', flagHtml: '&#127465;&#127466;' }, // 🇩🇪
  { code: 'IT', name: 'إيطاليا', nameEn: 'Italy', flagHtml: '&#127470;&#127481;' }, // 🇮🇹
  { code: 'ES', name: 'إسبانيا', nameEn: 'Spain', flagHtml: '&#127466;&#127480;' }, // 🇪🇸
  { code: 'TR', name: 'تركيا', nameEn: 'Turkey', flagHtml: '&#127481;&#127479;' }, // 🇹🇷
  { code: 'IR', name: 'إيران', nameEn: 'Iran', flagHtml: '&#127470;&#127479;' }, // 🇮🇷
  { code: 'PK', name: 'باكستان', nameEn: 'Pakistan', flagHtml: '&#127477;&#127472;' }, // 🇵🇰
  { code: 'IN', name: 'الهند', nameEn: 'India', flagHtml: '&#127470;&#127475;' }, // 🇮🇳
  { code: 'BD', name: 'بنغلاديش', nameEn: 'Bangladesh', flagHtml: '&#127463;&#127465;' }, // 🇧🇩
  { code: 'ID', name: 'إندونيسيا', nameEn: 'Indonesia', flagHtml: '&#127470;&#127465;' }, // 🇮🇩
  { code: 'MY', name: 'ماليزيا', nameEn: 'Malaysia', flagHtml: '&#127474;&#127486;' }, // 🇲🇾
  { code: 'CN', name: 'الصين', nameEn: 'China', flagHtml: '&#127464;&#127475;' }, // 🇨🇳
  { code: 'JP', name: 'اليابان', nameEn: 'Japan', flagHtml: '&#127471;&#127477;' }, // 🇯🇵
  { code: 'KR', name: 'كوريا الجنوبية', nameEn: 'South Korea', flagHtml: '&#127472;&#127479;' }, // 🇰🇷
  { code: 'RU', name: 'روسيا', nameEn: 'Russia', flagHtml: '&#127479;&#127482;' }, // 🇷🇺
  { code: 'CA', name: 'كندا', nameEn: 'Canada', flagHtml: '&#127464;&#127462;' }, // 🇨🇦
  { code: 'AU', name: 'أستراليا', nameEn: 'Australia', flagHtml: '&#127462;&#127482;' }, // 🇦🇺
  { code: 'BR', name: 'البرازيل', nameEn: 'Brazil', flagHtml: '&#127463;&#127479;' }, // 🇧🇷
  { code: 'MX', name: 'المكسيك', nameEn: 'Mexico', flagHtml: '&#127474;&#127485;' }, // 🇲🇽
  { code: 'AR', name: 'الأرجنتين', nameEn: 'Argentina', flagHtml: '&#127462;&#127479;' }, // 🇦🇷
  { code: 'ZA', name: 'جنوب أفريقيا', nameEn: 'South Africa', flagHtml: '&#127487;&#127462;' }, // 🇿🇦
  { code: 'NG', name: 'نيجيريا', nameEn: 'Nigeria', flagHtml: '&#127475;&#127468;' }, // 🇳🇬
  { code: 'KE', name: 'كينيا', nameEn: 'Kenya', flagHtml: '&#127472;&#127466;' }, // 🇰🇪
  { code: 'ET', name: 'إثيوبيا', nameEn: 'Ethiopia', flagHtml: '&#127466;&#127481;' }, // 🇪🇹
  { code: 'CI', name: 'ساحل العاج', nameEn: 'Ivory Coast', flagHtml: '&#127464;&#127470;' }, // 🇨🇮
  { code: 'SN', name: 'السنغال', nameEn: 'Senegal', flagHtml: '&#127480;&#127475;' }, // 🇸🇳
  { code: 'ML', name: 'مالي', nameEn: 'Mali', flagHtml: '&#127474;&#127473;' }, // 🇲🇱
  { code: 'BF', name: 'بوركينا فاسو', nameEn: 'Burkina Faso', flagHtml: '&#127463;&#127467;' }, // 🇧🇫
  { code: 'NE', name: 'النيجر', nameEn: 'Niger', flagHtml: '&#127475;&#127466;' }, // 🇳🇪
  { code: 'TD', name: 'تشاد', nameEn: 'Chad', flagHtml: '&#127481;&#127465;' }, // 🇹🇩
  { code: 'CM', name: 'الكاميرون', nameEn: 'Cameroon', flagHtml: '&#127464;&#127474;' }, // 🇨🇲
  { code: 'GA', name: 'الغابون', nameEn: 'Gabon', flagHtml: '&#127468;&#127462;' }, // 🇬🇦
  { code: 'CG', name: 'الكونغو', nameEn: 'Congo', flagHtml: '&#127464;&#127468;' }, // 🇨🇬
  { code: 'CD', name: 'الكونغو الديمقراطية', nameEn: 'DR Congo', flagHtml: '&#127464;&#127465;' }, // 🇨🇩
  { code: 'CF', name: 'أفريقيا الوسطى', nameEn: 'Central African Republic', flagHtml: '&#127464;&#127467;' }, // 🇨🇫
  { code: 'GQ', name: 'غينيا الاستوائية', nameEn: 'Equatorial Guinea', flagHtml: '&#127468;&#127478;' }, // 🇬🇶
  { code: 'DJ', name: 'جيبوتي', nameEn: 'Djibouti', flagHtml: '&#127465;&#127471;' }, // 🇩🇯
  { code: 'SO', name: 'الصومال', nameEn: 'Somalia', flagHtml: '&#127480;&#127476;' }, // 🇸🇴
  { code: 'ER', name: 'إريتريا', nameEn: 'Eritrea', flagHtml: '&#127466;&#127479;' }, // 🇪🇷
  { code: 'UG', name: 'أوغندا', nameEn: 'Uganda', flagHtml: '&#127482;&#127468;' }, // 🇺🇬
  { code: 'TZ', name: 'تنزانيا', nameEn: 'Tanzania', flagHtml: '&#127481;&#127487;' }, // 🇹🇿
  { code: 'RW', name: 'رواندا', nameEn: 'Rwanda', flagHtml: '&#127479;&#127484;' }, // 🇷🇼
  { code: 'BI', name: 'بوروندي', nameEn: 'Burundi', flagHtml: '&#127463;&#127470;' }, // 🇧🇮
  { code: 'MW', name: 'مالاوي', nameEn: 'Malawi', flagHtml: '&#127474;&#127484;' }, // 🇲🇼
  { code: 'ZM', name: 'زامبيا', nameEn: 'Zambia', flagHtml: '&#127487;&#127474;' }, // 🇿🇲
  { code: 'ZW', name: 'زيمبابوي', nameEn: 'Zimbabwe', flagHtml: '&#127487;&#127484;' }, // 🇿🇼
  { code: 'BW', name: 'بوتسوانا', nameEn: 'Botswana', flagHtml: '&#127463;&#127484;' }, // 🇧🇼
  { code: 'NA', name: 'ناميبيا', nameEn: 'Namibia', flagHtml: '&#127475;&#127462;' }, // 🇳🇦
  { code: 'SZ', name: 'إسواتيني', nameEn: 'Eswatini', flagHtml: '&#127480;&#127487;' }, // 🇸🇿
  { code: 'LS', name: 'ليسوتو', nameEn: 'Lesotho', flagHtml: '&#127473;&#127480;' }, // 🇱🇸
  { code: 'MZ', name: 'موزمبيق', nameEn: 'Mozambique', flagHtml: '&#127474;&#127487;' }, // 🇲🇿
  { code: 'MG', name: 'مدغشقر', nameEn: 'Madagascar', flagHtml: '&#127474;&#127468;' }, // 🇲🇬
  { code: 'MU', name: 'موريشيوس', nameEn: 'Mauritius', flagHtml: '&#127474;&#127482;' }, // 🇲🇺
  { code: 'SC', name: 'سيشل', nameEn: 'Seychelles', flagHtml: '&#127480;&#127464;' }, // 🇸🇨
  { code: 'KM', name: 'جزر القمر', nameEn: 'Comoros', flagHtml: '&#127472;&#127474;' }, // 🇰🇲
  { code: 'CV', name: 'الرأس الأخضر', nameEn: 'Cape Verde', flagHtml: '&#127464;&#127483;' }, // 🇨🇻
  { code: 'ST', name: 'ساو تومي وبرينسيبي', nameEn: 'São Tomé and Príncipe', flagHtml: '&#127480;&#127481;' }, // 🇸🇹
  { code: 'GH', name: 'غانا', nameEn: 'Ghana', flagHtml: '&#127468;&#127469;' }, // 🇬🇭
  { code: 'TG', name: 'توغو', nameEn: 'Togo', flagHtml: '&#127481;&#127468;' }, // 🇹🇬
  { code: 'BJ', name: 'بنين', nameEn: 'Benin', flagHtml: '&#127463;&#127471;' }, // 🇧🇯
  { code: 'LR', name: 'ليبيريا', nameEn: 'Liberia', flagHtml: '&#127473;&#127479;' }, // 🇱🇷
  { code: 'SL', name: 'سيراليون', nameEn: 'Sierra Leone', flagHtml: '&#127480;&#127473;' }, // 🇸🇱
  { code: 'GN', name: 'غينيا', nameEn: 'Guinea', flagHtml: '&#127468;&#127475;' }, // 🇬🇳
  { code: 'GW', name: 'غينيا بيساو', nameEn: 'Guinea-Bissau', flagHtml: '&#127468;&#127484;' }, // 🇬🇼
  { code: 'GM', name: 'غامبيا', nameEn: 'Gambia', flagHtml: '&#127468;&#127474;' }, // 🇬🇲
  { code: 'MR', name: 'موريتانيا', nameEn: 'Mauritania', flagHtml: '&#127474;&#127479;' } // 🇲🇷
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
            <span
              className="text-lg"
              dangerouslySetInnerHTML={{ __html: selectedCountry.flagHtml }}
            />
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
                <span
                  className="text-lg"
                  dangerouslySetInnerHTML={{ __html: country.flagHtml }}
                />
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