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
  currency = 'MAD'
}) => {
  // تهيئة CurrencyService عند تحميل المكون
  React.useEffect(() => {
    CurrencyService.initialize();
  }, []);

  // Ensure currency service uses the same shop context if available
  React.useEffect(() => {
    try {
      const unifiedStore = (window as any).UnifiedStoreManager?.getActiveStore?.();
      if (unifiedStore) {
        CurrencyService.setShopContext(unifiedStore, null);
      }
    } catch {}
  }, []);
  // Use real product price when available; otherwise fall back to 0 instead of a hardcoded demo value
  const realPrice = (typeof productData?.price === 'number' && !isNaN(productData.price)) ? productData.price : 0;
  const productTitle = productData?.title || 'المنتج';
  const productImage = productData?.image || productData?.featuredImage;
  // عرض الأسعار يجب أن يكون بعملة النموذج
  const displayCurrency = (form as any)?.currency || currency;
  // عملة مصدر السعر (عملة المنتج)
  const sourceCurrency = productData?.currency || displayCurrency;
  // تحويل سعر الوحدة إلى عملة العرض إذا اختلفت
  const unitPrice = sourceCurrency !== displayCurrency
    ? CurrencyService.convertCurrency(realPrice, sourceCurrency, displayCurrency)
    : realPrice;

  console.log('🎯 QuantityOffersPreview - Product Data:', {
    realPrice,
    unitPrice,
    productTitle,
    productImage,
    displayCurrency,
    sourceCurrency,
    fallbackCurrency: currency,
    productData
  });

  console.log('🎯 QuantityOffersPreview - Currency Analysis:', {
    'form.currency': (form as any)?.currency,
    'productData.currency': productData?.currency,
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
      <div className="space-y-2 mb-4">
        {offers.map((offer, index) => {
          const totalPrice = calculatePrice(offer);
          const originalPrice = unitPrice * offer.quantity;
          const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
          const isHighlighted = index === 0; // Highlight FIRST offer for preview

          // Calculate savings percentage for display
          let savingsPercentage = 0;
          if (isDiscounted && offer.discountType === 'percentage') {
            savingsPercentage = offer.discountValue || 0;
          } else if (isDiscounted && offer.discountType === 'fixed') {
            savingsPercentage = Math.round(((offer.discountValue || 0) / originalPrice) * 100);
          }

          // Pastel background like storefront
          const lightenColor = (hex: string, amount: number) => {
            try {
              const h = hex.replace('#','');
              const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
              const n = parseInt(full, 16);
              let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
              r = Math.round(r + (255 - r) * amount);
              g = Math.round(g + (255 - g) * amount);
              b = Math.round(b + (255 - b) * amount);
              const toHex = (v:number)=>v.toString(16).padStart(2,'0');
              return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            } catch { return hex; }
          };
          const baseColor = styling.backgroundColor || '#22c55e';
          const cardBg = '#ffffff';
          const selectedBg = lightenColor(baseColor, 0.96);

          return (
            <div
              key={offer.id}
              className={`p-3 rounded-lg border-2 flex items-center justify-between`}
              style={{ backgroundColor: isHighlighted ? selectedBg : cardBg, borderColor: isHighlighted ? baseColor : '#e5e7eb' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productTitle}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div>
                  <div
                    className="font-semibold"
                    style={{ color: styling.textColor || '#000000' }}
                  >
                    {offer.text || `Buy ${offer.quantity} Item${offer.quantity > 1 ? 's' : ''}`}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${(form?.language === 'ar' || (form as any)?.direction === 'rtl' || form?.style?.formDirection === 'rtl') ? 'justify-end' : 'justify-start'}`}>
                    {offer.tag && (
                      <div
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: styling.tagColor }}
                      >
                        {offer.tag}
                      </div>
                    )}
                    {savingsPercentage > 0 && (
                      <div className="inline-block px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: (styling.tagColor || styling.backgroundColor || '#22c55e') }}>
                        {(form?.language === 'ar' || (form as any)?.direction === 'rtl' || form?.style?.formDirection === 'rtl') ? 'وفر' : 'Save'} {savingsPercentage}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {isDiscounted && (
                  <div className="text-sm line-through text-gray-400">
                    {CurrencyService.formatCurrency(originalPrice, displayCurrency)}
                  </div>
                )}
                <div
                  className="font-bold text-lg"
                  style={{ color: styling.priceColor || '#000000' }}
                >
                  {CurrencyService.formatCurrency(totalPrice, displayCurrency)}
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
        gap: formStyle.formGap || '5px'
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
                    formCurrency={displayCurrency}
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
              formCurrency={displayCurrency}
            />
          );
        })}
      </div>

      {position === 'after_form' && <QuantityOffersBlock />}
    </div>
  );
};

export default QuantityOffersPreview;