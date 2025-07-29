import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { ShopifyProduct } from '@/lib/shopify/types';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface NewFormProductDialogProps {
  open: boolean;
  onSelect: (productIds: string[]) => void;
  onClose: () => void;
  onSkip: () => void;
}

const NewFormProductDialog: React.FC<NewFormProductDialogProps> = ({
  open,
  onSelect,
  onClose,
  onSkip,
}) => {
  const { language } = useI18n();
  const { activeStore: shop, loading: shopLoading } = useSimpleShopify();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when dialog opens
  useEffect(() => {
    if (open && shop) {
      fetchProducts();
    }
  }, [open, shop]);

  const fetchProducts = async () => {
    if (!shop) {
      setError('لم يتم العثور على متجر نشط');
      return;
    }

    try {
      setIsLoadingProducts(true);
      setError(null);
      
      console.log('🛍️ جلب المنتجات للمتجر:', shop);
      
      // استخدام supabase functions بدلاً من fetch مباشر
      const { supabase } = await import('@/integrations/supabase/client');
      
      const response = await supabase.functions.invoke('shopify-products', {
        body: {
          shop: shop,
          refresh: true, // إجبار إعادة تحديث المنتجات
          includeTestProducts: false
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في الاتصال بخدمة المنتجات');
      }

      const result = response.data;
      
      if (result?.success && result?.products) {
        setProducts(result.products);
        console.log(`✅ تم جلب ${result.products.length} منتج من ${shop}`);
        
        if (result.products.length === 0) {
          setError('لا توجد منتجات في هذا المتجر');
        }
      } else {
        throw new Error(result?.message || 'فشل في جلب المنتجات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المنتجات:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في جلب المنتجات';
      setError(errorMessage);
      toast.error(`فشل في تحميل المنتجات: ${errorMessage}`);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleContinue = () => {
    onSelect(selectedProducts);
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {language === 'ar' ? 'اختيار المنتجات (اختياري)' : 'Select Products (Optional)'}
          </DialogTitle>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'يمكنك ربط هذا النموذج بمنتجات محددة أو تخطي هذه الخطوة لإنشاء نموذج عام'
              : 'You can associate this form with specific products or skip this step to create a general form'}
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Loading State */}
          {(shopLoading || isLoadingProducts) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingProducts && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* No Shop State */}
          {!shop && !shopLoading && (
            <div className="flex items-center justify-center py-8 text-amber-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>{language === 'ar' ? 'لا يوجد متجر متصل' : 'No connected store'}</span>
            </div>
          )}

          {/* Products Grid */}
          {!isLoadingProducts && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedProducts.includes(product.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleProductToggle(product.id)}
                >
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img
                          src={typeof product.image === 'string' ? product.image : product.image.src}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" title={product.title}>
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {product.id}
                      </p>
                      {product.status && (
                        <Badge 
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs mt-2"
                        >
                          {product.status}
                        </Badge>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedProducts.includes(product.id) && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Products State */}
          {!isLoadingProducts && !error && products.length === 0 && shop && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p>{language === 'ar' ? 'لا توجد منتجات في هذا المتجر' : 'No products found in this store'}</p>
            </div>
          )}
        </div>

        {/* Selected Products Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-primary">
              {language === 'ar' 
                ? `تم اختيار ${selectedProducts.length} منتج`
                : `Selected ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="outline" onClick={handleSkip}>
            {language === 'ar' ? 'تخطي وإنشاء نموذج عام' : 'Skip & Create General Form'}
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={selectedProducts.length === 0}
          >
            {language === 'ar' ? 'متابعة مع المنتجات المختارة' : 'Continue with Selected Products'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewFormProductDialog;