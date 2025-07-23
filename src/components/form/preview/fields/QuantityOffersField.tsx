
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface ProductData {
  id?: string;
  price?: number;
  title?: string;
  image?: string;
  currency?: string;
}

interface QuantityOffersFieldProps {
  field: any;
  formStyle?: any;
  productId?: string;
  formId?: string;
  productData?: ProductData;
  currency?: string;
}

const QuantityOffersField: React.FC<QuantityOffersFieldProps> = ({ 
  field, 
  formStyle = {},
  productId,
  formId,
  productData,
  currency = 'SAR'
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [styling, setStyling] = useState<Styling>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    tagColor: '#22c55e',
    priceColor: '#ef4444'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuantityOffers = async () => {
      if (!productId || !formId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('quantity_offers')
          .select('*')
          .eq('product_id', productId)
          .eq('form_id', formId)
          .eq('enabled', true)
          .single();

        if (data && !error) {
          setOffers(data.offers || []);
          setStyling(data.styling || styling);
        }
      } catch (error) {
        console.error('Error loading quantity offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuantityOffers();
  }, [productId, formId]);

  // التحقق من وجود بيانات منتج حقيقية
  const hasRealPrice = productData?.price && productData.price > 0;
  const realPrice = hasRealPrice ? productData.price : null;
  const displayCurrency = productData?.currency || currency;
  const productTitle = productData?.title || 'المنتج';
  const productImage = productData?.image;

  const calculatePrice = (offer: Offer) => {
    if (!realPrice) return 0;
    
    const baseTotal = realPrice * (offer.quantity || 1);
    
    if (offer.discountType === 'fixed' && offer.discountValue) {
      return baseTotal - offer.discountValue;
    } else if (offer.discountType === 'percentage' && offer.discountValue) {
      const discount = (baseTotal * offer.discountValue) / 100;
      return baseTotal - discount;
    }
    
    return baseTotal;
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'SAR': 'ر.س',
      'MAD': 'د.م',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[curr] || curr;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">جاري تحميل العروض...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  // إذا لم يكن هناك سعر حقيقي، عرض رسالة تحذيرية
  if (!hasRealPrice) {
    return (
      <div className="p-4 border-2 border-dashed border-yellow-300 rounded-lg text-center text-yellow-600 bg-yellow-50 mb-4">
        <p className="text-sm font-medium">⚠️ لا توجد بيانات سعر حقيقية للمنتج</p>
        <p className="text-xs mt-1">يرجى التأكد من ربط المنتج بشكل صحيح</p>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(displayCurrency);

  return (
    <div className="space-y-2 mb-4">
      {offers.map((offer, index) => {
        const totalPrice = calculatePrice(offer);
        const originalPrice = realPrice * (offer.quantity || 1);
        const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
        const isHighlighted = index === 1;
        
        let savingsPercentage = 0;
        if (isDiscounted) {
          if (offer.discountType === 'percentage') {
            savingsPercentage = offer.discountValue || 0;
          } else if (offer.discountType === 'fixed') {
            savingsPercentage = Math.round(((offer.discountValue || 0) / originalPrice) * 100);
          }
        }

        return (
          <div 
            key={offer.id}
            className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
              isHighlighted 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white'
            }`}
            style={{ backgroundColor: isHighlighted ? '#f0fdf4' : styling.backgroundColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={productTitle}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  style={{ display: productImage ? 'none' : 'block' }}
                >
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <div 
                  className="font-semibold"
                  style={{ color: styling.textColor }}
                >
                  {offer.text || `اشترِ ${offer.quantity || 1} قطعة`}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {offer.tag && (
                    <div 
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: styling.tagColor }}
                    >
                      {offer.tag}
                    </div>
                  )}
                  {savingsPercentage > 0 && (
                    <div className="inline-block px-2 py-1 rounded text-xs font-medium text-white bg-green-500">
                      وفر {savingsPercentage}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              {isDiscounted && (
                <div className="text-sm line-through text-gray-400">
                  {originalPrice.toFixed(2)} {currencySymbol}
                </div>
              )}
              <div 
                className="font-bold text-lg"
                style={{ color: styling.priceColor }}
              >
                {totalPrice.toFixed(2)} {currencySymbol}
              </div>
              {(offer.quantity || 1) > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  {realPrice.toFixed(2)} {currencySymbol} × {offer.quantity || 1}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuantityOffersField;
