
import React from 'react';

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
  currency = 'SAR',
  formDirection = 'ltr'
}) => {
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
  const displayCurrency = productData.currency || currency;
  
  console.log('✅ Using real product data:', {
    realPrice,
    productTitle,
    productImage: !!productImage,
    displayCurrency
  });
  
  const calculatePrice = (offer: Offer) => {
    if (offer.discountType === 'none' || !offer.discountValue) {
      return realPrice * offer.quantity;
    }

    if (offer.discountType === 'fixed') {
      return (realPrice * offer.quantity) - offer.discountValue;
    }

    if (offer.discountType === 'percentage') {
      const discount = (realPrice * offer.quantity * offer.discountValue) / 100;
      return (realPrice * offer.quantity) - discount;
    }

    return realPrice * offer.quantity;
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

        return (
          <div 
            key={offer.id}
            style={{
              background: isHighlighted ? '#f0fdf4' : styling.backgroundColor,
              border: isHighlighted ? '2px solid #22c55e' : '2px solid #22c55e',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'Cairo, Arial, sans-serif',
              cursor: 'pointer',
              direction: formDirection,
              textAlign: formDirection === 'rtl' ? 'right' : 'left',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: '0.2s',
              transform: 'translateY(0px)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              direction: formDirection,
              gap: '12px',
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              {/* صورة المنتج */}
              <div style={{
                width: '40px',
                height: '40px',
                flexShrink: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#ffffff',
                border: '1px solid #e5e7eb'
              }}>
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={productTitle}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              
              {/* النص */}
              <div style={{
                flex: '1 1 0%',
                textAlign: formDirection === 'rtl' ? 'right' : 'left',
                direction: formDirection,
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff'
              }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#1f2937',
                  marginBottom: '2px',
                  borderColor: '#e5e7eb',
                  backgroundColor: '#ffffff'
                }}>
                  {offer.text || `Buy ${offer.quantity} Item${offer.quantity > 1 ? 's' : ''}`}
                </div>
                
                {offer.tag && (
                  <span style={{
                    background: '#22c55e',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {offer.tag}
                  </span>
                )}
              </div>
              
              {/* زر الكمية */}
              <button style={{
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                {formDirection === 'rtl' ? `اشتر ${offer.quantity} قطع` : `Buy ${offer.quantity} Items`}
              </button>
              
              {/* السعر */}
              <div style={{
                textAlign: formDirection === 'rtl' ? 'right' : 'left',
                direction: formDirection,
                minWidth: '70px',
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#059669',
                  borderColor: '#e5e7eb',
                  backgroundColor: '#ffffff'
                }}>
                  {formDirection === 'rtl' ? `${displayCurrency} ${totalPrice.toFixed(2)}` : `${totalPrice.toFixed(2)} ${displayCurrency}`}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuantityOffersDisplay;
