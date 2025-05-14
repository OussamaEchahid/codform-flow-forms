
import React, { useState, useEffect, useMemo } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ShopifyProductSelectionProps {
  selectedProducts: string[];
  onChange: (products: string[]) => void;
  formId?: string;
}

const ShopifyProductSelection: React.FC<ShopifyProductSelectionProps> = ({
  selectedProducts = [],
  onChange,
  formId
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
  
  // تحميل المنتجات عند تحميل المكون
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Set forceRefresh to true to force fetch from API
        await loadProducts(false);
        console.log("Products loaded successfully");
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error(language === 'ar' 
          ? 'فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى'
          : 'Failed to load products. Please try again');
      }
    };
    
    fetchProducts();
  }, [loadProducts, forceRefresh]);
  
  // تحديث المنتجات المحلية عندما تتغير القيمة في الخاصية
  useEffect(() => {
    setLocalSelectedProducts(selectedProducts);
  }, [selectedProducts]);
  
  // تصفية المنتجات وإزالة منتجات الاختبار
  useEffect(() => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    // تصفية المنتجات التجريبية بناءً على عنوان المنتج، المعرف، والوسوم
    const filtered = products.filter(product => {
      const title = product.title?.toLowerCase() || '';
      const handle = product.handle?.toLowerCase() || '';
      // Access tags safely using optional chaining and type checking
      const tags = product.tags ? 
        (Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : String(product.tags).toLowerCase()) : 
        '';
      
      // التحقق من البحث أولاً
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!title.includes(searchLower) && !handle.includes(searchLower)) {
          return false;
        }
      }
      
      // نحن لا نريد تصفية المنتجات الحقيقية بشكل مفرط
      // لذلك نستخدم قائمة محدودة من الكلمات المفتاحية للمنتجات التجريبية
      if (title === 'test' || title === 'demo' || handle === 'test' || handle === 'demo' ||
          title === 'sample product' || title === 'test product') {
        return false;
      }

      return true;
    });
    
    console.log(`تمت تصفية ${products.length - filtered.length} منتج تجريبي من إجمالي ${products.length} منتج`);
    setFilteredProducts(filtered);
  }, [products, searchTerm]);
  
  const handleProductToggle = (productId: string) => {
    setLocalSelectedProducts(prev => {
      const isSelected = prev.includes(productId);
      const updated = isSelected
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
        
      // نقل التغييرات إلى المكون الأب
      onChange(updated);
      return updated;
    });
  };
  
  const handleSelectAll = () => {
    if (filteredProducts.length === 0) return;
    
    const allProductIds = filteredProducts.map(product => product.id);
    setLocalSelectedProducts(allProductIds);
    onChange(allProductIds);
    
    toast.success(language === 'ar' 
      ? 'تم تحديد جميع المنتجات' 
      : 'All products selected');
  };
  
  const handleClearAll = () => {
    setLocalSelectedProducts([]);
    onChange([]);
    
    toast.success(language === 'ar' 
      ? 'تم إلغاء تحديد جميع المنتجات' 
      : 'All products deselected');
  };
  
  const handleForceRefresh = async () => {
    setForceRefresh(true);
    toast.info(language === 'ar' 
      ? 'جاري إعادة تحميل المنتجات من المتجر...' 
      : 'Reloading products from store...');
    
    try {
      // Force refresh from API by setting forceRefresh to true in hook call
      await loadProducts(false);
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
                ? 'لم يتم العثور على منتجات في متجرك. قد تحتاج إلى إضافة منتجات إلى متجر Shopify الخاص بك أولاً.' 
                : 'No products found in your store. You may need to add products to your Shopify store first.'}
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
          />
          
          <div className="flex justify-between gap-2">
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
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </span>
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                {language === 'ar' ? 'إلغاء تحديد الكل' : 'Clear All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
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
                className="flex items-center justify-between space-x-4 rtl:space-x-reverse border rounded-md p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  {product.images && product.images.length > 0 ? (
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
                      {product.price ? `${product.price}` : '-'}
                    </p>
                  </div>
                </div>
                
                <Checkbox
                  checked={localSelectedProducts.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                  aria-label={`Select ${product.title}`}
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
