
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { Info, AlertTriangle, ShoppingBag, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShopifyProduct {
  id: string;
  title: string;
  image?: string;
}

interface ProductConflict {
  productId: string;
  productTitle: string;
  existingFormId: string;
  existingFormTitle: string;
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
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<ProductConflict | null>(null);
  const [associatedProductsDetails, setAssociatedProductsDetails] = useState<ShopifyProduct[]>([]);
  const [cachedFormTitles, setCachedFormTitles] = useState<Record<string, string>>({});

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

  // Fetch form titles for better conflict messages
  useEffect(() => {
    const fetchFormTitles = async () => {
      try {
        const { data, error } = await shopifySupabase
          .from('forms')
          .select('id, title');
          
        if (error) throw error;
        
        const titles: Record<string, string> = {};
        if (data) {
          data.forEach(form => {
            titles[form.id] = form.title;
          });
          setCachedFormTitles(titles);
        }
      } catch (error) {
        console.error('Error fetching form titles:', error);
      }
    };
    
    fetchFormTitles();
  }, []);

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
          
          // Fetch details for associated products
          if (productIds.length > 0) {
            const productsWithDetails = products.filter(p => productIds.includes(p.id));
            setAssociatedProductsDetails(productsWithDetails);
          }
        }
      } catch (error) {
        console.error('Error fetching associated products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssociatedProducts();
  }, [formId, shopId, products]);

  const checkProductConflict = async (productId: string): Promise<ProductConflict | null> => {
    try {
      const { data, error } = await shopifySupabase
        .from('shopify_product_settings')
        .select('form_id')
        .eq('product_id', productId)
        .eq('shop_id', shopId)
        .eq('enabled', true)
        .not('form_id', 'eq', formId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking product conflict:', error);
        return null;
      }
      
      if (data && data.form_id) {
        // Get product title
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        // Find the existing form title
        let existingFormTitle = cachedFormTitles[data.form_id] || 'نموذج آخر';
        
        return {
          productId,
          productTitle: product.title,
          existingFormId: data.form_id,
          existingFormTitle
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking product conflict:', error);
      return null;
    }
  };

  const handleProductToggle = async (productId: string) => {
    // If removing a product, no need to check for conflicts
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      return;
    }
    
    // Check if the product is already associated with another form
    const conflict = await checkProductConflict(productId);
    
    if (conflict) {
      setCurrentConflict(conflict);
      setConflictDialogOpen(true);
    } else {
      // No conflict, add the product
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  const handleResolveConflict = (shouldReplace: boolean) => {
    if (!currentConflict) return;
    
    if (shouldReplace) {
      // Add the product to selected products, overriding the existing association
      setSelectedProducts(prev => [...prev, currentConflict.productId]);
      toast.success(language === 'ar'
        ? `تم إضافة المنتج "${currentConflict.productTitle}" وسيتم استبدال الارتباط السابق`
        : `Product "${currentConflict.productTitle}" added and previous association will be replaced`);
    } else {
      // Don't add the product
      toast.info(language === 'ar'
        ? `لم يتم تغيير ارتباط المنتج "${currentConflict.productTitle}"`
        : `Product "${currentConflict.productTitle}" association unchanged`);
    }
    
    setConflictDialogOpen(false);
    setCurrentConflict(null);
  };

  const saveProductAssociations = async () => {
    if (!shopId || !formId) return;
    
    try {
      setLoading(true);
      
      // Products to add (in selected but not in associated)
      const toAdd = selectedProducts.filter(id => !associatedProducts.includes(id));
      
      // Products to remove (in associated but not in selected)
      const toRemove = associatedProducts.filter(id => !selectedProducts.includes(id));
      
      // For each product to add, check if it's associated with another form
      const conflicts: ProductConflict[] = [];
      for (const productId of toAdd) {
        const conflict = await checkProductConflict(productId);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
      
      // Resolve conflicts by removing previous associations
      if (conflicts.length > 0) {
        for (const conflict of conflicts) {
          // Delete the previous association
          await shopifySupabase
            .from('shopify_product_settings')
            .delete()
            .eq('product_id', conflict.productId)
            .eq('form_id', conflict.existingFormId);
          
          // Log the override
          console.log(`Overrode product ${conflict.productId} association from form ${conflict.existingFormId} to ${formId}`);
        }
        
        // Notify the user
        toast.info(language === 'ar'
          ? `تم استبدال ${conflicts.length} ارتباطات سابقة للمنتجات`
          : `Replaced ${conflicts.length} previous product associations`);
      }
      
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
            .eq('product_id', productId)
            .eq('form_id', formId);
            
          if (removeError) throw removeError;
        }
      }
      
      // Update local state to reflect the new associations
      setAssociatedProducts(selectedProducts);
      
      // Refresh associated products details
      const updatedDetails = products.filter(p => selectedProducts.includes(p.id));
      setAssociatedProductsDetails(updatedDetails);
      
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

            {/* Show associated products in general tab as well */}
            {associatedProductsDetails.length > 0 && (
              <div className="mt-4">
                <h3 className={`text-sm font-medium mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'المنتجات المرتبطة:' : 'Associated Products:'}
                </h3>
                <div className={`rounded-md border p-4 ${language === 'ar' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {associatedProductsDetails.length} {associatedProductsDetails.length === 1 ? 'منتج مرتبط' : 'منتجات مرتبطة'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {associatedProductsDetails.slice(0, 3).map(product => (
                      <li key={product.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-8 h-8 object-cover rounded-sm"
                          />
                        )}
                        <span className="truncate">{product.title}</span>
                      </li>
                    ))}
                    {associatedProductsDetails.length > 3 && (
                      <li className="text-xs text-gray-500">
                        {language === 'ar' 
                          ? `+ ${associatedProductsDetails.length - 3} منتجات أخرى...`
                          : `+ ${associatedProductsDetails.length - 3} more products...`}
                      </li>
                    )}
                  </ul>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('products')}
                    >
                      {language === 'ar' ? 'تعديل المنتجات' : 'Edit Products'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
                        <span className="font-medium truncate max-w-[250px]">{product.title}</span>
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

      {/* Product conflict dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تنبيه: تم العثور على تعارض في المنتج' : 'Alert: Product Conflict Detected'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `المنتج "${currentConflict?.productTitle}" مرتبط بالفعل بنموذج آخر (${currentConflict?.existingFormTitle}). هل تريد استبدال الارتباط الحالي؟`
                : `Product "${currentConflict?.productTitle}" is already associated with another form (${currentConflict?.existingFormTitle}). Do you want to replace the current association?`}
            </DialogDescription>
          </DialogHeader>

          <Alert variant="warning" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {language === 'ar' ? 'تحذير' : 'Warning'}
            </AlertTitle>
            <AlertDescription>
              {language === 'ar'
                ? 'استبدال هذا الارتباط سيؤدي إلى إلغاء ربط المنتج بالنموذج الآخر.'
                : 'Replacing this association will unlink the product from the other form.'}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleResolveConflict(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolveConflict(true)}
            >
              {language === 'ar' ? 'استبدال الارتباط' : 'Replace Association'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShopifyIntegration;
