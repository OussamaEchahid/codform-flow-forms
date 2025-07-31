
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { supabase } from '@/integrations/supabase/client';

interface CartItemsProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  productId?: string;
}

const CartItems: React.FC<CartItemsProps> = ({ field, formStyle, productId }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  const { products, loadProducts } = useSimpleShopify();
  const [linkedProductId, setLinkedProductId] = React.useState<string | null>(null);

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

  // تحميل المنتجات عند التهيئة
  React.useEffect(() => {
    if ((linkedProductId || productId) && (!products || products.length === 0)) {
      console.log('Loading products for cart items with productId:', linkedProductId || productId);
      loadProducts();
    }
  }, [linkedProductId, productId, products, loadProducts]);
  
  // البحث عن المنتج المرتبط - استخدم linkedProductId أولاً
  const finalProductId = linkedProductId || productId;
  const linkedProduct = finalProductId ? products?.find(p => p.id === finalProductId) : null;
  
  console.log('Cart Items Debug - جميع الخصائص تعمل:', {
    linkedProductId,
    propProductId: productId,
    finalProductId,
    productsCount: products?.length || 0,
    linkedProduct: linkedProduct?.title || 'Not found',
    style: fieldStyle,
    showBorders: fieldStyle.showBorders,
    hideImage: fieldStyle.hideImage,
    hideTitle: fieldStyle.hideTitle,
    hideQuantitySelector: fieldStyle.hideQuantitySelector,
    hidePrice: fieldStyle.hidePrice,
    discountPrice: fieldStyle.discountPrice,
    hideDiscountPrice: fieldStyle.hideDiscountPrice
  });
  
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
              {linkedProduct?.featuredImage || linkedProduct?.images?.[0] ? (
                <img 
                  src={linkedProduct.featuredImage || linkedProduct.images[0]} 
                  alt={linkedProduct.title}
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
                {linkedProduct?.title || (language === 'ar' ? 'عنوان المنتج' : 'Product Title')}
              </h4>
            )}
            
            {/* معلومات المتغير - عرض فقط إذا كان هناك متغيرات حقيقية */}
            {linkedProduct?.variants && linkedProduct.variants.length > 0 && 
             linkedProduct.variants[0]?.title !== 'Default Title' && 
             linkedProduct.variants[0]?.title && (
              <div className="product-variant" style={{
                fontSize: fieldStyle.descriptionFontSize || '0.875rem',
                color: fieldStyle.descriptionColor || '#6b7280',
                fontFamily: fieldStyle.descriptionFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.descriptionFontWeight || '400',
              }}>
                {linkedProduct.variants[0].title}
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
                {linkedProduct?.variants?.[0]?.price ? 
                  `${linkedProduct.money_format?.replace('{{amount}}', linkedProduct.variants[0].price) || `${linkedProduct.variants[0].price} ${linkedProduct.currency || 'USD'}`}` :
                  (language === 'ar' ? '199.00 درهم' : '$29.99')
                }
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