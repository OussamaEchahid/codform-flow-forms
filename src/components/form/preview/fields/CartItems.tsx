
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';

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
  
  // تحميل المنتجات عند التهيئة
  React.useEffect(() => {
    if (productId && (!products || products.length === 0)) {
      loadProducts();
    }
  }, [productId, products, loadProducts]);
  
  // البحث عن المنتج المرتبط
  const linkedProduct = productId ? products?.find(p => p.id === productId) : null;
  
  // استخدم نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-4 codform-cart-items w-full max-w-sm mx-auto" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <div 
        className={`${fieldStyle.showBorders !== false ? 'border border-gray-200' : ''} rounded-lg overflow-hidden bg-white shadow-sm`} 
        style={{ 
          borderRadius,
        }}
      >
        {/* عنصر العربة النموذجي للمعاينة */}
        <div className={`flex items-center p-3 space-x-3 codform-cart-item ${language === 'ar' ? 'space-x-reverse' : ''}`} data-product-item>
          {/* صورة المنتج */}
          {fieldStyle.hideImage !== true && (
            <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden">
              {linkedProduct?.image && typeof linkedProduct.image === 'object' && linkedProduct.image.src ? (
                <img 
                  src={linkedProduct.image.src} 
                  alt={linkedProduct.title}
                  className="w-full h-full object-cover"
                />
              ) : linkedProduct?.image && typeof linkedProduct.image === 'string' ? (
                <img 
                  src={linkedProduct.image} 
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
            
            {/* معلومات المتغير */}
            <div className="product-variant" style={{
              fontSize: fieldStyle.descriptionFontSize || '0.875rem',
              color: fieldStyle.descriptionColor || '#6b7280',
              fontFamily: fieldStyle.descriptionFontFamily || 'Inter, Cairo, system-ui, sans-serif',
              fontWeight: fieldStyle.descriptionFontWeight || '400',
            }}>
              {language === 'ar' ? 'لون: أزرق، المقاس: متوسط' : 'Color: Blue, Size: Medium'}
            </div>
            
            {/* محدد الكمية */}
            {fieldStyle.hideQuantitySelector !== true && (
              <div className={`flex items-center space-x-2 mt-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <span className="text-xs font-medium text-gray-600" style={{
                  fontFamily: fieldStyle.quantityFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                }}>
                  {language === 'ar' ? 'الكمية:' : 'Qty:'}
                </span>
                <div className={`flex items-center space-x-1 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <button 
                    className="flex items-center justify-center w-6 h-6 rounded transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '4'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
                      fontSize: '12px',
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
                    className="flex items-center justify-center w-6 h-6 rounded transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '4'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
                      fontSize: '12px',
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
            <div className={`${language === 'ar' ? 'text-left' : 'text-right'} flex-shrink-0`}>
              <div className="font-bold product-price" style={{
                fontSize: fieldStyle.priceFontSize || '0.9rem',
                color: fieldStyle.priceColor || '#059669',
                fontFamily: fieldStyle.priceFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.priceFontWeight || '700',
              }}>
                {linkedProduct?.variants?.[0]?.price ? 
                  `${linkedProduct.variants[0].price} ${language === 'ar' ? 'درهم' : '$'}` :
                  (language === 'ar' ? '199.00 درهم' : '$29.99')
                }
              </div>
              <div className="text-xs text-gray-500 line-through" style={{
                fontFamily: fieldStyle.priceFontFamily || 'Inter, Cairo, system-ui, sans-serif',
              }}>
                {language === 'ar' ? '249.00 درهم' : '$39.99'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;