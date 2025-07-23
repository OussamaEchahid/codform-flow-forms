
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FormField from './FormField';
import QuantityOffersDisplay from '@/components/quantity-offers/QuantityOffersDisplay';

interface Offer {
  id: string;
  text: string;
  offer_text?: string;
  tag: string;
  quantity: number;
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value?: number;
}

interface QuantityOffer {
  id: string;
  offers: Offer[];
  styling: {
    backgroundColor: string;
    textColor: string;
    tagColor: string;
    priceColor: string;
  };
  position: string;
  enabled: boolean;
  product_id: string;
  form_id: string;
}

interface ProductData {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
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
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuantityOffers = async () => {
      console.log('🎯 FormWithQuantityOffers - Loading offers for:', { productId, formId });
      
      if (!productId || !formId) {
        console.log('❌ Missing productId or formId');
        setLoading(false);
        return;
      }
      
      try {
        // Load quantity offers
        const { data: offersData, error: offersError } = await (supabase as any)
          .from('quantity_offers')
          .select('*')
          .eq('product_id', productId)
          .eq('form_id', formId)
          .eq('enabled', true);

        if (offersError) {
          console.error('❌ Error loading quantity offers:', offersError);
          setLoading(false);
          return;
        }

        // Mock product data for preview (in real scenario, this would come from Shopify)
        const mockProductData: ProductData = {
          id: productId,
          title: 'منتج تجريبي',
          price: 150.00,
          currency: 'SAR',
          image: '/placeholder.svg'
        };

        console.log('✅ FormWithQuantityOffers - Loaded:', {
          offers: offersData?.length || 0,
          productData: mockProductData
        });

        setQuantityOffers(offersData || []);
        setProductData(mockProductData);
        
      } catch (error) {
        console.error('❌ Error loading quantity offers:', error);
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
          />
        ))}
      </div>
    );
  }

  // Get offers for different positions
  const beforeFormOffers = quantityOffers.filter(offer => offer.position === 'before_form');
  const insideFormOffers = quantityOffers.filter(offer => offer.position === 'inside_form');
  const afterFormOffers = quantityOffers.filter(offer => offer.position === 'after_form');

  const renderQuantityOffers = (offers: QuantityOffer[]) => {
    if (!offers.length || !productData) return null;

    return offers.map(offer => (
      <div key={offer.id} className="mb-4">
        <QuantityOffersDisplay
          offers={offer.offers}
          styling={offer.styling}
          productData={productData}
          currency={productData.currency}
        />
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      {/* Before form offers */}
      {beforeFormOffers.length > 0 && (
        <div className="quantity-offers-before">
          {renderQuantityOffers(beforeFormOffers)}
        </div>
      )}
      
      {/* Form fields with inside form offers */}
      {fields.map((field, index) => {
        // Show inside form offers before submit button
        if (field.type === 'submit' && insideFormOffers.length > 0) {
          return (
            <div key={`${field.id}-with-offers`}>
              <div className="quantity-offers-inside mb-4">
                {renderQuantityOffers(insideFormOffers)}
              </div>
              <FormField 
                key={field.id} 
                field={field} 
                formStyle={formStyle}
                formCountry={formCountry}
                formPhonePrefix={formPhonePrefix}
              />
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
          />
        );
      })}
      
      {/* After form offers */}
      {afterFormOffers.length > 0 && (
        <div className="quantity-offers-after">
          {renderQuantityOffers(afterFormOffers)}
        </div>
      )}
    </div>
  );
};

export default FormWithQuantityOffers;
