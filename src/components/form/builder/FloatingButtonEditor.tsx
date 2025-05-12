
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { FloatingButtonConfig } from '@/lib/form-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Send,
  Check 
} from 'lucide-react';

interface FloatingButtonEditorProps {
  floatingButton: FloatingButtonConfig;
  onChange: (config: FloatingButtonConfig) => void;
}

const FloatingButtonEditor: React.FC<FloatingButtonEditorProps> = ({ 
  floatingButton, 
  onChange 
}) => {
  const { language } = useI18n();
  
  const handleChange = (key: string, value: any) => {
    onChange({
      ...floatingButton,
      [key]: value
    });
  };
  
  const getIconPreview = (iconName: string) => {
    switch (iconName) {
      case 'shopping-cart':
        return <ShoppingCart size={16} />;
      case 'package':
        return <Package size={16} />;
      case 'truck':
        return <Truck size={16} />;
      case 'send':
        return <Send size={16} />;
      default:
        return <ShoppingCart size={16} />;
    }
  };
  
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">
          {language === 'ar' ? 'عام' : 'General'}
        </TabsTrigger>
        <TabsTrigger value="appearance">
          {language === 'ar' ? 'المظهر' : 'Appearance'}
        </TabsTrigger>
        <TabsTrigger value="animation">
          {language === 'ar' ? 'الحركة' : 'Animation'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-4 py-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-floating"
            checked={floatingButton?.enabled ?? false}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
          <Label htmlFor="enable-floating" className={language === 'ar' ? 'mr-2' : 'ml-2'}>
            {language === 'ar' ? 'تفعيل الزر العائم' : 'Enable Floating Button'}
          </Label>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="button-text">
            {language === 'ar' ? 'نص الزر' : 'Button Text'}
          </Label>
          <Input
            id="button-text"
            value={floatingButton?.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
            placeholder={language === 'ar' ? 'اطلب الآن' : 'Order Now'}
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-icon"
              checked={floatingButton?.showIcon ?? true}
              onCheckedChange={(checked) => handleChange('showIcon', checked)}
            />
            <Label htmlFor="show-icon" className={language === 'ar' ? 'mr-2' : 'ml-2'}>
              {language === 'ar' ? 'إظهار أيقونة' : 'Show Icon'}
            </Label>
          </div>
          
          {floatingButton?.showIcon && (
            <div className="mt-2">
              <Label htmlFor="button-icon">
                {language === 'ar' ? 'اختر الأيقونة' : 'Choose Icon'}
              </Label>
              <Select 
                value={floatingButton?.icon || 'shopping-cart'} 
                onValueChange={(value) => handleChange('icon', value)}
              >
                <SelectTrigger id="button-icon" className="mt-1">
                  <SelectValue placeholder={language === 'ar' ? 'اختر الأيقونة' : 'Select icon'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopping-cart" className="flex items-center">
                    <div className="flex items-center">
                      <ShoppingCart size={16} className="mr-2" />
                      <span>{language === 'ar' ? 'عربة تسوق' : 'Shopping Cart'}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="package">
                    <div className="flex items-center">
                      <Package size={16} className="mr-2" />
                      <span>{language === 'ar' ? 'طرد' : 'Package'}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="truck">
                    <div className="flex items-center">
                      <Truck size={16} className="mr-2" />
                      <span>{language === 'ar' ? 'شاحنة' : 'Truck'}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="send">
                    <div className="flex items-center">
                      <Send size={16} className="mr-2" />
                      <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="margin-bottom">
            {language === 'ar' ? 'المسافة من أسفل' : 'Distance from Bottom'}
          </Label>
          <Select 
            value={floatingButton?.marginBottom || '20px'} 
            onValueChange={(value) => handleChange('marginBottom', value)}
          >
            <SelectTrigger id="margin-bottom">
              <SelectValue placeholder={language === 'ar' ? 'اختر المسافة' : 'Select distance'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10px">
                {language === 'ar' ? 'قريب جداً (10px)' : 'Very Close (10px)'}
              </SelectItem>
              <SelectItem value="20px">
                {language === 'ar' ? 'قريب (20px)' : 'Close (20px)'}
              </SelectItem>
              <SelectItem value="30px">
                {language === 'ar' ? 'متوسط (30px)' : 'Medium (30px)'}
              </SelectItem>
              <SelectItem value="40px">
                {language === 'ar' ? 'بعيد (40px)' : 'Far (40px)'}
              </SelectItem>
              <SelectItem value="60px">
                {language === 'ar' ? 'بعيد جداً (60px)' : 'Very Far (60px)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
      
      <TabsContent value="appearance" className="space-y-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="bg-color">
            {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="bg-color"
              type="color"
              value={floatingButton?.backgroundColor || '#000000'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={floatingButton?.backgroundColor || '#000000'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="text-color">
            {language === 'ar' ? 'لون النص' : 'Text Color'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="text-color"
              type="color"
              value={floatingButton?.textColor || '#ffffff'}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={floatingButton?.textColor || '#ffffff'}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <div className="grid gap-2">
          <Label htmlFor="border-radius">
            {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
          </Label>
          <Select 
            value={floatingButton?.borderRadius || '4px'} 
            onValueChange={(value) => handleChange('borderRadius', value)}
          >
            <SelectTrigger id="border-radius">
              <SelectValue placeholder={language === 'ar' ? 'اختر الاستدارة' : 'Select border radius'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0px">
                {language === 'ar' ? 'بدون استدارة' : 'No Radius'}
              </SelectItem>
              <SelectItem value="4px">
                {language === 'ar' ? 'استدارة صغيرة' : 'Small Radius'}
              </SelectItem>
              <SelectItem value="8px">
                {language === 'ar' ? 'استدارة متوسطة' : 'Medium Radius'}
              </SelectItem>
              <SelectItem value="12px">
                {language === 'ar' ? 'استدارة كبيرة' : 'Large Radius'}
              </SelectItem>
              <SelectItem value="50px">
                {language === 'ar' ? 'استدارة كاملة' : 'Pill Shape'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="font-size">
            {language === 'ar' ? 'حجم الخط' : 'Font Size'}
          </Label>
          <Select 
            value={floatingButton?.fontSize || '16px'} 
            onValueChange={(value) => handleChange('fontSize', value)}
          >
            <SelectTrigger id="font-size">
              <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14px">
                {language === 'ar' ? 'صغير' : 'Small'}
              </SelectItem>
              <SelectItem value="16px">
                {language === 'ar' ? 'متوسط' : 'Medium'}
              </SelectItem>
              <SelectItem value="18px">
                {language === 'ar' ? 'كبير' : 'Large'}
              </SelectItem>
              <SelectItem value="20px">
                {language === 'ar' ? 'كبير جداً' : 'Extra Large'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="font-weight">
            {language === 'ar' ? 'سمك الخط' : 'Font Weight'}
          </Label>
          <Select 
            value={floatingButton?.fontWeight || '500'} 
            onValueChange={(value) => handleChange('fontWeight', value)}
          >
            <SelectTrigger id="font-weight">
              <SelectValue placeholder={language === 'ar' ? 'اختر سمك الخط' : 'Select font weight'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400">
                {language === 'ar' ? 'عادي' : 'Regular'}
              </SelectItem>
              <SelectItem value="500">
                {language === 'ar' ? 'متوسط' : 'Medium'}
              </SelectItem>
              <SelectItem value="600">
                {language === 'ar' ? 'سميك' : 'Semi-Bold'}
              </SelectItem>
              <SelectItem value="700">
                {language === 'ar' ? 'سميك جداً' : 'Bold'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="padding-y">
            {language === 'ar' ? 'التباعد الرأسي' : 'Vertical Padding'}
          </Label>
          <Select 
            value={floatingButton?.paddingY || '10px'} 
            onValueChange={(value) => handleChange('paddingY', value)}
          >
            <SelectTrigger id="padding-y">
              <SelectValue placeholder={language === 'ar' ? 'اختر التباعد' : 'Select padding'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6px">
                {language === 'ar' ? 'صغير جداً' : 'Extra Small'}
              </SelectItem>
              <SelectItem value="8px">
                {language === 'ar' ? 'صغير' : 'Small'}
              </SelectItem>
              <SelectItem value="10px">
                {language === 'ar' ? 'متوسط' : 'Medium'}
              </SelectItem>
              <SelectItem value="12px">
                {language === 'ar' ? 'كبير' : 'Large'}
              </SelectItem>
              <SelectItem value="16px">
                {language === 'ar' ? 'كبير جداً' : 'Extra Large'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
      
      <TabsContent value="animation" className="space-y-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="animation-type">
            {language === 'ar' ? 'نوع الحركة' : 'Animation Type'}
          </Label>
          <Select 
            value={floatingButton?.animation || 'none'} 
            onValueChange={(value) => handleChange('animation', value)}
          >
            <SelectTrigger id="animation-type">
              <SelectValue placeholder={language === 'ar' ? 'اختر نوع الحركة' : 'Select animation'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {language === 'ar' ? 'بدون حركة' : 'No Animation'}
              </SelectItem>
              <SelectItem value="pulse">
                {language === 'ar' ? 'نبض' : 'Pulse'}
              </SelectItem>
              <SelectItem value="shake">
                {language === 'ar' ? 'هزة' : 'Shake'}
              </SelectItem>
              <SelectItem value="bounce">
                {language === 'ar' ? 'قفز' : 'Bounce'}
              </SelectItem>
              <SelectItem value="wiggle">
                {language === 'ar' ? 'تمايل' : 'Wiggle'}
              </SelectItem>
              <SelectItem value="flash">
                {language === 'ar' ? 'وميض' : 'Flash'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {floatingButton?.animation && floatingButton.animation !== 'none' && (
          <div className="mt-4 p-4 border rounded-md">
            <div className="flex justify-center">
              <button
                className={`px-4 py-2 rounded flex items-center gap-2 ${floatingButton.animation}-animation`}
                style={{
                  backgroundColor: floatingButton.backgroundColor || '#000000',
                  color: floatingButton.textColor || '#ffffff',
                  borderRadius: floatingButton.borderRadius || '4px',
                  fontSize: floatingButton.fontSize || '16px',
                  fontWeight: floatingButton.fontWeight || '500',
                }}
              >
                {floatingButton.showIcon && getIconPreview(floatingButton.icon || 'shopping-cart')}
                <span>{floatingButton.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}</span>
              </button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default FloatingButtonEditor;
