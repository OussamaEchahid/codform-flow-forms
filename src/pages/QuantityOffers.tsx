import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import QuantityOffersPreview from '@/components/quantity-offers/QuantityOffersPreview';

interface Offer {
  id: string;
  text: string;
  tag: string;
  quantity: number;
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue?: number;
}

interface Styling {
  backgroundColor: string;
  textColor: string;
  tagColor: string;
  priceColor: string;
}

interface QuantityOfferData {
  id?: string;
  shop_id: string;
  product_id: string;
  form_id: string;
  enabled: boolean;
  offers: Offer[];
  styling: Styling;
  position: 'before_form' | 'inside_form' | 'after_form';
  custom_selector?: string;
}

export default function QuantityOffers() {
  const { t } = useI18n();
  const { products } = useShopify();
  
  const [forms, setForms] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [offers, setOffers] = useState<Offer[]>([{
    id: '1',
    text: 'Buy 1 Item',
    tag: 'Save 0%',
    quantity: 1,
    discountType: 'none'
  }]);
  
  const [styling, setStyling] = useState<Styling>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    tagColor: '#22c55e',
    priceColor: '#ef4444'
  });
  
  const [position, setPosition] = useState<'before_form' | 'inside_form' | 'after_form'>('before_form');
  const [customSelector, setCustomSelector] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentOfferData, setCurrentOfferData] = useState<QuantityOfferData | null>(null);

  // Load forms and store data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: formsData } = await supabase.from('forms').select('*');
        if (formsData) setForms(formsData);
        
        // Get selected store from localStorage or useShopify hook
        const store = localStorage.getItem('shopify_store');
        if (store) setSelectedStore({ shop: store });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Load existing offer data when product and form are selected
  useEffect(() => {
    if (selectedProduct && selectedForm && selectedStore) {
      loadOfferData();
    }
  }, [selectedProduct, selectedForm, selectedStore]);

  const loadOfferData = async () => {
    try {
      const { data, error } = await supabase
        .from('quantity_offers' as any)
        .select('*')
        .eq('shop_id', selectedStore?.shop)
        .eq('product_id', selectedProduct)
        .eq('form_id', selectedForm)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && typeof data === 'object' && data !== null) {
        setCurrentOfferData(data as QuantityOfferData);
        setEnabled((data as any).enabled);
        setOffers((data as any).offers || offers);
        setStyling((data as any).styling || styling);
        setPosition((data as any).position || position);
        setCustomSelector((data as any).custom_selector || '');
      } else {
        // Reset to defaults if no data found
        setCurrentOfferData(null);
        setEnabled(true);
        setOffers([{
          id: '1',
          text: 'Buy 1 Item',
          tag: 'Save 0%',
          quantity: 1,
          discountType: 'none'
        }]);
        setStyling({
          backgroundColor: '#ffffff',
          textColor: '#000000',
          tagColor: '#22c55e',
          priceColor: '#ef4444'
        });
        setPosition('before_form');
        setCustomSelector('');
      }
    } catch (error) {
      console.error('Error loading offer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offer data',
        variant: 'destructive'
      });
    }
  };

  const addNewOffer = () => {
    const newOffer: Offer = {
      id: Date.now().toString(),
      text: `Buy ${offers.length + 1} Items`,
      tag: 'Save 0%',
      quantity: offers.length + 1,
      discountType: 'none'
    };
    setOffers([...offers, newOffer]);
  };

  const removeOffer = (id: string) => {
    if (offers.length > 1) {
      setOffers(offers.filter(offer => offer.id !== id));
    }
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers(offers.map(offer => 
      offer.id === id ? { ...offer, ...updates } : offer
    ));
  };

  const updateStyling = (updates: Partial<Styling>) => {
    setStyling({ ...styling, ...updates });
  };

  const saveOfferData = async () => {
    if (!selectedProduct || !selectedForm || !selectedStore) {
      toast({
        title: 'Error',
        description: 'Please select both product and form',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const offerData: Omit<QuantityOfferData, 'id'> = {
        shop_id: selectedStore.shop,
        product_id: selectedProduct,
        form_id: selectedForm,
        enabled,
        offers,
        styling,
        position,
        custom_selector: customSelector || undefined
      };

      if (currentOfferData) {
        // Update existing
        const { error } = await supabase
          .from('quantity_offers' as any)
          .update(offerData)
          .eq('id', currentOfferData.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('quantity_offers' as any)
          .insert([offerData]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Quantity offers saved successfully'
      });

      // Reload data
      await loadOfferData();
    } catch (error) {
      console.error('Error saving offer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save offer data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('quantityOffers.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product and Form Selection */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product-select">{t('quantityOffers.selectProduct')}</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product-select">
                      <SelectValue placeholder={t('quantityOffers.selectProductPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="form-select">{t('quantityOffers.selectForm')}</Label>
                  <Select value={selectedForm} onValueChange={setSelectedForm}>
                    <SelectTrigger id="form-select">
                      <SelectValue placeholder={t('quantityOffers.selectFormPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                  <Label>{t('quantityOffers.enableOffers')}</Label>
                </div>
              </div>

              {/* Offers Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('quantityOffers.offers')}</h3>
                {offers.map((offer, index) => (
                  <Card key={offer.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{t('quantityOffers.offer')} {index + 1}</h4>
                        {offers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOffer(offer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label>{t('quantityOffers.offerText')}</Label>
                        <Input
                          value={offer.text}
                          onChange={(e) => updateOffer(offer.id, { text: e.target.value })}
                          placeholder="Buy 3 and get 1 free"
                        />
                      </div>

                      <div>
                        <Label>{t('quantityOffers.tag')}</Label>
                        <Input
                          value={offer.tag}
                          onChange={(e) => updateOffer(offer.id, { tag: e.target.value })}
                          placeholder="1 for free"
                        />
                      </div>

                      <div>
                        <Label>{t('quantityOffers.quantity')}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={offer.quantity}
                          onChange={(e) => updateOffer(offer.id, { quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>

                      <div>
                        <Label>{t('quantityOffers.discountType')}</Label>
                        <Select 
                          value={offer.discountType} 
                          onValueChange={(value: 'none' | 'fixed' | 'percentage') => 
                            updateOffer(offer.id, { discountType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('quantityOffers.noDiscount')}</SelectItem>
                            <SelectItem value="fixed">{t('quantityOffers.fixedAmount')}</SelectItem>
                            <SelectItem value="percentage">{t('quantityOffers.percentage')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {offer.discountType !== 'none' && (
                        <div>
                          <Label>
                            {offer.discountType === 'fixed' 
                              ? t('quantityOffers.discountAmount') 
                              : t('quantityOffers.discountPercentage')
                            }
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={offer.discountValue || 0}
                            onChange={(e) => updateOffer(offer.id, { discountValue: parseFloat(e.target.value) || 0 })}
                            placeholder={offer.discountType === 'fixed' ? '20' : '15'}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <Button onClick={addNewOffer} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('quantityOffers.addNewOffer')}
                </Button>
              </div>

              {/* Styling Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('quantityOffers.styling')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('quantityOffers.backgroundColor')}</Label>
                    <Input
                      type="color"
                      value={styling.backgroundColor}
                      onChange={(e) => updateStyling({ backgroundColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('quantityOffers.textColor')}</Label>
                    <Input
                      type="color"
                      value={styling.textColor}
                      onChange={(e) => updateStyling({ textColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('quantityOffers.tagColor')}</Label>
                    <Input
                      type="color"
                      value={styling.tagColor}
                      onChange={(e) => updateStyling({ tagColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('quantityOffers.priceColor')}</Label>
                    <Input
                      type="color"
                      value={styling.priceColor}
                      onChange={(e) => updateStyling({ priceColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Position Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('quantityOffers.position')}</h3>
                <Select value={position} onValueChange={(value) => setPosition(value as 'before_form' | 'inside_form' | 'after_form')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before_form">{t('quantityOffers.beforeForm')}</SelectItem>
                    <SelectItem value="inside_form">{t('quantityOffers.insideForm')}</SelectItem>
                    <SelectItem value="after_form">{t('quantityOffers.afterForm')}</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <Label>{t('quantityOffers.customSelector')} (Optional)</Label>
                  <Input
                    value={customSelector}
                    onChange={(e) => setCustomSelector(e.target.value)}
                    placeholder=".custom-position"
                  />
                </div>
              </div>

              <Button onClick={saveOfferData} disabled={loading} className="w-full">
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('quantityOffers.livePreview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuantityOffersPreview
                offers={offers}
                styling={styling}
                enabled={enabled}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}