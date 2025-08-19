import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { COUNTRIES_ALL } from '@/lib/constants/countries-all';

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (countryCode: string) => void;
  placeholder?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "اختر البلد"
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCountry = COUNTRIES_ALL.find(country => country.code === value);
  
  const filteredCountries = COUNTRIES_ALL.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (country.nameAr && country.nameAr.includes(searchTerm)) ||
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
            placeholder="البحث عن بلد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              لا توجد نتائج
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
                  <div className="font-medium">{country.nameAr || country.name}</div>
                  <div className="text-xs text-muted-foreground">{country.name}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};