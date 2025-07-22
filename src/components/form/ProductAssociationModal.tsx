
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Link, Unlink, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  title: string;
  handle: string;
  image?: {
    src: string;
    alt?: string;
  };
  status: string;
}

interface ProductAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

export function ProductAssociationModal({ 
  isOpen, 
  onClose, 
  formId, 
  formTitle 
}: ProductAssociationModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [operatingProductId, setOperatingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { activeStore } = useSimpleShopify();

  // Fetch products and their associations
  const fetchProductsAndAssociations = async () => {
    if (!activeStore) {
      setError('لا يوجد متجر نشط');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching products for store:', activeStore);
      
      // Fetch products from Shopify
      const { data: productsData, error: productsError } = await supabase.functions.invoke('shopify-products', {
        body: { shop: activeStore }
      });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }

      const fetchedProducts = productsData?.products || [];
      console.log('📦 Fetched products:', fetchedProducts.length);
      setProducts(fetchedProducts);

      // Fetch linked products from database
      const { data: associations, error: associationsError } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('form_id', formId)
        .eq('shop_id', activeStore)
        .eq('enabled', true);

      if (associationsError) {
        console.error('Error fetching associations:', associationsError);
        throw associationsError;
      }

      const linkedIds = associations?.map(a => a.product_id) || [];
      console.log('🔗 Linked products:', linkedIds);
      setLinkedProducts(linkedIds);
      
    } catch (error: any) {
      console.error('Error in fetchProductsAndAssociations:', error);
      setError(error.message || 'حدث خطأ في تحميل البيانات');
      toast.error('خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && formId && activeStore) {
      fetchProductsAndAssociations();
    }
  }, [isOpen, formId, activeStore]);

  // Link product to form
  const handleLinkProduct = async (productId: string) => {
    if (!activeStore) {
      toast.error('لا يوجد متجر نشط');
      return;
    }
    
    setOperatingProductId(productId);
    try {
      console.log('🔗 Linking product:', productId, 'to form:', formId);
      
      // First check if already linked
      const { data: existing } = await supabase
        .from('shopify_product_settings')
        .select('id')
        .eq('shop_id', activeStore)
        .eq('product_id', productId)
        .eq('form_id', formId)
        .single();

      if (existing) {
        toast.error('هذا المنتج مرتبط بالفعل بهذا النموذج');
        return;
      }

      // Check if product is linked to another form
      const { data: otherLink } = await supabase
        .from('shopify_product_settings')
        .select('form_id')
        .eq('shop_id', activeStore)
        .eq('product_id', productId)
        .eq('enabled', true)
        .single();

      if (otherLink && otherLink.form_id !== formId) {
        toast.error('هذا المنتج مرتبط بنموذج آخر بالفعل');
        return;
      }

      // Insert new association
      const { error } = await supabase
        .from('shopify_product_settings')
        .insert({
          shop_id: activeStore,
          product_id: productId,
          form_id: formId,
          enabled: true
        });

      if (error) {
        console.error('Error linking product:', error);
        if (error.code === '23505') {
          toast.error('هذا المنتج مرتبط بالفعل');
        } else {
          throw error;
        }
        return;
      }

      setLinkedProducts(prev => [...prev, productId]);
      toast.success('تم ربط المنتج بالنموذج');
      console.log('✅ Product linked successfully');
      
    } catch (error: any) {
      console.error('Error linking product:', error);
      toast.error('خطأ في ربط المنتج: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setOperatingProductId(null);
    }
  };

  // Unlink product from form
  const handleUnlinkProduct = async (productId: string) => {
    if (!activeStore) {
      toast.error('لا يوجد متجر نشط');
      return;
    }
    
    setOperatingProductId(productId);
    try {
      console.log('🔗 Unlinking product:', productId, 'from form:', formId);
      
      const { error } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('shop_id', activeStore)
        .eq('product_id', productId)
        .eq('form_id', formId);

      if (error) {
        console.error('Error unlinking product:', error);
        throw error;
      }

      setLinkedProducts(prev => prev.filter(id => id !== productId));
      toast.success('تم إلغاء ربط المنتج');
      console.log('✅ Product unlinked successfully');
      
    } catch (error: any) {
      console.error('Error unlinking product:', error);
      toast.error('خطأ في إلغاء ربط المنتج');
    } finally {
      setOperatingProductId(null);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ربط المنتجات بالنموذج: {formTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="mr-2">جاري تحميل المنتجات...</span>
            </div>
          )}

          {/* Products List */}
          {!loading && !error && (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات'}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isLinked = linkedProducts.includes(product.id);
                  const isOperating = operatingProductId === product.id;

                  return (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img
                                src={product.image.src}
                                alt={product.image.alt || product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <h3 className="font-medium">{product.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {product.handle}
                              </p>
                              <Badge
                                variant={product.status === 'active' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {product.status === 'active' ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLinked && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                مربوط
                              </Badge>
                            )}
                            
                            <Button
                              variant={isLinked ? "destructive" : "default"}
                              size="sm"
                              onClick={() => 
                                isLinked 
                                  ? handleUnlinkProduct(product.id)
                                  : handleLinkProduct(product.id)
                              }
                              disabled={isOperating}
                            >
                              {isOperating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isLinked ? (
                                <>
                                  <Unlink className="h-4 w-4 ml-1" />
                                  إلغاء الربط
                                </>
                              ) : (
                                <>
                                  <Link className="h-4 w-4 ml-1" />
                                  ربط
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Summary */}
          {!loading && !error && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                المنتجات المربوطة: {linkedProducts.length} من أصل {products.length}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
