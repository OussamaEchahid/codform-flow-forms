
import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';

interface CartSummaryProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    currency?: string;
  };
  productId?: string;
  formCurrency?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ field, formStyle, productId, formCurrency }) => {
  const { language } = useI18n();
  const { getProductById } = useShopifyProducts();
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fieldStyle = field.style || {};
  const config = field.cartSummaryConfig || {};
  
  // استخدام نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  // Check if we should show the title (default to true if not explicitly set to false)
  const showTitle = field.label !== '' && field.label !== undefined;

  // Helper function to calculate prices
  const calculatePrices = (basePrice: number, productInfo: any, configSettings: any, currency: string) => {
    let subtotal = basePrice;
    let discount = 0;
    let shipping = 0;

    // Calculate discount
    if (configSettings.showDiscount && configSettings.discountValue > 0) {
      if (configSettings.discountType === 'percentage') {
        discount = (subtotal * configSettings.discountValue) / 100;
      } else {
        discount = configSettings.discountValue;
      }
    }

    // Calculate shipping
    if (configSettings.shippingType === 'manual') {
      shipping = configSettings.shippingValue || 0;
    } else if (configSettings.shippingType === 'auto') {
      // Auto shipping from Shopify - would need API integration
      shipping = 10.00; // Placeholder - should integrate with Shopify shipping API
    } else {
      shipping = 0; // Free shipping
    }

    const total = subtotal - discount + shipping;

    return {
      subtotal,
      discount,
      shipping,
      total: Math.max(0, total) // Ensure total is not negative
    };
  };

  // Calculate prices using useMemo to prevent infinite loops
  const prices = useMemo(() => {
    if (!productData && !config.autoCalculate) {
      // Demo prices when not using auto calculation
      const demoPrice = 99.00;
      return calculatePrices(demoPrice, null, config, formCurrency || formStyle.currency || 'SAR');
    }
    
    if (productData && productData.variants && productData.variants.length > 0) {
      const basePrice = parseFloat(productData.variants[0].price) || 0;
      return calculatePrices(basePrice, productData, config, formCurrency || formStyle.currency || productData.currency || 'SAR');
    }
    
    return { subtotal: 0, discount: 0, shipping: 0, total: 0 };
  }, [productData, config, formCurrency, formStyle.currency]);

  // Load product data
  useEffect(() => {
    if (config.autoCalculate && productId && productId !== 'auto-detect' && !loading) {
      setLoading(true);
      getProductById(productId)
        .then(product => {
          if (product && product.variants && product.variants.length > 0) {
            setProductData(product);
          }
        })
        .catch(error => {
          console.error('Error loading product data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productId, config.autoCalculate, getProductById]);

  // Load shipping rates from Shopify if auto shipping is enabled
  useEffect(() => {
    if (config.shippingType === 'auto' && productData && productData.shop) {
      // This would call Shopify shipping API - placeholder for now
      console.log('Loading shipping rates from Shopify...');
    }
  }, [config.shippingType, productData]);

  const formatPrice = (amount: number) => {
    const currency = formCurrency || formStyle.currency || productData?.currency || 'SAR';
    try {
      return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };
  
  return (
    <div className="mb-6 codform-cart-summary">
      {showTitle && (
        <h3 className="text-lg font-medium mb-3" style={{
          color: fieldStyle.color || '#1f2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.2rem',
          fontFamily: fieldStyle.fontFamily || 'Tajawal',
        }}>
          {field.label || (language === 'ar' ? 'ملخص الطلب' : 'Order Summary')}
        </h3>
      )}
      <div 
        className="border rounded-md p-4"
        style={{ 
          borderRadius,
          backgroundColor: fieldStyle.backgroundColor || '#f9fafb',
          borderColor: fieldStyle.borderColor || '#e5e7eb',
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <div className="flex justify-between mb-3" data-product-price-display="subtotal">
          <span style={{ 
            fontSize: fieldStyle.labelFontSize || '1rem',
            color: fieldStyle.labelColor || '#6b7280',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.labelWeight || '400'
          }}>
            {config.subtotalText || (language === 'ar' ? 'المجموع الفرعي' : 'Subtotal')}
          </span>
          <span style={{
            fontSize: fieldStyle.valueFontSize || '1rem',
            color: fieldStyle.valueColor || '#1f2937',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.valueWeight || '500'
          }} className="product-price">
            {formatPrice(prices.subtotal)}
          </span>
        </div>
        
        {config.showDiscount && prices.discount > 0 && (
          <div className="flex justify-between mb-3">
            <span style={{ 
              fontSize: fieldStyle.labelFontSize || '1rem',
              color: fieldStyle.labelColor || '#6b7280',
              fontFamily: fieldStyle.fontFamily || 'Tajawal',
              fontWeight: fieldStyle.labelWeight || '400'
            }}>
              {config.discountText || (language === 'ar' ? 'الخصم' : 'Discount')}
            </span>
            <span style={{
              fontSize: fieldStyle.valueFontSize || '1rem',
              color: '#ef4444', // Red color for discount
              fontFamily: fieldStyle.fontFamily || 'Tajawal',
              fontWeight: fieldStyle.valueWeight || '500'
            }} className="discount-price">
              -{formatPrice(prices.discount)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between mb-3">
          <span style={{ 
            fontSize: fieldStyle.labelFontSize || '1rem',
            color: fieldStyle.labelColor || '#6b7280',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.labelWeight || '400'
          }}>
            {config.shippingText || (language === 'ar' ? 'الشحن' : 'Shipping')}
          </span>
          <span style={{
            fontSize: fieldStyle.valueFontSize || '1rem',
            color: fieldStyle.valueColor || '#1f2937',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.valueWeight || '500'
          }} className="shipping-price">
            {prices.shipping === 0 ? (language === 'ar' ? 'مجاني' : 'Free') : formatPrice(prices.shipping)}
          </span>
        </div>
        
        <div className="border-t pt-3 mt-3 flex justify-between">
          <span style={{
            fontSize: fieldStyle.totalLabelFontSize || '1.1rem',
            color: fieldStyle.totalLabelColor || '#1f2937',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.totalLabelWeight || 'bold'
          }}>
            {config.totalText || (language === 'ar' ? 'الإجمالي' : 'Total')}
          </span>
          <span style={{
            fontSize: fieldStyle.totalValueFontSize || '1.1rem',
            color: fieldStyle.totalValueColor || formStyle.primaryColor || '#9b87f5',
            fontFamily: fieldStyle.fontFamily || 'Tajawal',
            fontWeight: fieldStyle.totalValueWeight || 'bold'
          }} className="total-price">
            {formatPrice(prices.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
