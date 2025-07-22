
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, AlertCircle, Package, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuantityOffersEditor from './QuantityOffersEditor';
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

  // Get consistent active store
  const getConsistentActiveStore = (): string | null => {
    // أولوية للـ activeStore من useSimpleShopify إذا كان موجود
    let store = activeStore;
    
    // إذا لم يكن موجود، جرب getActiveShopId
    if (!store) {
      store = getActiveShopId();
    }
    
    // تنظيف وتصحيح shop_id إذا لزم الأمر
    if (store) {
      store = store.trim();
      // التأكد من أنه يحتوي على .myshopify.com
      if (!store.includes('.myshopify.com')) {
        store = store.replace(/\.myshopify\.com.*$/, '') + '.myshopify.com';
      }
    }
    
    console.log('🏪 Using consistent active store:', store, 'from activeStore:', activeStore);
    return store;
  };

  // Load forms for the current shop
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

  // Load associated products for selected form
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
      
      // Get products associated with this form - Remove enabled filter as it might be causing issues
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

      // Get product details from Shopify
      console.log('📡 Fetching product details from Shopify for store:', currentStore);
      const { data: productsData, error: productsError } = await supabase.functions.invoke('shopify-products', {
        body: { shop: currentStore }
      });

      if (productsError) {
        console.error('❌ Error fetching Shopify products:', productsError);
        throw productsError;
      }

      const allProducts = productsData?.products || [];
      console.log('📦 All Shopify products fetched:', allProducts.length);
      
      const associatedProductIds = settings.map(s => s.product_id);
      console.log('🔗 Associated product IDs:', associatedProductIds);
      
      // Filter products that are associated with this form - Convert IDs to strings for comparison
      const formProducts = allProducts
        .filter((product: any) => associatedProductIds.includes(String(product.id)))
        .map((product: any) => ({
          product_id: String(product.id),
          product_title: product.title,
          form_id: formId,
          form_title: forms.find(f => f.id === formId)?.title || ''
        }));

      console.log('✅ Associated products mapped:', formProducts.length, formProducts);
      setAssociatedProducts(formProducts);

      // Load existing quantity offers for this form
      await loadQuantityOffers(formId);
      
    } catch (error) {
      console.error('❌ Error loading form products:', error);
      toast.error('خطأ في تحميل منتجات النموذج: ' + (error as any)?.message);
      setAssociatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load quantity offers for form
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

      // Enrich with product and form titles
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

  const handleCreateOffer = () => {
    if (!selectedProductId) {
      toast.error('يرجى اختيار منتج أولاً');
      return;
    }
    
    // Check if offer already exists for this product and form
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
        priceColor: '#ef4444'
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
      
      // Reload quantity offers
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
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            إدارة عروض الكمية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug Info */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            المتجر النشط: {currentStore} | النماذج: {forms.length} | المنتجات المرتبطة: {associatedProducts.length}
          </div>

          {/* Form Selection */}
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

          {/* Product Selection and Create Button */}
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

          {/* No products message */}
          {selectedFormId && associatedProducts.length === 0 && !loading && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                لا توجد منتجات مرتبطة بهذا النموذج. يرجى ربط منتجات أولاً من صفحة إدارة النماذج.
                <br />
                <span className="text-xs text-muted-foreground">
                  تأكد من أن المنتجات مرتبطة في shopify_product_settings للنموذج: {selectedFormId}
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="mr-2">جاري التحميل...</span>
        </div>
      )}

      {/* Existing Quantity Offers */}
      {quantityOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>عروض الكمية الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quantityOffers.map(offer => (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{offer.product_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(offer.offers) ? offer.offers.length : 0} عروض • موضع: {
                          offer.position === 'before_form' ? 'قبل النموذج' :
                          offer.position === 'inside_form' ? 'داخل النموذج' : 'بعد النموذج'
                        }
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuantityOffersManager;
