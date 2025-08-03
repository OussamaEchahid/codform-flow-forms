import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { supabase } from '@/integrations/supabase/client';

interface CartItemsProps {
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

const CartItems: React.FC<CartItemsProps> = ({ field, formStyle, productId, formCurrency }) => {
  const { language } = useI18n();
  const { getProductById } = useShopifyProducts();
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fieldStyle = field.style || {};
  const [linkedProductId, setLinkedProductId] = React.useState<string | null>(null);

  // وظيفة تحويل العملة
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // أسعار صرف شاملة لجميع العملات المدعومة
    const exchangeRates: { [key: string]: number } = {
      'USD': 1.0,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.43,
      'AUD': 1.57,
      'SAR': 3.75,
      'AED': 3.67,
      'EGP': 30.85,
      'QAR': 3.64,
      'KWD': 0.31,
      'BHD': 0.38,
      'OMR': 0.38,
      'JOD': 0.71,
      'LBP': 89500,
      'MAD': 9.85,
      'TND': 3.15,
      'DZD': 134.25,
      'MXN': 20.15,
      'BRL': 6.05,
      'ARS': 350.50,
      'CLP': 950.75,
      'COP': 4250.30,
      'PEN': 3.75,
      'VES': 36.50,
      'UYU': 39.85,
      'IQD': 1470.25,
      'IRR': 42000.00,
      'TRY': 29.75,
      'ILS': 3.70,
      'SYP': 12500.00,
      'YER': 250.75,
      'NGN': 850.25,
      'ZAR': 18.95,
      'KES': 155.30,
      'GHS': 15.85,
      'ETB': 120.50,
      'TZS': 2500.75,
      'UGX': 3750.25,
      'ZWL': 350.00,
      'ZMW': 26.85,
      'RWF': 1350.50
    };
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  };

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
            console.log('Found linked product:', data.product_id);
            setLinkedProductId(data.product_id);
          }
        }
      } catch (error) {
        console.error('Error fetching linked product:', error);
      }
    };

    fetchLinkedProduct();
  }, []);

  // تحميل بيانات المنتج من Shopify
  useEffect(() => {
    const finalProductId = linkedProductId || productId;
    if (finalProductId && finalProductId !== 'auto-detect' && !loading && !productData) {
      setLoading(true);
      console.log('📦 Starting to load product for cart items:', finalProductId);
      
      getProductById(finalProductId)
        .then(product => {
          console.log('✅ Product loaded successfully for cart items:', product);
          if (product && product.variants && product.variants.length > 0) {
            setProductData(product);
          } else {
            console.warn('⚠️ Product has no variants:', product);
          }
        })
        .catch(error => {
          console.error('❌ Error loading product data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [linkedProductId, productId]);

  // حساب السعر المحول
  const convertedPrice = useMemo(() => {
    if (productData && productData.variants && productData.variants.length > 0) {
      const originalPrice = parseFloat(productData.variants[0].price) || 0;
      // قراءة العملة من المنتج أو من المتغير
      const productCurrency = productData.variants[0].currency_code || 
                             productData.currency || 
                             productData.shop?.currency || 
                             'USD';
      const targetCurrency = formCurrency || formStyle.currency || 'SAR';
      
      console.log('💰 Cart Items Currency conversion:', {
        originalPrice,
        productCurrency,
        targetCurrency
      });
      
      // تحويل السعر إلى العملة المطلوبة
      const convertedPrice = convertCurrency(originalPrice, productCurrency, targetCurrency);
      
      return {
        price: convertedPrice,
        currency: targetCurrency
      };
    }
    
    return {
      price: 29.99,
      currency: formCurrency || formStyle.currency || 'SAR'
    };
  }, [productData, formCurrency, formStyle.currency]);

  const formatPrice = (amount: number) => {
    const currency = convertedPrice.currency;
    
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
  
  // استخدم نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-2 codform-cart-items w-full max-w-sm mx-auto" style={{ direction: fieldStyle.direction || (language === 'ar' ? 'rtl' : 'ltr') }}>
      <div 
        className={`${fieldStyle.showBorders !== false ? 'border' : ''} rounded-lg overflow-hidden bg-white shadow-sm`} 
        style={{ 
          borderRadius: `${fieldStyle.borderRadius || '12'}px`,
          borderColor: fieldStyle.borderColor || '#e5e7eb',
          borderWidth: `${fieldStyle.borderWidth || '1'}px`,
        }}
      >
        {/* عنصر العربة النموذجي للمعاينة */}
        <div className={`flex items-center p-3 space-x-3 codform-cart-item ${fieldStyle.direction === 'rtl' || language === 'ar' ? 'space-x-reverse' : ''}`} data-product-item>
          {/* صورة المنتج */}
          {fieldStyle.hideImage !== true && (
            <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden">
              {productData?.image ? (
                <img 
                  src={productData.image} 
                  alt={productData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-blue-200">
                  <ShoppingCart 
                    size={16} 
                    className="text-blue-600" 
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* معلومات المنتج */}
          <div className="flex-1 space-y-1">
            {/* عنوان المنتج */}
            {fieldStyle.hideTitle !== true && (
              <h4 className="font-semibold product-title leading-tight" style={{
                fontSize: fieldStyle.fontSize || '0.95rem',
                color: fieldStyle.color || '#1f2937',
                fontFamily: fieldStyle.fontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.fontWeight || '600',
              }}>
                {productData?.title || (language === 'ar' ? 'عنوان المنتج' : 'Product Title')}
              </h4>
            )}
            
            {/* معلومات المتغير - عرض فقط إذا كان هناك متغيرات حقيقية */}
            {productData?.variants && productData.variants.length > 0 && 
             productData.variants[0]?.title !== 'Default Title' && 
             productData.variants[0]?.title && (
              <div className="product-variant" style={{
                fontSize: fieldStyle.descriptionFontSize || '0.875rem',
                color: fieldStyle.descriptionColor || '#6b7280',
                fontFamily: fieldStyle.descriptionFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.descriptionFontWeight || '400',
              }}>
                {productData.variants[0].title}
              </div>
            )}
            
            {/* محدد الكمية */}
            {fieldStyle.hideQuantitySelector !== true && (
              <div className={`flex items-center space-x-2 mt-2 ${fieldStyle.direction === 'rtl' || language === 'ar' ? 'space-x-reverse' : ''}`}>
                <span className="text-xs font-medium text-gray-600" style={{
                  fontFamily: fieldStyle.quantityFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                }}>
                  {language === 'ar' ? 'الكمية:' : 'Qty:'}
                </span>
                <div className={`flex items-center space-x-1 ${fieldStyle.direction === 'rtl' || language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <button 
                    className="flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '4'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
                      fontSize: '11px',
                    }}
                  >
                    −
                  </button>
                  <span 
                    className="w-6 text-center font-semibold text-xs" 
                    style={{
                      fontFamily: fieldStyle.quantityFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                      color: fieldStyle.quantityColor || '#1f2937',
                      fontWeight: fieldStyle.productFontWeight || '600',
                    }}
                  >
                    1
                  </span>
                  <button 
                    className="flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '4'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
                      fontSize: '11px',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* سعر المنتج */}
          {fieldStyle.hidePrice !== true && (
            <div className={`${fieldStyle.direction === 'rtl' || language === 'ar' ? 'text-left' : 'text-right'} flex-shrink-0`}>
              <div className="font-bold product-price" style={{
                fontSize: fieldStyle.priceFontSize || '0.9rem',
                color: fieldStyle.priceColor || '#059669',
                fontFamily: fieldStyle.priceFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.priceFontWeight || '700',
              }}>
                {formatPrice(convertedPrice.price)}
              </div>
              {!fieldStyle.hideDiscountPrice && fieldStyle.discountPrice && (
                <div className="text-xs text-gray-500 line-through" style={{
                  fontFamily: fieldStyle.priceFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                }}>
                  {fieldStyle.discountPrice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;