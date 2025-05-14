
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { ShopifyProduct } from '@/lib/shopify/types';

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
  
  useEffect(() => {
    // Load products when component mounts
    loadProducts();
  }, [loadProducts]);
  
  useEffect(() => {
    // Update local state when prop changes
    setLocalSelectedProducts(selectedProducts);
  }, [selectedProducts]);
  
  const handleProductToggle = (productId: string) => {
    setLocalSelectedProducts(prev => {
      const isSelected = prev.includes(productId);
      const updated = isSelected
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
        
      // Propagate changes to parent
      onChange(updated);
      return updated;
    });
  };
  
  const handleSelectAll = () => {
    if (products.length === 0) return;
    
    const allProductIds = products.map(product => product.id);
    setLocalSelectedProducts(allProductIds);
    onChange(allProductIds);
  };
  
  const handleClearAll = () => {
    setLocalSelectedProducts([]);
    onChange([]);
  };
  
  if (isLoading) {
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
  
  if (!products || products.length === 0) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {language === 'ar' 
            ? 'لم يتم العثور على منتجات في متجرك. يرجى إضافة منتجات إلى متجر Shopify الخاص بك أولاً.' 
            : 'No products found in your store. Please add products to your Shopify store first.'}
        </AlertDescription>
      </Alert>
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
        
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            {language === 'ar' ? 'إلغاء تحديد الكل' : 'Clear All'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {language === 'ar' ? 'تحديد الكل' : 'Select All'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {products.map((product) => (
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
            ? `تم تحديد ${localSelectedProducts.length} من المنتجات من إجمالي ${products.length}` 
            : `${localSelectedProducts.length} of ${products.length} products selected`}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyProductSelection;
