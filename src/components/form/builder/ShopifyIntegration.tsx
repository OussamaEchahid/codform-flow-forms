import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ShopifyIntegrationProps {
  formId: string;
  formStyle?: any;
  onSave: (settings: any) => Promise<void>;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId, formStyle, onSave }) => {
  const { language } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isProductLinked, setIsProductLinked] = useState(false);
  const [floatingButton, setFloatingButton] = useState({
    enabled: false,
    text: language === 'ar' ? 'اطلب الآن' : 'Order Now',
    textColor: '#ffffff',
    backgroundColor: formStyle?.primaryColor || '#9b87f5',
    borderColor: '',
    borderRadius: '9999px',
    borderWidth: '0',
    fontSize: '1rem',
    fontWeight: 'medium',
    paddingY: '0.5rem',
    marginBottom: '1rem',
    showIcon: true,
    icon: 'shopping-cart',
    animation: 'pulse'
  });
  
  useEffect(() => {
    // Load existing product data if available
    const fetchProductData = async () => {
      try {
        // This would be an API call in a real implementation
        // For now, we'll just simulate loading data
        setTimeout(() => {
          if (formId === 'demo-product-form') {
            setProductId('123456789');
            setProductTitle('Sample Product');
            setProductImage('https://via.placeholder.com/300');
            setProductPrice('99.99');
            setIsProductLinked(true);
          }
        }, 500);
      } catch (error) {
        console.error('Error fetching product data', error);
      }
    };
    
    fetchProductData();
  }, [formId]);
  
  useEffect(() => {
    // Update floating button color when form style changes
    if (formStyle?.primaryColor) {
      setFloatingButton(prev => ({
        ...prev,
        backgroundColor: formStyle.primaryColor
      }));
    }
  }, [formStyle]);
  
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await onSave({ 
        productId,
        floatingButton
      });
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving Shopify settings', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFloatingButtonChange = (key: string, value: any) => {
    setFloatingButton(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleLinkProduct = () => {
    // This would be an API call to link the product in a real implementation
    // For now, we'll just simulate linking a product
    setIsLoading(true);
    
    setTimeout(() => {
      setProductId('123456789');
      setProductTitle('Sample Product');
      setProductImage('https://via.placeholder.com/300');
      setProductPrice('99.99');
      setIsProductLinked(true);
      setIsLoading(false);
      
      toast.success(language === 'ar' ? 'تم ربط المنتج بنجاح' : 'Product linked successfully');
    }, 1000);
  };
  
  const handleUnlinkProduct = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setProductId('');
      setProductTitle('');
      setProductImage('');
      setProductPrice('');
      setIsProductLinked(false);
      setIsLoading(false);
      
      toast.success(language === 'ar' ? 'تم إلغاء ربط المنتج' : 'Product unlinked');
    }, 500);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'إعدادات Shopify' : 'Shopify Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="product">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product">
              {language === 'ar' ? 'ربط المنتج' : 'Product Connection'}
            </TabsTrigger>
            <TabsTrigger value="button">
              {language === 'ar' ? 'زر الطلب العائم' : 'Floating Order Button'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="product" className="space-y-4 mt-4">
            <div className={`space-y-4 ${language === 'ar' ? 'text-right' : ''}`}>
              <h3 className="text-lg font-medium">
                {language === 'ar' ? 'ربط النموذج بمنتج Shopify' : 'Connect Form to Shopify Product'}
              </h3>
              
              {isProductLinked ? (
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {productImage && (
                      <div className="w-full md:w-1/3">
                        <AspectRatio ratio={1}>
                          <img 
                            src={productImage} 
                            alt={productTitle}
                            className="rounded-md object-cover w-full h-full"
                          />
                        </AspectRatio>
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium">{productTitle}</h4>
                      <p className="text-sm text-gray-500">ID: {productId}</p>
                      <p className="font-medium">${productPrice}</p>
                      
                      <div className="pt-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleUnlinkProduct}
                          disabled={isLoading}
                        >
                          {language === 'ar' ? 'إلغاء ربط المنتج' : 'Unlink Product'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-6 text-center">
                  <p className="mb-4 text-gray-500">
                    {language === 'ar' 
                      ? 'لم يتم ربط أي منتج بهذا النموذج بعد' 
                      : 'No product linked to this form yet'}
                  </p>
                  
                  <Button
                    onClick={handleLinkProduct}
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? (language === 'ar' ? 'جاري الربط...' : 'Linking...') 
                      : (language === 'ar' ? 'ربط منتج' : 'Link Product')}
                  </Button>
                </div>
              )}
              
              <div className="text-sm text-gray-500 mt-2">
                <p>
                  {language === 'ar'
                    ? 'عند ربط منتج، سيتم عرض معلومات المنتج في النموذج تلقائيًا'
                    : 'When a product is linked, product information will be automatically displayed in the form'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="button" className="space-y-4 mt-4">
            <div className={`space-y-4 ${language === 'ar' ? 'text-right' : ''}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="floating-button-enabled">
                  {language === 'ar' ? 'تفعيل زر الطلب العائم' : 'Enable Floating Order Button'}
                </Label>
                <Switch
                  id="floating-button-enabled"
                  checked={floatingButton.enabled}
                  onCheckedChange={(checked) => handleFloatingButtonChange('enabled', checked)}
                />
              </div>
              
              {floatingButton.enabled && (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="button-text">
                      {language === 'ar' ? 'نص الزر' : 'Button Text'}
                    </Label>
                    <Input
                      id="button-text"
                      value={floatingButton.text}
                      onChange={(e) => handleFloatingButtonChange('text', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={floatingButton.backgroundColor}
                          onChange={(e) => handleFloatingButtonChange('backgroundColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={floatingButton.backgroundColor}
                          onChange={(e) => handleFloatingButtonChange('backgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'لون النص' : 'Text Color'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={floatingButton.textColor}
                          onChange={(e) => handleFloatingButtonChange('textColor', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={floatingButton.textColor}
                          onChange={(e) => handleFloatingButtonChange('textColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                      </Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={floatingButton.fontSize}
                        onChange={(e) => handleFloatingButtonChange('fontSize', e.target.value)}
                      >
                        <option value="0.875rem">صغير</option>
                        <option value="1rem">متوسط</option>
                        <option value="1.125rem">كبير</option>
                        <option value="1.25rem">كبير جداً</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'وزن الخط' : 'Font Weight'}
                      </Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={floatingButton.fontWeight}
                        onChange={(e) => handleFloatingButtonChange('fontWeight', e.target.value)}
                      >
                        <option value="normal">عادي</option>
                        <option value="medium">متوسط</option>
                        <option value="bold">عريض</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
                      </Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={floatingButton.borderRadius}
                        onChange={(e) => handleFloatingButtonChange('borderRadius', e.target.value)}
                      >
                        <option value="0">بدون استدارة</option>
                        <option value="0.25rem">استدارة خفيفة</option>
                        <option value="0.5rem">استدارة متوسطة</option>
                        <option value="9999px">دائري</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'تأثير حركي' : 'Animation'}
                      </Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={floatingButton.animation}
                        onChange={(e) => handleFloatingButtonChange('animation', e.target.value)}
                      >
                        <option value="">بدون تأثير</option>
                        <option value="pulse">نبض</option>
                        <option value="bounce">قفز</option>
                        <option value="shake">اهتزاز</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="show-icon"
                      checked={floatingButton.showIcon}
                      onCheckedChange={(checked) => handleFloatingButtonChange('showIcon', checked)}
                    />
                    <Label htmlFor="show-icon">
                      {language === 'ar' ? 'إظهار أيقونة' : 'Show Icon'}
                    </Label>
                  </div>
                  
                  {floatingButton.showIcon && (
                    <div className="space-y-2">
                      <Label>
                        {language === 'ar' ? 'الأيقونة' : 'Icon'}
                      </Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={floatingButton.icon}
                        onChange={(e) => handleFloatingButtonChange('icon', e.target.value)}
                      >
                        <option value="shopping-cart">عربة تسوق</option>
                        <option value="arrow-right">سهم</option>
                        <option value="check">علامة صح</option>
                        <option value="phone">هاتف</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="mt-4 p-4 border rounded-md bg-gray-50">
                    <h4 className="font-medium mb-2">
                      {language === 'ar' ? 'معاينة الزر' : 'Button Preview'}
                    </h4>
                    <div 
                      className="flex items-center justify-center gap-2 w-fit mx-auto px-4 py-2 rounded-md"
                      style={{
                        backgroundColor: floatingButton.backgroundColor,
                        color: floatingButton.textColor,
                        borderRadius: floatingButton.borderRadius,
                        fontSize: floatingButton.fontSize,
                        fontWeight: floatingButton.fontWeight,
                      }}
                    >
                      {floatingButton.showIcon && (
                        <span>🛒</span> // Simplified icon representation
                      )}
                      <span>{floatingButton.text}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
