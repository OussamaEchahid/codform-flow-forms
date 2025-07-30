
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES, CURRENCIES, getCountryByCode } from '@/lib/constants/countries-currencies';
import { useFormStore } from '@/hooks/useFormStore';

interface FormSettingsTabProps {
  formTitle: string;
  formDescription: string;
  country: string;
  currency: string;
  phonePrefix: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onCountryChange: (country: string) => void;
  onCurrencyChange: (currency: string) => void;
}

const FormSettingsTab: React.FC<FormSettingsTabProps> = ({
  country,
  currency,
  phonePrefix,
  onCountryChange,
  onCurrencyChange,
}) => {
  const { language } = useI18n();
  const { formState, setFormState } = useFormStore();

  const handleCountryChange = (newCountry: string) => {
    const countryData = getCountryByCode(newCountry);
    onCountryChange(newCountry);
    if (countryData) {
      onCurrencyChange(countryData.currency);
    }
  };

  // Popup Button Helpers
  const popupButton = formState?.style?.popupButton || { enabled: false };
  const isPopupEnabled = (popupButton as any).enabled || false;

  const updatePopupButton = (updates: any) => {
    setFormState({
      ...formState,
      style: {
        ...formState.style,
        popupButton: {
          enabled: false,
          text: language === 'ar' ? 'اطلب الآن' : 'Order Now',
          position: 'bottom-right',
          backgroundColor: formState.style?.primaryColor || '#9b87f5',
          textColor: '#ffffff',
          borderColor: formState.style?.primaryColor || '#9b87f5',
          borderWidth: '2px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          paddingY: '12px',
          showIcon: true,
          animation: 'none',
          ...formState.style?.popupButton,
          ...updates
        }
      }
    });
  };

  const positionOptions = [
    { value: 'bottom-right', label: language === 'ar' ? 'أسفل يمين' : 'Bottom Right' },
    { value: 'bottom-left', label: language === 'ar' ? 'أسفل يسار' : 'Bottom Left' },
    { value: 'top-right', label: language === 'ar' ? 'أعلى يمين' : 'Top Right' },
    { value: 'top-left', label: language === 'ar' ? 'أعلى يسار' : 'Top Left' },
    { value: 'center', label: language === 'ar' ? 'وسط الشاشة' : 'Center' }
  ];

  const animationOptions = [
    { value: 'none', label: language === 'ar' ? 'بدون حركة' : 'None' },
    { value: 'pulse', label: language === 'ar' ? 'نبضة' : 'Pulse' },
    { value: 'bounce', label: language === 'ar' ? 'قفز' : 'Bounce' },
    { value: 'shake', label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: 'wiggle', label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: 'flash', label: language === 'ar' ? 'وميض' : 'Flash' }
  ];

  return (
    <div className="space-y-6">
      {/* Country and Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'إعدادات الدولة والعملة' : 'Country & Currency Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="country-select">
              {language === 'ar' ? 'الدولة' : 'Country'}
            </Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر الدولة' : 'Select country'} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{language === 'ar' ? c.nameAr : c.name}</span>
                      <span className="text-sm text-gray-500">({c.phonePrefix})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency-select">
              {language === 'ar' ? 'العملة' : 'Currency'}
            </Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر العملة' : 'Select currency'} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      <span>{c.symbol}</span>
                      <span>{language === 'ar' ? c.nameAr : c.name}</span>
                      <span className="text-sm text-gray-500">({c.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone-prefix">
              {language === 'ar' ? 'كود الهاتف' : 'Phone Prefix'}
            </Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="font-medium">{phonePrefix}</span>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' 
                  ? 'يتم تحديث كود الهاتف تلقائياً عند تغيير الدولة' 
                  : 'Phone prefix is automatically updated when country changes'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default FormSettingsTab;
