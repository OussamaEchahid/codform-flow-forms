
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

interface QuantityOffersDisplayProps {
  offers: Offer[];
  styling: Styling;
  basePrice?: number;
}

const QuantityOffersDisplay: React.FC<QuantityOffersDisplayProps> = ({ 
  offers, 
  styling, 
  basePrice = 100 
}) => {
  const calculatePrice = (offer: Offer) => {
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

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {offers.map((offer, index) => {
        const totalPrice = calculatePrice(offer);
        const originalPrice = basePrice * offer.quantity;
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
            style={{ backgroundColor: isHighlighted ? '#f0fdf4' : styling.backgroundColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <div 
                  className="font-semibold"
                  style={{ color: styling.textColor }}
                >
                  {offer.text || `Buy ${offer.quantity} Item${offer.quantity > 1 ? 's' : ''}`}
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
                      Save {savingsPercentage}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              {isDiscounted && (
                <div className="text-sm line-through text-gray-400">
                  ${originalPrice.toFixed(2)}
                </div>
              )}
              <div 
                className="font-bold text-lg"
                style={{ color: styling.priceColor }}
              >
                ${totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuantityOffersDisplay;
