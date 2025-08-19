import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COUNTRIES_ALL } from '@/lib/constants/countries-all';

// تحويل قائمة الدول إلى أعلام مع صور SVG
const countryFlags = COUNTRIES_ALL.map(country => ({
  code: country.code,
  flag: `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`,
  name: country.name,
  nameAr: country.nameAr
}));

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (countryCode: string) => void;
  defaultCountry?: string; // الدولة الافتراضية من إعدادات النموذج
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange,
  defaultCountry
}) => {
  const [open, setOpen] = useState(false);

  // استخدام القيمة المحفوظة أو الافتراضية من إعدادات النموذج
  const currentValue = value || defaultCountry || 'SA';
  const selectedCountry = countryFlags.find(country => country.code === currentValue);

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
            <img
              src={selectedCountry.flag}
              alt={selectedCountry.code}
              className="w-5 h-4 object-cover rounded-sm"
            />
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
              <img
                src={country.flag}
                alt={country.code}
                className="w-8 h-6 object-cover rounded-sm"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};