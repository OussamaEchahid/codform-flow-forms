
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
  formDirection?: 'ltr' | 'rtl';
}

const CartItems: React.FC<CartItemsProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // استخدم نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  // Check if we should show the title (default to true if not explicitly set to false)
  const showTitle = field.label !== '' && field.label !== undefined;
  
  return (
    <div 
      className="mb-6 codform-cart-items"
      dir={textDirection}
      data-direction={textDirection}
    >
      {showTitle && (
        <h3 
          className="text-lg font-medium mb-3" 
          style={{
            color: fieldStyle.color || '#1f2937',
            fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.2rem',
            textAlign: textDirection === 'rtl' ? 'right' : 'left'
          }}
          dir={textDirection}
        >
          {field.label || (language === 'ar' ? 'المنتج المختار' : 'Selected Product')}
        </h3>
      )}
      <div 
        className="border rounded-md overflow-hidden" 
        style={{ 
          borderRadius,
          direction: textDirection,
        }}
        dir={textDirection}
      >
        {/* عنصر العربة النموذجي للمعاينة */}
        <div 
          className="flex items-center p-4 border-b codform-cart-item" 
          data-product-item
          dir={textDirection}
          style={{
            flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row'
          }}
        >
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
          <div className="flex-1">
            <h4 
              className="font-medium product-title" 
              style={{
                fontSize: fieldStyle.fontSize || '1.1rem',
                color: fieldStyle.color || '#1f2937',
                textAlign: textDirection === 'rtl' ? 'right' : 'left'
              }}
              dir={textDirection}
            >
              {language === 'ar' ? 'منتج تجريبي' : 'Sample Product'}
            </h4>
            <div 
              className="text-sm text-gray-500 mt-1 product-quantity" 
              style={{
                fontSize: fieldStyle.descriptionFontSize || '0.9rem',
                color: fieldStyle.descriptionColor || '#6b7280',
                textAlign: textDirection === 'rtl' ? 'right' : 'left'
              }}
              dir={textDirection}
            >
              {language === 'ar' ? 'الكمية: ١' : 'Quantity: 1'}
            </div>
          </div>
          <div className="text-right">
            <div 
              className="font-medium product-price" 
              style={{
                fontSize: fieldStyle.priceFontSize || '1rem',
                color: fieldStyle.priceColor || '#1f2937',
                textAlign: textDirection === 'rtl' ? 'left' : 'right'
              }}
              dir={textDirection}
            >$99.00</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
