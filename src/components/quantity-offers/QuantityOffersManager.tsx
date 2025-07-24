import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, AlertCircle, Package, Gift, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuantityOffersEditor from './QuantityOffersEditor';
import QuantityOffersDisplay from './QuantityOffersDisplay';
import { getActiveShopId } from '@/utils/shop-utils';

interface Form {
  id: string;
  title: string;
}

interface ProductAssociation {
  product_id: string;
  product_title: string;
  form_id: string;
  form_title: string;
  product_price?: number;
  product_compare_at_price?: number;
  product_image?: string;
  product_currency?: string;
}

interface QuantityOffer {
  id: string;
  product_id: string;
  form_id: string;
  offers: any;
  styling: any;
  position: string;
  enabled: boolean;
  custom_selector?: string | null;
  created_at?: string;
  updated_at?: string;
  product_title?: string;
  form_title?: string;
}

const QuantityOffersManager: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [associatedProducts, setAssociatedProducts] = useState<ProductAssociation[]>([]);
  const [quantityOffers, setQuantityOffers] = useState<QuantityOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState<QuantityOffer | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { activeStore } = useSimpleShopify();
  const [refreshing, setRefreshing] = useState(false);
  const [storeData, setStoreData] = useState<{currency?: string}>({});

  const getConsistentActiveStore = (): string | null => {
    if (activeStore) {
      console.log('🏪 Using activeStore directly:', activeStore);
      return activeStore;
    }
    
    const fallbackStore = getActiveShopId();
    console.log('🏪 Using fallback store:', fallbackStore);
    return fallbackStore;
  };

  const loadStoreData = async () => {
    const currentStore = getConsistentActiveStore();
    if (!currentStore) return;
    
    try {
      const { data: shopData, error } = await supabase.functions.invoke('shopify-products', {
        body: { shop: currentStore, includeStoreInfo: true }
      });

      if (shopData?.store) {
        setStoreData({
          currency: shopData.store.currency || 'SAR'
        });
        console.log('💰 Store currency loaded:', shopData.store.currency);
      }
    } catch (error) {
      console.error('❌ Error loading store data:', error);
    }
  };

  const loadForms = async () => {
    const currentStore = getConsistentActiveStore();
    if (!currentStore) {
      console.log('🚫 No active store for loading forms');
      setForms([]);
      return;
    }
    
    try {
      console.log('📋 Loading forms for shop:', currentStore);
      
      const { data, error } = await supabase
        .from('forms')
        .select('id, title')
        .eq('shop_id', currentStore)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading forms:', error);
        throw error;
      }

      console.log('✅ Loaded forms:', data?.length || 0);
      setForms(data || []);
      
    } catch (error) {
      console.error('❌ Error loading forms:', error);
      toast.error('خطأ في تحميل النماذج');
    }
  };

  const loadFormProducts = async (formId: string) => {
    const currentStore = getConsistentActiveStore();
    if (!currentStore || !formId) {
      console.log('🚫 Missing store or form for loading products');
      setAssociatedProducts([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔗 Loading products for form:', formId, 'store:', currentStore);
      
      const { data: settings, error: settingsError } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('shop_id', currentStore)
        .eq('form_id', formId);

      if (settingsError) {
        console.error('❌ Error loading product settings:', settingsError);
        throw settingsError;
      }

      console.log('📦 Product settings found:', settings?.length || 0, settings);

      if (!settings || settings.length === 0) {
        console.log('ℹ️ No products associated with this form');
        setAssociatedProducts([]);
        setQuantityOffers([]);
        return;
      }

      console.log('📡 Fetching complete product details from Shopify for store:', currentStore);
      const { data: productsData, error: productsError } = await supabase.functions.invoke('shopify-products', {
        body: { 
          shop: currentStore,
          includeVariants: true,
          includeImages: true,
          includeStoreInfo: true
        }
      });

      if (productsError) {
        console.error('❌ Error fetching Shopify products:', productsError);
        throw productsError;
      }

      const allProducts = productsData?.products || [];
      const storeCurrency = productsData?.store?.currency || storeData.currency || 'SAR';
      
      console.log('📦 All Shopify products fetched:', allProducts.length);
      console.log('💰 Store currency:', storeCurrency);
      
      setStoreData({ currency: storeCurrency });
      
      const associatedProductIds = settings.map(s => String(s.product_id));
      console.log('🔗 Associated product IDs (as strings):', associatedProductIds);
      
      const formProducts = allProducts
        .filter((product: any) => {
          const productIdStr = String(product.id);
          const productIdNum = Number(productIdStr);
          const isAssociated = 
            associatedProductIds.includes(productIdStr) || 
            associatedProductIds.some(id => Number(id) === productIdNum);
          
          console.log(`🔍 Product ${productIdStr} (${product.title}) - Associated: ${isAssociated}`, {
            price: product.variants?.[0]?.price,
            image: product.image,
            variants: product.variants?.length
          });
          return isAssociated;
        })
        .map((product: any) => {
          const variant = product.variants?.[0];
          const price = variant?.price ? parseFloat(variant.price) : undefined;
          const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : undefined;
          
          let imageUrl = null;
          if (product.image) {
            imageUrl = typeof product.image === 'string' ? product.image : product.image.src;
          } else if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.src;
          }

          const productData = {
            product_id: String(product.id),
            product_title: product.title,
            form_id: formId,
            form_title: forms.find(f => f.id === formId)?.title || '',
            product_price: price,
            product_compare_at_price: compareAtPrice,
            product_image: imageUrl,
            product_currency: storeCurrency
          };

          console.log('📦 Mapped product data:', productData);
          return productData;
        });

      console.log('✅ Associated products mapped with complete data:', formProducts.length, formProducts);
      setAssociatedProducts(formProducts);

      await loadQuantityOffers(formId);
      
    } catch (error) {
      console.error('❌ Error loading form products:', error);
      toast.error('خطأ في تحميل منتجات النموذج: ' + (error as any)?.message);
      setAssociatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuantityOffers = async (formId: string) => {
    const currentStore = getConsistentActiveStore();
    if (!currentStore || !formId) {
      console.log('🚫 Missing store or form for loading quantity offers');
      return;
    }
    
    try {
      console.log('🎁 Loading quantity offers for form:', formId, 'store:', currentStore);
      
      const { data, error } = await supabase
        .from('quantity_offers')
        .select('*')
        .eq('shop_id', currentStore)
        .eq('form_id', formId);

      if (error) {
        console.error('❌ Error loading quantity offers:', error);
        throw error;
      }

      const enrichedOffers = data?.map(offer => ({
        ...offer,
        product_title: associatedProducts.find(p => p.product_id === offer.product_id)?.product_title || 'منتج غير معروف',
        form_title: forms.find(f => f.id === offer.form_id)?.title || 'نموذج غير معروف'
      })) || [];

      console.log('✅ Loaded quantity offers:', enrichedOffers.length);
      setQuantityOffers(enrichedOffers);
      
    } catch (error) {
      console.error('❌ Error loading quantity offers:', error);
      toast.error('خطأ في تحميل عروض الكمية');
    }
  };

  useEffect(() => {
    const currentStore = getConsistentActiveStore();
    if (currentStore) {
      console.log('🔄 Active store changed, reloading forms:', currentStore);
      loadStoreData();
      loadForms();
    }
  }, [activeStore]);

  useEffect(() => {
    if (selectedFormId) {
      console.log('📋 Selected form changed, loading products:', selectedFormId);
      loadFormProducts(selectedFormId);
    } else {
      setAssociatedProducts([]);
      setQuantityOffers([]);
    }
  }, [selectedFormId]);

  const forceRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStoreData();
      await loadForms();
      if (selectedFormId) {
        await loadFormProducts(selectedFormId);
      }
      toast.success('تم التحديث بنجاح');
    } catch (error) {
      toast.error('خطأ في التحديث');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateOffer = () => {
    if (!selectedProductId) {
      toast.error('يرجى اختيار منتج أولاً');
      return;
    }
    
    const existingOffer = quantityOffers.find(
      offer => offer.product_id === selectedProductId && offer.form_id === selectedFormId
    );
    
    if (existingOffer) {
      toast.error('يوجد عرض كمية بالفعل لهذا المنتج');
      return;
    }
    
    const selectedProduct = associatedProducts.find(p => p.product_id === selectedProductId);
    
    setEditingOffer({
      id: '',
      product_id: selectedProductId,
      form_id: selectedFormId,
      offers: [],
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        tagColor: '#22c55e',
        priceColor: '#000000'
      },
      position: 'before_form',
      enabled: true,
      product_title: selectedProduct?.product_title || '',
      form_title: selectedProduct?.form_title || ''
    });
    setIsCreating(true);
  };

  const handleSaveOffer = async (offerData: any) => {
    const currentStore = getConsistentActiveStore();
    if (!currentStore) {
      toast.error('لا يوجد متجر نشط');
      return;
    }

    try {
      console.log('💾 Saving quantity offer:', offerData);
      
      if (isCreating) {
        const { error } = await supabase
          .from('quantity_offers')
          .insert({
            shop_id: currentStore,
            product_id: offerData.product_id,
            form_id: offerData.form_id,
            offers: offerData.offers,
            styling: offerData.styling,
            position: offerData.position,
            enabled: offerData.enabled,
            custom_selector: offerData.custom_selector
          });
          
        if (error) {
          console.error('❌ Error creating quantity offer:', error);
          throw error;
        }
        
        toast.success('تم إنشاء عرض الكمية بنجاح');
      } else {
        const { error } = await supabase
          .from('quantity_offers')
          .update({
            offers: offerData.offers,
            styling: offerData.styling,
            position: offerData.position,
            enabled: offerData.enabled,
            custom_selector: offerData.custom_selector
          })
          .eq('id', offerData.id);
          
        if (error) {
          console.error('❌ Error updating quantity offer:', error);
          throw error;
        }
        
        toast.success('تم تحديث عرض الكمية بنجاح');
      }
      
      await loadQuantityOffers(selectedFormId);
      
      setEditingOffer(null);
      setIsCreating(false);
      setSelectedProductId('');
      
    } catch (error) {
      console.error('❌ Error saving quantity offer:', error);
      toast.error('خطأ في حفظ عرض الكمية: ' + (error as any)?.message);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('quantity_offers')
        .delete()
        .eq('id', offerId);
        
      if (error) {
        console.error('❌ Error deleting quantity offer:', error);
        throw error;
      }
      
      toast.success('تم حذف عرض الكمية');
      await loadQuantityOffers(selectedFormId);
      
    } catch (error) {
      console.error('❌ Error deleting quantity offer:', error);
      toast.error('خطأ في حذف عرض الكمية');
    }
  };

  const currentStore = getConsistentActiveStore();

  if (!currentStore) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          يرجى تحديد متجر Shopify أولاً من إعدادات الاتصال
        </AlertDescription>
      </Alert>
    );
  }

  if (editingOffer) {
    return (
      <QuantityOffersEditor
        offer={editingOffer}
        isCreating={isCreating}
        onSave={handleSaveOffer}
        onCancel={() => {
          setEditingOffer(null);
          setIsCreating(false);
          setSelectedProductId('');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              إدارة عروض الكمية - مع البيانات الحقيقية
            </CardTitle>
            <Button 
              onClick={forceRefresh} 
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border">
            <div className="grid grid-cols-2 gap-2">
              <div>المتجر النشط: <strong>{currentStore}</strong></div>
              <div>عملة المتجر: <strong>{storeData.currency || 'غير محدد'}</strong></div>
              <div>النماذج: <strong>{forms.length}</strong></div>
              <div>المنتجات المرتبطة: <strong>{associatedProducts.length}</strong></div>
              <div>العروض النشطة: <strong>{quantityOffers.length}</strong></div>
              <div>منتجات بأسعار: <strong>{associatedProducts.filter(p => p.product_price).length}</strong></div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">اختيار النموذج</label>
            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نموذج..." />
              </SelectTrigger>
              <SelectContent>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFormId && associatedProducts.length > 0 && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">اختيار المنتج</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر منتج..." />
                  </SelectTrigger>
                  <SelectContent>
                    {associatedProducts.map(product => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        {product.product_title} 
                        {product.product_price && ` - ${product.product_price.toFixed(2)} ${product.product_currency}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCreateOffer}
                  disabled={!selectedProductId}
                  className="mb-0"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إنشاء عرض
                </Button>
              </div>
            </div>
          )}

          {selectedFormId && associatedProducts.length === 0 && !loading && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                لا توجد منتجات مرتبطة بهذا النموذج. يرجى ربط منتجات أولاً من صفحة إدارة النماذج.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="mr-2">جاري التحميل...</span>
        </div>
      )}

      {quantityOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>عروض الكمية الحالية - مع البيانات الحقيقية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quantityOffers.map(offer => {
                const associatedProduct = associatedProducts.find(p => p.product_id === offer.product_id);
                
                console.log('🔍 Rendering offer for product:', offer.product_id, 'found product data:', associatedProduct);
                
                return (
                  <div key={offer.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{offer.product_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(offer.offers) ? offer.offers.length : 0} عروض • موضع: {
                            offer.position === 'before_form' ? 'قبل النموذج' :
                            offer.position === 'inside_form' ? 'داخل النموذج' : 'بعد النموذج'
                          }
                          {associatedProduct?.product_price && (
                            <> • السعر: {associatedProduct.product_price.toFixed(2)} {associatedProduct.product_currency}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={offer.enabled ? 'default' : 'secondary'}>
                          {offer.enabled ? 'مفعل' : 'معطل'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingOffer(offer)}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium mb-3 text-gray-600">معاينة مباشرة مع البيانات الحقيقية:</h4>
                      <QuantityOffersDisplay 
                        offers={offer.offers || []} 
                        styling={offer.styling || {
                          backgroundColor: '#ffffff',
                          textColor: '#000000',
                          tagColor: '#22c55e',
                          priceColor: '#000000'
                        }}
                        productData={associatedProduct ? {
                          price: associatedProduct.product_price,
                          compareAtPrice: associatedProduct.product_compare_at_price,
                          title: associatedProduct.product_title,
                          image: associatedProduct.product_image,
                          currency: associatedProduct.product_currency || storeData.currency || 'SAR'
                        } : undefined}
                        currency={storeData.currency || 'SAR'}
                      />
                      {associatedProduct ? (
                        <div className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded">
                          <strong>✅ بيانات المنتج الحقيقية:</strong> {associatedProduct.product_title} - 
                          السعر: {associatedProduct.product_price?.toFixed(2) || 'غير محدد'} {associatedProduct.product_currency}
                          {associatedProduct.product_image && ' - يتضمن صورة'}
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>⚠️ تحذير:</strong> لا توجد بيانات منتج حقيقية
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuantityOffersManager;
