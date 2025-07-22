
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
      const shopId = localStorage.getItem('shopify_store');
      if (!shopId) {
        toast.error('لم يتم العثور على معرف المتجر');
        return;
      }

      // Fetch all products from Shopify
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        },
        body: JSON.stringify({
          shop: shopId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
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
              image: getImageUrl(product.featuredImage) || getImageUrl(product.image) || '/placeholder.svg',
              status: 'active' as const
            };
          });
          setProducts(transformedProducts);
        }
      }

      // Fetch linked products for this form
      const { data: linkedData, error: linkedError } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('form_id', formId);

      if (linkedError) {
        console.error('خطأ في جلب المنتجات المرتبطة:', linkedError);
      } else {
        const linkedIds = new Set(linkedData.map(item => item.product_id));
        setLinkedProducts(linkedIds);
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
      const shopId = localStorage.getItem('shopify_store');
      if (!shopId) {
        toast.error('لم يتم العثور على معرف المتجر');
        return;
      }

      const { error } = await supabase
        .from('shopify_product_settings')
        .insert({
          form_id: formId,
          product_id: productId,
          shop_id: shopId,
          enabled: true
        });

      if (error) {
        console.error('خطأ في ربط المنتج:', error);
        toast.error('فشل في ربط المنتج بالنموذج');
        return;
      }

      setLinkedProducts(prev => new Set([...prev, productId]));
      toast.success('تم ربط المنتج بالنموذج بنجاح');
    } catch (error) {
      console.error('خطأ في ربط المنتج:', error);
      toast.error('فشل في ربط المنتج بالنموذج');
    } finally {
      setIsOperating(null);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    setIsOperating(productId);
    try {
      const { error } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId)
        .eq('product_id', productId);

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
