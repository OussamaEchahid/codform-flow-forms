import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Settings } from 'lucide-react';

interface PopupButtonConfig {
  enabled: boolean;
  text: string;
  fontSize: string;
  fontWeight: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  paddingY: string;
  animation: string;
  showIcon: boolean;
}

interface PopupButtonManagerProps {
  popupButton: PopupButtonConfig;
  onUpdate: (config: PopupButtonConfig) => void;
  fields: FormField[];
  formStyle: any;
}

const PopupButtonManager: React.FC<PopupButtonManagerProps> = ({
  popupButton,
  onUpdate,
  fields,
  formStyle
}) => {
  const { t, language } = useI18n();

  const handleConfigChange = (key: keyof PopupButtonConfig, value: any) => {
    onUpdate({ ...popupButton, [key]: value });
  };

  const fontWeightOptions = [
    { value: '300', label: language === 'ar' ? 'خفيف' : 'Light' },
    { value: '400', label: language === 'ar' ? 'عادي' : 'Normal' },
    { value: '500', label: language === 'ar' ? 'متوسط' : 'Medium' },
    { value: '600', label: language === 'ar' ? 'شبه عريض' : 'Semi Bold' },
    { value: '700', label: language === 'ar' ? 'عريض' : 'Bold' },
    { value: '800', label: language === 'ar' ? 'عريض جداً' : 'Extra Bold' }
  ];

  const animationOptions = [
    { value: 'none', label: language === 'ar' ? 'بدون حركة' : 'None' },
    { value: 'pulse', label: language === 'ar' ? 'نبضة' : 'Pulse' },
    { value: 'bounce', label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: 'shake', label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: 'wiggle', label: language === 'ar' ? 'تمايل' : 'Wiggle' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            ⚙️ {language === 'ar' ? 'إعدادات النموذج المنبثق' : 'Popup Form Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  {language === 'ar' ? 'تفعيل النموذج المنبثق' : 'Enable Popup Form'}
                </Label>
                <Switch
                  checked={popupButton.enabled}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
              </div>

              {popupButton.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <Label>
                        {language === 'ar' ? 'نص الزر' : 'Button Text'}
                      </Label>
                      <Input
                        value={popupButton.text}
                        onChange={(e) => handleConfigChange('text', e.target.value)}
                        placeholder={language === 'ar' ? 'اطلب الآن' : 'Order Now'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                        </Label>
                        <Input
                          value={popupButton.fontSize}
                          onChange={(e) => handleConfigChange('fontSize', e.target.value)}
                          placeholder="18px"
                        />
                      </div>

                      <div>
                        <Label>
                          {language === 'ar' ? 'وزن الخط' : 'Font Weight'}
                        </Label>
                        <Select
                          value={popupButton.fontWeight}
                          onValueChange={(value) => handleConfigChange('fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontWeightOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          {language === 'ar' ? 'لون النص' : 'Text Color'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={popupButton.textColor}
                            onChange={(e) => handleConfigChange('textColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={popupButton.textColor}
                            onChange={(e) => handleConfigChange('textColor', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>
                          {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={popupButton.backgroundColor}
                            onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={popupButton.backgroundColor}
                            onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                            placeholder="#9b87f5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>
                          {language === 'ar' ? 'لون الحدود' : 'Border Color'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={popupButton.borderColor}
                            onChange={(e) => handleConfigChange('borderColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={popupButton.borderColor}
                            onChange={(e) => handleConfigChange('borderColor', e.target.value)}
                            placeholder="#9b87f5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>
                          {language === 'ar' ? 'سمك الحدود' : 'Border Width'}
                        </Label>
                        <Input
                          value={popupButton.borderWidth}
                          onChange={(e) => handleConfigChange('borderWidth', e.target.value)}
                          placeholder="2px"
                        />
                      </div>

                      <div>
                        <Label>
                          {language === 'ar' ? 'نصف قطر الحدود' : 'Border Radius'}
                        </Label>
                        <Input
                          value={popupButton.borderRadius}
                          onChange={(e) => handleConfigChange('borderRadius', e.target.value)}
                          placeholder="8px"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          {language === 'ar' ? 'المسافة الداخلية (عمودي)' : 'Padding (Vertical)'}
                        </Label>
                        <Input
                          value={popupButton.paddingY}
                          onChange={(e) => handleConfigChange('paddingY', e.target.value)}
                          placeholder="16px"
                        />
                      </div>

                      <div>
                        <Label>
                          {language === 'ar' ? 'الحركة' : 'Animation'}
                        </Label>
                        <Select
                          value={popupButton.animation}
                          onValueChange={(value) => handleConfigChange('animation', value)}
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
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>
                        {language === 'ar' ? 'إظهار أيقونة السلة' : 'Show Cart Icon'}
                      </Label>
                      <Switch
                        checked={popupButton.showIcon}
                        onCheckedChange={(checked) => handleConfigChange('showIcon', checked)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Preview Section */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">
                👁️ {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
              </div>
              <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border flex items-center justify-center p-4">
                {popupButton.enabled ? (
                  <div className="w-full max-w-xs">
                    <button
                      className={`w-full transition-all duration-300 transform hover:scale-105 ${
                        popupButton.animation !== 'none' ? `animate-${popupButton.animation}` : ''
                      }`}
                      style={{
                        backgroundColor: popupButton.backgroundColor,
                        color: popupButton.textColor,
                        border: `${popupButton.borderWidth} solid ${popupButton.borderColor}`,
                        borderRadius: popupButton.borderRadius,
                        fontSize: popupButton.fontSize,
                        fontWeight: popupButton.fontWeight,
                        padding: `${popupButton.paddingY} 24px`,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        minHeight: '48px',
                        cursor: 'pointer'
                      }}
                    >
                      {popupButton.showIcon ? '🛒 ' : ''}{popupButton.text}
                    </button>
                    <div className="mt-3 text-center text-xs text-gray-500">
                      {language === 'ar' 
                        ? 'هذا هو شكل الزر في المتجر'
                        : 'Button preview for your store'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {language === 'ar' 
                        ? 'النموذج المنبثق معطل' 
                        : 'Popup Disabled'
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {language === 'ar' 
                        ? 'قم بتفعيل النموذج لرؤية المعاينة' 
                        : 'Enable to see preview'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupButtonManager;