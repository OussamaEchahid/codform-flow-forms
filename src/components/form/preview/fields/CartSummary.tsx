
import React, { useEffect, useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';

interface CartSummaryProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  productId?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ field, formStyle, productId }) => {
  const { language } = useI18n();
  const { getProductById } = useShopifyProducts();
  const [productData, setProductData] = useState<any>(null);
  const [prices, setPrices] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0
  });

  const fieldStyle = field.style || {};
  const config = field.cartSummaryConfig || {};
  
  // استخدام نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  // Check if we should show the title (default to true if not explicitly set to false)
  const showTitle = field.label !== '' && field.label !== undefined;

  // Load product data and calculate prices
  useEffect(() => {
    const loadProductData = async () => {
      if (config.autoCalculate && productId && productId !== 'auto-detect') {
        try {
          const product = await getProductById(productId);
          if (product && product.variants && product.variants.length > 0) {
            setProductData(product);
            const basePrice = parseFloat(product.variants[0].price) || 0;
            calculatePrices(basePrice);
          }
        } catch (error) {
          console.error('Error loading product data:', error);
          // Fallback to demo prices
          calculatePrices(99.00);
        }
      } else {
        // Use demo prices
        calculatePrices(99.00);
      }
    };

    loadProductData();
  }, [productId, config.autoCalculate, getProductById]);

  const calculatePrices = (basePrice: number) => {
    let subtotal = basePrice;
    let discount = 0;
    let shipping = 0;

    // Calculate discount
    if (config.showDiscount && config.discountValue > 0) {
      if (config.discountType === 'percentage') {
        discount = (subtotal * config.discountValue) / 100;
      } else {
        discount = config.discountValue;
      }
    }

    // Calculate shipping
    if (config.shippingType === 'manual') {
      shipping = config.shippingValue || 0;
    } else {
      // Auto shipping - you can integrate with Shopify shipping rates here
      shipping = 10.00; // Default shipping for demo
    }

    const total = subtotal - discount + shipping;

    setPrices({
      subtotal,
      discount,
      shipping,
      total: Math.max(0, total) // Ensure total is not negative
    });
  };

  const formatPrice = (amount: number) => {
    const currency = productData?.currency || 'SAR';
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
