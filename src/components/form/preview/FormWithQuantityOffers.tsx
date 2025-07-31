import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FormField from './FormField';
import QuantityOffersField from './fields/QuantityOffersField';
import { getCurrencyByCode } from '@/lib/constants/countries-currencies';

interface Offer {
  id: string;
  text: string;
  tag: string;
  quantity: number;
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue?: number;
}

interface QuantityOffer {
  id: string;
  offers: Offer[];
  styling: any;
  position: string;
  enabled: boolean;
  product_id: string;
  form_id: string;
}

interface FormWithQuantityOffersProps {
  fields: any[];
  formStyle: any;
  formCountry: string;
  formPhonePrefix: string;
  productId?: string;
  formId?: string;
}

const FormWithQuantityOffers: React.FC<FormWithQuantityOffersProps> = ({
  fields,
  formStyle,
  formCountry,
  formPhonePrefix,
  productId,
  formId
}) => {
  const [quantityOffers, setQuantityOffers] = useState<QuantityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<{price: number, currency: string, moneyFormat: string, moneyWithCurrencyFormat?: string} | null>(null);

  // الحصول على رمز العملة بناءً على المنتج أو الدولة أو العملة المحددة
  const getCurrencySymbol = () => {
    if (productData?.currency) {
      // Map common currencies to symbols
      const currencySymbols: Record<string, string> = {
        'AED': 'د.إ',
        'SAR': 'ر.س',
        'MAD': 'د.م', // الدرهم المغربي
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
      };
      
      return currencySymbols[productData.currency] || productData.currency;
    }
    
    const currency = formStyle?.currency || formCountry;
    const currencyData = getCurrencyByCode(currency);
    return currencyData?.symbol || 'ر.س';
  };

  // دالة لتنسيق السعر باستخدام تنسيق المتجر
  const formatPrice = (amount: number) => {
    // استخدام تنسيق المتجر الصحيح من Shopify
    if (productData?.moneyWithCurrencyFormat) {
      return productData.moneyWithCurrencyFormat.replace('{{amount}}', amount.toFixed(2));
    } else if (productData?.moneyFormat) {
      return productData.moneyFormat.replace('{{amount}}', amount.toFixed(2));
    }
    return `${amount.toFixed(2)} ${getCurrencySymbol()}`;
  };

  useEffect(() => {
    const loadQuantityOffers = async () => {
      console.log('Loading quantity offers for productId:', productId, 'formId:', formId);
      if (!productId || !formId) {
        console.log('Missing productId or formId, skipping load');
        setLoading(false);
        return;
      }
      
      try {
        // First, get the shop information from form to fetch product data
        const { data: formData } = await supabase
          .from('forms')
          .select('shop_id')
          .eq('id', formId)
          .single();

        if (formData?.shop_id) {
          // Fetch product data from Shopify
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
            },
            body: JSON.stringify({
              shop: formData.shop_id,
              productIds: [productId]
            })
          });

          if (response.ok) {
            const productResponse = await response.json();
            if (productResponse.success && productResponse.products?.length > 0) {
              const product = productResponse.products[0];
              console.log('Product data from Shopify:', product);
              
              setProductData({
                price: parseFloat(product.price || '0'),
                currency: product.currency || 'USD',
                moneyFormat: product.money_format || '${{amount}}',
                moneyWithCurrencyFormat: product.money_with_currency_format || '${{amount}} USD'
              });
              
              console.log('Set product data:', {
                price: parseFloat(product.price || '0'),
                currency: product.currency,
                moneyFormat: product.money_format
              });
            }
          }
        }

        // Load quantity offers
        const { data, error } = await (supabase as any)
          .from('quantity_offers')
          .select('*')
          .eq('product_id', productId)
          .eq('form_id', formId)
          .eq('enabled', true);

        if (data && !error) {
          console.log('Loaded quantity offers:', data);
          setQuantityOffers(data);
        } else if (error) {
          console.error('Error loading quantity offers:', error);
        }
      } catch (error) {
        console.error('Error loading quantity offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuantityOffers();
  }, [productId, formId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <FormField 
            key={field.id} 
            field={field} 
            formStyle={formStyle}
            formCountry={formCountry}
            formPhonePrefix={formPhonePrefix}
            productId={productId}
          />
        ))}
      </div>
    );
  }

  // Get offers for different positions
  const beforeFormOffers = quantityOffers.filter(offer => offer.position === 'before_form');
  const insideFormOffers = quantityOffers.filter(offer => offer.position === 'inside_form');
  const afterFormOffers = quantityOffers.filter(offer => offer.position === 'after_form');

  // تحديد اتجاه النموذج
  const formDirection = formStyle?.formDirection || 'ltr';

  const renderQuantityOffers = (offers: QuantityOffer[]) => {
    return offers.map(offer => (
      <div key={offer.id} className="space-y-2 mb-4" style={{ direction: formDirection }}>
        {offer.offers.map((singleOffer, index) => {
          // استخدام السعر الفعلي للمنتج من Shopify
          const basePrice = productData?.price || 0; // استخدام السعر الفعلي من المنتج
          console.log(`Offer ${index}: basePrice = ${basePrice}, currency = ${productData?.currency}, quantity = ${singleOffer.quantity}`);
          
          const totalPrice = calculatePrice(basePrice, singleOffer);
          const originalPrice = basePrice * singleOffer.quantity;
          const isDiscounted = singleOffer.discountType !== 'none' && singleOffer.discountValue && singleOffer.discountValue > 0;
          const isHighlighted = index === 1;
          
          console.log(`Calculated prices: totalPrice = ${totalPrice}, originalPrice = ${originalPrice}`);
          
          let savingsPercentage = 0;
          if (isDiscounted && singleOffer.discountType === 'percentage') {
            savingsPercentage = singleOffer.discountValue || 0;
          } else if (isDiscounted && singleOffer.discountType === 'fixed') {
            savingsPercentage = Math.round(((singleOffer.discountValue || 0) / originalPrice) * 100);
          }

          return (
            <div 
              key={singleOffer.id}
              className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
                isHighlighted ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-white'
              }`}
              style={{ direction: formDirection }}
            >
              <div className={`flex items-center ${formDirection === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div>
                  <div 
                    className="font-semibold"
                    style={{ 
                      color: offer.styling?.textColor || '#000000',
                      textAlign: formDirection === 'rtl' ? 'right' : 'left'
                    }}
                  >
                    {singleOffer.text || `Buy ${singleOffer.quantity} Item${singleOffer.quantity > 1 ? 's' : ''}`}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${formDirection === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                    {singleOffer.tag && (
                      <div 
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: offer.styling?.tagColor || '#22c55e' }}
                      >
                        {singleOffer.tag}
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
                    {formatPrice(originalPrice)}
                  </div>
                )}
                 <div 
                  className="font-bold text-lg"
                  style={{ color: offer.styling?.priceColor || '#000000' }}
                >
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  const calculatePrice = (basePrice: number, offer: Offer) => {
    if (offer.discountType === 'none' || !offer.discountValue) {
      return basePrice * offer.quantity;
    }

    if (offer.discountType === 'fixed') {
      return (basePrice * offer.quantity) - offer.discountValue;
    }

    if (offer.discountType === 'percentage') {
      const discount = (basePrice * offer.quantity * offer.discountValue) / 100;
      return (basePrice * offer.quantity) - discount;
    }

    return basePrice * offer.quantity;
  };

  return (
    <div className="space-y-4">
      {/* Form fields with inside form offers only */}
      {fields.map((field, index) => {
        // Show ALL quantity offers (regardless of position) before submit button
        if (field.type === 'submit' && quantityOffers.length > 0) {
          return (
            <div key={`${field.id}-with-offers`}>
              {renderQuantityOffers(quantityOffers)}
              <div className="mt-4">
                <FormField 
                  key={field.id} 
                  field={field} 
                  formStyle={formStyle}
                  formCountry={formCountry}
                  formPhonePrefix={formPhonePrefix}
                  productId={productId}
                />
              </div>
            </div>
          );
        }
        
        return (
          <FormField 
            key={field.id} 
            field={field} 
            formStyle={formStyle}
            formCountry={formCountry}
            formPhonePrefix={formPhonePrefix}
            productId={productId}
          />
        );
      })}
    </div>
  );
};

export default FormWithQuantityOffers;