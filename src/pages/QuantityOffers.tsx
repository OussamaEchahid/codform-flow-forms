import React, { useState, useEffect } from 'react';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Package, FileText, Settings, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
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
  const [currentStep, setCurrentStep] = useState<'product' | 'form' | 'settings'>('product');
  const [products, setProducts] = useState<Product[]>([]);
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
    loadProducts();
    loadForms();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Get active shop from local storage
      const activeShop = localStorage.getItem('ACTIVE_STORE_KEY');
      if (!activeShop) {
        toast.error('No active Shopify store found');
        return;
      }

      // Fetch products from Shopify API
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
        },
        body: JSON.stringify({ 
          shop: activeShop,
          action: 'products' 
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      } else {
        console.error('Failed to fetch products:', response.statusText);
        // Fallback to mock data if API fails
        setProducts([
          { id: '1', title: 'Product 1', handle: 'product-1', images: [{ url: '/placeholder.svg' }] },
          { id: '2', title: 'Product 2', handle: 'product-2', images: [{ url: '/placeholder.svg' }] }
        ]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      // Fallback to mock data
      setProducts([
        { id: '1', title: 'Product 1', handle: 'product-1', images: [{ url: '/placeholder.svg' }] },
        { id: '2', title: 'Product 2', handle: 'product-2', images: [{ url: '/placeholder.svg' }] }
      ]);
    }
    setLoading(false);
  };

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('is_published', true);

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      toast.error('Failed to load forms');
    }
  };

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
          shop_id: 'default-shop', // This should come from actual shop context
          product_id: selectedProduct.id,
          form_id: selectedForm.id
        });

      if (error) throw error;
      toast.success('Quantity offer saved successfully');
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

  return (
    <SettingsLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('quantityOffers')}</h1>
            <p className="text-muted-foreground">{t('quantityOffersDescription')}</p>
          </div>
          {currentStep === 'settings' && (
            <Button onClick={resetToProductSelection} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              {t('createNewOffer')}
            </Button>
          )}
        </div>

        {currentStep === 'product' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('selectProduct')}
              </CardTitle>
            </CardHeader>
            <CardContent>
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