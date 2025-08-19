import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// قائمة أعلام الدول للعرض فقط (Country Tags) - باستخدام صور SVG
const countryFlags = [
  { code: 'SA', flag: 'https://flagcdn.com/w40/sa.png' },
  { code: 'AE', flag: 'https://flagcdn.com/w40/ae.png' },
  { code: 'EG', flag: 'https://flagcdn.com/w40/eg.png' },
  { code: 'MA', flag: 'https://flagcdn.com/w40/ma.png' },
  { code: 'DZ', flag: 'https://flagcdn.com/w40/dz.png' },
  { code: 'TN', flag: 'https://flagcdn.com/w40/tn.png' },
  { code: 'LY', flag: 'https://flagcdn.com/w40/ly.png' },
  { code: 'SD', flag: 'https://flagcdn.com/w40/sd.png' },
  { code: 'JO', flag: 'https://flagcdn.com/w40/jo.png' },
  { code: 'LB', flag: 'https://flagcdn.com/w40/lb.png' },
  { code: 'SY', flag: 'https://flagcdn.com/w40/sy.png' },
  { code: 'IQ', flag: 'https://flagcdn.com/w40/iq.png' },
  { code: 'KW', flag: 'https://flagcdn.com/w40/kw.png' },
  { code: 'QA', flag: 'https://flagcdn.com/w40/qa.png' },
  { code: 'BH', flag: 'https://flagcdn.com/w40/bh.png' },
  { code: 'OM', flag: 'https://flagcdn.com/w40/om.png' },
  { code: 'YE', flag: 'https://flagcdn.com/w40/ye.png' },
  { code: 'PS', flag: 'https://flagcdn.com/w40/ps.png' },
  { code: 'US', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'GB', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'FR', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'DE', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'IT', flag: 'https://flagcdn.com/w40/it.png' },
  { code: 'ES', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'TR', flag: 'https://flagcdn.com/w40/tr.png' },
  { code: 'IR', flag: 'https://flagcdn.com/w40/ir.png' },
  { code: 'PK', flag: 'https://flagcdn.com/w40/pk.png' },
  { code: 'IN', flag: 'https://flagcdn.com/w40/in.png' },
  { code: 'BD', flag: 'https://flagcdn.com/w40/bd.png' },
  { code: 'ID', flag: 'https://flagcdn.com/w40/id.png' },
  { code: 'MY', flag: 'https://flagcdn.com/w40/my.png' },
  { code: 'CN', flag: 'https://flagcdn.com/w40/cn.png' },
  { code: 'JP', flag: 'https://flagcdn.com/w40/jp.png' },
  { code: 'KR', flag: 'https://flagcdn.com/w40/kr.png' },
  { code: 'RU', flag: 'https://flagcdn.com/w40/ru.png' },
  { code: 'CA', flag: 'https://flagcdn.com/w40/ca.png' },
  { code: 'AU', flag: 'https://flagcdn.com/w40/au.png' },
  { code: 'BR', flag: 'https://flagcdn.com/w40/br.png' },
  { code: 'MX', flag: 'https://flagcdn.com/w40/mx.png' },
  { code: 'AR', flag: 'https://flagcdn.com/w40/ar.png' },
  { code: 'ZA', flag: 'https://flagcdn.com/w40/za.png' },
  { code: 'NG', flag: 'https://flagcdn.com/w40/ng.png' },
  { code: 'KE', flag: 'https://flagcdn.com/w40/ke.png' },
  { code: 'ET', flag: 'https://flagcdn.com/w40/et.png' },
  { code: 'CI', flag: 'https://flagcdn.com/w40/ci.png' },
  { code: 'SN', flag: 'https://flagcdn.com/w40/sn.png' },
  { code: 'ML', flag: 'https://flagcdn.com/w40/ml.png' },
  { code: 'BF', flag: 'https://flagcdn.com/w40/bf.png' },
  { code: 'NE', flag: 'https://flagcdn.com/w40/ne.png' },
  { code: 'TD', flag: 'https://flagcdn.com/w40/td.png' },
  { code: 'CM', flag: 'https://flagcdn.com/w40/cm.png' },
  { code: 'GA', flag: 'https://flagcdn.com/w40/ga.png' },
  { code: 'CG', flag: 'https://flagcdn.com/w40/cg.png' },
  { code: 'CD', flag: 'https://flagcdn.com/w40/cd.png' },
  { code: 'CF', flag: 'https://flagcdn.com/w40/cf.png' },
  { code: 'GQ', flag: 'https://flagcdn.com/w40/gq.png' },
  { code: 'DJ', flag: 'https://flagcdn.com/w40/dj.png' },
  { code: 'SO', flag: 'https://flagcdn.com/w40/so.png' },
  { code: 'ER', flag: 'https://flagcdn.com/w40/er.png' },
  { code: 'UG', flag: 'https://flagcdn.com/w40/ug.png' },
  { code: 'TZ', flag: 'https://flagcdn.com/w40/tz.png' },
  { code: 'RW', flag: 'https://flagcdn.com/w40/rw.png' },
  { code: 'BI', flag: 'https://flagcdn.com/w40/bi.png' },
  { code: 'MW', flag: 'https://flagcdn.com/w40/mw.png' },
  { code: 'ZM', flag: 'https://flagcdn.com/w40/zm.png' },
  { code: 'ZW', flag: 'https://flagcdn.com/w40/zw.png' },
  { code: 'BW', flag: 'https://flagcdn.com/w40/bw.png' },
  { code: 'NA', flag: 'https://flagcdn.com/w40/na.png' },
  { code: 'SZ', flag: 'https://flagcdn.com/w40/sz.png' },
  { code: 'LS', flag: 'https://flagcdn.com/w40/ls.png' },
  { code: 'MZ', flag: 'https://flagcdn.com/w40/mz.png' },
  { code: 'MG', flag: 'https://flagcdn.com/w40/mg.png' },
  { code: 'MU', flag: 'https://flagcdn.com/w40/mu.png' },
  { code: 'SC', flag: 'https://flagcdn.com/w40/sc.png' },
  { code: 'KM', flag: 'https://flagcdn.com/w40/km.png' },
  { code: 'CV', flag: 'https://flagcdn.com/w40/cv.png' },
  { code: 'ST', flag: 'https://flagcdn.com/w40/st.png' },
  { code: 'GH', flag: 'https://flagcdn.com/w40/gh.png' },
  { code: 'TG', flag: 'https://flagcdn.com/w40/tg.png' },
  { code: 'BJ', flag: 'https://flagcdn.com/w40/bj.png' },
  { code: 'LR', flag: 'https://flagcdn.com/w40/lr.png' },
  { code: 'SL', flag: 'https://flagcdn.com/w40/sl.png' },
  { code: 'GN', flag: 'https://flagcdn.com/w40/gn.png' },
  { code: 'GW', flag: 'https://flagcdn.com/w40/gw.png' },
  { code: 'GM', flag: 'https://flagcdn.com/w40/gm.png' },
  { code: 'MR', flag: 'https://flagcdn.com/w40/mr.png' }
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