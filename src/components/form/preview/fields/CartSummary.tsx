
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
    autoCalculate: true, // Default to true if not set
    showDiscount: true,
    discountType: 'percentage',
    discountValue: 0,
    shippingType: 'manual',
    shippingValue: 0,
    direction: 'auto', // Default direction
    ...field.cartSummaryConfig
  };
  
  // تحديد اتجاه النص
  const getTextDirection = () => {
    if (config.direction && config.direction !== 'auto') {
      return config.direction;
    }
    
    // تحديد الاتجاه التلقائي بناءً على النصوص
    const texts = [
      config.subtotalText,
      config.discountText,
      config.shippingText,
      config.totalText
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
    console.log('🔄 Cart Summary - useEffect triggered:', {
      finalProductId,
      autoCalculate: config.autoCalculate,
      loading,
      hasProductData: !!productData,
      linkedProductId,
      productId
    });
    
    if (config.autoCalculate && finalProductId && finalProductId !== 'auto-detect' && !loading && !productData) {
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
          console.error('❌ Cart Summary - Error loading product data:', error);
          // Set empty product data to avoid infinite loading
          setProductData({});
        })
        .finally(() => {
          console.log('🔄 Cart Summary - Loading finished');
          setLoading(false);
        });
    } else {
      console.log('⏭️ Cart Summary - Skipping product load:', {
        autoCalculate: config.autoCalculate,
        finalProductId,
        loading,
        hasProductData: !!productData
      });
    }
  }, [linkedProductId, productId, config.autoCalculate]); // Remove loading and productData dependencies

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
    
    // استخدام CurrencyService للتنسيق مع الإعدادات المخصصة
    return CurrencyService.formatCurrency(amount, currency, language);
  };
  
  return (
    <div className="mb-0 codform-cart-summary">
      <div
        className="border rounded-md p-4"
        style={{ 
          borderRadius,
          backgroundColor: fieldStyle.backgroundColor || '#ffffff',
          borderColor: fieldStyle.borderColor || '#e5e7eb',
          direction: textDirection as 'ltr' | 'rtl',
          fontFamily: fieldStyle.fontFamily || 'Cairo',
        }}
      >
        <div className="flex justify-between mb-3" data-product-price-display="subtotal">
          <span style={{ 
            fontSize: fieldStyle.labelsFontSize || fieldStyle.labelFontSize || '14px',
            color: fieldStyle.labelsColor || fieldStyle.labelColor || '#374151',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.labelWeight || '500'
          }}>
            {config.subtotalText || (language === 'ar' ? 'المجموع الفرعي' : 'Subtotal')}
          </span>
          <span style={{
            fontSize: fieldStyle.labelsFontSize || fieldStyle.valueFontSize || '14px',
            color: fieldStyle.labelsColor || fieldStyle.valueColor || '#374151',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.valueWeight || '400'
          }} className="product-price">
            {formatPrice(prices.subtotal)}
          </span>
        </div>
        
        {config.showDiscount && prices.discount > 0 && (
          <div className="flex justify-between mb-3">
            <span style={{ 
              fontSize: fieldStyle.labelsFontSize || fieldStyle.labelFontSize || '14px',
              color: fieldStyle.labelsColor || fieldStyle.labelColor || '#374151',
              fontFamily: fieldStyle.fontFamily || 'Cairo',
              fontWeight: fieldStyle.labelWeight || '500'
            }}>
              {config.discountText || (language === 'ar' ? 'الخصم' : 'Discount')}
            </span>
            <span style={{
              fontSize: fieldStyle.labelsFontSize || fieldStyle.valueFontSize || '14px',
              color: '#ef4444', // Red color for discount
              fontFamily: fieldStyle.fontFamily || 'Cairo',
              fontWeight: fieldStyle.valueWeight || '400'
            }} className="discount-price">
              -{formatPrice(prices.discount)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between mb-3">
          <span style={{ 
            fontSize: fieldStyle.labelsFontSize || fieldStyle.labelFontSize || '14px',
            color: fieldStyle.labelsColor || fieldStyle.labelColor || '#374151',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.labelWeight || '500'
          }}>
            {config.shippingText || (language === 'ar' ? 'الشحن' : 'Shipping')}
          </span>
          <span style={{
            fontSize: fieldStyle.labelsFontSize || fieldStyle.valueFontSize || '14px',
            color: fieldStyle.labelsColor || fieldStyle.valueColor || '#374151',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.valueWeight || '400'
          }} className="shipping-price">
            {prices.shipping === 0 ? (language === 'ar' ? 'مجاني' : 'Free') : formatPrice(prices.shipping)}
          </span>
        </div>
        
        <div className="border-t pt-3 mt-3 flex justify-between">
          <span style={{
            fontSize: fieldStyle.labelsFontSize || fieldStyle.totalLabelFontSize || '14px',
            color: fieldStyle.labelsColor || fieldStyle.totalLabelColor || '#374151',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.totalLabelWeight || '600'
          }}>
            {config.totalText || (language === 'ar' ? 'الإجمالي' : 'Total')}
          </span>
          <span style={{
            fontSize: fieldStyle.labelsFontSize || fieldStyle.totalValueFontSize || '14px',
            color: fieldStyle.totalColor || fieldStyle.totalValueColor || '#16a34a',
            fontFamily: fieldStyle.fontFamily || 'Cairo',
            fontWeight: fieldStyle.totalValueWeight || '600'
          }} className="total-price">
            {formatPrice(prices.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
