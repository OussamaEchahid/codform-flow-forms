import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Plus, Minus } from 'lucide-react';
import { CURRENCIES } from '@/lib/constants/countries-currencies';

interface CartSummaryFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const CartSummaryFieldEditor: React.FC<CartSummaryFieldEditorProps> = ({
  field,
  onSave,
  onClose
}) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = useState<FormField>({
    ...field,
    style: {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      color: '#1f2937',
      fontSize: '1rem',
      borderRadius: '0.5rem',
      labelColor: '#6b7280',
      valueColor: '#1f2937',
      totalLabelColor: '#1f2937',
      totalValueColor: '#059669', // ✅ أخضر كما هو مطلوب
      fontFamily: 'Cairo', // ✅ خط Cairo كما هو مطلوب
      labelFontSize: '1rem',
      valueFontSize: '1rem',
      totalLabelFontSize: '1.1rem',
      totalValueFontSize: '1.1rem',
      labelWeight: '400',
      valueWeight: '500',
      totalLabelWeight: 'bold',
      totalValueWeight: 'bold',
      direction: 'auto', // ✅ اتجاه تلقائي
      ...field.style
    },
    cartSummaryConfig: {
      subtotalText: language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
      discountText: language === 'ar' ? 'الخصم' : 'Discount',
      shippingText: language === 'ar' ? 'الشحن' : 'Shipping',
      totalText: language === 'ar' ? 'الإجمالي' : 'Total',
      showDiscount: false, // ✅ إخفاء الخصم افتراضياً
      discountType: 'percentage', // 'percentage' or 'fixed'
      discountValue: 0,
      shippingType: 'manual', // 'manual' or 'free'
      shippingValue: 0,
      autoCalculate: true,
      direction: 'auto', // ✅ اتجاه تلقائي للنص
      ...field.cartSummaryConfig
    }
  });

  const handleStyleChange = (key: string, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      style: { ...prev.style, [key]: value }
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      cartSummaryConfig: { ...prev.cartSummaryConfig, [key]: value }
    }));
  };

  const handleSave = () => {
    onSave(currentField);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'إعدادات ملخص السلة' : 'Cart Summary Settings'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">
            {language === 'ar' ? 'المحتوى' : 'Content'}
          </TabsTrigger>
          <TabsTrigger value="calculation">
            {language === 'ar' ? 'الحساب' : 'Calculation'}
          </TabsTrigger>
          <TabsTrigger value="styling">
            {language === 'ar' ? 'التصميم' : 'Styling'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'تسميات النصوص' : 'Text Labels'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'اتجاه النص' : 'Text Direction'}</Label>
                <Select
                  value={currentField.cartSummaryConfig?.direction || 'auto'}
                  onValueChange={(value) => handleConfigChange('direction', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      {language === 'ar' ? 'تلقائي' : 'Auto'}
                    </SelectItem>
                    <SelectItem value="rtl">
                      {language === 'ar' ? 'من اليمين لليسار' : 'Right to Left'}
                    </SelectItem>
                    <SelectItem value="ltr">
                      {language === 'ar' ? 'من اليسار لليمين' : 'Left to Right'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'ar' ? 'نص المجموع الفرعي' : 'Subtotal Text'}</Label>
                <Input
                  value={currentField.cartSummaryConfig?.subtotalText || ''}
                  onChange={(e) => handleConfigChange('subtotalText', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'نص الخصم' : 'Discount Text'}</Label>
                <Input
                  value={currentField.cartSummaryConfig?.discountText || ''}
                  onChange={(e) => handleConfigChange('discountText', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'نص الشحن' : 'Shipping Text'}</Label>
                <Input
                  value={currentField.cartSummaryConfig?.shippingText || ''}
                  onChange={(e) => handleConfigChange('shippingText', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'نص الإجمالي' : 'Total Text'}</Label>
                <Input
                  value={currentField.cartSummaryConfig?.totalText || ''}
                  onChange={(e) => handleConfigChange('totalText', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'إعدادات الحساب' : 'Calculation Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>{language === 'ar' ? 'حساب تلقائي من المنتج' : 'Auto Calculate from Product'}</Label>
                <Switch
                  checked={currentField.cartSummaryConfig?.autoCalculate || false}
                  onCheckedChange={(checked) => handleConfigChange('autoCalculate', checked)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'إظهار الخصم' : 'Show Discount'}</Label>
                  <Switch
                    checked={currentField.cartSummaryConfig?.showDiscount || false}
                    onCheckedChange={(checked) => handleConfigChange('showDiscount', checked)}
                  />
                </div>

                {currentField.cartSummaryConfig?.showDiscount && (
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    <div>
                      <Label>{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</Label>
                      <Select
                        value={currentField.cartSummaryConfig?.discountType || 'percentage'}
                        onValueChange={(value) => handleConfigChange('discountType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            {language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}
                          </SelectItem>
                          <SelectItem value="fixed">
                            {language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        {language === 'ar' ? 'قيمة الخصم' : 'Discount Value'} 
                        {currentField.cartSummaryConfig?.discountType === 'percentage' ? ' (%)' : ''}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max={currentField.cartSummaryConfig?.discountType === 'percentage' ? 100 : undefined}
                        value={currentField.cartSummaryConfig?.discountValue || 0}
                        onChange={(e) => handleConfigChange('discountValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>{language === 'ar' ? 'نوع الشحن' : 'Shipping Type'}</Label>
                  <Select
                    value={currentField.cartSummaryConfig?.shippingType || 'manual'}
                    onValueChange={(value) => handleConfigChange('shippingType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        {language === 'ar' ? 'يدوي' : 'Manual'}
                      </SelectItem>
                      <SelectItem value="free">
                        {language === 'ar' ? 'مجاني' : 'Free'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentField.cartSummaryConfig?.shippingType === 'manual' && (
                  <div>
                    <Label>{language === 'ar' ? 'قيمة الشحن' : 'Shipping Value'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentField.cartSummaryConfig?.shippingValue || 0}
                      onChange={(e) => handleConfigChange('shippingValue', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="styling" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'تصميم الألوان' : 'Color Design'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
                <Input
                  type="color"
                  value={currentField.style?.backgroundColor || '#f9fafb'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'لون الحدود' : 'Border Color'}</Label>
                <Input
                  type="color"
                  value={currentField.style?.borderColor || '#e5e7eb'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'لون التسميات' : 'Labels Color'}</Label>
                <Input
                  type="color"
                  value={currentField.style?.labelColor || '#6b7280'}
                  onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'لون القيم' : 'Values Color'}</Label>
                <Input
                  type="color"
                  value={currentField.style?.valueColor || '#1f2937'}
                  onChange={(e) => handleStyleChange('valueColor', e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'لون الإجمالي' : 'Total Color'}</Label>
                <Input
                  type="color"
                  value={currentField.style?.totalValueColor || '#059669'}
                  onChange={(e) => handleStyleChange('totalValueColor', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'تصميم النصوص' : 'Text Design'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'خط العائلة' : 'Font Family'}</Label>
                <Select
                  value={currentField.style?.fontFamily || 'Cairo'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cairo">Cairo</SelectItem>
                    <SelectItem value="Tajawal">Tajawal</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'ar' ? 'حجم خط التسميات' : 'Labels Font Size'}</Label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">0.8rem</span>
                  <Slider
                    value={[parseFloat(currentField.style?.labelFontSize?.replace('rem', '') || '1')]}
                    onValueChange={(value) => handleStyleChange('labelFontSize', `${value[0]}rem`)}
                    max={2}
                    min={0.8}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm">2rem</span>
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'حجم خط القيم' : 'Values Font Size'}</Label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">0.8rem</span>
                  <Slider
                    value={[parseFloat(currentField.style?.valueFontSize?.replace('rem', '') || '1')]}
                    onValueChange={(value) => handleStyleChange('valueFontSize', `${value[0]}rem`)}
                    max={2}
                    min={0.8}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm">2rem</span>
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'حجم خط الإجمالي' : 'Total Font Size'}</Label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">1rem</span>
                  <Slider
                    value={[parseFloat(currentField.style?.totalValueFontSize?.replace('rem', '') || '1.1')]}
                    onValueChange={(value) => handleStyleChange('totalValueFontSize', `${value[0]}rem`)}
                    max={2.5}
                    min={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm">2.5rem</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default CartSummaryFieldEditor;