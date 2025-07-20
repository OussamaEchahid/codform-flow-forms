import React from 'react';
import { Badge } from '@/components/ui/badge';
import FormField from '@/components/form/preview/FormField';

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
  if (!enabled || !form) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        {!form ? 'Please select a form to preview' : 'Quantity offers are disabled'}
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
      <div 
        className="p-4 rounded-lg border mb-4"
        style={{ 
          backgroundColor: styling.backgroundColor,
          color: styling.textColor 
        }}
      >
        <h3 className="text-lg font-semibold mb-4">Choose Your Quantity</h3>
        
        <div className="space-y-3">
          {offers.map((offer, index) => {
            const totalPrice = calculatePrice(basePrice, offer);
            const originalPrice = basePrice * offer.quantity;
            const isDiscounted = offer.discountType !== 'none' && offer.discountValue && offer.discountValue > 0;
            const isHighlighted = index === 1; // Highlight second offer

            return (
              <div 
                key={offer.id}
                className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                  isHighlighted ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                    <div className="w-full h-full bg-gray-300 rounded-lg"></div>
                  </div>
                  
                  <div>
                    <div className="font-medium" style={{ color: styling.textColor }}>
                      {offer.text || `Quantity: ${offer.quantity}`}
                    </div>
                    {offer.tag && (
                      <Badge 
                        style={{ 
                          backgroundColor: styling.tagColor,
                          color: '#ffffff'
                        }}
                        className="mt-1"
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
      </div>
    );
  };

  return (
    <div 
      className="p-6 rounded-lg border max-w-md mx-auto"
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