
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Link, Unlink, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct } from '@/lib/shopify/types';
import { getActiveShopId, cleanShopId } from '@/utils/shop-utils';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  formId,
  formTitle,
}) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOperating, setIsOperating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formId) {
      fetchProductsAndLinks();
    }
  }, [isOpen, formId]);

  const fetchProductsAndLinks = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 ProductManagementModal: بدء جلب البيانات...');
      const rawShopId = getActiveShopId();
      console.log('🔍 ProductManagementModal: rawShopId =', rawShopId);
      
      if (!rawShopId) {
        toast.error('لم يتم العثور على معرف المتجر');
        console.error('❌ ProductManagementModal: No shop ID found');
        return;
      }
      
      const shopId = cleanShopId(rawShopId);
      console.log('🔍 ProductManagementModal: shopId after cleaning =', shopId);
      console.log(`🔍 جلب المنتجات للمتجر: ${shopId}`);

      // Fetch all products from Shopify using the correct function
      console.log('📡 استدعاء دالة shopify-products-fixed...');
      
      const { data, error: productsError } = await supabase.functions.invoke('shopify-products-fixed', {
        body: { 
          shop: shopId
        }
      });

      console.log('📊 نتيجة استدعاء shopify-products-fixed:', { data, error: productsError });

      if (productsError) {
        console.error('❌ خطأ في جلب المنتجات:', productsError);
        toast.error('فشل في تحميل المنتجات من Shopify: ' + productsError.message);
        setProducts([]);
      } else if (data?.success && data?.products) {
        const transformedProducts: ShopifyProduct[] = data.products.map((product: any) => {
          const getImageUrl = (imageData: any): string => {
            if (typeof imageData === 'string') return imageData;
            if (imageData && typeof imageData === 'object' && imageData.src) return imageData.src;
            return '/placeholder.svg';
          };

          return {
            id: String(product.id).replace('gid://shopify/Product/', ''),
            title: product.title || `منتج ${product.id}`,
            handle: product.handle || '',
            image: getImageUrl(product.image) || '/placeholder.svg',
            status: 'active' as const
          };
        });
        setProducts(transformedProducts);
        console.log('✅ تم تحميل المنتجات بنجاح:', transformedProducts.length);
      } else {
        console.log('⚠️ لم يتم العثور على منتجات في المتجر أو فشل في الاستجابة');
        console.log('📊 البيانات المستلمة:', data);
        setProducts([]);
        toast.error('لا توجد منتجات في المتجر أو حدث خطأ في التحميل');
      }

      // Fetch linked products for this form AND shop
      console.log(`🔗 جلب المنتجات المرتبطة للنموذج: ${formId} والمتجر: ${shopId}`);
      
      const { data: linkedData, error: linkedError } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('form_id', formId)
        .eq('shop_id', shopId);

      console.log('📊 نتيجة جلب المنتجات المرتبطة:', { linkedData, error: linkedError });

      if (linkedError) {
        console.error('خطأ في جلب المنتجات المرتبطة:', linkedError);
        toast.error('فشل في تحميل المنتجات المرتبطة');
      } else {
        const linkedIds = new Set(linkedData.map(item => item.product_id));
        setLinkedProducts(linkedIds);
        console.log('✅ تم تحميل المنتجات المرتبطة:', linkedIds.size);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkProduct = async (productId: string) => {
    setIsOperating(productId);
    try {
      const rawShopId = getActiveShopId();
      if (!rawShopId) {
        toast.error('لم يتم العثور على معرف المتجر');
        return;
      }
      
      const shopId = cleanShopId(rawShopId);
      console.log(`🔗 ربط المنتج ${productId} بالمتجر: ${shopId}`);

      // استخدام الدالة المخصصة لربط المنتج مع معالجة أفضل للأخطاء
      console.log('🔗 محاولة ربط المنتج باستخدام الدالة المخصصة:', {
        shopId,
        productId: String(productId),
        formId
      });

      const { data: result, error } = await supabase
        .rpc('associate_product_with_form', {
          p_shop_id: shopId,
          p_product_id: String(productId),
          p_form_id: formId,
          p_enabled: true
        });

      if (error) {
        console.error('❌ خطأ في ربط المنتج:', error);
        
        // معالجة خطأ duplicate key
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          toast.error('هذا المنتج مرتبط بالفعل بنموذج آخر');
          setLinkedProducts(prev => new Set([...prev, productId]));
        } else {
          toast.error('فشل في ربط المنتج: ' + error.message);
        }
        return;
      }

      console.log('✅ تم ربط المنتج بنجاح');
      setLinkedProducts(prev => new Set([...prev, productId]));
      toast.success('تم ربط المنتج بالنموذج بنجاح');
    } catch (error) {
      console.error('❌ خطأ في ربط المنتج:', error);
      toast.error('فشل في ربط المنتج بالنموذج');
    } finally {
      setIsOperating(null);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    setIsOperating(productId);
    try {
      const rawShopId = getActiveShopId();
      if (!rawShopId) {
        toast.error('لم يتم العثور على معرف المتجر');
        return;
      }
      
      const shopId = cleanShopId(rawShopId);
      console.log(`🔗 إلغاء ربط المنتج ${productId} من المتجر: ${shopId}`);
      
      const { error } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId)
        .eq('product_id', productId)
        .eq('shop_id', shopId);

      if (error) {
        console.error('خطأ في إلغاء ربط المنتج:', error);
        toast.error('فشل في إلغاء ربط المنتج من النموذج');
        return;
      }

      setLinkedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      toast.success('تم إلغاء ربط المنتج من النموذج بنجاح');
    } catch (error) {
      console.error('خطأ في إلغاء ربط المنتج:', error);
      toast.error('فشل في إلغاء ربط المنتج من النموذج');
    } finally {
      setIsOperating(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            إدارة المنتجات المرتبطة
          </DialogTitle>
          <DialogDescription>
            إدارة المنتجات المرتبطة بالنموذج: {formTitle}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">جاري تحميل المنتجات...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                إجمالي المنتجات: {products.length} | المرتبطة: {linkedProducts.size}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد منتجات متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => {
                  const isLinked = linkedProducts.has(product.id);
                  const isCurrentlyOperating = isOperating === product.id;

                  return (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isLinked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={typeof product.image === 'string' ? product.image : product.image?.src || '/placeholder.svg'}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 rounded object-cover border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {product.id}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {isLinked ? (
                              <Badge variant="success" className="text-xs">
                                مرتبط ✅
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                غير مرتبط
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {isLinked ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUnlinkProduct(product.id)}
                              disabled={isCurrentlyOperating}
                              className="text-xs"
                            >
                              {isCurrentlyOperating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unlink className="h-3 w-3" />
                              )}
                              إلغاء الربط
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLinkProduct(product.id)}
                              disabled={isCurrentlyOperating}
                              className="text-xs"
                            >
                              {isCurrentlyOperating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Link className="h-3 w-3" />
                              )}
                              ربط
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductManagementModal;
