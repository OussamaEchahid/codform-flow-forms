import React, { useState, useEffect } from 'react';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Package, FileText, Settings, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { toast } from 'sonner';
import QuantityOffersPreview from '@/components/quantity-offers/QuantityOffersPreview';

interface Product {
  id: string;
  title: string;
  handle: string;
  images?: { url: string }[];
}

interface Form {
  id: string;
  title: string;
  data: any;
  style: any;
}

interface Offer {
  id: string;
  tag: string;
  text: string;
  quantity: number;
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue: number;
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
  const [currentStep, setCurrentStep] = useState<'product' | 'form' | 'settings'>('product');
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);
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
      priceColor: '#ef4444'
    },
    position: 'before_form'
  });

  useEffect(() => {
    loadForms();
    // Load products using the useSimpleShopify hook when connected
    if (isConnected && activeStore) {
      loadProducts();
    }
  }, [isConnected, activeStore]); // إزالة loadProducts من dependencies لمنع infinite loop

  const loadForms = async () => {
    try {
      const activeShop = activeStore || localStorage.getItem('simple_active_store');
      
      if (!activeShop) {
        console.log('🚫 لا يوجد متجر نشط - لن يتم تحميل النماذج');
        setForms([]);
        return;
      }

      console.log(`📋 تحميل النماذج للمتجر النشط: ${activeShop}`);
      
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('is_published', true)
        .eq('shop_id', activeShop);

      if (error) throw error;
      
      console.log(`✅ تم تحميل ${data?.length || 0} نموذج للمتجر: ${activeShop}`);
      setForms(data || []);
    } catch (error) {
      console.error('❌ خطأ في تحميل النماذج:', error);
      toast.error('Failed to load forms');
    }
  };

  // Convert Shopify products to our format
  const products = shopifyProducts.map(product => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    images: product.images?.map(img => ({ url: typeof img === 'string' ? img : img.src })) || [{ url: '/placeholder.svg' }]
  }));

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantityOffer(prev => ({ ...prev, product_id: product.id }));
  };

  const handleFormSelect = (form: Form) => {
    setSelectedForm(form);
    setQuantityOffer(prev => ({ ...prev, form_id: form.id }));
  };

  const proceedToSettings = () => {
    if (!selectedProduct || !selectedForm) {
      toast.error('Please select both product and form');
      return;
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

    setLoading(true);
    try {
      // Since quantity_offers table types aren't updated yet, we'll use a generic approach
      const { error } = await (supabase as any)
        .from('quantity_offers')
        .upsert({
          ...quantityOffer,
          shop_id: activeStore || localStorage.getItem('simple_active_store') || '',
          product_id: selectedProduct.id,
          form_id: selectedForm.id
        });

      if (error) throw error;
      toast.success('Quantity offer saved successfully');
      loadExistingOffers(); // Reload the list after saving
    } catch (error) {
      toast.error('Failed to save quantity offer');
    }
    setLoading(false);
  };

  const resetToProductSelection = () => {
    setCurrentStep('product');
    setSelectedProduct(null);
    setSelectedForm(null);
    setQuantityOffer(prev => ({
      ...prev,
      product_id: '',
      form_id: '',
      offers: []
    }));
  };

  // Load existing quantity offers
  const [existingOffers, setExistingOffers] = useState<any[]>([]);

  const loadExistingOffers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quantity_offers')
        .select(`
          *,
          forms(title)
        `)
        .eq('shop_id', activeStore || localStorage.getItem('simple_active_store') || '');

      console.log('Quantity offers data:', data, 'Error:', error);

      if (data && !error) {
        setExistingOffers(data);
      }
    } catch (error) {
      console.error('Error loading existing offers:', error);
    }
  };

  React.useEffect(() => {
    if (activeStore || localStorage.getItem('simple_active_store')) {
      console.log('Loading existing offers for store:', activeStore || localStorage.getItem('simple_active_store'));
      loadExistingOffers();
    }
  }, [activeStore]);

  console.log('Current existing offers:', existingOffers);

  return (
    <SettingsLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('quantityOffers')}</h1>
            <p className="text-muted-foreground">{t('quantityOffersDescription')}</p>
          </div>
          <Button onClick={resetToProductSelection} variant="outline">
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
                Created Quantity Offers ({existingOffers.length})
              </CardTitle>
              <CardDescription>
                Manage your existing quantity-based discount offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{offer.forms?.title || 'Unknown Form'}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          offer.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {offer.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Product ID: <span className="font-mono text-xs">{offer.product_id}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        {offer.offers?.length || 0} offers configured • Position: {offer.position}
                      </p>
                      {offer.offers && offer.offers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {offer.offers.slice(0, 3).map((singleOffer: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              {singleOffer.text || `Buy ${singleOffer.quantity}`}
                            </div>
                          ))}
                          {offer.offers.length > 3 && (
                            <div className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs">
                              +{offer.offers.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuantityOffer(offer);
                          setCurrentStep('settings');
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this offer?')) {
                            try {
                              await (supabase as any)
                                .from('quantity_offers')
                                .delete()
                                .eq('id', offer.id);
                              toast.success('Offer deleted successfully');
                              loadExistingOffers();
                            } catch (error) {
                              toast.error('Failed to delete offer');
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'product' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('selectProduct')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Shopify store not connected</p>
                  <p className="text-sm">Please connect your Shopify store first</p>
                </div>
              ) : shopifyLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading products from Shopify...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No products found in your Shopify store</p>
                  <Button onClick={() => loadProducts()} variant="outline" className="mt-4">
                    Retry Loading Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <CardContent className="p-4">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.svg'}
                          alt={product.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <h3 className="font-medium">{product.title}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {selectedProduct && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setCurrentStep('form')}>
                    {t('next')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'form' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('selectForm')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forms.map((form) => (
                  <Card
                    key={form.id}
                    className={`cursor-pointer transition-all ${
                      selectedForm?.id === form.id
                        ? 'ring-2 ring-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleFormSelect(form)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium">{form.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(form.data) ? form.data.length : 0} {t('fields')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <Button onClick={() => setCurrentStep('product')} variant="outline">
                  {t('back')}
                </Button>
                {selectedForm && (
                  <Button onClick={proceedToSettings}>
                    {t('saveAndContinue')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'settings' && selectedProduct && selectedForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    {t('selectedProduct')}: {selectedProduct.title} | {t('selectedForm')}: {selectedForm.title}
                  </CardTitle>
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
                            <Badge variant="outline">{t('offer')} #{offer.id}</Badge>
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
                          {t('noOffersYet')}
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
                          <Label>{t('customSelector')}</Label>
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

              <div className="mt-6">
                <Button onClick={saveQuantityOffer} disabled={loading} className="w-full">
                  {loading ? t('saving') : t('saveOffer')}
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
                    form={selectedForm}
                    offers={quantityOffer.offers}
                    styling={quantityOffer.styling}
                    position={quantityOffer.position}
                    enabled={quantityOffer.enabled}
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