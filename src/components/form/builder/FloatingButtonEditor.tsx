
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FloatingButtonConfig } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FloatingButtonEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  floatingButton: FloatingButtonConfig;
  onSave: (config: FloatingButtonConfig) => void;
}

const FloatingButtonEditor: React.FC<FloatingButtonEditorProps> = ({
  isOpen,
  onOpenChange,
  floatingButton,
  onSave,
}) => {
  const { language } = useI18n();
  const [config, setConfig] = useState<FloatingButtonConfig>(floatingButton || {
    enabled: false,
    text: language === 'ar' ? 'اطلب الآن' : 'Order Now',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderRadius: '4px',
    borderWidth: '0',
    paddingY: '10',
    marginBottom: '20',
    showIcon: true,
    icon: 'shopping-cart',
    animation: 'none',
    fontSize: '16',
    fontWeight: '500',
  });

  const handleChange = (key: keyof FloatingButtonConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إعدادات زر التنقل العائم' : 'Floating Button Settings'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'قم بتخصيص زر التنقل العائم الذي سيظهر للمستخدمين في الجزء السفلي من الصفحة'
              : 'Customize the floating navigation button that will appear at the bottom of the page'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">
                {language === 'ar' ? 'تفعيل الزر العائم' : 'Enable Floating Button'}
              </Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => handleChange('enabled', checked)}
              />
            </div>

            {config.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="button-text">
                    {language === 'ar' ? 'نص الزر' : 'Button Text'}
                  </Label>
                  <Input
                    id="button-text"
                    value={config.text || ''}
                    onChange={(e) => handleChange('text', e.target.value)}
                    placeholder={language === 'ar' ? 'اطلب الآن' : 'Order Now'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">
                    {language === 'ar' ? 'عائلة الخط' : 'Font Family'}
                  </Label>
                  <Select
                    value={config.fontFamily || 'default'}
                    onValueChange={(value) => handleChange('fontFamily', value === 'default' ? undefined : value)}
                  >
                    <SelectTrigger id="font-family">
                      <SelectValue placeholder={language === 'ar' ? 'اختر الخط' : 'Select font'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Tahoma, sans-serif">Tahoma</SelectItem>
                      <SelectItem value="'Tajawal', sans-serif">Tajawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="font-size">
                      {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                    </Label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Input
                        id="font-size"
                        type="range"
                        min="12"
                        max="28"
                        value={config.fontSize || '16'}
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        className="w-full"
                      />
                      <span>{config.fontSize || '16'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-weight">
                      {language === 'ar' ? 'وزن الخط' : 'Font Weight'}
                    </Label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Input
                        id="font-weight"
                        type="range"
                        min="100"
                        max="900"
                        step="100"
                        value={config.fontWeight || '500'}
                        onChange={(e) => handleChange('fontWeight', e.target.value)}
                        className="w-full"
                      />
                      <span>{config.fontWeight || '500'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">
                    {language === 'ar' ? 'لون النص' : 'Text Color'}
                  </Label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      id="text-color"
                      type="color"
                      value={config.textColor || '#ffffff'}
                      onChange={(e) => handleChange('textColor', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <Input
                      type="text"
                      value={config.textColor || '#ffffff'}
                      onChange={(e) => handleChange('textColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">
                    {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                  </Label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      id="background-color"
                      type="color"
                      value={config.backgroundColor || '#000000'}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <Input
                      type="text"
                      value={config.backgroundColor || '#000000'}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {config.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="border-color">
                  {language === 'ar' ? 'لون الحدود' : 'Border Color'}
                </Label>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    id="border-color"
                    type="color"
                    value={config.borderColor || '#000000'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className="w-10 h-10 rounded border"
                  />
                  <Input
                    type="text"
                    value={config.borderColor || '#000000'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="border-radius">
                    {language === 'ar' ? 'نصف قطر الحدود' : 'Border Radius'}
                  </Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      id="border-radius"
                      type="range"
                      min="0"
                      max="50"
                      value={parseInt(config.borderRadius || '4')}
                      onChange={(e) => handleChange('borderRadius', `${e.target.value}px`)}
                      className="w-full"
                    />
                    <span>{parseInt(config.borderRadius || '4')}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="border-width">
                    {language === 'ar' ? 'سمك الحدود' : 'Border Width'}
                  </Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      id="border-width"
                      type="range"
                      min="0"
                      max="10"
                      value={config.borderWidth || '0'}
                      onChange={(e) => handleChange('borderWidth', e.target.value)}
                      className="w-full"
                    />
                    <span>{config.borderWidth || '0'}px</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="padding-y">
                    {language === 'ar' ? 'تباعد عمودي' : 'Padding Y'}
                  </Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      id="padding-y"
                      type="range"
                      min="0"
                      max="50"
                      value={config.paddingY || '10'}
                      onChange={(e) => handleChange('paddingY', e.target.value)}
                      className="w-full"
                    />
                    <span>{config.paddingY || '10'}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-bottom">
                    {language === 'ar' ? 'هامش سفلي' : 'Margin Bottom'}
                  </Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      id="margin-bottom"
                      type="range"
                      min="0"
                      max="50"
                      value={config.marginBottom || '20'}
                      onChange={(e) => handleChange('marginBottom', e.target.value)}
                      className="w-full"
                    />
                    <span>{config.marginBottom || '20'}px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-icon">
                    {language === 'ar' ? 'إظهار الأيقونة' : 'Show Icon'}
                  </Label>
                  <Switch
                    id="show-icon"
                    checked={config.showIcon || false}
                    onCheckedChange={(checked) => handleChange('showIcon', checked)}
                  />
                </div>
                
                {config.showIcon && (
                  <div className="mt-2">
                    <Label htmlFor="icon" className="mb-1 block">
                      {language === 'ar' ? 'اختر الأيقونة' : 'Select Icon'}
                    </Label>
                    <Select
                      value={config.icon || 'shopping-cart'}
                      onValueChange={(value) => handleChange('icon', value)}
                    >
                      <SelectTrigger id="icon">
                        <SelectValue placeholder={language === 'ar' ? 'اختر الأيقونة' : 'Select icon'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopping-cart">
                          <div className="flex items-center">
                            <span className="mr-2">🛒</span>
                            {language === 'ar' ? 'عربة التسوق' : 'Shopping Cart'}
                          </div>
                        </SelectItem>
                        <SelectItem value="truck">
                          <div className="flex items-center">
                            <span className="mr-2">🚚</span>
                            {language === 'ar' ? 'شاحنة' : 'Truck'}
                          </div>
                        </SelectItem>
                        <SelectItem value="package">
                          <div className="flex items-center">
                            <span className="mr-2">📦</span>
                            {language === 'ar' ? 'طرد' : 'Package'}
                          </div>
                        </SelectItem>
                        <SelectItem value="send">
                          <div className="flex items-center">
                            <span className="mr-2">📤</span>
                            {language === 'ar' ? 'إرسال' : 'Send'}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="animation">
                  {language === 'ar' ? 'تأثير حركي' : 'Animation'}
                </Label>
                <Select
                  value={config.animation || 'none'}
                  onValueChange={(value) => handleChange('animation', value)}
                >
                  <SelectTrigger id="animation">
                    <SelectValue placeholder={language === 'ar' ? 'اختر التأثير الحركي' : 'Select animation'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === 'ar' ? 'بدون تأثير' : 'None'}</SelectItem>
                    <SelectItem value="pulse">{language === 'ar' ? 'نبض' : 'Pulse'}</SelectItem>
                    <SelectItem value="bounce">{language === 'ar' ? 'ارتداد' : 'Bounce'}</SelectItem>
                    <SelectItem value="shake">{language === 'ar' ? 'اهتزاز' : 'Shake'}</SelectItem>
                    <SelectItem value="wiggle">{language === 'ar' ? 'تمايل' : 'Wiggle'}</SelectItem>
                    <SelectItem value="flash">{language === 'ar' ? 'وميض' : 'Flash'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {config.enabled && (
          <div className="mt-4 mb-6 border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium mb-2">
              {language === 'ar' ? 'معاينة الزر' : 'Button Preview'}
            </h3>
            <div className="flex justify-center p-4 bg-white border rounded min-h-20 items-center">
              <button
                className={cn("flex items-center gap-2", {
                  "pulse-animation": config.animation === "pulse",
                  "bounce-animation": config.animation === "bounce",
                  "shake-animation": config.animation === "shake",
                  "wiggle-animation": config.animation === "wiggle",
                  "flash-animation": config.animation === "flash"
                })}
                style={{
                  backgroundColor: config.backgroundColor || '#000000',
                  color: config.textColor || '#ffffff',
                  padding: `${config.paddingY || '10'}px 20px`,
                  borderRadius: config.borderRadius || '4px',
                  borderWidth: `${config.borderWidth || '0'}px`,
                  borderStyle: config.borderWidth && parseInt(config.borderWidth) > 0 ? 'solid' : 'none',
                  borderColor: config.borderColor || '#000000',
                  fontSize: `${config.fontSize || '16'}px`,
                  fontWeight: config.fontWeight || '500',
                  fontFamily: config.fontFamily || 'inherit'
                }}
              >
                {config.showIcon && config.icon === 'shopping-cart' && <span>🛒</span>}
                {config.showIcon && config.icon === 'truck' && <span>🚚</span>}
                {config.showIcon && config.icon === 'package' && <span>📦</span>}
                {config.showIcon && config.icon === 'send' && <span>📤</span>}
                <span>{config.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}</span>
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave}>
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FloatingButtonEditor;
