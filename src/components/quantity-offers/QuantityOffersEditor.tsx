import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Palette, Eye } from 'lucide-react';
import QuantityOffersDisplay from './QuantityOffersDisplay';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { supabase } from '@/integrations/supabase/client';

interface Offer {
  quantity: number;
  title: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tag?: string;
}

interface QuantityOffer {
  id: string;
  product_id: string;
  form_id: string;
  offers: any;
  styling: any;
  position: string;
  enabled: boolean;
  product_title?: string;
  form_title?: string;
}

interface Props {
  offer: QuantityOffer;
  isCreating: boolean;
  onSave: (offer: QuantityOffer) => void;
  onCancel: () => void;
}

interface ProductData {
  price?: number;
  compareAtPrice?: number;
  title?: string;
  image?: string;
  currency?: string;
}

const QuantityOffersEditor: React.FC<Props> = ({ offer, isCreating, onSave, onCancel }) => {
  const { activeStore } = useSimpleShopify();
  const [currentOffer, setCurrentOffer] = useState<QuantityOffer>({
    ...offer,
    offers: Array.isArray(offer.offers) ? offer.offers : []
  });
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [newOffer, setNewOffer] = useState<Offer>({
    quantity: 2,
    title: 'اشتري {quantity} واحصل على خصم {discount}%',
    discount: 10,
    discountType: 'percentage',
    tag: 'وفر أكثر'
  });

  // جلب بيانات المنتج الحقيقية
  React.useEffect(() => {
    const loadProductData = async () => {
      if (!activeStore || !currentOffer.product_id) return;
      
      setLoadingProduct(true);
      try {
        const { data: productsData, error } = await supabase.functions.invoke('shopify-products', {
          body: { shop: activeStore }
        });

        if (error) {
          console.error('Error fetching product data:', error);
          return;
        }

        const allProducts = productsData?.products || [];
        const product = allProducts.find((p: any) => String(p.id) === String(currentOffer.product_id));
        
        if (product) {
          setProductData({
            price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : undefined,
            compareAtPrice: product.variants?.[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : undefined,
            title: product.title,
            image: typeof product.image === 'string' ? product.image : product.image?.src,
            currency: 'SAR'
          });
        }
      } catch (error) {
        console.error('Error loading product data:', error);
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProductData();
  }, [activeStore, currentOffer.product_id]);

  const addOffer = () => {
    setCurrentOffer(prev => ({
      ...prev,
      offers: [...prev.offers, { ...newOffer }]
    }));
    
    setNewOffer({
      quantity: newOffer.quantity + 1,
      title: 'اشتري {quantity} واحصل على خصم {discount}%',
      discount: 10,
      discountType: 'percentage',
      tag: 'وفر أكثر'
    });
  };

  const removeOffer = (index: number) => {
    setCurrentOffer(prev => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index)
    }));
  };

  const updateOffer = (index: number, field: keyof Offer, value: any) => {
    setCurrentOffer(prev => ({
      ...prev,
      offers: prev.offers.map((offer, i) => 
        i === index ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const updateStyling = (field: string, value: string) => {
    setCurrentOffer(prev => ({
      ...prev,
      styling: { ...prev.styling, [field]: value }
    }));
  };

  const handleSave = () => {
    if (currentOffer.offers.length === 0) {
      alert('يرجى إضافة عرض واحد على الأقل');
      return;
    }
    onSave(currentOffer);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {isCreating ? 'إنشاء عرض كمية جديد' : 'تعديل عرض الكمية'}
              </CardTitle>
            </div>
            <Badge variant="outline">
              {currentOffer.product_title}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>الإعدادات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>تفعيل العرض</Label>
            <Switch
              checked={currentOffer.enabled}
              onCheckedChange={(enabled) => 
                setCurrentOffer(prev => ({ ...prev, enabled }))
              }
            />
          </div>

          <div>
            <Label>موضع العرض</Label>
            <Select
              value={currentOffer.position}
              onValueChange={(position) => 
                setCurrentOffer(prev => ({ ...prev, position }))
              }
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
        </CardContent>
      </Card>

      {/* Offers */}
      <Card>
        <CardHeader>
          <CardTitle>عروض الكمية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Offers */}
          {currentOffer.offers.map((offer, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge>عرض {index + 1}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOffer(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    value={offer.quantity}
                    onChange={(e) => updateOffer(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>قيمة الخصم</Label>
                  <Input
                    type="number"
                    value={offer.discount}
                    onChange={(e) => updateOffer(index, 'discount', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>نوع الخصم</Label>
                <Select
                  value={offer.discountType}
                  onValueChange={(value) => updateOffer(index, 'discountType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">قيمة ثابتة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>نص العرض</Label>
                <Input
                  value={offer.title}
                  onChange={(e) => updateOffer(index, 'title', e.target.value)}
                  placeholder="اشتري {quantity} واحصل على خصم {discount}%"
                />
              </div>

              <div>
                <Label>تسمية إضافية (اختيارية)</Label>
                <Input
                  value={offer.tag || ''}
                  onChange={(e) => updateOffer(index, 'tag', e.target.value)}
                  placeholder="وفر أكثر"
                />
              </div>
            </div>
          ))}

          {/* Add New Offer */}
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">إضافة عرض جديد</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={newOffer.quantity}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>قيمة الخصم</Label>
                <Input
                  type="number"
                  value={newOffer.discount}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <Button onClick={addOffer} className="w-full">
              <Plus className="h-4 w-4 ml-1" />
              إضافة العرض
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {currentOffer.offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة مباشرة مع السعر الحقيقي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border">
              {loadingProduct ? (
                <div className="text-center py-4 text-gray-500">
                  جاري تحميل بيانات المنتج...
                </div>
              ) : (
                <QuantityOffersDisplay 
                  offers={currentOffer.offers.map((offer: any) => ({
                    id: String(Math.random()),
                    text: offer.title?.replace('{quantity}', offer.quantity)?.replace('{discount}', offer.discount) || `اشتري ${offer.quantity} قطع`,
                    tag: offer.tag || '',
                    quantity: offer.quantity || 1,
                    discountType: offer.discountType === 'percentage' ? 'percentage' : 'fixed',
                    discountValue: offer.discount || 0
                  }))}
                  styling={currentOffer.styling || {
                    backgroundColor: '#ffffff',
                    textColor: '#000000',
                    tagColor: '#22c55e',
                    priceColor: '#ef4444'
                  }}
                  productData={productData || undefined}
                  currency="SAR"
                />
              )}
              {productData && (
                <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <strong>بيانات المنتج الحقيقية:</strong> {productData.title} - 
                  السعر: {productData.price?.toFixed(2) || 'غير محدد'} {productData.currency}
                  {productData.image && ' - يتضمن صورة'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Styling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            التخصيص المرئي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>لون الخلفية</Label>
              <Input
                type="color"
                value={currentOffer.styling.backgroundColor}
                onChange={(e) => updateStyling('backgroundColor', e.target.value)}
              />
            </div>
            <div>
              <Label>لون النص</Label>
              <Input
                type="color"
                value={currentOffer.styling.textColor}
                onChange={(e) => updateStyling('textColor', e.target.value)}
              />
            </div>
            <div>
              <Label>لون التسمية</Label>
              <Input
                type="color"
                value={currentOffer.styling.tagColor}
                onChange={(e) => updateStyling('tagColor', e.target.value)}
              />
            </div>
            <div>
              <Label>لون السعر</Label>
              <Input
                type="color"
                value={currentOffer.styling.priceColor}
                onChange={(e) => updateStyling('priceColor', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button onClick={handleSave}>
          {isCreating ? 'إنشاء العرض' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
};

export default QuantityOffersEditor;
