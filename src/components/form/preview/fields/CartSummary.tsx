
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
  };
  productId?: string;
  formCurrency?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ field, formStyle, productId, formCurrency }) => {
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
  
  // الحصول على إعدادات محفوظة من المحرر
  const config = field.cartSummaryConfig || {};
  
  // النصوص الافتراضية حسب المحتوى أو الاعدادات المحفوظة
  const getDefaultTexts = () => {
    // أولاً نتحقق من النصوص المحفوظة
    if (config.subtotalText || config.discountText || config.shippingText || config.totalText) {
      return {
        subtotalText: config.subtotalText || 'Subtotal',
        discountText: config.discountText || 'Discount', 
        shippingText: config.shippingText || 'Shipping',
        totalText: config.totalText || 'Total'
      };
    }
    
    // في حالة عدم وجود نصوص محفوظة، نحدد بناءً على محتوى النصوص الموجودة
    const allTexts = [
      config.subtotalText, config.discountText, 
      config.shippingText, config.totalText,
      field.label, field.placeholder
    ].filter(Boolean).join(' ');
    
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(allTexts);
    
    return hasArabic ? {
      subtotalText: 'المجموع الفرعي',
      discountText: 'الخصم',
      shippingText: 'الشحن', 
      totalText: 'الإجمالي'
    } : {
      subtotalText: 'Subtotal',
      discountText: 'Discount',
      shippingText: 'Shipping',
      totalText: 'Total'
    };
  };
  
  const defaultTexts = getDefaultTexts();
  
  const finalConfig = {
    autoCalculate: true,
    showDiscount: true,
    discountType: 'percentage',
    discountValue: 0,
    shippingType: 'manual', 
    shippingValue: 0,
    currency: 'SAR',
    subtotalText: config.subtotalText || defaultTexts.subtotalText,
    discountText: config.discountText || defaultTexts.discountText,
    shippingText: config.shippingText || defaultTexts.shippingText,
    totalText: config.totalText || defaultTexts.totalText,
    ...config
  };
  
  // تحديد اتجاه النص
  const getTextDirection = () => {
    if (finalConfig.direction && finalConfig.direction !== 'auto') {
      return finalConfig.direction;
    }
    
    // تحديد الاتجاه بناءً على النصوص المحفوظة
    const texts = [
      finalConfig.subtotalText,
      finalConfig.discountText,
      finalConfig.shippingText,
      finalConfig.totalText
    ].filter(Boolean).join(' ');
    
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(texts);
    return hasArabic ? 'rtl' : 'ltr';
  };
  
  const textDirection = getTextDirection();
  
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
      
      return calculatePrices(convertedPrice, productData, finalConfig, targetCurrency);
    }
    
    // Show placeholder prices instead of null to prevent white screen
    if (finalConfig.autoCalculate && loading) {
      console.log('⏳ Waiting for product data...');
      return { subtotal: null, discount: null, shipping: null, total: null };
    }
    
    // Show demo prices when not using auto calculation OR when auto calculation fails
    const demoPrice = 99.00;
    console.log('🎭 Using demo price:', demoPrice);
    return calculatePrices(demoPrice, null, finalConfig, formCurrency || formStyle.currency || 'SAR');
  }, [productData, finalConfig, formCurrency, formStyle.currency, loading]);

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
    console.log('🔄 Cart Summary - useEffect triggered:', {
      finalProductId,
      autoCalculate: config.autoCalculate,
      loading,
      hasProductData: !!productData,
      linkedProductId,
      productId
    });
    
    if (finalConfig.autoCalculate && finalProductId && finalProductId !== 'auto-detect' && !loading && !productData) {
      setLoading(true);
      console.log('📦 Cart Summary - Starting to load product:', finalProductId);
      
      getProductById(finalProductId)
        .then(product => {
          console.log('✅ Cart Summary - Product loaded successfully:', {
            product,
            hasVariants: product?.variants?.length,
            firstVariantPrice: product?.variants?.[0]?.price
          });
          
          if (product && product.variants && product.variants.length > 0) {
            console.log('💾 Cart Summary - Setting product data...');
            setProductData(product);
            console.log('✅ Cart Summary - Product data set successfully');
          } else {
            console.warn('⚠️ Cart Summary - Product has no variants:', product);
            // Set empty product data to avoid infinite loading
            setProductData({});
          }
        })
        .catch(error => {
          console.error('❌ Cart Summary - Error loading product data:', {
            error: error.message,
            productId: finalProductId,
            fullError: error
          });
          // Set empty product data to avoid infinite loading
          setProductData({});
        })
        .finally(() => {
          console.log('🔄 Cart Summary - Loading finished');
          setLoading(false);
        });
    } else {
      console.log('⏭️ Cart Summary - Skipping product load:', {
        autoCalculate: finalConfig.autoCalculate,
        finalProductId,
        loading,
        hasProductData: !!productData
      });
    }
  }, [linkedProductId, productId, finalConfig.autoCalculate]); // Remove loading and productData dependencies

  // Load shipping rates from Shopify if auto shipping is enabled
  useEffect(() => {
    if (finalConfig.shippingType === 'auto' && productData && productData.shop) {
      // This would call Shopify shipping API - placeholder for now
      console.log('Loading shipping rates from Shopify...');
    }
  }, [finalConfig.shippingType, productData]);

  const formatPrice = (amount: number | null) => {
    if (amount === null) return '...';
    
    const currency = formCurrency || formStyle.currency || finalConfig.currency || 'SAR';
    
    // استخدام CurrencyService للتنسيق مع الإعدادات المخصصة
    return CurrencyService.formatCurrency(amount, currency, 'ar');
  };
  
  return (
    <div className="cart-summary-field codform-cart-summary" style={{
      width: '100%',
      margin: '16px 0',
      direction: textDirection as 'ltr' | 'rtl',
      fontFamily: textDirection === 'rtl' ? 'Cairo, Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif'
    }}>
      <div
        style={{ 
          backgroundColor: fieldStyle.backgroundColor || '#f9fafb',
          border: `1px solid ${fieldStyle.borderColor || '#e5e7eb'}`,
          borderRadius: fieldStyle.borderRadius || '8px',
          padding: '16px',
          direction: textDirection as 'ltr' | 'rtl',
          fontFamily: fieldStyle.fontFamily || (textDirection === 'rtl' ? 'Cairo, Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif')
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ 
            color: fieldStyle.labelColor || '#374151',
            fontSize: fieldStyle.labelFontSize || '16px',
            fontWeight: fieldStyle.labelWeight || '500'
          }}>
            {finalConfig.subtotalText}
          </span>
          <span style={{
            color: fieldStyle.valueColor || '#111827',
            fontSize: fieldStyle.valueFontSize || '16px',
            fontWeight: '600',
            visibility: loading ? 'hidden' : 'visible'
          }} className="subtotal-value">
            {formatPrice(prices.subtotal)}
          </span>
        </div>
        
        {finalConfig.showDiscount && prices.discount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ 
              color: fieldStyle.labelColor || '#374151',
              fontSize: fieldStyle.labelFontSize || '16px',
              fontWeight: fieldStyle.labelWeight || '500'
            }}>
              {finalConfig.discountText}
            </span>
            <span style={{
              color: '#dc2626',
              fontSize: fieldStyle.valueFontSize || '16px',
              fontWeight: '600',
              visibility: loading ? 'hidden' : 'visible'
            }} className="discount-value">
              -{formatPrice(prices.discount)}
            </span>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: `1px solid ${fieldStyle.borderColor || '#e5e7eb'}`,
          paddingBottom: '8px'
        }}>
          <span style={{ 
            color: fieldStyle.labelColor || '#374151',
            fontSize: fieldStyle.labelFontSize || '16px',
            fontWeight: fieldStyle.labelWeight || '500'
          }}>
            {finalConfig.shippingText}
          </span>
          <span style={{
            color: fieldStyle.valueColor || '#111827',
            fontSize: fieldStyle.valueFontSize || '16px',
            fontWeight: '600',
            visibility: loading ? 'hidden' : 'visible'
          }} className="shipping-value">
            {prices.shipping === 0 ? (textDirection === 'rtl' ? 'مجاني' : 'Free') : formatPrice(prices.shipping)}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: fieldStyle.totalLabelColor || '#111827',
            fontSize: fieldStyle.totalLabelFontSize || '18px',
            fontWeight: '700'
          }}>
            {finalConfig.totalText}
          </span>
          <span style={{
            color: fieldStyle.totalValueColor || '#059669',
            fontSize: fieldStyle.totalValueFontSize || '18px',
            fontWeight: '700',
            visibility: loading ? 'hidden' : 'visible'
          }} className="total-value">
            {formatPrice(prices.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
