import React from 'react';
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

interface QuantityOffersPreviewProps {
  form?: any;
  offers: Offer[];
  styling: Styling;
  position?: string;
  enabled?: boolean;
}

const QuantityOffersPreview: React.FC<QuantityOffersPreviewProps> = ({
  form,
  offers,
  styling,
  position,
  enabled = true
}) => {
  if (!enabled) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        Quantity offers are disabled
      </div>
    );
  }

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

  const basePrice = 100; // Mock base price for preview

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: styling.backgroundColor,
        color: styling.textColor 
      }}
    >
      <h3 className="text-lg font-semibold mb-4">Buy with Cash on Delivery</h3>
      
      <div className="space-y-3">
        {offers.map((offer, index) => {
          const totalPrice = calculatePrice(basePrice, offer);
          const originalPrice = basePrice * offer.quantity;
          const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
          const isHighlighted = index === 1; // Highlight second offer like in the image

          return (
            <div 
              key={offer.id}
              className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                isHighlighted ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                  {/* Mock product image */}
                  <div className="w-full h-full bg-gray-300 rounded-lg"></div>
                </div>
                
                <div>
                  <div className="font-medium" style={{ color: styling.textColor }}>
                    {offer.text}
                  </div>
                  {isDiscounted && (
                    <Badge 
                      style={{ 
                        backgroundColor: styling.tagColor,
                        color: '#ffffff'
                      }}
                    >
                      {offer.tag}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                {isDiscounted && (
                  <div className="text-sm line-through text-gray-500">
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

      {/* Mock form fields like in the image */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Express Shipping</label>
          <div className="text-sm text-gray-600">1-2 days - $4.99</div>
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Ex: John D..."
            className="w-full p-2 border border-gray-300 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Phone"
            className="w-full p-2 border border-gray-300 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div>
          <input 
            type="email" 
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Address"
            className="w-full p-2 border border-gray-300 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <select className="p-2 border border-gray-300 rounded" style={{ backgroundColor: '#ffffff' }}>
            <option>Province</option>
          </select>
          <input 
            type="text" 
            placeholder="City"
            className="p-2 border border-gray-300 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
        
        <button 
          className="w-full p-3 text-white font-bold rounded-lg"
          style={{ background: 'linear-gradient(135deg, #ff4757, #ff6b7a)' }}
        >
          Complete order - $108.89
        </button>
      </div>
    </div>
  );
};

export default QuantityOffersPreview;