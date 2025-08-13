import React, { useEffect, useState, useMemo } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { supabase } from '@/integrations/supabase/client';
import { CurrencyService } from '@/lib/services/CurrencyService';

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
  
  // تهيئة CurrencyService عند تحميل المكون
  React.useEffect(() => {
    CurrencyService.initialize();
  }, []);

  // وظيفة تحويل العملة باستخدام الخدمة الموحدة
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // استخدام الخدمة الموحدة للعملات
    return CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  };

  // البحث عن معرف المنتج من الصفحة الحالية
  React.useEffect(() => {
    const getCurrentProductId = () => {
      try {
        // أولاً: محاولة الحصول على معرف المنتج من productId المرسل
        if (productId && productId !== 'auto-detect') {
          console.log('🆔 Using provided product ID:', productId);
          setLinkedProductId(productId);
          return;
        }

        // ثانياً: محاولة الحصول على معرف المنتج من البيانات الموجودة في الصفحة
        const productDataFromPage = (window as any).product || (window as any).meta?.product;
        if (productDataFromPage?.id) {
          console.log('🆔 Found product ID from page data:', productDataFromPage.id);
          setLinkedProductId(productDataFromPage.id.toString());
          return;
        }

        // ثالثاً: محاولة استخراج معرف المنتج من URL
        const urlPath = window.location.pathname;
        const productMatch = urlPath.match(/\/products\/([^\/\?]+)/);
        if (productMatch) {
          const productHandle = productMatch[1];
          console.log('🆔 Found product handle from URL:', productHandle);
          // يمكن استخدام handle أو البحث عن ID
          setLinkedProductId(productHandle);
          return;
        }

        console.log('⚠️ No product ID found');
      } catch (error) {
        console.error('Error getting current product ID:', error);
      }
    };

    getCurrentProductId();
  }, [productId]);

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

  // حساب السعر مع تحويل العملة
  const convertedPrice = useMemo(() => {
    if (productData && productData.variants && productData.variants.length > 0) {
      const originalPrice = parseFloat(productData.variants[0].price) || 0;
      // قراءة العملة من المنتج أو من المتغير
      const productCurrency = productData.variants[0].currency_code || 
                             productData.currency || 
                             productData.shop?.currency || 
                             'USD';
      // استخدام العملة من النموذج بدلاً من formStyle.currency
      const targetCurrency = formCurrency || 'SAR';
      
      console.log('💰 Cart Items Currency conversion - FIXED:', {
        originalPrice,
        productCurrency,
        targetCurrency,
        formCurrency,
        formStyleCurrency: formStyle.currency,
        usingFormCurrency: !!formCurrency
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
      currency: formCurrency || 'SAR'
    };
  }, [productData, formCurrency]);

  const formatPrice = (amount: number) => {
    const currency = convertedPrice.currency;
    
    // استخدام CurrencyService للتنسيق مع الإعدادات المخصصة
    return CurrencyService.formatCurrency(amount, currency, language);
  };
  
  // استخدم نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-0 codform-cart-items w-full" style={{ direction: fieldStyle.direction || (language === 'ar' ? 'rtl' : 'ltr') }}>
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px',
        marginBottom: '12px',
      }}>
        {/* Product Information */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: language === 'ar' ? "'Cairo', sans-serif" : 'inherit',
        }}>
          {/* Product Image */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            {productData?.image ? (
              <img 
                src={productData.image} 
                alt={productData?.title || (language === 'ar' ? 'عنوان المنتج' : 'Product Title')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShoppingCart size={24} color="#9CA3AF" strokeWidth={2} />
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 4px 0',
              fontSize: '16px',
            }}>
              {productData?.title || (language === 'ar' ? 'عنوان المنتج' : 'Product Title')}
            </h3>
            <p style={{
              color: '#6b7280',
              margin: '0',
              fontSize: '14px',
            }}>
              {language === 'ar' ? 'السعر:' : 'Price:'} 
              <span 
                className="cart-items-price" 
                data-base-price={productData?.variants?.[0]?.price || '10'}
                data-base-currency={productData?.variants?.[0]?.currency_code || productData?.currency || 'MAD'}
                data-target-currency={formCurrency || 'MAD'}
                data-currency={convertedPrice.currency}
              >
                {formatPrice(convertedPrice.price)}
              </span>
            </p>
          </div>
          
          {/* Quantity Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: language === 'ar' ? '0' : 'auto',
            marginRight: language === 'ar' ? 'auto' : '0',
          }}>
            <label style={{
              fontSize: '14px',
              color: '#374151',
              marginRight: language === 'ar' ? '0' : '8px',
              marginLeft: language === 'ar' ? '8px' : '0',
            }}>
              {language === 'ar' ? 'الكمية:' : 'Quantity:'}
            </label>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              <button 
                type="button"
                style={{
                  backgroundColor: '#f9fafb',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#374151',
                  transition: 'background-color 0.2s',
                }}
              >
                -
              </button>
              
              <span className="cart-items-quantity" style={{
                padding: '0 12px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: 'white',
                minWidth: '40px',
                textAlign: 'center',
                lineHeight: '32px',
              }}>
                1
              </span>
              
              <button 
                type="button"
                style={{
                  backgroundColor: '#f9fafb',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#374151',
                  transition: 'background-color 0.2s',
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;