import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Package, FileText, Settings, Eye, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { toast } from 'sonner';
import QuantityOffersPreview from '@/components/quantity-offers/QuantityOffersPreview';
import { CurrencyService } from '@/lib/services/CurrencyService';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { isAdminBypassEnabled, ADMIN_BYPASS_SHOP_ID } from '@/utils/admin-mode';



interface Product {
  id: string;
  title: string;
  handle: string;
  price: string;
  currency?: string;
  images?: { url: string }[];
}

interface Form {
  id: string;
  title: string;
  data: any;
  style: any;
  currency: string;
}

interface Offer {
  id: string;
  tag: string;
  text: string;
  quantity: number;
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue: number;
}

interface AssociatedProduct {
  productId: string;
  productTitle: string;
  productImage?: string;
  offerId: string;
}

interface QuantityOfferData {
  id?: string;
  shop_id: string;
  product_id: string;
  form_id: string;
  enabled: boolean;
  offers: Offer[];
  styling: {
    backgroundColor: string;
    textColor: string;
    tagColor: string;
    priceColor: string;
  };
  position: 'before_form' | 'inside_form' | 'after_form';
  custom_selector?: string;
}

const QuantityOffers = () => {
  const { t } = useI18n();
  const { shop: currentStore, isShopifyAuthenticated } = useAuth();
  const { products: shopifyProducts, loadProducts, loading: shopifyLoading, isConnected, activeStore, switchToStore } = useSimpleShopify();

  // Robust active store detection (unified + legacy keys)
  const unifiedStore = (typeof window !== 'undefined' && (UnifiedStoreManager?.getActiveStore?.())) || null;
  const legacyCandidates = [
    'active_shopify_store', 'shopify_store', 'simple_active_store', 'active_shop', 'current_shopify_store'
  ];
  const legacyStore = (typeof window !== 'undefined') ? (legacyCandidates.map(k => localStorage.getItem(k)).find(v => v && v !== 'null') || null) : null;
  const queryShop = (typeof window !== 'undefined') ? (new URLSearchParams(window.location.search).get('shop') || null) : null;
  const hostShop = (typeof window !== 'undefined' && window.location.hostname.includes('myshopify.com')) ? window.location.hostname : null;
  const isAdmin = isAdminBypassEnabled();
  const effectiveStore = currentStore || activeStore || unifiedStore || queryShop || hostShop || legacyStore || (isAdmin ? ADMIN_BYPASS_SHOP_ID : null);

  console.log('🔍 QuantityOffers - Store state:', {
    currentStore,
    activeStore,
    unifiedStore,
    legacyStore,
    effectiveStore,
    isShopifyAuthenticated,
    isConnected
  });

  // Ensure currency service uses the correct shop context and loads custom rates
  useEffect(() => {
    if (effectiveStore) {
      CurrencyService.setShopContext(effectiveStore, null);
      CurrencyService.initialize();
    }
  }, [effectiveStore]);


  // Ensure hook activeStore follows effectiveStore (auto-switch)
  useEffect(() => {
    if (effectiveStore && activeStore !== effectiveStore && typeof switchToStore === 'function') {
      console.log('🔄 Auto-switching hook activeStore to effectiveStore:', { activeStore, effectiveStore });
      switchToStore(effectiveStore);
    }
  }, [effectiveStore, activeStore, switchToStore]);

  const [currentStep, setCurrentStep] = useState<'form' | 'product' | 'settings'>('form');
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [associatedProducts, setAssociatedProducts] = useState<AssociatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingOffers, setExistingOffers] = useState<any[]>([]);
  const [associatedProductIds, setAssociatedProductIds] = useState<string[]>([]);
  const [quantityOffer, setQuantityOffer] = useState<QuantityOfferData>({
    shop_id: '',
    product_id: '',
    form_id: '',
    enabled: true,
    offers: [],
    styling: {
      backgroundColor: '#22c55e',
      textColor: '#000000',
      tagColor: '#22c55e',
      priceColor: '#000000'
    },
    position: 'before_form'
  });
  const [storeCurrency, setStoreCurrency] = useState<string>('MAD');

  useEffect(() => {
    if (isAdmin) {
      // In admin mode, load dummy forms and skip network calls
      setForms([
        { id: 'demo-form-1', title: 'نموذج طلب المنتج', data: [], style: {}, currency: 'MAD' },
        { id: 'demo-form-2', title: 'Product Order Form', data: [], style: {}, currency: 'USD' },
      ]);
      return;
    }
    loadForms();
    loadExistingOffers();
    loadStoreCurrency();
    if ((isConnected || effectiveStore) && effectiveStore) {
      loadProducts();
    }
  }, [isConnected, activeStore, isAdmin]);

  const loadStoreCurrency = async () => {
    try {
      if (!effectiveStore) return;

      // Get store currency from products API - the currency is usually included with product data
      const response = await fetch(`https://nnwnuurkcmuvprirsfho.supabase.co/functions/v1/shopify-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud251dXJrY211dnByaXJzZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTMwMjcsImV4cCI6MjA4OTY2OTAyN30.u91K1NfUkhYiIPOVGNb3CepK0F8WfjPhGcG1T63KDOc`
        },
        body: JSON.stringify({
          shop: effectiveStore
        })
      });

      const data = await response.json();

      // Extract currency from shop info or first product
      let currency = 'MAD'; // default

      if (data.currency) {
        currency = data.currency;
        console.log('✅ Got currency from Shopify API response:', currency);
      } else if (data.products && data.products.length > 0) {
        // استخدام العملة من المنتج مباشرة
        const firstProduct = data.products[0];
        if (firstProduct.currency) {
          currency = firstProduct.currency;
          console.log('✅ Got currency from first product:', currency);
        }
      }

      setStoreCurrency(currency);
      console.log('✅ Store currency set to:', currency, 'for shop:', effectiveStore);

    } catch (error) {
      console.warn('Could not fetch store currency, using default MAD:', error);
      // استخدام MAD كقيمة افتراضية
      setStoreCurrency('MAD');
      console.log('⚠️ Using fallback MAD currency');
    }
  };

  // Ensure the active store is linked to the current user to satisfy RLS
  const ensureOwnership = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const shop = effectiveStore;
      if (!shop || !user?.id) return;

      // Prefer edge function for reliable linking
      try {
        await supabase.functions.invoke('store-link-manager', {
          body: { action: 'link_store', shop, userId: user.id }
        });
        await supabase.functions.invoke('store-link-manager', {
          body: { action: 'link_orphan_stores', userId: user.id }
        });
      } catch (e) {
        console.warn('store-link-manager linking failed, falling back to RPCs:', e);
      }

      // Fallback RPCs (best-effort)
      try {
        await Promise.all([
          (supabase as any).rpc('auto_link_store_to_current_user'),
          (supabase as any).rpc('link_active_store_to_user')
        ]);
        try {
          await supabase.functions.invoke('forms-maintenance', { body: { action: 'fix_form_links' } });
        } catch (_) {
          // ignore
        }
      } catch (e) {
        console.warn('Link RPCs failed (non-blocking):', e);
      }
    } catch (err) {
      console.warn('ensureOwnership skipped:', err);
    }
  };

  const loadForms = async () => {
    try {
      if (!effectiveStore) {
        console.log('🚫 No active store - forms will not be loaded');
        setForms([]);
        return;
      }

      console.log(`📋 Loading forms for active store: ${effectiveStore}`);

      await ensureOwnership();

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('is_published', true)
        .eq('shop_id', effectiveStore);

      if (error) {
        console.error('❌ Error loading forms:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} forms for store: ${effectiveStore}`);
      setForms((data || []).map(form => ({
        id: form.id,
        title: form.title,
        data: form.data,
        style: form.style,
        currency: (form as any).currency || 'USD'
      })));
    } catch (error) {
      console.error('❌ Error loading forms:', error);
      toast.error('Failed to load forms');
    }
  };

  const loadExistingOffers = async () => {
    try {
      if (!effectiveStore) return;

      console.log('🔍 Loading existing offers for store:', effectiveStore);

      await ensureOwnership();

      const { data, error } = await (supabase as any)
        .rpc('get_form_quantity_offers', {
          p_shop_id: effectiveStore
        });

      if (error) {
        console.error('❌ Error loading existing offers:', error);
        return;
      }

      console.log('✅ Loaded existing offers:', data);
      setExistingOffers(data || []);
    } catch (error) {
      console.error('❌ Error loading existing offers:', error);
    }
  };

  // Convert Shopify products to our format
  const dummyProducts: Product[] = isAdmin ? [
    { id: 'demo-product-1', title: 'منتج تجريبي 1', handle: 'demo-1', price: '199.00', currency: 'MAD', images: [{ url: '/placeholder.svg' }] },
    { id: 'demo-product-2', title: 'منتج تجريبي 2', handle: 'demo-2', price: '349.00', currency: 'MAD', images: [{ url: '/placeholder.svg' }] },
    { id: 'demo-product-3', title: 'Demo Product 3', handle: 'demo-3', price: '99.00', currency: 'USD', images: [{ url: '/placeholder.svg' }] },
  ] : [];

  const allProducts = isAdmin ? dummyProducts : shopifyProducts.map(product => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    price: product.price || '0',
    currency: product.currency || storeCurrency,
    images: product.images?.map(img => ({ url: img })) || [{ url: '/placeholder.svg' }]
  }));

  // Get products associated with the selected form only
  const products = isAdmin 
    ? allProducts 
    : (selectedForm && associatedProductIds.length > 0 ? allProducts.filter(product =>
        associatedProductIds.includes(product.id)
      ) : []);

  // Load products associated with a specific form from shopify_product_settings table
  const loadFormProducts = async (formId: string) => {
    try {
      console.log(`🔍 Loading products associated with form: ${formId}`);

      await ensureOwnership();

      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('form_id', formId)
        .eq('shop_id', effectiveStore || '');

      if (error) {
        console.warn('Error loading form products:', error);
        setAssociatedProductIds([]);
        return;
      }

      const productIds = (data || []).map((setting: any) => setting.product_id);
      console.log(`📦 Found ${productIds.length} products associated with form:`, productIds);
      setAssociatedProductIds(productIds);
    } catch (error) {
      console.error('Error loading form products:', error);
      setAssociatedProductIds([]);
    }
  };

  const loadAssociatedProducts = async (formId: string) => {
    try {
      console.log(`🔍 Loading existing quantity offers for form: ${formId}`);

      await ensureOwnership();

      const { data, error } = await (supabase as any)
        .rpc('get_form_quantity_offers', {
          p_shop_id: effectiveStore || '',
          p_form_id: formId
        });

      if (error) {
        console.warn('Error loading existing quantity offers:', error);
        setAssociatedProducts([]);
        return;
      }

      // Map the data to include product information
      const associatedProductsList: AssociatedProduct[] = (data || []).map((offer: any) => {
        const product = allProducts.find(p => p.id === offer.product_id);
        return {
          productId: offer.product_id,
          productTitle: product?.title || `Product ${offer.product_id}`,
          productImage: product?.images?.[0]?.url,
          offerId: offer.id
        };
      });

      console.log(`📦 Found ${associatedProductsList.length} existing quantity offers:`, associatedProductsList);
      setAssociatedProducts(associatedProductsList);
    } catch (error) {
      console.error('Error loading existing quantity offers:', error);
      setAssociatedProducts([]);
    }
  };

  const handleFormSelect = async (form: Form) => {
    console.log('📋 Form selected:', form.title);
    setSelectedForm(form);
    setQuantityOffer(prev => ({ ...prev, form_id: form.id }));

    // Load products associated with this form from shopify_product_settings
    await loadFormProducts(form.id);
    // Load existing quantity offers for this form
    await loadAssociatedProducts(form.id);
    setCurrentStep('product');
  };

  const handleProductSelect = (product: Product) => {
    // Check if this product already has a quantity offer for the selected form
    const hasExistingOffer = associatedProducts.some(ap => ap.productId === product.id);
    if (hasExistingOffer) {
      toast.error(`${t('productAlreadyHasOffer')}. ${t('editExistingOffer')}.`);
      return;
    }

    console.log('📦 Product selected:', product.title);
    setSelectedProduct(product);
    setQuantityOffer(prev => ({ ...prev, product_id: product.id }));
  };

  const proceedToSettings = () => {
    if (!selectedProduct || !selectedForm) {
      toast.error('Please select both product and form');
      return;
    }

    console.log('⚙️ Proceeding to settings step');

    // إضافة العروض الافتراضية إذا لم تكن موجودة
    if (quantityOffer.offers.length === 0) {
      // تحديد لغة النموذج من البيانات
      const isArabic = selectedForm.data?.some((step: any) =>
        step.fields?.some((field: any) =>
          field.label?.includes('اسم') || field.label?.includes('هاتف') ||
          field.placeholder?.includes('اسم') || field.placeholder?.includes('هاتف')
        )
      ) || selectedForm.title?.match(/[\u0600-\u06FF]/);

      const defaultOffers = isArabic ? [
        {
          id: Date.now().toString(),
          tag: 'هدية مجانية',
          text: 'اشتر 3 واحصل على 1 مجانًا',
          quantity: 3,
          discountType: 'none' as const,
          discountValue: 0
        },
        {
          id: (Date.now() + 1).toString(),
          tag: 'هدية مجانية',
          text: 'اشتر 5 واحصل على 2 مجانًا',
          quantity: 5,
          discountType: 'none' as const,
          discountValue: 0
        }
      ] : [
        {
          id: Date.now().toString(),
          tag: 'Free Gift',
          text: 'Buy 3 get 1 free',
          quantity: 3,
          discountType: 'none' as const,
          discountValue: 0
        },
        {
          id: (Date.now() + 1).toString(),
          tag: 'Free Gift',
          text: 'Buy 5 get 2 free',
          quantity: 5,
          discountType: 'none' as const,
          discountValue: 0
        }
      ];

      setQuantityOffer(prev => ({
        ...prev,
        offers: defaultOffers
      }));
    }

    setCurrentStep('settings');
  };

  const addOffer = () => {
    const newOffer: Offer = {
      id: Date.now().toString(),
      tag: '',
      text: '',
      quantity: 1,
      discountType: 'none',
      discountValue: 0
    };
    setQuantityOffer(prev => ({
      ...prev,
      offers: [...prev.offers, newOffer]
    }));
    console.log('➕ Added new offer:', newOffer.id);
  };

  const updateOffer = (id: string, field: keyof Offer, value: any) => {
    setQuantityOffer(prev => ({
      ...prev,
      offers: prev.offers.map(offer =>
        offer.id === id ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const removeOffer = (id: string) => {
    setQuantityOffer(prev => ({
      ...prev,
      offers: prev.offers.filter(offer => offer.id !== id)
    }));
    console.log('🗑️ Removed offer:', id);
  };

  const updateStyling = (field: string, value: string) => {
    setQuantityOffer(prev => ({
      ...prev,
      styling: { ...prev.styling, [field]: value }
    }));
  };

  const saveQuantityOffer = async () => {
    if (!selectedProduct || !selectedForm) {
      toast.error('Product and form must be selected');
      return;
    }

    if (quantityOffer.offers.length === 0) {
      toast.error(t('addAtLeastOneOffer'));
      return;
    }

    setLoading(true);
    try {
      if (!effectiveStore) {
        throw new Error('No active shop found');
      }

      // Prepare data for saving
      const offerData = {
        shop_id: effectiveStore,
        product_id: selectedProduct.id,
        form_id: selectedForm.id,
        enabled: quantityOffer.enabled,
        offers: quantityOffer.offers,
        styling: quantityOffer.styling,
        position: quantityOffer.position,
        custom_selector: quantityOffer.custom_selector || null
      };

      console.log('💾 Saving quantity offer data:', offerData);

      await ensureOwnership();

      const { data: upsertId, error: upsertError } = await (supabase as any).rpc('upsert_quantity_offer', {
        p_shop_id: effectiveStore,
        p_form_id: selectedForm.id,
        p_product_id: selectedProduct.id,
        p_offers: quantityOffer.offers as any,
        p_styling: quantityOffer.styling as any,
        p_enabled: quantityOffer.enabled,
        p_position: quantityOffer.position,
        p_custom_selector: quantityOffer.custom_selector || null,
        p_id: quantityOffer.id || null
      });

      if (upsertError) {
        console.error('❌ RPC upsert_quantity_offer error:', upsertError);
        throw upsertError;
      }

      console.log('✅ Quantity offer saved successfully:', upsertId);
      toast.success(quantityOffer.id ? t('offerUpdatedSuccessfully') : t('offerSavedSuccessfully'));

      // Reset or refresh views
      await loadExistingOffers();
      if (selectedForm) {
        await loadAssociatedProducts(selectedForm.id);
        setCurrentStep('product');
      }

    } catch (error) {
      console.error('❌ Error saving quantity offer:', error);
      toast.error(`${t('failedToSaveOffer')}: ` + (error as any)?.message || t('unknownError'));
    }
    setLoading(false);
  };

  const resetToFormSelection = () => {
    setCurrentStep('form');
    setSelectedProduct(null);
    setSelectedForm(null);
    setAssociatedProducts([]);
    setAssociatedProductIds([]);
    setQuantityOffer({
      shop_id: '',
      product_id: '',
      form_id: '',
      enabled: true,
      offers: [],
      styling: {
        backgroundColor: '#22c55e',
        textColor: '#000000',
        tagColor: '#22c55e',
        priceColor: '#000000'
      },
      position: 'before_form'
    });
  };

  const editExistingOffer = async (offer: any) => {
    // Find the form
    const form = forms.find(f => f.id === offer.form_id);
    if (form) {
      setSelectedForm(form);
      await loadAssociatedProducts(form.id);
    }

    // Find the product
    const product = allProducts.find(p => p.id === offer.product_id);
    if (product) {
      setSelectedProduct({
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: product.price || '0',
        images: product.images
      });
    }

    // Set the offer data
    setQuantityOffer({
      ...offer,
      offers: offer.offers || []
    });
    setCurrentStep('settings');
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const { error } = await (supabase as any)
        .rpc('delete_quantity_offer', { p_offer_id: offerId, p_shop_id: effectiveStore });


      if (error) throw error;

      toast.success('تم حذف العرض بنجاح');
      await loadExistingOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('فشل في حذف العرض');
    }
  };

  // Check if user has access based on store connection
  if (!effectiveStore) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6 text-center">
              <Package className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">يجب ربط متجر Shopify</h2>
              <p className="text-muted-foreground mb-4">
                للوصول إلى العروض الكمية، يجب ربط متجر Shopify أولاً
              </p>
              <Button asChild>
                <Link to="/my-stores">إدارة المتاجر</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('quantityOffers')}</h1>
            <p className="text-muted-foreground">{t('quantityOffersDescription')}</p>
          </div>
          <Button onClick={resetToFormSelection} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {t('createNewOffer')}
          </Button>
        </div>

        {/* Existing Offers List */}
        {existingOffers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                العروض المُنشأة ({existingOffers.length})
              </CardTitle>
              <CardDescription>
                إدارة عروض الكمية الموجودة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                 {existingOffers.map((offer) => {
                   const product = allProducts.find(p => p.id === offer.product_id);
                  return (
                    <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {product?.images?.[0] && (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              loading="lazy"
                              decoding="async"
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{product?.title || `Product ${offer.product_id}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              النموذج: {forms.find(f => f.id === offer.form_id)?.title || 'Unknown Form'}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {offer.enabled ? t('enabled') : t('disabled')}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                           <span>{offer.offers?.length || 0} {t('offersConfigured')}</span>
                           <span>{t('positionPrefix')} {
                             offer.position === 'before_form' ? t('beforeForm') :
                             offer.position === 'after_form' ? t('afterForm') : t('insideForm')
                           }</span>
                        </div>
                        {offer.offers && offer.offers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {offer.offers.slice(0, 3).map((singleOffer: any, idx: number) => (
                              <div key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                {singleOffer.text || `اشترِ ${singleOffer.quantity} قطعة`}
                              </div>
                            ))}
                            {offer.offers.length > 3 && (
                              <div className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs">
                                +{offer.offers.length - 3} {t('additionalOffers')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editExistingOffer(offer)}
                        >
                           {t('edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteOffer(offer.id)}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Selection Step */}
        {currentStep === 'form' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('step1SelectForm')}
              </CardTitle>
              <CardDescription>
                {t('selectFormDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                   <p>{t('noPublishedForms')}</p>
                   <p className="text-sm">{t('createFormFirstMessage')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forms.map((form) => (
                    <Card
                      key={form.id}
                      className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
                      onClick={() => handleFormSelect(form)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{form.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(form.data) && form.data[0]?.fields ?
                            `${form.data[0].fields.length} حقل` : 'نموذج فارغ'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Selection Step */}
        {currentStep === 'product' && selectedForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('step2SelectProduct')}
              </CardTitle>
              <CardDescription>
                {t('selectedForm')}: <strong>{selectedForm.title}</strong>
                {associatedProducts.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          {t('productsAlreadyLinked')}
                        </p>
                        <div className="mt-1 space-y-1">
                          {associatedProducts.map(ap => (
                            <div key={ap.productId} className="flex items-center gap-2 text-sm text-yellow-700">
                              {ap.productImage && (
                                <img src={ap.productImage} alt={ap.productTitle} loading="lazy" decoding="async" className="w-6 h-6 object-cover rounded" />
                              )}
                              <span>{ap.productTitle}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                   <p>{t('shopifyNotConnected')}</p>
                   <p className="text-sm">{t('connectShopifyFirst')}</p>
                </div>
              ) : shopifyLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">{t('loadingProducts')}</p>
                </div>
               ) : products.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                   <p>
                      {selectedForm ?
                        t('noProductsLinkedToForm') :
                        t('noProductsInShopify')
                      }
                   </p>
                   {selectedForm ? (
                     <p className="text-sm mt-2">
                        {t('linkProductsToForm')}
                      </p>
                    ) : (
                      <Button onClick={() => loadProducts()} variant="outline" className="mt-4">
                        {t('reloadProducts')}
                     </Button>
                   )}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => {
                    const isAssociated = associatedProducts.some(ap => ap.productId === product.id);
                    return (
                      <Card
                        key={product.id}
                        className={`transition-all border-2 ${
                          isAssociated
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                            : selectedProduct?.id === product.id
                              ? 'ring-2 ring-primary cursor-pointer border-primary'
                              : 'hover:shadow-md cursor-pointer hover:border-primary/50'
                        }`}
                        onClick={() => !isAssociated && handleProductSelect(product)}
                      >
                        <CardContent className="p-4">
                          <img
                            src={product.images?.[0]?.url || '/placeholder.svg'}
                            alt={product.title}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <h3 className="font-medium">{product.title}</h3>
                          {isAssociated && (
                            <Badge variant="destructive" className="mt-2 text-xs">
                              {t('alreadyLinked')}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-between">
                 <Button onClick={() => setCurrentStep('form')} variant="outline">
                   {t('back')}
                 </Button>
                 {selectedProduct && (
                   <Button onClick={proceedToSettings}>
                     {t('next')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Step */}
        {currentStep === 'settings' && selectedProduct && selectedForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                     {t('step3SetupOffer')}
                   </CardTitle>
                   <CardDescription>
                     {t('product')}: {selectedProduct.title} | {t('form')}: {selectedForm.title}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Tabs defaultValue="offers" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="offers">{t('offers')}</TabsTrigger>
                   <TabsTrigger value="styling">{t('styling')}</TabsTrigger>
                   <TabsTrigger value="position">{t('position')}</TabsTrigger>
                </TabsList>

                <TabsContent value="offers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                         <CardTitle>{t('offers')}</CardTitle>
                         <Button onClick={addOffer} size="sm">
                           <Plus className="w-4 h-4 mr-2" />
                           {t('addOffer')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {quantityOffer.offers.map((offer) => (
                        <Card key={offer.id} className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <Badge variant="outline">{t('offerNumber')}{offer.id}</Badge>
                            <Button
                              onClick={() => removeOffer(offer.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <Label>{t('tag')}</Label>
                               <Input
                                 value={offer.tag}
                                 onChange={(e) => updateOffer(offer.id, 'tag', e.target.value)}
                                 placeholder={t('freeGift')}
                               />
                             </div>
                             <div>
                               <Label>{t('quantity')}</Label>
                              <Input
                                type="number"
                                value={offer.quantity}
                                onChange={(e) => updateOffer(offer.id, 'quantity', parseInt(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="col-span-2">
                               <Label>{t('offerText')}</Label>
                               <Input
                                 value={offer.text}
                                 onChange={(e) => updateOffer(offer.id, 'text', e.target.value)}
                                 placeholder={t('buy3Get1Free')}
                               />
                            </div>
                            <div>
                               <Label>{t('discountType')}</Label>
                               <Select
                                 value={offer.discountType}
                                 onValueChange={(value) => updateOffer(offer.id, 'discountType', value)}
                               >
                                 <SelectTrigger>
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="none">{t('noDiscount')}</SelectItem>
                                   <SelectItem value="fixed">{t('fixedAmount')}</SelectItem>
                                   <SelectItem value="percentage">{t('percentage')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {offer.discountType !== 'none' && (
                              <div>
                                <Label>{t('discountValue')}</Label>
                                <Input
                                  type="number"
                                  value={offer.discountValue}
                                  onChange={(e) => updateOffer(offer.id, 'discountValue', parseFloat(e.target.value))}
                                  placeholder={offer.discountType === 'percentage' ? '15' : '20'}
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                      {quantityOffer.offers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {t('noOffersYetDesc')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>


                <TabsContent value="styling" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('styling')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label>{t('backgroundColor')}</Label>
                           <Input
                             type="color"
                             value={quantityOffer.styling.backgroundColor}
                             onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                           />
                         </div>
                         <div>
                           <Label>{t('textColor')}</Label>
                           <Input
                             type="color"
                             value={quantityOffer.styling.textColor}
                             onChange={(e) => updateStyling('textColor', e.target.value)}
                           />
                         </div>
                         <div>
                           <Label>{t('tagColor')}</Label>
                           <Input
                             type="color"
                             value={quantityOffer.styling.tagColor}
                             onChange={(e) => updateStyling('tagColor', e.target.value)}
                           />
                         </div>
                         <div>
                           <Label>{t('priceColor')}</Label>
                           <Input
                             type="color"
                             value={quantityOffer.styling.priceColor}
                             onChange={(e) => updateStyling('priceColor', e.target.value)}
                           />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="position" className="space-y-4">
                  <Card>
                    <CardHeader>
                       <CardTitle>{t('position')}</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div>
                         <Label>{t('offerPosition')}</Label>
                         <Select
                           value={quantityOffer.position}
                           onValueChange={(value) => setQuantityOffer(prev => ({ ...prev, position: value as any }))}
                         >
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="before_form">{t('beforeForm')}</SelectItem>
                             <SelectItem value="inside_form">{t('insideForm')}</SelectItem>
                             <SelectItem value="after_form">{t('afterForm')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {quantityOffer.position === 'inside_form' && (
                        <div>
                          <Label>{t('customCSSSelector')}</Label>
                          <Input
                            value={quantityOffer.custom_selector || ''}
                            onChange={(e) => setQuantityOffer(prev => ({ ...prev, custom_selector: e.target.value }))}
                            placeholder=".submit-button"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex gap-3">
                 <Button onClick={() => setCurrentStep('product')} variant="outline" className="flex-1">
                   {t('back')}
                 </Button>
                 <Button onClick={saveQuantityOffer} disabled={loading || quantityOffer.offers.length === 0} className="flex-1">
                   {loading ? t('saving') : quantityOffer.id ? t('updateOffer') : t('saveOffer')}
                </Button>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {t('livePreview')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QuantityOffersPreview
                    key={`${JSON.stringify(quantityOffer.styling)}-${quantityOffer.offers.length}`}
                    form={selectedForm}
                    offers={quantityOffer.offers}
                    styling={quantityOffer.styling}
                    position={quantityOffer.position}
                    enabled={quantityOffer.enabled}
                    productData={selectedProduct ? {
                      id: selectedProduct.id,
                      price: parseFloat(selectedProduct.price) || 0,
                      title: selectedProduct.title,
                      image: selectedProduct.images?.[0]?.url,
                      currency: selectedProduct.currency || storeCurrency // عملة المنتج الأصلية؛ التحويل سيتم داخل المعاينة
                    } : undefined}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityOffers;
