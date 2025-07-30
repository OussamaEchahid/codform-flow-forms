
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';

interface CartItemsProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const CartItems: React.FC<CartItemsProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخدم نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-6 codform-cart-items" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <div 
        className={`${fieldStyle.showBorders !== false ? 'border-2 border-gray-200' : ''} rounded-lg overflow-hidden bg-white shadow-sm`} 
        style={{ 
          borderRadius,
        }}
      >
        {/* عنصر العربة النموذجي للمعاينة */}
        <div className={`flex items-center p-6 space-x-4 codform-cart-item ${language === 'ar' ? 'space-x-reverse' : ''}`} data-product-item>
          {/* أيقونة المنتج الاحترافية */}
          {fieldStyle.hideImage !== true && (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex-shrink-0 flex items-center justify-center border border-blue-200">
              <ShoppingCart 
                size={28} 
                className="text-blue-600" 
                strokeWidth={1.5}
              />
            </div>
          )}
          
          {/* معلومات المنتج */}
          <div className="flex-1 space-y-2">
            {/* عنوان المنتج */}
            {fieldStyle.hideTitle !== true && (
              <h4 className="font-semibold product-title leading-tight" style={{
                fontSize: fieldStyle.fontSize || '1.1rem',
                color: fieldStyle.color || '#1f2937',
                fontFamily: fieldStyle.fontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.fontWeight || '600',
              }}>
                {language === 'ar' ? 'منتج تجريبي' : 'Sample Product'}
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
              <div className={`flex items-center space-x-3 mt-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <span className="text-sm font-medium text-gray-600" style={{
                  fontFamily: fieldStyle.quantityFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                }}>
                  {language === 'ar' ? 'الكمية:' : 'Qty:'}
                </span>
                <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <button 
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '8'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
                    }}
                  >
                    −
                  </button>
                  <span 
                    className="w-8 text-center font-semibold" 
                    style={{
                      fontFamily: fieldStyle.quantityFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                      color: fieldStyle.quantityColor || '#1f2937',
                      fontWeight: fieldStyle.productFontWeight || '600',
                    }}
                  >
                    1
                  </span>
                  <button 
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-gray-100" 
                    style={{
                      backgroundColor: fieldStyle.quantityBgColor || '#f9fafb',
                      border: `${fieldStyle.quantityBorderWidth || '1'}px solid ${fieldStyle.quantityBorderColor || '#e5e7eb'}`,
                      borderRadius: `${fieldStyle.quantityBorderRadius || '8'}px`,
                      color: fieldStyle.quantityBtnColor || '#374151',
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
                fontSize: fieldStyle.priceFontSize || '1.125rem',
                color: fieldStyle.priceColor || '#059669',
                fontFamily: fieldStyle.priceFontFamily || 'Inter, Cairo, system-ui, sans-serif',
                fontWeight: fieldStyle.priceFontWeight || '700',
              }}>
                {language === 'ar' ? '199.00 درهم' : '$29.99'}
              </div>
              <div className="text-sm text-gray-500 line-through mt-1" style={{
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