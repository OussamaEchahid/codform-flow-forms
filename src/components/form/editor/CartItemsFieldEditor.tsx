import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductSelector from './ProductSelector';

interface CartItemsFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

const CartItemsFieldEditor: React.FC<CartItemsFieldEditorProps> = ({ field, onUpdate, onClose }) => {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState('product');

  const currentStyle = field.style || {};

  const handleStyleUpdate = (styleKey: string, value: any) => {
    onUpdate({
      style: {
        ...currentStyle,
        [styleKey]: value
      }
    });
  };

  const ColorPicker = ({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border cursor-pointer"
          style={{ backgroundColor: value || '#000000' }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value || '#000000';
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );

  const FontSlider = ({ value, onChange, label, min = 0, max = 3, step = 0.05 }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="space-y-2">
      <Label className="flex justify-between">
        {label}
        <span className="text-sm text-muted-foreground">({value})</span>
      </Label>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );

  const FontFamilySelect = ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || 'Inter, Cairo, system-ui, sans-serif'} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Inter, Cairo, system-ui, sans-serif">Inter</SelectItem>
          <SelectItem value="Cairo, system-ui, sans-serif">Cairo</SelectItem>
          <SelectItem value="Roboto, system-ui, sans-serif">Roboto</SelectItem>
          <SelectItem value="Open Sans, system-ui, sans-serif">Open Sans</SelectItem>
          <SelectItem value="Poppins, system-ui, sans-serif">Poppins</SelectItem>
          <SelectItem value="Montserrat, system-ui, sans-serif">Montserrat</SelectItem>
          <SelectItem value="Source Sans Pro, system-ui, sans-serif">Source Sans Pro</SelectItem>
          <SelectItem value="Nunito Sans, system-ui, sans-serif">Nunito Sans</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const FontWeightSlider = ({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="flex justify-between">
        {label}
        <span className="text-sm text-muted-foreground">({value})</span>
      </Label>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={100}
        max={900}
        step={100}
      />
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{language === 'ar' ? 'إعدادات عناصر السلة' : 'Cart Items Configuration'}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">
                {language === 'ar' ? 'اختيار المنتج' : 'Product Selection'}
              </h4>
              <ProductSelector 
                value={field.productId || ''}
                onChange={(productId) => onUpdate({ productId })}
              />
            </div>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-1">
                {language === 'ar' ? 'عنوان المنتج' : 'Product Title'}
              </h4>
              <p className="text-xs text-blue-700">
                {language === 'ar' 
                  ? 'سيتم عرض عنوان المنتج المرتبط تلقائياً. لا حاجة لتسمية منفصلة.'
                  : 'The linked product title will be displayed automatically. No separate label needed.'
                }
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-borders"
                  checked={field.style?.showBorders !== false}
                  onCheckedChange={(checked) => handleStyleUpdate('showBorders', checked)}
                />
                <Label htmlFor="show-borders">
                  {language === 'ar' ? 'إظهار الحدود' : 'Show Borders'}
                </Label>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStyleUpdate('direction', field.style?.direction === 'rtl' ? 'ltr' : 'rtl')}
                className="text-gray-600 hover:text-gray-900"
              >
                {field.style?.direction === 'rtl' ? 'LTR' : 'RTL'}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={currentStyle.hideImage === true}
                onCheckedChange={(checked) => handleStyleUpdate('hideImage', checked)}
              />
              <Label>{language === 'ar' ? 'إخفاء الصورة' : 'Hide Image'}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={currentStyle.hideTitle === true}
                onCheckedChange={(checked) => handleStyleUpdate('hideTitle', checked)}
              />
              <Label>{language === 'ar' ? 'إخفاء عنوان المنتج' : 'Hide Title'}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={currentStyle.hideQuantitySelector === true}
                onCheckedChange={(checked) => handleStyleUpdate('hideQuantitySelector', checked)}
              />
              <Label>{language === 'ar' ? 'إخفاء محدد الكمية' : 'Hide Quantity Selector'}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={currentStyle.hidePrice === true}
                onCheckedChange={(checked) => handleStyleUpdate('hidePrice', checked)}
              />
              <Label>{language === 'ar' ? 'إخفاء السعر' : 'Hide Price'}</Label>
            </div>
          </div>

          {/* Styling Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="product">{language === 'ar' ? 'المنتج' : 'Product'}</TabsTrigger>
              <TabsTrigger value="variant">{language === 'ar' ? 'المتغير' : 'Variant'}</TabsTrigger>
              <TabsTrigger value="quantity">{language === 'ar' ? 'الكمية' : 'Quantity'}</TabsTrigger>
              <TabsTrigger value="price">{language === 'ar' ? 'السعر' : 'Price'}</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="space-y-4">
              <ColorPicker
                value={currentStyle.color || '#000000'}
                onChange={(color) => handleStyleUpdate('color', color)}
                label={language === 'ar' ? 'لون الخط' : 'Font Color'}
              />
              <FontSlider
                value={parseFloat(currentStyle.fontSize?.replace('rem', '') || '0.95')}
                onChange={(value) => handleStyleUpdate('fontSize', `${value}rem`)}
                label={language === 'ar' ? 'حجم الخط' : 'Font Size'}
              />
              <FontFamilySelect
                value={currentStyle.fontFamily || 'Tajawal'}
                onChange={(value) => handleStyleUpdate('fontFamily', value)}
                label={language === 'ar' ? 'عائلة الخط' : 'Font Family'}
              />
              <FontWeightSlider
                value={parseInt(currentStyle.fontWeight || '700')}
                onChange={(value) => handleStyleUpdate('fontWeight', value.toString())}
                label={language === 'ar' ? 'وزن الخط' : 'Font Weight'}
              />
            </TabsContent>

            <TabsContent value="variant" className="space-y-4">
              <ColorPicker
                value={currentStyle.descriptionColor || '#151515'}
                onChange={(color) => handleStyleUpdate('descriptionColor', color)}
                label={language === 'ar' ? 'لون الخط' : 'Option Font Color'}
              />
              <FontSlider
                value={parseFloat(currentStyle.descriptionFontSize?.replace('rem', '') || '0.85')}
                onChange={(value) => handleStyleUpdate('descriptionFontSize', `${value}rem`)}
                label={language === 'ar' ? 'حجم الخط' : 'Option Font Size'}
              />
              <FontFamilySelect
                value={currentStyle.descriptionFontFamily || 'Tajawal'}
                onChange={(value) => handleStyleUpdate('descriptionFontFamily', value)}
                label={language === 'ar' ? 'عائلة الخط' : 'Option Font Family'}
              />
              <FontWeightSlider
                value={parseInt(currentStyle.descriptionFontWeight || '400')}
                onChange={(value) => handleStyleUpdate('descriptionFontWeight', value.toString())}
                label={language === 'ar' ? 'وزن الخط' : 'Option Font Weight'}
              />
            </TabsContent>

            <TabsContent value="quantity" className="space-y-4">
              <ColorPicker
                value={currentStyle.quantityBgColor || '#00000020'}
                onChange={(color) => handleStyleUpdate('quantityBgColor', color)}
                label={language === 'ar' ? 'لون الخلفية' : 'Quantity Background Color'}
              />
              <ColorPicker
                value={currentStyle.quantityBorderColor || '#000000'}
                onChange={(color) => handleStyleUpdate('quantityBorderColor', color)}
                label={language === 'ar' ? 'لون الحدود' : 'Quantity Border Color'}
              />
              <FontSlider
                value={parseInt(currentStyle.quantityBorderWidth || '2')}
                onChange={(value) => handleStyleUpdate('quantityBorderWidth', value.toString())}
                label={language === 'ar' ? 'عرض الحدود' : 'Quantity Border Width'}
                min={0}
                max={6}
                step={1}
              />
              <FontSlider
                value={parseFloat(currentStyle.quantityBorderRadius || '8.5')}
                onChange={(value) => handleStyleUpdate('quantityBorderRadius', value.toString())}
                label={language === 'ar' ? 'نصف قطر الحدود' : 'Quantity Border Radius'}
                min={0}
                max={30}
                step={0.5}
              />
              <FontFamilySelect
                value={currentStyle.quantityFontFamily || 'Tajawal'}
                onChange={(value) => handleStyleUpdate('quantityFontFamily', value)}
                label={language === 'ar' ? 'عائلة الخط' : 'Quantity Font Family'}
              />
              <ColorPicker
                value={currentStyle.quantityColor || '#000000'}
                onChange={(color) => handleStyleUpdate('quantityColor', color)}
                label={language === 'ar' ? 'لون النص' : 'Quantity Color'}
              />
              <ColorPicker
                value={currentStyle.quantityBtnColor || '#000000'}
                onChange={(color) => handleStyleUpdate('quantityBtnColor', color)}
                label={language === 'ar' ? 'لون الأزرار' : 'Quantity Button Color'}
              />
              <FontWeightSlider
                value={parseInt(currentStyle.productFontWeight || '700')}
                onChange={(value) => handleStyleUpdate('productFontWeight', value.toString())}
                label={language === 'ar' ? 'وزن الخط' : 'Product Font Weight'}
              />
            </TabsContent>

            <TabsContent value="price" className="space-y-4">
              <ColorPicker
                value={currentStyle.priceColor || '#000000'}
                onChange={(color) => handleStyleUpdate('priceColor', color)}
                label={language === 'ar' ? 'لون السعر' : 'Price Color'}
              />
              <FontSlider
                value={parseFloat(currentStyle.priceFontSize?.replace('rem', '') || '1.05')}
                onChange={(value) => handleStyleUpdate('priceFontSize', `${value}rem`)}
                label={language === 'ar' ? 'حجم خط السعر' : 'Price Font Size'}
              />
              <FontFamilySelect
                value={currentStyle.priceFontFamily || 'Tajawal'}
                onChange={(value) => handleStyleUpdate('priceFontFamily', value)}
                label={language === 'ar' ? 'عائلة خط السعر' : 'Price Font Family'}
              />
              <FontWeightSlider
                value={parseInt(currentStyle.priceFontWeight || '900')}
                onChange={(value) => handleStyleUpdate('priceFontWeight', value.toString())}
                label={language === 'ar' ? 'وزن خط السعر' : 'Price Font Weight'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItemsFieldEditor;