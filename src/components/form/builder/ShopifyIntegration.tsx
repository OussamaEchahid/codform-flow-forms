
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { Check, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useFormStore } from '@/hooks/useFormStore';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
}

interface ShopifyIntegrationProps {
  formId: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => Promise<void>;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ 
  formId,
  formStyle = { primaryColor: '#9b87f5' },
  onSave
}) => {
  const { t, language } = useI18n();
  const { formState, setFormState } = useFormStore();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(formState.productId || null);
  
  // Mock function to get products - in real implementation this would come from useShopify()
  const getProducts = async () => {
    // This is a placeholder. In real implementation, this would fetch from Shopify API
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockProducts = [
        { id: 'product1', title: 'منتج تجريبي 1', handle: 'sample-product-1' },
        { id: 'product2', title: 'منتج تجريبي 2', handle: 'sample-product-2' },
        { id: 'product3', title: 'منتج تجريبي 3', handle: 'sample-product-3' },
      ];
      
      return mockProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Mock function for saving product settings
  const saveProductSettings = async ({ productId, formId, enabled = true }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    } catch (error) {
      console.error('Error saving product settings:', error);
      return { error: 'Failed to save product settings' };
    }
  };
  
  // Load available products
  useEffect(() => {
    const loadProducts = async () => {
      const shopifyProducts = await getProducts();
      if (shopifyProducts && Array.isArray(shopifyProducts)) {
        setProducts(shopifyProducts);
      }
    };
    
    loadProducts();
  }, []);
  
  // Handle product selection change
  const handleProductChange = async (productId: string) => {
    try {
      setSelectedProduct(productId);
      
      // Update form state with the selected product
      setFormState({ productId });
      
      // Save the product-form association to the database
      if (onSave) {
        await onSave({ productId });
      }
      
      // Save product settings in Supabase
      await saveProductSettings({
        productId,
        formId,
        enabled: true
      });
      
      toast.success(
        language === 'ar'
          ? 'تم ربط النموذج بالمنتج بنجاح'
          : 'Form linked to product successfully'
      );
    } catch (error) {
      console.error('Error linking form to product:', error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء ربط النموذج بالمنتج'
          : 'Error linking form to product'
      );
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'ربط النموذج بمنتج' : 'Link Form to Product'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'اختر منتجًا لربط هذا النموذج به. سيظهر النموذج فقط على صفحة المنتج المحدد.' 
            : 'Choose a product to link this form to. The form will only appear on the selected product page.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full items-center gap-3">
            <Label htmlFor="product-select" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'اختر منتج' : 'Select Product'}
            </Label>
            
            <Select 
              value={selectedProduct || ''} 
              onValueChange={handleProductChange}
              disabled={loading}
            >
              <SelectTrigger id="product-select" className="w-full">
                <SelectValue 
                  placeholder={
                    loading 
                      ? (language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...')
                      : (language === 'ar' ? 'اختر منتجًا' : 'Select a product')
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 && !loading ? (
                  <div className="p-2 text-center text-gray-500">
                    {language === 'ar' 
                      ? 'لم يتم العثور على منتجات' 
                      : 'No products found'}
                  </div>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct ? (
            <Alert variant="success" className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className={`text-green-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar'
                  ? 'تم ربط هذا النموذج بالمنتج المحدد. سيظهر النموذج تلقائيًا في صفحة المنتج.'
                  : 'This form is linked to the selected product. The form will be displayed automatically on the product page.'}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="warning" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className={`text-amber-800 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' 
                  ? 'هذا النموذج غير مرتبط بأي منتج حاليًا. يرجى اختيار منتج لربط النموذج به.' 
                  : 'This form is not linked to any product. Please select a product to link this form to.'}
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="default" className="bg-blue-50 border-blue-200 mt-4">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className={`text-blue-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar'
                ? 'ملاحظة: تأكد من نشر النموذج قبل استخدامه في متجرك. النماذج غير المنشورة لن تظهر للعملاء.'
                : 'Note: Make sure to publish the form before using it in your store. Unpublished forms will not appear to customers.'}
            </AlertDescription>
          </Alert>
          
          {/* توجيهات لتحسين مظهر النموذج في المتجر */}
          <Alert variant="default" className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className={`text-green-800 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar'
                ? 'نصيحة: أضف حقل "عنوان نموذج" (form-title) لتحسين شكل النموذج في المتجر وتجنب العناوين المكررة.'
                : 'Tip: Add a "Form Title" field to improve the form appearance in your store and avoid duplicate headings.'}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
