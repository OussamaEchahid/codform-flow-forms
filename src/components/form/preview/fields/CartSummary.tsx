
import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { supabase } from '@/integrations/supabase/client';

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

  const fieldStyle = field.style || {};
  const config = {
    autoCalculate: true, // Default to true if not set
    showDiscount: true,
    discountType: 'percentage',
    discountValue: 0,
    shippingType: 'auto',
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

  // وظيفة تحويل العملة
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // استخدام الخدمة الموحدة للعملات
    const { convertCurrency: unifiedConvert } = require('@/lib/services/CurrencyService');
    return unifiedConvert(amount, fromCurrency, toCurrency);
  };

  // Calculate prices using useMemo to prevent infinite loops
  const prices = useMemo(() => {
    console.log('🔍 Cart Summary Debug:', {
      productData,
      autoCalculate: config.autoCalculate,
      productId,
      formCurrency,
      formStyleCurrency: formStyle.currency,
      productCurrency: productData?.currency,
      variants: productData?.variants
    });
    
    if (productData && productData.variants && productData.variants.length > 0) {
      const originalPrice = parseFloat(productData.variants[0].price) || 0;
      // قراءة العملة من المنتج أو من المتجر أو من المتغير
      const productCurrency = productData.variants[0].currency_code || 
                             productData.currency || 
                             productData.shop?.currency || 
                             'USD';
      const targetCurrency = formCurrency || formStyle.currency || 'SAR';
      
      // تحويل السعر قبل الحسابات
      const convertedPrice = convertCurrency(originalPrice, productCurrency, targetCurrency);
      
      console.log('💰 Currency conversion applied:', {
        originalPrice,
        productCurrency,
        targetCurrency,
        convertedPrice
      });
      
      return calculatePrices(convertedPrice, productData, config, targetCurrency);
    }
    
    // Show placeholder prices instead of null to prevent white screen
    if (config.autoCalculate && loading) {
      console.log('⏳ Waiting for product data...');
      return { subtotal: null, discount: null, shipping: null, total: null };
    }
    
    // Show demo prices when not using auto calculation OR when auto calculation fails
    const demoPrice = 99.00;
    console.log('🎭 Using demo price:', demoPrice);
    return calculatePrices(demoPrice, null, config, formCurrency || formStyle.currency || 'SAR');
  }, [productData, config, formCurrency, formStyle.currency, loading]);

  // البحث عن المنتج المرتبط بالنموذج من قاعدة البيانات
  React.useEffect(() => {
    const fetchLinkedProduct = async () => {
      try {
        // الحصول على form ID من URL أو context
        const pathParts = window.location.pathname.split('/');
        const formId = pathParts[pathParts.length - 1];
        
        if (formId && formId !== 'form-builder') {
          const { data, error } = await supabase
            .from('shopify_product_settings')
            .select('product_id')
            .eq('form_id', formId)
            .single();
          
          if (data && !error) {
            console.log('✅ Cart Summary - Found linked product:', data.product_id);
            setLinkedProductId(data.product_id);
          }
        }
      } catch (error) {
        console.error('❌ Cart Summary - Error fetching linked product:', error);
      }
    };

    fetchLinkedProduct();
  }, []);

  // Load product data
  useEffect(() => {
    const finalProductId = linkedProductId || productId;
    if (config.autoCalculate && finalProductId && finalProductId !== 'auto-detect' && !loading && !productData) {
      setLoading(true);
      console.log('📦 Cart Summary - Starting to load product:', finalProductId);
      
      getProductById(finalProductId)
        .then(product => {
          console.log('✅ Cart Summary - Product loaded successfully:', product);
          if (product && product.variants && product.variants.length > 0) {
            setProductData(product);
          } else {
            console.warn('⚠️ Cart Summary - Product has no variants:', product);
          }
        })
        .catch(error => {
          console.error('❌ Cart Summary - Error loading product data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [linkedProductId, productId, config.autoCalculate]);

  // Load shipping rates from Shopify if auto shipping is enabled
  useEffect(() => {
    if (config.shippingType === 'auto' && productData && productData.shop) {
      // This would call Shopify shipping API - placeholder for now
      console.log('Loading shipping rates from Shopify...');
    }
  }, [config.shippingType, productData]);

  const formatPrice = (amount: number | null) => {
    if (amount === null) return '...';
    
    const currency = formCurrency || formStyle.currency || 'SAR';
    
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
