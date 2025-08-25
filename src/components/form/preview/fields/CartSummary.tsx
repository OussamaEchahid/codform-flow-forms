
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

  // تهيئة CurrencyService عند تحميل المكون - مرة واحدة فقط
  React.useEffect(() => {
    if (isInitialized) return;

    const initializeService = async () => {
      try {
        await CurrencyService.initialize();
        setIsInitialized(true);
        console.log('✅ CartSummary: CurrencyService initialized');
      } catch (error) {
        console.error('❌ CartSummary: Error initializing CurrencyService:', error);
        setIsInitialized(true); // تجنب إعادة المحاولة اللانهائية
      }
    };
    initializeService();
  }, [isInitialized]);

  const fieldStyle = field.style || {};
  
  // الحصول على إعدادات محفوظة من المحرر - أولوية لـ config ثم cartSummaryConfig
  const config = field.config || field.cartSummaryConfig || {};
  
  // تحديد اللغة مرة واحدة فقط بناءً على النصوص المحفوظة أو اتجاه النموذج
  const [detectedLanguage] = useState(() => {
    // أولاً: فحص النصوص المحفوظة
    const savedTexts = [
      config.subtotalText, config.discountText,
      config.shippingText, config.totalText
    ].filter(Boolean).join(' ');

    if (savedTexts) {
      const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(savedTexts);
      return hasArabic ? 'ar' : 'en';
    }

    // ثانياً: فحص اتجاه النموذج
    if (formStyle && 'formDirection' in formStyle) {
      return formStyle.formDirection === 'rtl' ? 'ar' : 'en';
    }

    // ثالثاً: فحص محتوى الحقل
    const fieldTexts = [field.label, field.placeholder].filter(Boolean).join(' ');
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(fieldTexts);
    return hasArabic ? 'ar' : 'en';
  });

  // النصوص الافتراضية حسب اللغة المكتشفة - مرة واحدة فقط
  const [defaultTexts] = useState(() => {
    const isArabic = detectedLanguage === 'ar';
    return {
      subtotalText: isArabic ? 'المجموع الفرعي' : 'Subtotal',
      discountText: isArabic ? 'الخصم' : 'Discount',
      shippingText: isArabic ? 'الشحن' : 'Shipping',
      totalText: isArabic ? 'الإجمالي' : 'Total'
    };
  });

  // النصوص النهائية - تعطي أولوية للنصوص المحفوظة
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
    currency: formCurrency || formStyle.currency || 'MAD', // استخدام عملة النموذج الصحيحة
    subtotalText: finalTexts.subtotalText,
    discountText: finalTexts.discountText,
    shippingText: finalTexts.shippingText,
    totalText: finalTexts.totalText,
    ...config
  }), [formCurrency, formStyle.currency, finalTexts, config]);
  
  // تحديد اتجاه النص بناءً على اللغة المكتشفة - ثابت ولا يتغير
  const textDirection = detectedLanguage === 'ar' ? 'rtl' : 'ltr';

  // وظيفة تحويل العملة
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;



    console.log('🔄 CartSummary convertCurrency called:', {
      amount,
      fromCurrency,
      toCurrency,
      CurrencyServiceExists: !!CurrencyService
    });

    // ✅ DEBUG: فحص localStorage مباشرة
    try {
      const savedRates = localStorage.getItem('codform_custom_currency_rates');
      console.log('🔍 localStorage custom rates:', savedRates);

      if (savedRates) {
        const rates = JSON.parse(savedRates);
        console.log('� Parsed custom rates:', rates);
      }
    } catch (error) {
      console.error('❌ Error reading localStorage:', error);
    }

    // ✅ DEBUG: فحص معدلات CurrencyService
    console.log('🔍 CurrencyService rates check:', {
      madRate: CurrencyService.getExchangeRate('MAD'),
      gbpRate: CurrencyService.getExchangeRate('GBP'),
      customRatesCount: 'checking...'
    });

    // استخدام الخدمة الموحدة للعملات
    const result = CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);

    console.log('💰 CartSummary conversion result:', {
      input: `${amount} ${fromCurrency}`,
      output: `${result} ${toCurrency}`,
      service: 'CurrencyService (unified)'
    });

    return result;
  };

  // Helper function to calculate prices
  const calculatePrices = (basePrice: number, configSettings: any) => {
    // ✅ CRITICAL FIX: تطبيق تحويل العملة على السعر الأساسي أولاً
    const baseCurrency = 'MAD'; // العملة الأساسية للأسعار
    const targetCurrency = formCurrency || formStyle.currency || 'MAD';

    // تحويل السعر الأساسي إلى العملة المطلوبة
    const convertedBasePrice = convertCurrency(basePrice, baseCurrency, targetCurrency);

    let subtotal = convertedBasePrice;
    let discount = 0;
    let shipping = 0;

    // Calculate discount
    if (configSettings.showDiscount && configSettings.discountValue > 0) {
      if (configSettings.discountType === 'percentage') {
        discount = (subtotal * configSettings.discountValue) / 100;
      } else {
        // تحويل قيمة الخصم الثابتة أيضاً
        discount = convertCurrency(configSettings.discountValue, baseCurrency, targetCurrency);
      }
    }

    // Calculate shipping
    if (configSettings.shippingType === 'manual') {
      // تحويل قيمة الشحن أيضاً
      shipping = convertCurrency(configSettings.shippingValue || 0, baseCurrency, targetCurrency);
    } else {
      shipping = 0; // Free shipping
    }

    const total = subtotal - discount + shipping;

    console.log('💰 Price calculation with currency conversion:', {
      originalBasePrice: basePrice,
      baseCurrency,
      targetCurrency,
      convertedBasePrice,
      subtotal,
      discount,
      shipping,
      total
    });

    return {
      subtotal,
      discount,
      shipping,
      total: Math.max(0, total) // Ensure total is not negative
    };
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
      const rawPrice = productData.variants[0].price;
      const originalPrice = parseFloat(rawPrice) || 0;

      // 🚨 CRITICAL DEBUG: تسجيل السعر الخام لفهم المشكلة
      console.log('🚨 PRICE DEBUG - Raw data from Shopify:', {
        rawPrice,
        originalPrice,
        priceType: typeof rawPrice,
        fullVariant: productData.variants[0],
        allVariants: productData.variants
      });

      // قراءة العملة من المنتج أو من المتجر أو من المتغير
      const productCurrency = productData.variants[0].currency_code ||
                             productData.currency ||
                             productData.shop?.currency ||
                             'USD';
      const targetCurrency = formCurrency || formStyle.currency || 'MAD';

      // تحويل السعر قبل الحسابات
      const convertedPrice = convertCurrency(originalPrice, productCurrency, targetCurrency);

      console.log('💰 Currency conversion applied:', {
        originalPrice,
        productCurrency,
        targetCurrency,
        convertedPrice
      });
      
      return calculatePrices(convertedPrice, finalConfig);
    }
    
    // Show placeholder prices instead of null to prevent white screen
    if (finalConfig.autoCalculate && loading) {
      console.log('⏳ Waiting for product data...');
      return { subtotal: null, discount: null, shipping: null, total: null };
    }
    
    // Show demo prices when not using auto calculation OR when auto calculation fails
    const demoPrice = 10.00; // ✅ السعر الحقيقي للمنتج: 10 درهم مغربي
    console.log('🎭 Using demo price:', demoPrice);
    return calculatePrices(demoPrice, finalConfig);
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
    
    const currency = formCurrency || formStyle.currency || finalConfig.currency || 'MAD';
    
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
