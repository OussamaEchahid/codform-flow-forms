
import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { supabase } from '@/integrations/supabase/client';
import { CurrencyService } from '@/lib/services/CurrencyService';

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
  const [linkedProductId, setLinkedProductId] = React.useState<string | null>(null);
  
  // تهيئة CurrencyService عند تحميل المكون
  React.useEffect(() => {
    const initializeService = async () => {
      try {
        await CurrencyService.initialize();
        // إعادة حساب الأسعار بعد تحميل الإعدادات المخصصة
        setProductData(prev => prev ? { ...prev } : null);
      } catch (error) {
        console.error('Error initializing CurrencyService:', error);
      }
    };
    initializeService();
  }, []);

  const fieldStyle = field.style || {};
  const config = {
    showDiscount: true,
    discountType: 'percentage',
    discountValue: 0,
    shippingType: 'manual',
    shippingValue: 0,
    ...field.cartSummaryConfig
  };
  
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

  // وظيفة تحويل العملة
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // استخدام الخدمة الموحدة للعملات
    return CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  };

  // Calculate prices using manual values only
  const prices = useMemo(() => {
    // Always use demo prices for manual configuration
    const demoPrice = 99.00;
    return calculatePrices(demoPrice, null, config, formCurrency || formStyle.currency || 'SAR');
  }, [config, formCurrency, formStyle.currency]);


  const formatPrice = (amount: number | null) => {
    if (amount === null) return '...';
    
    const currency = formCurrency || formStyle.currency || 'SAR';
    
    // استخدام CurrencyService للتنسيق مع الإعدادات المخصصة
    return CurrencyService.formatCurrency(amount, currency, language);
  };
  
  return (
    <div className="mb-6 codform-cart-summary">
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
