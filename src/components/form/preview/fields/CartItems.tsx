
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Image } from 'lucide-react';

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
  
  // Check if we should show the title (default to true if not explicitly set to false)
  const showTitle = field.label !== '' && field.label !== undefined;
  
  return (
    <div className="mb-6 codform-cart-items">
      {showTitle && fieldStyle.showTitle !== false && (
        <h3 className="text-lg font-medium mb-3" style={{
          color: fieldStyle.color || '#1f2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.2rem',
          fontFamily: fieldStyle.fontFamily || 'Tajawal',
          fontWeight: fieldStyle.fontWeight || '700',
        }}>
          {field.label || (language === 'ar' ? 'المنتج المختار' : 'Selected Product')}
        </h3>
      )}
      <div 
        className={`${fieldStyle.showBorders !== false ? 'border' : ''} rounded-md overflow-hidden`} 
        style={{ 
          borderRadius,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        {/* عنصر العربة النموذجي للمعاينة */}
        <div className="flex items-center p-4 border-b codform-cart-item" data-product-item>
          {/* صورة المنتج */}
          {fieldStyle.hideImage !== true && (
            <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 ml-4 flex items-center justify-center" style={{ borderRadius: '0.25rem' }}>
              <img 
                src="https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=80&h=80&q=80" 
                alt="Product" 
                className="w-full h-full object-cover product-image"
                style={{ borderRadius: '0.25rem' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const iconElement = document.createElement('div');
                    iconElement.className = 'w-full h-full flex items-center justify-center text-gray-400';
                    iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    parent.appendChild(iconElement);
                  }
                }}
              />
            </div>
          )}
          
          {/* معلومات المنتج */}
          <div className="flex-1">
            {/* عنوان المنتج */}
            {fieldStyle.hideTitle !== true && (
              <h4 className="font-medium product-title" style={{
                fontSize: fieldStyle.fontSize || '1.1rem',
                color: fieldStyle.color || '#1f2937',
                fontFamily: fieldStyle.fontFamily || 'Tajawal',
                fontWeight: fieldStyle.fontWeight || '700',
              }}>
                {language === 'ar' ? 'منتج تجريبي' : 'Sample Product'}
              </h4>
            )}
            
            {/* معلومات المتغير */}
            <div className="text-sm text-gray-500 mt-1 product-quantity" style={{
              fontSize: fieldStyle.descriptionFontSize || '0.9rem',
              color: fieldStyle.descriptionColor || '#6b7280',
              fontFamily: fieldStyle.descriptionFontFamily || 'Tajawal',
              fontWeight: fieldStyle.descriptionFontWeight || '400',
            }}>
              {language === 'ar' ? 'معلومات المتغير' : 'Variant info'}
            </div>
            
            {/* محدد الكمية */}
            {fieldStyle.hideQuantitySelector !== true && (
              <div className="flex items-center mt-2">
                <button 
                  className="flex items-center justify-center w-8 h-8 rounded" 
                  style={{
                    backgroundColor: fieldStyle.quantityBgColor || '#00000020',
                    border: `${fieldStyle.quantityBorderWidth || '2'}px solid ${fieldStyle.quantityBorderColor || '#000000'}`,
                    borderRadius: `${fieldStyle.quantityBorderRadius || '8.5'}px`,
                    color: fieldStyle.quantityBtnColor || '#000000',
                  }}
                >
                  -
                </button>
                <span 
                  className="mx-3 font-medium" 
                  style={{
                    fontFamily: fieldStyle.quantityFontFamily || 'Tajawal',
                    color: fieldStyle.quantityColor || '#000000',
                    fontWeight: fieldStyle.productFontWeight || '700',
                  }}
                >
                  1
                </span>
                <button 
                  className="flex items-center justify-center w-8 h-8 rounded" 
                  style={{
                    backgroundColor: fieldStyle.quantityBgColor || '#00000020',
                    border: `${fieldStyle.quantityBorderWidth || '2'}px solid ${fieldStyle.quantityBorderColor || '#000000'}`,
                    borderRadius: `${fieldStyle.quantityBorderRadius || '8.5'}px`,
                    color: fieldStyle.quantityBtnColor || '#000000',
                  }}
                >
                  +
                </button>
              </div>
            )}
          </div>
          
          {/* سعر المنتج */}
          {fieldStyle.hidePrice !== true && (
            <div className="text-right">
              <div className="font-medium product-price" style={{
                fontSize: fieldStyle.priceFontSize || '1rem',
                color: fieldStyle.priceColor || '#1f2937',
                fontFamily: fieldStyle.priceFontFamily || 'Tajawal',
                fontWeight: fieldStyle.priceFontWeight || '900',
              }}>
                0.00 MAD
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;
