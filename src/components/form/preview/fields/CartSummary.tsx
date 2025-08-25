
import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
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
    formDirection?: string;
  };
  productId?: string;
  formCurrency?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ field, formStyle, productId, formCurrency }) => {
  const { getProductById } = useShopifyProducts();
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [linkedProductId, setLinkedProductId] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    if (isInitialized) return;
    const initializeService = async () => {
      try {
        await CurrencyService.initialize();
        setIsInitialized(true);
      } catch (error) {
        setIsInitialized(true);
      }
    };
    initializeService();
  }, [isInitialized]);

  const fieldStyle = field.style || {};
  const config = field.config || field.cartSummaryConfig || {};

  const [detectedLanguage] = useState(() => {
    const savedTexts = [config.subtotalText, config.discountText, config.shippingText, config.totalText].filter(Boolean).join(' ');
    if (savedTexts) {
      const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(savedTexts);
      return hasArabic ? 'ar' : 'en';
    }
    if (formStyle && 'formDirection' in formStyle) {
      return formStyle.formDirection === 'rtl' ? 'ar' : 'en';
    }
    const fieldTexts = [field.label, field.placeholder].filter(Boolean).join(' ');
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(fieldTexts);
    return hasArabic ? 'ar' : 'en';
  });

  const [defaultTexts] = useState(() => {
    const isArabic = detectedLanguage === 'ar';
    return {
      subtotalText: isArabic ? 'المجموع الفرعي' : 'Subtotal',
      discountText: isArabic ? 'الخصم' : 'Discount',
      shippingText: isArabic ? 'الشحن' : 'Shipping',
      totalText: isArabic ? 'الإجمالي' : 'Total'
    };
  });

  const finalTexts = {
    subtotalText: config.subtotalText || defaultTexts.subtotalText,
    discountText: config.discountText || defaultTexts.discountText,
    shippingText: config.shippingText || defaultTexts.shippingText,
    totalText: config.totalText || defaultTexts.totalText
  };

  const finalConfig = useMemo(() => ({
    autoCalculate: true,
    showDiscount: true,
    discountType: 'percentage',
    discountValue: 0,
    shippingType: 'manual',
    shippingValue: 0,
    currency: formCurrency || formStyle.currency || 'MAD',
    subtotalText: finalTexts.subtotalText,
    discountText: finalTexts.discountText,
    shippingText: finalTexts.shippingText,
    totalText: finalTexts.totalText,
    ...config
  }), [formCurrency, formStyle.currency, finalTexts, config]);

  const textDirection = detectedLanguage === 'ar' ? 'rtl' : 'ltr';

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    return CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  };

  const calculatePrices = (basePrice: number, configSettings: any) => {
    // استخدم عملة المنتج الفعلية، لا تفترض MAD
    const productCurrency = (productData?.variants?.[0]?.currency_code || productData?.currency || productData?.shop?.currency || 'USD') as string;
    const targetCurrency = formCurrency || formStyle.currency || 'MAD';
    // تحويل صحيح عبر USD من عملة المنتج إلى عملة النموذج
    const convertedBasePrice = convertCurrency(basePrice, productCurrency, targetCurrency);
    let subtotal = convertedBasePrice;
    let discount = 0;
    let shipping = 0;

    if (configSettings.showDiscount && configSettings.discountValue > 0) {
      if (configSettings.discountType === 'percentage') {
        discount = (subtotal * configSettings.discountValue) / 100;
      } else {
        // خصم ثابت معبر عنه بعملة المنتج — نحوله لعملة العرض
        discount = convertCurrency(configSettings.discountValue, productCurrency, targetCurrency);
      }
    }

    if (configSettings.shippingType === 'manual') {
      // الشحن مُدخل بعملة المنتج — نحوله لعملة العرض
      shipping = convertCurrency(configSettings.shippingValue || 0, productCurrency, targetCurrency);
    } else {
      shipping = 0;
    }

    const total = subtotal - discount + shipping;
    return { subtotal, discount, shipping, total: Math.max(0, total) };
  };

  const prices = useMemo(() => {
    if (productData && productData.variants && productData.variants.length > 0) {
      const rawPrice = productData.variants[0].price;
      const originalPrice = parseFloat(rawPrice) || 0;
      return calculatePrices(originalPrice, finalConfig);
    }
    if (finalConfig.autoCalculate && loading) {
      return { subtotal: null, discount: null, shipping: null, total: null };
    }
    const demoPrice = 10.00;
    return calculatePrices(demoPrice, finalConfig);
  }, [productData, finalConfig, formCurrency, formStyle.currency, loading]);

  React.useEffect(() => {
    const fetchLinkedProduct = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        const formId = pathParts[pathParts.length - 1];
        if (formId && formId !== 'form-builder') {
          const { data, error } = await supabase.from('shopify_product_settings').select('product_id').eq('form_id', formId).single();
          if (data && !error) {
            setLinkedProductId(data.product_id);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };
    fetchLinkedProduct();
  }, []);

  useEffect(() => {
    const finalProductId = linkedProductId || productId;
    if (finalConfig.autoCalculate && finalProductId && finalProductId !== 'auto-detect' && !loading && !productData) {
      setLoading(true);
      getProductById(finalProductId).then(product => {
        if (product && product.variants && product.variants.length > 0) {
          setProductData(product);
        } else {
          setProductData({});
        }
      }).catch(() => {
        setProductData({});
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [linkedProductId, productId, finalConfig.autoCalculate]);

  useEffect(() => {
    if (finalConfig.shippingType === 'auto' && productData && productData.shop) {
      // Placeholder for Shopify shipping API
    }
  }, [finalConfig.shippingType, productData]);

  const formatPrice = (amount: number | null) => {
    if (amount === null) return '...';
    const currency = formCurrency || formStyle.currency || finalConfig.currency || 'MAD';
    return CurrencyService.formatCurrency(amount, currency, 'ar');
  };

  return (
    <div className="cart-summary-field codform-cart-summary" style={{
      width: '100%', margin: '16px 0', direction: textDirection as 'ltr' | 'rtl',
      fontFamily: textDirection === 'rtl' ? 'Cairo, Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: fieldStyle.backgroundColor || '#f9fafb',
        border: `1px solid ${fieldStyle.borderColor || '#e5e7eb'}`,
        borderRadius: fieldStyle.borderRadius || '8px', padding: '16px',
        direction: textDirection as 'ltr' | 'rtl',
        fontFamily: fieldStyle.fontFamily || (textDirection === 'rtl' ? 'Cairo, Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif')
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: fieldStyle.labelColor || '#374151', fontSize: fieldStyle.labelFontSize || '16px', fontWeight: fieldStyle.labelWeight || '500' }}>
            {finalConfig.subtotalText}
          </span>
          <span style={{ color: fieldStyle.valueColor || '#111827', fontSize: fieldStyle.valueFontSize || '16px', fontWeight: '600', visibility: loading ? 'hidden' : 'visible' }} className="subtotal-value">
            {formatPrice(prices.subtotal)}
          </span>
        </div>
        {finalConfig.showDiscount && prices.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: fieldStyle.labelColor || '#374151', fontSize: fieldStyle.labelFontSize || '16px', fontWeight: fieldStyle.labelWeight || '500' }}>
              {finalConfig.discountText}
            </span>
            <span style={{ color: '#dc2626', fontSize: fieldStyle.valueFontSize || '16px', fontWeight: '600', visibility: loading ? 'hidden' : 'visible' }} className="discount-value">
              -{formatPrice(prices.discount)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${fieldStyle.borderColor || '#e5e7eb'}`, paddingBottom: '8px' }}>
          <span style={{ color: fieldStyle.labelColor || '#374151', fontSize: fieldStyle.labelFontSize || '16px', fontWeight: fieldStyle.labelWeight || '500' }}>
            {finalConfig.shippingText}
          </span>
          <span style={{ color: fieldStyle.valueColor || '#111827', fontSize: fieldStyle.valueFontSize || '16px', fontWeight: '600', visibility: loading ? 'hidden' : 'visible' }} className="shipping-value">
            {prices.shipping === 0 ? (textDirection === 'rtl' ? 'مجاني' : 'Free') : formatPrice(prices.shipping)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: fieldStyle.totalLabelColor || '#111827', fontSize: fieldStyle.totalLabelFontSize || '18px', fontWeight: '700' }}>
            {finalConfig.totalText}
          </span>
          <span style={{ color: fieldStyle.totalValueColor || '#059669', fontSize: fieldStyle.totalValueFontSize || '18px', fontWeight: '700', visibility: loading ? 'hidden' : 'visible' }} className="total-value">
            {formatPrice(prices.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
