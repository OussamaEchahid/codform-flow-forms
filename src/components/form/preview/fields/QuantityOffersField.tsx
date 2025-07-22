import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
  // استخراج البيانات الحقيقية للمنتج
  const realPrice = productData?.price || 100;
  const productTitle = productData?.title || 'المنتج';
  const productImage = productData?.image;
  const displayCurrency = productData?.currency || currency;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [styling, setStyling] = useState<Styling>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    tagColor: '#22c55e',
    priceColor: '#ef4444'
  });
  const [position, setPosition] = useState('before_form');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuantityOffers = async () => {
      if (!productId || !formId) return;
      
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
          setPosition(data.position || 'before_form');
        }
      } catch (error) {
        console.error('Error loading quantity offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuantityOffers();
  }, [productId, formId]);

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

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {offers.map((offer, index) => {
        const totalPrice = calculatePrice(offer);
        const originalPrice = realPrice * offer.quantity;
        const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
        const isHighlighted = index === 1; // Highlight second offer
        
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
            className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
              isHighlighted ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={productTitle}
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
                  style={{ color: styling.textColor }}
                >
                  {offer.text || `Buy ${offer.quantity} Item${offer.quantity > 1 ? 's' : ''}`}
                </div>
                {offer.tag && (
                  <div 
                    className="inline-block px-2 py-1 rounded text-xs font-medium text-white mt-1"
                    style={{ backgroundColor: styling.tagColor }}
                  >
                    {offer.tag}
                  </div>
                )}
                {savingsPercentage > 0 && (
                  <div className="inline-block px-2 py-1 rounded text-xs font-medium text-white bg-green-500 mt-1 ml-2">
                    Save {savingsPercentage}%
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              {isDiscounted && (
                <div className="text-sm line-through text-gray-400">
                  {originalPrice.toFixed(2)} {displayCurrency}
                </div>
              )}
              <div 
                className="font-bold text-lg"
                style={{ color: styling.priceColor }}
              >
                {totalPrice.toFixed(2)} {displayCurrency}
              </div>
              {offer.quantity > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  {realPrice.toFixed(2)} {displayCurrency} × {offer.quantity}
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