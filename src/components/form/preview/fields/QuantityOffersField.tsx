
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CurrencyService } from '@/lib/services/CurrencyService';

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
  formDirection?: 'ltr' | 'rtl';
}

const QuantityOffersField: React.FC<QuantityOffersFieldProps> = ({ 
  field, 
  formStyle = {},
  productId,
  formId,
  productData,
  currency = 'MAD',
  formDirection = 'ltr'
}) => {
  console.log('🎯 QuantityOffersField - LOGICAL SOLUTION - Product Data:', {
    productData,
    productId,
    formId,
    hasRealPrice: !!(productData?.price && productData.price > 0)
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [styling, setStyling] = useState<Styling>({
    backgroundColor: '#22c55e',
    textColor: '#000000',
    tagColor: '#22c55e',
    priceColor: '#000000'
  });
  const [loading, setLoading] = useState(true);

  // تهيئة CurrencyService عند تحميل المكون
  React.useEffect(() => {
    const initializeService = async () => {
      try {
        await CurrencyService.initialize();
        // إعادة تحديث التنسيق عند تغيير الإعدادات
        if (offers.length > 0) {
          // إجبار إعادة التحديث للواجهة
          setOffers([...offers]);
        }
      } catch (error) {
        console.error('Error initializing CurrencyService:', error);
      }
    };
    initializeService();
  }, []);

  useEffect(() => {
    const loadQuantityOffers = async () => {
      if (!productId || !formId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await (supabase as any)
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
    
    let totalPrice = realPrice * offer.quantity;
    
    if (offer.discountType === 'fixed' && offer.discountValue) {
      totalPrice = totalPrice - offer.discountValue;
    } else if (offer.discountType === 'percentage' && offer.discountValue) {
      const discount = (totalPrice * offer.discountValue) / 100;
      totalPrice = totalPrice - discount;
    }
    
    return totalPrice;
  };

  // إذا لم تكن هناك عروض أو لا يوجد سعر حقيقي
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
      <div className="p-4 border-2 border-dashed border-yellow-300 rounded-lg text-center text-yellow-600 bg-yellow-50 mb-2">
        <p className="text-sm font-medium">⚠️ لا توجد بيانات سعر حقيقية للمنتج</p>
        <p className="text-xs mt-1">يرجى التأكد من ربط المنتج بشكل صحيح</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-0" style={{ direction: formDirection }}>
      {offers.map((offer, index) => {
        const totalPrice = calculatePrice(offer);
        const originalPrice = realPrice * offer.quantity;
        const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
        const isHighlighted = index === 1;
        
        let savingsPercentage = 0;
        if (isDiscounted && offer.discountType === 'percentage') {
          savingsPercentage = offer.discountValue || 0;
        } else if (isDiscounted && offer.discountType === 'fixed') {
          savingsPercentage = Math.round(((offer.discountValue || 0) / originalPrice) * 100);
        }

        return (
          <div 
            key={offer.id}
            className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
              isHighlighted 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white'
            }`}
            style={{ 
              backgroundColor: isHighlighted ? '#f0fdf4' : styling.backgroundColor,
              direction: formDirection 
            }}
          >
            <div className={`flex items-center ${formDirection === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={productTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.log('❌ Image failed to load:', productImage);
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
                  style={{ color: styling.textColor, textAlign: formDirection === 'rtl' ? 'right' : 'left' }}
                >
                  {offer.text || `Buy ${offer.quantity} Item${offer.quantity > 1 ? 's' : ''}`}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${formDirection === 'rtl' ? 'justify-end' : 'justify-start'}`}>
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
                      Save {savingsPercentage}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={formDirection === 'rtl' ? 'text-left' : 'text-right'}>
              {isDiscounted && (
                <div className="text-sm line-through text-gray-400">
                  {CurrencyService.formatCurrency(originalPrice, currency, formDirection === 'rtl' ? 'ar' : 'en')}
                </div>
              )}
              <div 
                className="font-bold text-lg"
                style={{ color: styling.priceColor }}
              >
                {CurrencyService.formatCurrency(totalPrice, currency, formDirection === 'rtl' ? 'ar' : 'en')}
              </div>
              {offer.quantity > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  {CurrencyService.formatCurrency(realPrice, currency, formDirection === 'rtl' ? 'ar' : 'en')} × {offer.quantity}
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
