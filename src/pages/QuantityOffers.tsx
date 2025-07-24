import React, { useState, useEffect } from 'react';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Package, FileText, Settings, Eye, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { toast } from 'sonner';
import QuantityOffersPreview from '@/components/quantity-offers/QuantityOffersPreview';

// Simple currency conversion rates (you can replace with real API)
const CURRENCY_RATES: { [key: string]: number } = {
  'USD': 1,
  'SAR': 3.75,
  'AED': 3.67,
  'MAD': 10.24,
  'EUR': 0.85,
  'GBP': 0.76
};

// Function to convert price between currencies
const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / (CURRENCY_RATES[fromCurrency] || 1);
  const convertedAmount = usdAmount * (CURRENCY_RATES[toCurrency] || 1);
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
};

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
  const { products: shopifyProducts, loadProducts, loading: shopifyLoading, isConnected, activeStore } = useSimpleShopify();
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
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e',
      priceColor: '#000000'
    },
    position: 'before_form'
  });
  const [storeCurrency, setStoreCurrency] = useState<string>('SAR');

  useEffect(() => {
    loadForms();
    loadExistingOffers();
    loadStoreCurrency();
    if (isConnected && activeStore) {
      loadProducts();
    }
  }, [isConnected, activeStore]);

  const loadStoreCurrency = async () => {
    try {
      const activeShop = activeStore || localStorage.getItem('simple_active_store');
      if (!activeShop) return;

      // Get store currency from products API - the currency is usually included with product data
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        },
        body: JSON.stringify({
          shop: activeShop
        })
      });

      const data = await response.json();
      
      // Extract currency from shop info or first product
      let currency = 'SAR'; // default
      
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
      console.log('✅ Store currency set to:', currency, 'for shop:', activeShop);
      
    } catch (error) {
      console.warn('Could not fetch store currency, using default MAD:', error);
      // استخدام MAD كقيمة افتراضية
      setStoreCurrency('MAD');
      console.log('⚠️ Using fallback MAD currency');
    }
  };

  const loadForms = async () => {
    try {
      const activeShop = activeStore || localStorage.getItem('simple_active_store');
      
      if (!activeShop) {
        console.log('🚫 No active store - forms will not be loaded');
        setForms([]);
        return;
      }

      console.log(`📋 Loading forms for active store: ${activeShop}`);
      
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('is_published', true)
        .eq('shop_id', activeShop);

      if (error) {
        console.error('❌ Error loading forms:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} forms for store: ${activeShop}`);
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
      const activeShop = activeStore || localStorage.getItem('simple_active_store');
      if (!activeShop) return;

      console.log('🔍 Loading existing offers for store:', activeShop);
      
      const { data, error } = await (supabase as any)
        .from('quantity_offers')
        .select(`
          *,
          forms(title)
        `)
        .eq('shop_id', activeShop);

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
  const allProducts = shopifyProducts.map(product => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    price: product.price || '0',
    currency: product.currency || storeCurrency, // إضافة العملة من المنتج
    images: product.images?.map(img => ({ url: typeof img === 'string' ? img : img.src })) || [{ url: '/placeholder.svg' }]
  }));

  // Get products associated with the selected form only
  const products = selectedForm && associatedProductIds.length > 0 ? allProducts.filter(product => 
    associatedProductIds.includes(product.id)
  ) : [];

  // Load products associated with a specific form from shopify_product_settings table
  const loadFormProducts = async (formId: string) => {
    try {
      console.log(`🔍 Loading products associated with form: ${formId}`);
      
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('product_id')
        .eq('form_id', formId)
        .eq('shop_id', activeStore || localStorage.getItem('simple_active_store') || '');

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
      
      const { data, error } = await (supabase as any)
        .from('quantity_offers')
        .select('*')
        .eq('form_id', formId)
        .eq('shop_id', activeStore || localStorage.getItem('simple_active_store') || '');

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
      toast.error(`المنتج "${product.title}" لديه بالفعل عرض كمية لهذا النموذج. يمكنك تعديل العرض الموجود أو اختيار منتج آخر.`);
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
      toast.error('يجب إضافة عرض واحد على الأقل');
      return;
    }

    setLoading(true);
    try {
      const activeShop = activeStore || localStorage.getItem('simple_active_store');
      if (!activeShop) {
        throw new Error('No active shop found');
      }

      // Prepare data for saving
      const offerData = {
        shop_id: activeShop,
        product_id: selectedProduct.id,
        form_id: selectedForm.id,
        enabled: quantityOffer.enabled,
        offers: quantityOffer.offers,
        styling: quantityOffer.styling,
        position: quantityOffer.position,
        custom_selector: quantityOffer.custom_selector || null
      };

      console.log('💾 Saving quantity offer data:', offerData);

      let result;
      if (quantityOffer.id) {
        // Update existing offer
        result = await (supabase as any)
          .from('quantity_offers')
          .update(offerData)
          .eq('id', quantityOffer.id)
          .select();
      } else {
        // Create new offer
        result = await (supabase as any)
          .from('quantity_offers')
          .insert([offerData])
          .select();
      }

      if (result.error) {
        console.error('❌ Database error:', result.error);
        throw result.error;
      }
      
      console.log('✅ Quantity offer saved successfully:', result.data);
      toast.success(quantityOffer.id ? 'تم تحديث العرض بنجاح' : 'تم حفظ العرض بنجاح');
      
      // Reset form and reload data
      resetToFormSelection();
      await loadExistingOffers();
      
    } catch (error) {
      console.error('❌ Error saving quantity offer:', error);
      toast.error('فشل في حفظ العرض: ' + (error as any)?.message || 'خطأ غير معروف');
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
        backgroundColor: '#ffffff',
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
        .from('quantity_offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      
      toast.success('تم حذف العرض بنجاح');
      await loadExistingOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('فشل في حذف العرض');
    }
  };

  return (
    <SettingsLayout>
      <div className="p-6">
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
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{product?.title || `Product ${offer.product_id}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              النموذج: {offer.forms?.title || 'Unknown Form'}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {offer.enabled ? 'نشط' : 'معطل'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{offer.offers?.length || 0} عرض مُهيأ</span>
                          <span>الموضع: {
                            offer.position === 'before_form' ? 'قبل النموذج' : 
                            offer.position === 'after_form' ? 'بعد النموذج' : 'داخل النموذج'
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
                                +{offer.offers.length - 3} عرض إضافي
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
                          تعديل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteOffer(offer.id)}
                        >
                          حذف
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
                الخطوة 1: اختيار النموذج
              </CardTitle>
              <CardDescription>
                اختر النموذج المراد إضافة عروض الكمية إليه
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد نماذج منشورة</p>
                  <p className="text-sm">يرجى إنشاء ونشر نموذج أولاً</p>
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
                الخطوة 2: اختيار المنتج
              </CardTitle>
              <CardDescription>
                النموذج المختار: <strong>{selectedForm.title}</strong>
                {associatedProducts.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          المنتجات المرتبطة مسبقاً بهذا النموذج:
                        </p>
                        <div className="mt-1 space-y-1">
                          {associatedProducts.map(ap => (
                            <div key={ap.productId} className="flex items-center gap-2 text-sm text-yellow-700">
                              {ap.productImage && (
                                <img src={ap.productImage} alt={ap.productTitle} className="w-6 h-6 object-cover rounded" />
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
                  <p>متجر Shopify غير متصل</p>
                  <p className="text-sm">يرجى ربط متجر Shopify أولاً</p>
                </div>
              ) : shopifyLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">جاري تحميل المنتجات من Shopify...</p>
                </div>
               ) : products.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                   <p>
                     {selectedForm ? 
                       'لا توجد منتجات مرتبطة بهذا النموذج' : 
                       'لا توجد منتجات في متجر Shopify'
                     }
                   </p>
                   {selectedForm ? (
                     <p className="text-sm mt-2">
                       قم بربط المنتجات بهذا النموذج من صفحة النماذج أولاً
                     </p>
                   ) : (
                     <Button onClick={() => loadProducts()} variant="outline" className="mt-4">
                       إعادة تحميل المنتجات
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
                              مرتبط مسبقاً
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
                  رجوع
                </Button>
                {selectedProduct && (
                  <Button onClick={proceedToSettings}>
                    التالي
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
                    الخطوة 3: إعداد العرض
                  </CardTitle>
                  <CardDescription>
                    المنتج: {selectedProduct.title} | النموذج: {selectedForm.title}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Tabs defaultValue="offers" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="offers">العروض</TabsTrigger>
                  <TabsTrigger value="styling">التنسيق</TabsTrigger>
                  <TabsTrigger value="position">الموضع</TabsTrigger>
                </TabsList>

                <TabsContent value="offers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>العروض</CardTitle>
                        <Button onClick={addOffer} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة عرض
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {quantityOffer.offers.map((offer) => (
                        <Card key={offer.id} className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <Badge variant="outline">عرض #{offer.id}</Badge>
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
                              <Label>العلامة</Label>
                              <Input
                                value={offer.tag}
                                onChange={(e) => updateOffer(offer.id, 'tag', e.target.value)}
                                placeholder="هدية مجانية"
                              />
                            </div>
                            <div>
                              <Label>الكمية</Label>
                              <Input
                                type="number"
                                value={offer.quantity}
                                onChange={(e) => updateOffer(offer.id, 'quantity', parseInt(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label>نص العرض</Label>
                              <Input
                                value={offer.text}
                                onChange={(e) => updateOffer(offer.id, 'text', e.target.value)}
                                placeholder="اشترِ 3 واحصل على 1 مجاناً"
                              />
                            </div>
                            <div>
                              <Label>نوع الخصم</Label>
                              <Select
                                value={offer.discountType}
                                onValueChange={(value) => updateOffer(offer.id, 'discountType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">بدون خصم</SelectItem>
                                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                                  <SelectItem value="percentage">نسبة مئوية</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {offer.discountType !== 'none' && (
                              <div>
                                <Label>قيمة الخصم</Label>
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
                          لا توجد عروض بعد. أضف عرضاً للبدء.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                
                <TabsContent value="styling" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>التنسيق</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>لون الخلفية</Label>
                          <Input
                            type="color"
                            value={quantityOffer.styling.backgroundColor}
                            onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>لون النص</Label>
                          <Input
                            type="color"
                            value={quantityOffer.styling.textColor}
                            onChange={(e) => updateStyling('textColor', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>لون العلامة</Label>
                          <Input
                            type="color"
                            value={quantityOffer.styling.tagColor}
                            onChange={(e) => updateStyling('tagColor', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>لون السعر</Label>
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
                      <CardTitle>الموضع</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>موضع العرض</Label>
                        <Select
                          value={quantityOffer.position}
                          onValueChange={(value) => setQuantityOffer(prev => ({ ...prev, position: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before_form">قبل النموذج</SelectItem>
                            <SelectItem value="inside_form">داخل النموذج</SelectItem>
                            <SelectItem value="after_form">بعد النموذج</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {quantityOffer.position === 'inside_form' && (
                        <div>
                          <Label>محدد CSS المخصص</Label>
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
                  رجوع
                </Button>
                <Button onClick={saveQuantityOffer} disabled={loading || quantityOffer.offers.length === 0} className="flex-1">
                  {loading ? 'جاري الحفظ...' : quantityOffer.id ? 'تحديث العرض' : 'حفظ العرض'}
                </Button>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    معاينة مباشرة
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
                      price: parseFloat(selectedProduct.price) || 0, // استخدام السعر الأصلي بدون تحويل
                      title: selectedProduct.title,
                      image: selectedProduct.images?.[0]?.url,
                      currency: selectedProduct.currency || storeCurrency // استخدام عملة المنتج الأصلية
                    } : undefined}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
};

export default QuantityOffers;
