
import React from 'react';
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
  price?: number;
  compareAtPrice?: number;
  title?: string;
  image?: string;
  currency?: string;
}

interface QuantityOffersDisplayProps {
  offers: Offer[];
  styling: Styling;
  basePrice?: number;
  productData?: ProductData;
  currency?: string;
  formDirection?: 'ltr' | 'rtl';
}

const QuantityOffersDisplay: React.FC<QuantityOffersDisplayProps> = ({ 
  offers, 
  styling, 
  basePrice,
  productData,
  currency = 'MAD',
  formDirection = 'ltr'
}) => {
  React.useEffect(() => {
    CurrencyService.initialize();
  }, []);

  console.log('🎯 QuantityOffersDisplay received:', {
    offers: offers?.length,
    productData,
    hasPrice: !!productData?.price,
    hasImage: !!productData?.image,
    currency: productData?.currency || currency
  });

  // إذا لم تكن هناك بيانات منتج حقيقية، عرض رسالة تحذيرية
  if (!productData?.price) {
    console.log('⚠️ No real product data available');
    return (
      <div className="p-4 border-2 border-dashed border-yellow-300 rounded-lg text-center text-yellow-600 bg-yellow-50">
        <p className="text-sm font-medium">لا توجد بيانات سعر حقيقية للمنتج</p>
        <p className="text-xs mt-1">يرجى التأكد من ربط المنتج بشكل صحيح</p>
      </div>
    );
  }

  const realPrice = productData.price;
  const productTitle = productData.title || 'المنتج';
  const productImage = productData.image;
  const sourceCurrency = productData.currency || currency;
  const displayCurrency = currency;
  const unitPrice = sourceCurrency !== displayCurrency 
    ? CurrencyService.convertCurrency(realPrice, sourceCurrency, displayCurrency)
    : realPrice;
  
  console.log('✅ Using real product data:', {
    realPrice,
    productTitle,
    productImage: !!productImage,
    displayCurrency
  });
  
  const calculatePrice = (offer: Offer) => {
    const base = unitPrice;
    if (offer.discountType === 'none' || !offer.discountValue) {
      return base * offer.quantity;
    }

    if (offer.discountType === 'fixed') {
      return (base * offer.quantity) - offer.discountValue;
    }

    if (offer.discountType === 'percentage') {
      const discount = (base * offer.quantity * offer.discountValue) / 100;
      return (base * offer.quantity) - discount;
    }

    return base * offer.quantity;
  };

  if (!offers || offers.length === 0) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        <p className="text-sm">لا توجد عروض كمية محددة</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4" style={{ direction: formDirection }}>
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

        const lang = formDirection === 'rtl' ? 'ar' : 'en';
        const formattedOriginal = isDiscounted ? CurrencyService.formatCurrency(originalPrice, displayCurrency, lang) : '';
        const formattedTotal = CurrencyService.formatCurrency(totalPrice, displayCurrency, lang);
        const formattedUnit = CurrencyService.formatCurrency(realPrice, displayCurrency, lang);
        return (
          <div 
            key={offer.id}
            className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
              isHighlighted 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white'
            }`}
            style={{ 
              backgroundColor: styling.backgroundColor || '#22c55e',
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
                  {formattedOriginal}
                </div>
              )}
              <div 
                className="font-bold text-lg"
                style={{ color: styling.priceColor }}
              >
                {formattedTotal}
              </div>
              {offer.quantity > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  {formDirection === 'rtl' ? `${offer.quantity} × ${formattedUnit}` : `${formattedUnit} × ${offer.quantity}`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuantityOffersDisplay;
