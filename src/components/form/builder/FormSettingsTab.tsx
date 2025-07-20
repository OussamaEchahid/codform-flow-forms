import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES, CURRENCIES, getCountryByCode } from '@/lib/constants/countries-currencies';

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
  formTitle,
  formDescription,
  country,
  currency,
  phonePrefix,
  onTitleChange,
  onDescriptionChange,
  onCountryChange,
  onCurrencyChange,
}) => {
  const { language } = useI18n();

  const handleCountryChange = (newCountry: string) => {
    const countryData = getCountryByCode(newCountry);
    onCountryChange(newCountry);
    if (countryData) {
      onCurrencyChange(countryData.currency);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Form Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'معلومات النموذج الأساسية' : 'Basic Form Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="form-title">
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </Label>
            <Input
              id="form-title"
              value={formTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
            />
          </div>
          
          <div>
            <Label htmlFor="form-description">
              {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
            </Label>
            <Textarea
              id="form-description"
              value={formDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل وصف النموذج (اختياري)' : 'Enter form description (optional)'}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

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
            <Input
              id="phone-prefix"
              value={phonePrefix}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500 mt-1">
              {language === 'ar' 
                ? 'يتم تحديث كود الهاتف تلقائياً عند تغيير الدولة' 
                : 'Phone prefix is automatically updated when country changes'
              }
            </p>
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
                ? '• العملاء لن يحتاجوا لإدخال كود الدولة مع رقم الهاتف'
                : '• Customers won\'t need to enter country code with phone number'
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