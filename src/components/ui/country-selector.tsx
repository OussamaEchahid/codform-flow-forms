import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// قائمة أعلام الدول للعرض فقط (Country Tags) - أعلام emoji مرئية
const countryFlags = [
  { code: 'SA', flag: '🇸🇦' },
  { code: 'AE', flag: '🇦🇪' },
  { code: 'EG', flag: '🇪🇬' },
  { code: 'MA', flag: '🇲🇦' },
  { code: 'DZ', flag: '🇩🇿' },
  { code: 'TN', flag: '🇹🇳' },
  { code: 'LY', flag: '🇱🇾' },
  { code: 'SD', flag: '🇸🇩' },
  { code: 'JO', flag: '🇯🇴' },
  { code: 'LB', flag: '🇱🇧' },
  { code: 'SY', flag: '🇸🇾' },
  { code: 'IQ', flag: '🇮🇶' },
  { code: 'KW', flag: '🇰🇼' },
  { code: 'QA', flag: '🇶🇦' },
  { code: 'BH', flag: '🇧🇭' },
  { code: 'OM', flag: '🇴🇲' },
  { code: 'YE', flag: '🇾🇪' },
  { code: 'PS', flag: '🇵🇸' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'IT', flag: '🇮🇹' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'TR', flag: '🇹🇷' },
  { code: 'IR', flag: '🇮🇷' },
  { code: 'PK', flag: '🇵🇰' },
  { code: 'IN', flag: '🇮🇳' },
  { code: 'BD', flag: '🇧🇩' },
  { code: 'ID', flag: '🇮🇩' },
  { code: 'MY', flag: '🇲🇾' },
  { code: 'CN', flag: '🇨🇳' },
  { code: 'JP', flag: '🇯🇵' },
  { code: 'KR', flag: '🇰🇷' },
  { code: 'RU', flag: '🇷🇺' },
  { code: 'CA', flag: '🇨🇦' },
  { code: 'AU', flag: '🇦🇺' },
  { code: 'BR', flag: '🇧🇷' },
  { code: 'MX', flag: '🇲🇽' },
  { code: 'AR', flag: '🇦🇷' },
  { code: 'ZA', flag: '🇿🇦' },
  { code: 'NG', flag: '🇳🇬' },
  { code: 'KE', flag: '🇰🇪' },
  { code: 'ET', flag: '🇪🇹' },
  { code: 'CI', flag: '🇨🇮' },
  { code: 'SN', flag: '🇸🇳' },
  { code: 'ML', flag: '🇲🇱' },
  { code: 'BF', flag: '🇧🇫' },
  { code: 'NE', flag: '🇳🇪' },
  { code: 'TD', flag: '🇹🇩' },
  { code: 'CM', flag: '🇨🇲' },
  { code: 'GA', flag: '🇬🇦' },
  { code: 'CG', flag: '🇨🇬' },
  { code: 'CD', flag: '🇨🇩' },
  { code: 'CF', flag: '🇨🇫' },
  { code: 'GQ', flag: '🇬🇶' },
  { code: 'DJ', flag: '🇩🇯' },
  { code: 'SO', flag: '🇸🇴' },
  { code: 'ER', flag: '🇪🇷' },
  { code: 'UG', flag: '🇺🇬' },
  { code: 'TZ', flag: '🇹🇿' },
  { code: 'RW', flag: '🇷🇼' },
  { code: 'BI', flag: '🇧🇮' },
  { code: 'MW', flag: '🇲🇼' },
  { code: 'ZM', flag: '🇿🇲' },
  { code: 'ZW', flag: '🇿🇼' },
  { code: 'BW', flag: '🇧🇼' },
  { code: 'NA', flag: '🇳🇦' },
  { code: 'SZ', flag: '🇸🇿' },
  { code: 'LS', flag: '🇱🇸' },
  { code: 'MZ', flag: '🇲🇿' },
  { code: 'MG', flag: '🇲🇬' },
  { code: 'MU', flag: '🇲🇺' },
  { code: 'SC', flag: '🇸🇨' },
  { code: 'KM', flag: '🇰🇲' },
  { code: 'CV', flag: '🇨🇻' },
  { code: 'ST', flag: '🇸🇹' },
  { code: 'GH', flag: '🇬🇭' },
  { code: 'TG', flag: '🇹🇬' },
  { code: 'BJ', flag: '🇧🇯' },
  { code: 'LR', flag: '🇱🇷' },
  { code: 'SL', flag: '🇸🇱' },
  { code: 'GN', flag: '🇬🇳' },
  { code: 'GW', flag: '🇬🇼' },
  { code: 'GM', flag: '🇬🇲' },
  { code: 'MR', flag: '🇲🇷' }
];

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (countryCode: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange
}) => {
  const [open, setOpen] = useState(false);

  const selectedCountry = countryFlags.find(country => country.code === value);

  const handleSelect = (countryCode: string) => {
    onValueChange?.(countryCode);
    setOpen(false);
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
            <span className="text-lg">🌍</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="center">
        <div className="max-h-60 overflow-y-auto grid grid-cols-6 gap-1">
          {countryFlags.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country.code)}
              className="w-full flex items-center justify-center p-2 hover:bg-muted rounded-md transition-colors"
              title={country.code}
            >
              <span className="text-2xl">{country.flag}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};