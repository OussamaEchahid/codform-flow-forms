
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

      {/* Popup Button Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'ar' ? 'إعدادات النافذة المنبثقة' : 'Popup Button Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {language === 'ar' ? 'تفعيل النافذة المنبثقة' : 'Enable Popup Button'}
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' 
                  ? 'إظهار زر عائم في المتجر للتمرير إلى النموذج'
                  : 'Show floating button in store to scroll to form'
                }
              </p>
            </div>
            <Switch 
              checked={isPopupEnabled}
              onCheckedChange={(enabled) => updatePopupButton({ enabled })}
            />
          </div>

          {isPopupEnabled && (
            <>
              {/* Button Text */}
              <div>
                <Label htmlFor="popup-text">
                  {language === 'ar' ? 'نص الزر' : 'Button Text'}
                </Label>
                <Input
                  id="popup-text"
                  value={(popupButton as any).text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
                  onChange={(e) => updatePopupButton({ text: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل نص الزر' : 'Enter button text'}
                />
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="popup-position">
                  {language === 'ar' ? 'موضع الزر' : 'Button Position'}
                </Label>
                <Select 
                  value={(popupButton as any).position || 'bottom-right'} 
                  onValueChange={(position) => updatePopupButton({ position })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="popup-bg-color">
                    {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                  </Label>
                  <Input
                    id="popup-bg-color"
                    type="color"
                    value={(popupButton as any).backgroundColor || '#9b87f5'}
                    onChange={(e) => updatePopupButton({ backgroundColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="popup-text-color">
                    {language === 'ar' ? 'لون النص' : 'Text Color'}
                  </Label>
                  <Input
                    id="popup-text-color"
                    type="color"
                    value={(popupButton as any).textColor || '#ffffff'}
                    onChange={(e) => updatePopupButton({ textColor: e.target.value })}
                  />
                </div>
              </div>

              {/* Animation */}
              <div>
                <Label htmlFor="popup-animation">
                  {language === 'ar' ? 'الحركة' : 'Animation'}
                </Label>
                <Select 
                  value={(popupButton as any).animation || 'none'} 
                  onValueChange={(animation) => updatePopupButton({ animation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {animationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show Icon Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-base">
                  {language === 'ar' ? 'إظهار الأيقونة' : 'Show Icon'}
                </Label>
                <Switch 
                  checked={(popupButton as any).showIcon !== false}
                  onCheckedChange={(showIcon) => updatePopupButton({ showIcon })}
                />
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {language === 'ar' ? 'معاينة الزر' : 'Button Preview'}
                </Label>
                <Button
                  className="inline-flex items-center gap-2"
                  style={{
                    backgroundColor: (popupButton as any).backgroundColor || '#9b87f5',
                    color: (popupButton as any).textColor || '#ffffff',
                    borderRadius: (popupButton as any).borderRadius || '8px'
                  }}
                >
                  {(popupButton as any).showIcon !== false && '🛒'}
                  {(popupButton as any).text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
                </Button>
              </div>
            </>
          )}
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
            {isPopupEnabled && (
              <p className="text-green-600 font-medium">
                {language === 'ar' 
                  ? '• الزر المنبثق سيظهر في المتجر عند نشر النموذج'
                  : '• Popup button will appear in store when form is published'
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSettingsTab;
