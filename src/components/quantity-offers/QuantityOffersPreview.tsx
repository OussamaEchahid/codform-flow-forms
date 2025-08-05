import React from 'react';
import { Badge } from '@/components/ui/badge';
import FormField from '@/components/form/preview/FormField';
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
  featuredImage?: string;
  currency?: string;
}

interface QuantityOffersPreviewProps {
  form?: any;
  offers: Offer[];
  styling: Styling;
  position?: string;
  enabled?: boolean;
  productData?: ProductData;
  currency?: string;
}

const QuantityOffersPreview: React.FC<QuantityOffersPreviewProps> = ({
  form,
  offers,
  styling,
  position,
  enabled = true,
  productData,
  currency = 'SAR'
}) => {
  // تهيئة CurrencyService عند تحميل المكون
  React.useEffect(() => {
    CurrencyService.initialize();
  }, []);
  // استخراج البيانات الحقيقية للمنتج
  const realPrice = productData?.price || 5000; // استخدام السعر الحقيقي من المنتج
  const productTitle = productData?.title || 'njhygfjuygfujk'; // استخدام اسم المنتج الحقيقي
  const productImage = productData?.image || productData?.featuredImage;
  const displayCurrency = productData?.currency || currency;
  
  console.log('🎯 QuantityOffersPreview - Product Data:', {
    realPrice,
    productTitle,
    productImage,
    displayCurrency,
    fallbackCurrency: currency,
    productData
  });
  
  console.log('🎯 QuantityOffersPreview - Currency Analysis:', {
    'productData.currency': productData?.currency,
    'fallback currency param': currency,
    'final displayCurrency': displayCurrency
  });
  if (!enabled || !form) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        {!form ? 'Please select a form to preview' : 'Quantity offers are disabled'}
      </div>
    );
  }

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

  
  const formStyle = form.style || {};
  const formData = Array.isArray(form.data) ? form.data : [];
  const formFields = formData.length > 0 && formData[0]?.fields ? formData[0].fields : [];

  // Quantity offers component
  const QuantityOffersBlock = () => {
    if (offers.length === 0) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
          No offers configured yet
        </div>
      );
    }

    return (
      <div className="space-y-2 mb-4" style={{ direction: formStyle.formDirection || 'ltr' }}>
        {offers.map((offer, index) => {
          const totalPrice = calculatePrice(offer);
          const originalPrice = realPrice * offer.quantity;
          const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
          const isHighlighted = index === 1; // Highlight second offer
          const formDirection = formStyle.formDirection || 'ltr';
          
          // Calculate savings percentage for display
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
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                  )}
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
                    {CurrencyService.formatCurrency(totalPrice, displayCurrency)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="p-6 rounded-lg border-2 border-purple-400 max-w-md mx-auto"
      style={{
        backgroundColor: formStyle.backgroundColor || '#F9FAFB',
        direction: formStyle.formDirection || 'ltr',
        fontFamily: formStyle.fontFamily || 'inherit',
        fontSize: formStyle.fontSize || '1rem',
        gap: formStyle.formGap || '16px'
      }}
    >
      {/* Show quantity offers based on position */}
      {position === 'before_form' && <QuantityOffersBlock />}
      
      {/* Render actual form fields */}
      <div className="space-y-4">
        {formFields.map((field: any, index: number) => {
          // Show quantity offers inside form (above submit button)
          if (position === 'inside_form' && field.type === 'submit') {
            return (
              <div key={`${field.id}-with-offers`}>
                <QuantityOffersBlock />
                <div className="mt-4">
                  <FormField
                    key={field.id}
                    field={field}
                    value=""
                    onChange={() => {}}
                    formStyle={formStyle}
                  />
                </div>
              </div>
            );
          }
          
          return (
            <FormField
              key={field.id}
              field={field}
              value=""
              onChange={() => {}}
              formStyle={formStyle}
            />
          );
        })}
      </div>
      
      {position === 'after_form' && <QuantityOffersBlock />}
    </div>
  );
};

export default QuantityOffersPreview;