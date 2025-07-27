import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import PopupButton from '@/components/form/preview/PopupButton';
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
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        {language === 'ar' ? 'إعدادات النموذج المنبثق' : 'Popup Form Settings'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {language === 'ar' ? 'إعدادات النموذج المنبثق' : 'Popup Form Settings'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </TabsTrigger>
              <TabsTrigger value="preview">
                {language === 'ar' ? 'المعاينة' : 'Preview'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="flex-1 overflow-y-auto p-1">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      ⚙️ {language === 'ar' ? 'إعدادات عامة' : 'General Settings'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto p-1">
              <div className="h-full">
                {/* Live Preview */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      👁️ {language === 'ar' ? 'معاينة مباشرة للزر' : 'Live Button Preview'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border flex items-center justify-center p-6">
                      {popupButton.enabled ? (
                        <div className="w-full max-w-md">
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
                              padding: `${popupButton.paddingY} 32px`,
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                              minHeight: '60px',
                              cursor: 'pointer'
                            }}
                          >
                            {popupButton.showIcon ? '🛒 ' : ''}{popupButton.text}
                          </button>
                          <div className="mt-4 text-center text-sm text-gray-500">
                            {language === 'ar' 
                              ? 'هذا هو شكل الزر الذي سيظهر في المتجر'
                              : 'This is how the button will appear in your store'
                            }
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Settings className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium mb-2">
                            {language === 'ar' 
                              ? 'النموذج المنبثق معطل' 
                              : 'Popup Form Disabled'
                            }
                          </p>
                          <p className="text-sm">
                            {language === 'ar' 
                              ? 'قم بتفعيل النموذج المنبثق لرؤية معاينة الزر' 
                              : 'Enable popup form to see button preview'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {popupButton.enabled ? (
                  <span className="text-green-600 font-medium">
                    ✅ {language === 'ar' ? 'النموذج المنبثق مفعل' : 'Popup form enabled'}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    ❌ {language === 'ar' ? 'النموذج المنبثق معطل' : 'Popup form disabled'}
                  </span>
                )}
              </div>
              <Button onClick={() => setIsOpen(false)} size="lg">
                {language === 'ar' ? 'حفظ وإغلاق' : 'Save & Close'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PopupButtonManager;