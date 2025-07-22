
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES, CURRENCIES, getCountryByCode } from '@/lib/constants/countries-currencies';
import { useFormStore } from '@/hooks/useFormStore';

interface FormSettingsTabProps {}

const FormSettingsTab: React.FC<FormSettingsTabProps> = () => {
  const { language } = useI18n();
  const { country, currency, phonePrefix, setCountry, setCurrency, setPhonePrefix } = useFormStore();

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    
    // Update the currency when country changes
    const countryData = getCountryByCode(newCountry);
    if (countryData && countryData.currency !== (currency || 'SAR')) {
      setCurrency(countryData.currency);
    }
  };

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
            <Select value={country || 'SA'} onValueChange={handleCountryChange}>
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
            <Select value={currency || 'SAR'} onValueChange={setCurrency}>
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

      {/* Form Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'معلومات مهمة' : 'Important Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              {language === 'ar' 
                ? '• سيتم تطبيق إعدادات الدولة والعملة على جميع الطلبات من هذا النموذج'
                : '• Country and currency settings will be applied to all orders from this form'
              }
            </p>
            <p>
              {language === 'ar' 
                ? '• العملاء سيستخدمون كود الدولة المحدد عند إدخال رقم الهاتف'
                : '• Customers will use the selected country code when entering phone numbers'
              }
            </p>
            <p>
              {language === 'ar' 
                ? '• سيتم إنشاء الطلبات في Shopify بالعملة المحددة'
                : '• Orders will be created in Shopify with the selected currency'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSettingsTab;
