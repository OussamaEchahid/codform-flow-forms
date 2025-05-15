
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { Info, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ShopifyProduct {
  id: string;
  title: string;
  image?: string;
}

interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void;
  isSyncing?: boolean;
  formTitleElement?: any;
  shopId?: string;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ 
  formId,
  formTitle,
  formDescription,
  formStyle = { primaryColor: '#9b87f5' },
  isSyncing = false,
  formTitleElement,
  shopId,
  onSave
}) => {
  const { t, language } = useI18n();
  const [hideHeader] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!shopId) return;
      
      try {
        setLoading(true);
        const url = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/shopify-products?shop=${shopId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.products) {
          setProducts(data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            image: p.image?.src || undefined
          })));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error(language === 'ar' 
          ? 'خطأ في جلب المنتجات' 
          : 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [shopId]);

  // Fetch associated products for this form
  useEffect(() => {
    const fetchAssociatedProducts = async () => {
      if (!formId || !shopId) return;
      
      try {
        setLoading(true);
        const { data, error } = await shopifySupabase
          .from('shopify_product_settings')
          .select('product_id')
          .eq('form_id', formId)
          .eq('shop_id', shopId)
          .eq('enabled', true);
          
        if (error) throw error;
        
        if (data) {
          const productIds = data.map(item => item.product_id);
          setAssociatedProducts(productIds);
          setSelectedProducts(productIds);
        }
      } catch (error) {
        console.error('Error fetching associated products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssociatedProducts();
  }, [formId, shopId]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const saveProductAssociations = async () => {
    if (!shopId || !formId) return;
    
    try {
      setLoading(true);
      
      // Products to add (in selected but not in associated)
      const toAdd = selectedProducts.filter(id => !associatedProducts.includes(id));
      
      // Products to remove (in associated but not in selected)
      const toRemove = associatedProducts.filter(id => !selectedProducts.includes(id));
      
      // Add new associations
      if (toAdd.length > 0) {
        const newAssociations = toAdd.map(productId => ({
          shop_id: shopId,
          product_id: productId,
          form_id: formId,
          enabled: true
        }));
        
        const { error: addError } = await shopifySupabase
          .from('shopify_product_settings')
          .upsert(newAssociations, {
            onConflict: 'shop_id,product_id'
          });
          
        if (addError) throw addError;
      }
      
      // Remove old associations
      if (toRemove.length > 0) {
        // Approach 1: Delete records
        for (const productId of toRemove) {
          const { error: removeError } = await shopifySupabase
            .from('shopify_product_settings')
            .delete()
            .eq('shop_id', shopId)
            .eq('product_id', productId);
            
          if (removeError) throw removeError;
        }
        
        // Alternative Approach 2: Disable records instead of deleting them
        /*
        for (const productId of toRemove) {
          const { error: updateError } = await shopifySupabase
            .from('shopify_product_settings')
            .update({ enabled: false })
            .eq('shop_id', shopId)
            .eq('product_id', productId);
            
          if (updateError) throw updateError;
        }
        */
      }
      
      // Update local state to reflect the new associations
      setAssociatedProducts(selectedProducts);
      
      toast.success(language === 'ar'
        ? 'تم حفظ إعدادات المنتجات بنجاح'
        : 'Product associations saved successfully');
        
    } catch (error) {
      console.error('Error saving product associations:', error);
      toast.error(language === 'ar' 
        ? 'خطأ في حفظ إعدادات المنتجات'
        : 'Error saving product associations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'دمج النموذج في متجرك' : 'Integrate Form in Your Store'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'سيتم استخدام هذا النموذج تلقائياً في متجرك عند إضافة البلوك إلى صفحة المنتج' 
            : 'This form will be used automatically in your store when adding the block to the product page'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">
              {language === 'ar' ? 'إعدادات عامة' : 'General Settings'}
            </TabsTrigger>
            <TabsTrigger value="products">
              {language === 'ar' ? 'إعدادات المنتجات' : 'Product Settings'}
              {associatedProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {associatedProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' 
                  ? 'لإضافة هذا النموذج في متجرك، اتبع هذه الخطوات:' 
                  : 'To add this form to your store, follow these steps:'}
                <ol className={`mt-2 list-decimal ${language === 'ar' ? 'mr-4' : 'ml-4'} space-y-1`}>
                  <li>
                    {language === 'ar' 
                      ? 'اذهب إلى "تخصيص المتجر" ثم انتقل إلى صفحة المنتج' 
                      : 'Go to "Customize Store" then navigate to the product page'}
                  </li>
                  <li>
                    {language === 'ar' 
                      ? 'انقر على "إضافة كتلة" واختر "نموذج الدفع عند الاستلام"' 
                      : 'Click "Add Block" and choose "Cash On Delivery Form"'}
                  </li>
                  <li>
                    {language === 'ar' 
                      ? 'سيظهر النموذج تلقائياً دون الحاجة لإعدادات إضافية' 
                      : 'The form will appear automatically without needing additional settings'}
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between py-2 border-t">
                <Label htmlFor="hide-header" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'إخفاء ترويسة النموذج في المتجر (مفعل افتراضيًا)' : 'Hide form header in store (enabled by default)'}
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' 
                      ? 'الترويسة مخفية تلقائيًا لتجنب العناوين المكررة في صفحة المنتج' 
                      : 'The header is hidden automatically to avoid duplicate titles in the product page'}
                  </p>
                </Label>
                <Switch 
                  id="hide-header"
                  checked={hideHeader}
                  disabled={true} 
                />
              </div>
              
              {formTitleElement && (
                <div className={`flex flex-row items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-sm font-medium ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                    {language === 'ar' ? 'عنوان النموذج المخصص:' : 'Custom Form Title:'}
                  </span>
                  <div className="p-2 bg-gray-100 rounded text-sm flex-1">
                    <span className="font-semibold">✓</span> {language === 'ar' ? 'تم تعيين عنوان مخصص' : 'Custom title configured'}
                  </div>
                </div>
              )}
              
              {formTitle && !formTitleElement && (
                <div className={`flex flex-row items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-sm font-medium ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                    {language === 'ar' ? 'عنوان النموذج:' : 'Form Title:'}
                  </span>
                  <span className="p-2 bg-gray-100 rounded text-sm flex-1">{formTitle}</span>
                </div>
              )}
              
              <div className={`flex flex-col ${language === 'ar' ? 'items-end' : 'items-start'}`}>
                <span className="text-sm font-medium mb-2">
                  {language === 'ar' ? 'إعدادات التنسيق:' : 'Styling Settings:'}
                </span>
                <div className="flex flex-wrap gap-2 w-full">
                  {formStyle.primaryColor && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formStyle.primaryColor }}></div>
                      {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Alert variant="warning" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className={`text-amber-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' 
                  ? 'تأكد من نشر النموذج قبل استخدامه في متجرك. النماذج غير المنشورة لن تظهر للعملاء.' 
                  : 'Make sure to publish the form before using it in your store. Unpublished forms will not appear to customers.'}
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' 
                  ? 'حدد المنتجات التي تريد عرض هذا النموذج عليها. إذا لم تحدد أي منتج، سيتم استخدام هذا النموذج كنموذج افتراضي.' 
                  : 'Select products where you want this form to appear. If no products are selected, this form will be used as the default form.'}
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-md p-4 space-y-4 max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length > 0 ? (
                <div className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-sm"
                          />
                        )}
                        <span className="font-medium">{product.title}</span>
                      </div>
                      <Switch 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`py-4 text-center text-gray-500 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' 
                    ? 'لا توجد منتجات متاحة في المتجر' 
                    : 'No products available in the store'}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={saveProductAssociations}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'ar' ? 'حفظ إعدادات المنتجات' : 'Save Product Settings'}
              </Button>
            </div>
            
            <Alert variant="default" className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className={`text-green-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar'
                  ? 'عدد المنتجات المرتبطة بهذا النموذج: ' + associatedProducts.length
                  : 'Number of products associated with this form: ' + associatedProducts.length}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        <Alert variant="default" className="bg-blue-50 border-blue-200 mt-4">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' 
              ? 'ملاحظة: بعض أنواع الحقول قد تظهر مختلفة أو لا تعمل بشكل كامل في المتجر مقارنة بالمعاينة. الحقول المدعومة بشكل كامل هي: الحقول النصية، مربعات الاختيار، أزرار الراديو، العناوين، وأزرار الإرسال.' 
              : 'Note: Some field types may appear differently or not work fully in the store compared to the preview. Fully supported fields are: text fields, checkboxes, radio buttons, titles, and submit buttons.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
