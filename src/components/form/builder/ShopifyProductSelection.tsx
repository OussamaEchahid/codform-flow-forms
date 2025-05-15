
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, Search, TerminalSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface ShopifyProductSelectionProps {
  formId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const ShopifyProductSelection: React.FC<ShopifyProductSelectionProps> = ({ formId, onComplete, onCancel }) => {
  const { products, loadProducts, isLoading, shop } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [associatedProducts, setAssociatedProducts] = useState<Record<string, string>>({});
  const [makeDefault, setMakeDefault] = useState<boolean>(false);
  const [isCurrentlyDefault, setIsCurrentlyDefault] = useState<boolean>(false);
  
  // Load product settings
  useEffect(() => {
    const loadProductSettings = async () => {
      if (formId && shop) {
        try {
          // Check if form is default
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('is_default')
            .eq('id', formId)
            .single();
            
          if (!formError && formData) {
            setIsCurrentlyDefault(formData.is_default || false);
          }
          
          // Load associated products
          const { data, error } = await supabase
            .from('shopify_product_settings')
            .select('product_id, form_id')
            .eq('shop_id', shop)
            .eq('enabled', true);
            
          if (error) {
            console.error('Error fetching product settings:', error);
            return;
          }
          
          // Create a map of product ID to form ID
          const productFormMap: Record<string, string> = {};
          const productsWithThisForm = new Set<string>();
          
          data.forEach(record => {
            productFormMap[record.product_id] = record.form_id;
            if (record.form_id === formId) {
              productsWithThisForm.add(record.product_id);
            }
          });
          
          setAssociatedProducts(productFormMap);
          setSelectedProducts(productsWithThisForm);
        } catch (error) {
          console.error('Error loading product settings:', error);
        }
      }
    };
    
    loadProductSettings();
  }, [formId, shop]);
  
  // Load products on initial render
  useEffect(() => {
    if (products.length === 0) {
      loadProducts();
    }
  }, [loadProducts, products.length]);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };
  
  // Select all visible products
  const selectAllVisible = () => {
    const newSelection = new Set(selectedProducts);
    filteredProducts.forEach(product => newSelection.add(product.id));
    setSelectedProducts(newSelection);
  };
  
  // Deselect all products
  const deselectAll = () => {
    setSelectedProducts(new Set());
  };
  
  // Is a product association changed?
  const isProductChanged = (productId: string) => {
    const currentlyAssociated = associatedProducts[productId] === formId;
    const nowSelected = selectedProducts.has(productId);
    return currentlyAssociated !== nowSelected;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!formId || !shop) {
      toast.error('ناقص معلومات النموذج أو المتجر');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, update the default flag for the form
      if (makeDefault !== isCurrentlyDefault) {
        // If making this form default, unset default from all other forms for this shop
        if (makeDefault) {
          await supabase
            .from('forms')
            .update({ is_default: false })
            .eq('shop_id', shop);
        }
        
        // Update this form's default status
        await supabase
          .from('forms')
          .update({ is_default: makeDefault })
          .eq('id', formId);
          
        setIsCurrentlyDefault(makeDefault);
      }
      
      // Handle product associations
      const updates = [];
      
      // Products to associate with this form
      for (const productId of selectedProducts) {
        if (associatedProducts[productId] !== formId) {
          updates.push(supabase
            .from('shopify_product_settings')
            .upsert({
              shop_id: shop,
              product_id: productId,
              form_id: formId,
              enabled: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'shop_id,product_id' })
          );
        }
      }
      
      // Products to disassociate from this form
      for (const [productId, associatedFormId] of Object.entries(associatedProducts)) {
        if (associatedFormId === formId && !selectedProducts.has(productId)) {
          updates.push(supabase
            .from('shopify_product_settings')
            .update({ enabled: false })
            .eq('shop_id', shop)
            .eq('product_id', productId)
            .eq('form_id', formId)
          );
        }
      }
      
      // Execute all updates
      await Promise.all(updates);
      
      toast.success('تم حفظ إعدادات المنتجات بنجاح');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating product settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ضبط إعدادات النموذج للمنتجات</CardTitle>
          <CardDescription>
            حدد المنتجات التي تريد عرض هذا النموذج فيها. يمكنك البحث وتحديد منتجات متعددة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default form toggle */}
          <div className="flex flex-row items-center justify-between px-2 py-4 border rounded-md">
            <div>
              <h4 className="font-medium">جعل هذا النموذج افتراضي للمتجر</h4>
              <p className="text-sm text-gray-500">
                سيستخدم هذا النموذج لجميع المنتجات التي لم يتم تخصيص نموذج لها
              </p>
            </div>
            <Switch 
              checked={makeDefault}
              onCheckedChange={setMakeDefault}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Search and bulk selection */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="بحث في المنتجات"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={selectAllVisible}
                disabled={filteredProducts.length === 0 || isSubmitting}
              >
                تحديد الكل
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={deselectAll}
                disabled={selectedProducts.size === 0 || isSubmitting}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>
          
          {/* Status display */}
          <div className="text-sm text-gray-500">
            تم تحديد {selectedProducts.size} من أصل {products.length} منتج
          </div>
          
          {/* Product list */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">جاري تحميل المنتجات...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
              {filteredProducts.map(product => {
                const isSelected = selectedProducts.has(product.id);
                const hasChanged = isProductChanged(product.id);
                const currentFormId = associatedProducts[product.id];
                const differentFormSelected = currentFormId && currentFormId !== formId;
                
                return (
                  <div 
                    key={product.id}
                    className={`flex items-center px-4 py-3 hover:bg-gray-50 ${hasChanged ? 'bg-blue-50' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      disabled={isSubmitting}
                      className="ml-2"
                    />
                    
                    <div className="flex items-center flex-1 min-w-0">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="h-10 w-10 object-cover rounded ml-2"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center ml-2">
                          <TerminalSquare className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <div className="font-medium truncate">{product.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {product.variants && product.variants.length > 0 
                            ? `${product.variants.length} متغير` 
                            : 'منتج أساسي'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-auto flex items-center">
                      {differentFormSelected ? (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          مرتبط بنموذج آخر
                        </Badge>
                      ) : currentFormId === formId ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          مرتبط بهذا النموذج
                        </Badge>
                      ) : null}
                      
                      {hasChanged && (
                        <Badge className="mr-2 bg-blue-500">سيتغير</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertTitle>لا توجد منتجات</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? 'لا توجد منتجات تطابق البحث. جرب كلمات بحث أخرى.'
                  : 'لم يتم العثور على منتجات في هذا المتجر. أضف منتجات أولاً.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ إعدادات المنتجات'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyProductSelection;
