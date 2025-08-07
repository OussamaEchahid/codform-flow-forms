
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShoppingBag, AlertCircle, RefreshCw, InfoIcon } from 'lucide-react';
import { ShopifyProduct, ProductFormConflict } from '@/lib/shopify/types';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyProductSelectionProps {
  selectedProducts: string[];
  onChange: (products: string[]) => void;
  formId?: string;
  readOnly?: boolean;
}

const ShopifyProductSelection: React.FC<ShopifyProductSelectionProps> = ({
  selectedProducts = [],
  onChange,
  formId,
  readOnly = false
}) => {
  const { t, language } = useI18n();
  const { 
    loadProducts, 
    products, 
    isLoading, 
    refreshConnection, 
    isRetrying, 
    tokenError, 
    shop 
  } = useShopify();
  
  const [localSelectedProducts, setLocalSelectedProducts] = useState<string[]>(selectedProducts);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [formConflicts, setFormConflicts] = useState<ProductFormConflict[]>([]);
  const [associatedProductDetails, setAssociatedProductDetails] = useState<Array<{id: string, title: string}>>([]);
  
  // Load initial products with retry mechanism
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchProducts = async (forceRefresh = false) => {
      try {
        // التحقق من وجود متجر نشط قبل تحميل المنتجات
        const activeShop = shop || 
          localStorage.getItem('current_shopify_store') ||
          localStorage.getItem('shopify_store');
          
        if (!activeShop) {
          console.log('⚠️ لا يوجد متجر نشط، تخطي تحميل المنتجات');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              if (isMounted) {
                fetchProducts(false);
              }
            }, 2000);
            return;
          }
          
          toast.error(language === 'ar' 
            ? 'لا يوجد متجر Shopify نشط. يرجى الاتصال بمتجرك أولاً'
            : 'No active Shopify store. Please connect your store first');
          return;
        }

        console.log('🚀 بدء تحميل المنتجات للمتجر:', activeShop);
        await loadProducts(forceRefresh);
        console.log("✅ تم تحميل المنتجات بنجاح");
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error("❌ خطأ في تحميل المنتجات:", error);
        
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          console.log(`🔄 إعادة المحاولة ${retryCount}/${maxRetries}`);
          setTimeout(() => {
            if (isMounted) {
              fetchProducts(true);
            }
          }, 3000);
        } else {
          toast.error(language === 'ar' 
            ? 'فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى'
            : 'Failed to load products. Please try again');
        }
      }
    };
    
    fetchProducts();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_shopify_store' || e.key === 'shopify_store') {
        setTimeout(() => {
          if (isMounted) {
            fetchProducts(true);
          }
        }, 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadProducts, shop]);
  
  // Update local products when selectedProducts prop changes
  useEffect(() => {
    setLocalSelectedProducts(selectedProducts);
  }, [selectedProducts]);
  
  // Filter products based on search
  useEffect(() => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    // Filter based on search term
    const filtered = products.filter(product => {
      const title = product.title?.toLowerCase() || '';
      const handle = product.handle?.toLowerCase() || '';
      
      // Check search if exists
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return title.includes(searchLower) || handle.includes(searchLower);
      }
      
      return true;
    });
    
    console.log(`Showing ${filtered.length} products out of ${products.length} total products`);
    setFilteredProducts(filtered);
  }, [products, searchTerm]);
  
  // Fetch associated product details for read-only mode
  useEffect(() => {
    if (!formId || !shop || !readOnly || formId === "new") return;
    
    async function fetchAssociatedProducts() {
      try {
        // Get product settings for this form
        const { data: productSettings, error } = await supabase
          .from('shopify_product_settings')
          .select('*')
          .eq('form_id', formId);
          
        if (error) {
          console.error('Error fetching product settings:', error);
          return;
        }
        
        // If no associated products, exit early
        if (!productSettings || productSettings.length === 0) {
          setAssociatedProductDetails([]);
          return;
        }
        
        const productIds = productSettings.map(s => s.product_id);
        
        // Skip cached products query since table doesn't exist
        const cachedProducts = null;
          
        if (cachedProducts?.products) {
          const shopifyProducts = cachedProducts.products;
          const matchedProducts = shopifyProducts
            .filter((product: any) => productIds.includes(product.id))
            .map((product: any) => ({ 
              id: product.id, 
              title: product.title 
            }));
            
          setAssociatedProductDetails(matchedProducts);
        }
      } catch (error) {
        console.error('Error fetching associated products:', error);
      }
    }
    
    fetchAssociatedProducts();
  }, [formId, shop, readOnly]);
  
  // Check for product-form conflicts
  useEffect(() => {
    async function checkForConflicts() {
      if (!shop || selectedProducts.length === 0 || !formId || formId === "new") return;
      
      try {
        // Find existing product settings for the selected products
        const { data: existingSettings, error } = await supabase
          .from('shopify_product_settings')
          .select('product_id, form_id')
          .in('product_id', selectedProducts)
          .neq('form_id', formId);
          
        if (error) {
          console.error('Error checking for conflicts:', error);
          return;
        }
        
        if (!existingSettings || existingSettings.length === 0) {
          setFormConflicts([]);
          return;
        }
        
        // Get forms data for conflict details
        const formIds = [...new Set(existingSettings.map(s => s.form_id))];
        const { data: conflictForms } = await supabase
          .from('forms')
          .select('id, title')
          .in('id', formIds);
          
        if (!conflictForms) return;
        
        // Skip cached products query since table doesn't exist
        const cachedProducts = null;
          
        if (!cachedProducts?.products) return;
        
        // Build conflict data
        const conflicts: ProductFormConflict[] = [];
        for (const setting of existingSettings) {
          const product = cachedProducts.products.find((p: any) => p.id === setting.product_id);
          const form = conflictForms.find(f => f.id === setting.form_id);
          
          if (product && form) {
            // Get the current form details
            const { data: currentForm } = await supabase
              .from('forms')
              .select('title')
              .eq('id', formId)
              .maybeSingle();
              
            conflicts.push({
              productId: setting.product_id,
              productTitle: product.title,
              existingFormId: setting.form_id,
              existingFormTitle: form.title,
              newFormId: formId,
              newFormTitle: currentForm?.title || 'Current Form'
            });
          }
        }
        
        setFormConflicts(conflicts);
        
        // Show toast for conflicts
        if (conflicts.length > 0) {
          toast.warning(
            language === 'ar'
              ? `تم العثور على ${conflicts.length} تعارض بين المنتجات والنماذج`
              : `Found ${conflicts.length} product-form conflict(s)`
          );
        }
      } catch (error) {
        console.error('Error checking for form conflicts:', error);
      }
    }
    
    checkForConflicts();
  }, [localSelectedProducts, formId, shop]);
  
  const handleProductToggle = (productId: string) => {
    if (readOnly) return; // Don't allow changes in read-only mode
    
    setLocalSelectedProducts(prev => {
      const isSelected = prev.includes(productId);
      const updated = isSelected
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
        
      // Pass changes to parent component
      onChange(updated);
      return updated;
    });
  };
  
  const handleSelectAll = () => {
    if (readOnly || filteredProducts.length === 0) return;
    
    const allProductIds = filteredProducts.map(product => product.id);
    setLocalSelectedProducts(allProductIds);
    onChange(allProductIds);
    
    toast.success(language === 'ar' 
      ? 'تم تحديد جميع المنتجات' 
      : 'All products selected');
  };
  
  const handleClearAll = () => {
    if (readOnly) return;
    
    setLocalSelectedProducts([]);
    onChange([]);
    
    toast.success(language === 'ar' 
      ? 'تم إلغاء تحديد جميع المنتجات' 
      : 'All products deselected');
  };
  
  const handleForceRefresh = async () => {
    if (readOnly) return;
    
    setForceRefresh(true);
    toast.info(language === 'ar' 
      ? 'جاري إعادة تحميل المنتجات من المتجر...' 
      : 'Reloading products from store...');
    
    try {
      // Force reload products with refresh flag
      await loadProducts(true);
      toast.success(language === 'ar' 
        ? 'تم تحديث المنتجات بنجاح' 
        : 'Products refreshed successfully');
    } catch (error) {
      console.error("Error refreshing products:", error);
      toast.error(language === 'ar' 
        ? 'فشل في تحديث المنتجات' 
        : 'Failed to refresh products');
    } finally {
      setForceRefresh(false);
    }
  };
  
  // Show read-only view when editing existing form
  if (readOnly && associatedProductDetails.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'المنتجات المرتبطة' : 'Associated Products'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' 
              ? 'هذا النموذج مرتبط بالمنتجات التالية' 
              : 'This form is associated with the following products'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>
              {language === 'ar' ? 'معلومات' : 'Information'}
            </AlertTitle>
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'لا يمكن تغيير ارتباط المنتج بعد إنشاء النموذج. يرجى إنشاء نموذج جديد إذا كنت بحاجة إلى ربط منتجات مختلفة.' 
                : 'Product associations cannot be changed after form creation. Please create a new form if you need to associate different products.'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            {associatedProductDetails.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-50 border border-blue-200 rounded-md p-3"
              >
                <ShoppingBag className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="font-medium">{product.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading || forceRefresh) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">
          {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
        </p>
      </div>
    );
  }
  
  if (tokenError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {language === 'ar' 
            ? 'حدث خطأ في الاتصال بمتجر Shopify. يرجى التحقق من الإعدادات وإعادة المحاولة.' 
            : 'There was an error connecting to your Shopify store. Please check your settings and try again.'}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refreshConnection()}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري إعادة الاتصال...' : 'Reconnecting...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show conflicts if any
  if (formConflicts.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600">
            {language === 'ar' ? 'تعارض بين المنتجات والنماذج' : 'Product-Form Conflicts'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'تم العثور على تعارضات بين المنتجات المحددة والنماذج الموجودة' 
              : 'Conflicts found between selected products and existing forms'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {language === 'ar' ? 'تنبيه' : 'Warning'}
            </AlertTitle>
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'بعض المنتجات التي اخترتها مرتبطة بالفعل بنماذج أخرى. إذا واصلت، سيتم استبدال الارتباطات الحالية.' 
                : 'Some products you\'ve selected are already associated with other forms. If you continue, the existing associations will be replaced.'}
            </AlertDescription>
          </Alert>
          
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {formConflicts.map((conflict) => (
                <div key={conflict.productId} className="border border-amber-300 bg-amber-50 rounded-md p-3">
                  <p className="font-medium">{conflict.productTitle}</p>
                  <p className="text-sm text-gray-600">
                    {language === 'ar' 
                      ? `مرتبط حالياً بـ: ${conflict.existingFormTitle}` 
                      : `Currently associated with: ${conflict.existingFormTitle}`}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    {language === 'ar' 
                      ? `سيتم ربطه بـ: ${conflict.newFormTitle}` 
                      : `Will be associated with: ${conflict.newFormTitle}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="default" 
              onClick={() => setFormConflicts([])}
              className="mr-2"
            >
              {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Remove conflicting products from selection
                const conflictIds = formConflicts.map(c => c.productId);
                const filteredSelection = localSelectedProducts.filter(id => !conflictIds.includes(id));
                setLocalSelectedProducts(filteredSelection);
                onChange(filteredSelection);
                setFormConflicts([]);
              }}
            >
              {language === 'ar' ? 'إزالة المنتجات المتعارضة' : 'Remove Conflicting Products'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'منتجات متجر Shopify' : 'Shopify Products'}
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleForceRefresh}
              disabled={isLoading || forceRefresh}
            >
              {forceRefresh ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">
                {language === 'ar' ? 'تحديث المنتجات' : 'Refresh Products'}
              </span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'لم يتم العثور على منتجات في متجرك. قد تحتاج إلى إضافة منتجات إلى متجر Shopify الخاص بك أولاً أو قم بتحديث المنتجات.' 
                : 'No products found in your store. You may need to add products to your Shopify store first or refresh the products.'}
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleForceRefresh}
            disabled={isLoading || forceRefresh}
            className="w-full"
          >
            {forceRefresh ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'تحديث المنتجات من المتجر' : 'Refresh Products from Store'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'منتجات متجر Shopify' : 'Shopify Products'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' 
            ? 'حدد المنتجات التي تريد ربط هذا النموذج بها' 
            : 'Select products you want to associate this form with'}
        </CardDescription>
        
        <div className="flex flex-col gap-2 mt-2">
          <Input
            placeholder={language === 'ar' ? 'البحث عن المنتجات...' : 'Search products...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
            disabled={readOnly}
          />
          
          <div className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleForceRefresh}
              disabled={isLoading || forceRefresh || readOnly}
            >
              {forceRefresh ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </span>
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={readOnly}
              >
                {language === 'ar' ? 'إلغاء تحديد الكل' : 'Clear All'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                disabled={readOnly}
              >
                {language === 'ar' ? 'تحديد الكل' : 'Select All'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`flex items-center justify-between space-x-4 rtl:space-x-reverse border rounded-md p-3 ${readOnly ? 'bg-gray-50' : 'hover:bg-muted/50'} transition-colors`}
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  {product.image ? (
                    <img 
                      src={typeof product.image === 'string' ? product.image : product.image.src} 
                      alt={typeof product.image === 'string' ? product.title : product.image.alt || product.title}
                      className="h-14 w-14 rounded-md object-contain border p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/eee/ccc?text=No+Image';
                      }}
                    />
                  ) : product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="h-14 w-14 rounded-md object-contain border p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/eee/ccc?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.price ? (() => {
                        const currencySymbols: Record<string, string> = {
                          'AED': 'د.إ',
                          'SAR': 'ر.س',
                          'MAD': 'د.م', // الدرهم المغربي
                          'USD': '$',
                          'EUR': '€',
                          'GBP': '£'
                        };
                        
                        const currency = product.currency || 'USD';
                        const symbol = currencySymbols[currency] || currency;
                        
                        return `${product.price} ${symbol}`;
                      })() : '-'}
                    </p>
                  </div>
                </div>
                
                <Checkbox
                  checked={localSelectedProducts.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                  aria-label={`Select ${product.title}`}
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-4 text-sm text-muted-foreground">
          {language === 'ar' 
            ? `تم تحديد ${localSelectedProducts.length} من المنتجات من إجمالي ${filteredProducts.length}` 
            : `${localSelectedProducts.length} of ${filteredProducts.length} products selected`}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyProductSelection;
