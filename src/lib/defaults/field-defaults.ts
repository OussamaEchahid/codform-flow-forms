/**
 * مصدر موحد للقيم الافتراضية لجميع الحقول
 * Single source of truth for all field default values
 */

export interface FieldDefaults {
  submit: {
    style: {
      backgroundColor: string;
      color: string;
      fontSize: string;
      paddingY: string;
      iconPosition: string;
      iconSize: string;
      icon: string;
      showIcon: boolean;
      animation: boolean;
      animationType: 'pulse' | 'bounce' | 'shake' | 'wiggle' | 'flash';
      borderColor: string;
      borderRadius: string;
      borderWidth: string;
    };
  };
  formTitle: {
    style: {
      color: string;
      backgroundColor: string;
      textAlign: string;
      fontSize: string;
      fontWeight: string;
      fontFamily: string;
    };
  };
  text: {
    style: {
      borderColor: string;
      borderRadius: string;
      borderWidth: string;
      padding: string;
      fontSize: string;
      fontFamily: string;
    };
  };
  cartItems: {
    style: {
      showBorders: boolean;
      hideImage: boolean;
      hideTitle: boolean;
      hideQuantitySelector: boolean;
      hidePrice: boolean;
      color: string;
      fontSize: string;
      fontFamily: string;
      fontWeight: string;
      descriptionColor: string;
      descriptionFontSize: string;
      descriptionFontFamily: string;
      descriptionFontWeight: string;
      quantityBgColor: string;
      quantityBorderColor: string;
      quantityBorderWidth: string;
      quantityBorderRadius: string;
      quantityFontFamily: string;
      quantityColor: string;
      quantityBtnColor: string;
      productFontWeight: string;
      priceColor: string;
      priceFontSize: string;
      priceFontFamily: string;
      priceFontWeight: string;
    };
  };
  image: {
    style: {
      textAlign: string;
    };
    src: string;
    alt: string;
    width: string;
  };
  cartSummary: {
    config: {
      subtotalText: string;
      discountText: string;
      shippingText: string;
      totalText: string;
      showDiscount: boolean;
      discountType: string;
      discountValue: number;
      shippingType: string;
      shippingValue: number;

      currency: string;
    };
    style: {
      backgroundColor: string;
      borderColor: string;
      borderRadius: string;
      labelColor: string;
      valueColor: string;
      totalLabelColor: string;
      totalValueColor: string;
      fontFamily: string;
      labelFontSize: string;
      valueFontSize: string;
      totalLabelFontSize: string;
      totalValueFontSize: string;
      labelWeight: string;
      valueWeight: string;
      totalLabelWeight: string;
      totalValueWeight: string;
    };
  };
}

/**
 * القيم الافتراضية الموحدة لجميع الحقول
 * Unified default values for all fields
 */
export const FIELD_DEFAULTS: FieldDefaults = {
  submit: {
    style: {
      backgroundColor: '#9b87f5',
      color: '#ffffff',
      fontSize: '18px', // UNIFIED: 18px for all languages except Arabic
      paddingY: '15px', // UNIFIED: 15px for all languages except Arabic  
      iconPosition: 'right',
      iconSize: '18px', // UNIFIED: 18px for all languages
      icon: 'shopping-cart', // القيمة الافتراضية للأيقونة
      showIcon: true,
      animation: true,
      animationType: 'pulse',
      borderColor: '#eaeaff',
      borderRadius: '6px',
      borderWidth: '0px'
    }
  },
  formTitle: {
    style: {
      color: '#000000', // ALWAYS BLACK for new forms
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      fontFamily: 'Cairo, Tajawal, Arial, sans-serif'
    }
  },
  text: {
    style: {
      borderColor: '#e5e7eb',
      borderRadius: '6px',
      borderWidth: '1px',
      padding: '12px',
      fontSize: '16px',
      fontFamily: 'Inter, Cairo, system-ui, sans-serif'
    }
  },
  cartItems: {
    style: {
      showBorders: true,
      hideImage: false,
      hideTitle: false,
      hideQuantitySelector: false,
      hidePrice: false,
      color: '#1f2937',
      fontSize: '1.1rem',
      fontFamily: 'Inter, Cairo, system-ui, sans-serif',
      fontWeight: '600',
      descriptionColor: '#6b7280',
      descriptionFontSize: '0.875rem',
      descriptionFontFamily: 'Inter, Cairo, system-ui, sans-serif',
      descriptionFontWeight: '400',
      quantityBgColor: '#f9fafb',
      quantityBorderColor: '#e5e7eb',
      quantityBorderWidth: '1',
      quantityBorderRadius: '8',
      quantityFontFamily: 'Inter, Cairo, system-ui, sans-serif',
      quantityColor: '#1f2937',
      quantityBtnColor: '#374151',
      productFontWeight: '600',
      priceColor: '#059669',
      priceFontSize: '1.125rem',
      priceFontFamily: 'Inter, Cairo, system-ui, sans-serif',
      priceFontWeight: '700'
    }
  },
  image: {
    style: {
      textAlign: 'center'
    },
    src: 'https://codform.com/assets/image_place_holder.avif',
    alt: 'صورة',
    width: '100'
  },
  cartSummary: {
    config: {
      subtotalText: 'المجموع الفرعي', // Will be set based on language
      discountText: 'الخصم',
      shippingText: 'الشحن',
      totalText: 'الإجمالي',
      showDiscount: true,
      discountType: 'percentage',
      discountValue: 0,
      shippingType: 'manual',
      shippingValue: 0,

      currency: 'MAD'
    },
    style: {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderRadius: '8px',
      labelColor: '#374151',
      valueColor: '#111827',
      totalLabelColor: '#111827',
      totalValueColor: '#059669',
      fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
      labelFontSize: '16px',
      valueFontSize: '16px',
      totalLabelFontSize: '18px',
      totalValueFontSize: '18px',
      labelWeight: '500',
      valueWeight: '600',
      totalLabelWeight: '700',
      totalValueWeight: '700'
    }
  }
};

/**
 * دالة للحصول على القيم الافتراضية للحقل بناءً على نوعه واللغة
 * Function to get field defaults based on type and language
 */
export const getFieldDefaults = (fieldType: string, language: string = 'en') => {
  const defaults = { ...FIELD_DEFAULTS };
  
  // تطبيق إعدادات خاصة حسب اللغة
  // Apply language-specific settings
  if (language === 'ar') {
    // إعدادات خاصة بالعربية (الإعدادات الحالية)
    // Arabic-specific settings (current settings)
    defaults.submit.style.fontSize = '17px';
    defaults.submit.style.paddingY = '12px';
  } else {
    // إعدادات خاصة بالإنجليزية واللغات الأخرى
    // English and other languages settings
    defaults.submit.style.fontSize = '18px';
    defaults.submit.style.paddingY = '15px';
  }
  
  // iconSize remains 18px for all languages
  
  return defaults;
};

/**
 * دالة لإنشاء حقل جديد بالقيم الافتراضية الصحيحة
 * Function to create a new field with correct default values
 */
export const createFieldWithDefaults = (type: string, language: string = 'en') => {
  const defaults = getFieldDefaults(type, language);
  const baseField = {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: '',
    required: false
  };

  switch (type) {
    case 'form-title':
      return {
        ...baseField,
        label: 'عنوان النموذج',
        content: 'عنوان النموذج',
        style: defaults.formTitle.style
      };
    
    case 'submit':
      return {
        ...baseField,
        label: 'Submit Form',
        style: {
          ...defaults.submit.style,
          icon: 'shopping-cart', // إعداد icon في style فقط
          showIcon: true
        }
      };
    
    case 'text':
      return {
        ...baseField,
        style: defaults.text.style
      };
    
    case 'cart-items':
      return {
        ...baseField,
        label: 'عناصر السلة',
        productId: '',
        style: defaults.cartItems.style
      };
    
    case 'image':
      return {
        ...baseField,
        label: 'صورة',
        src: defaults.image.src,
        alt: defaults.image.alt,
        width: defaults.image.width,
        style: defaults.image.style
      };
    
    case 'cart-summary':
      return {
        ...baseField,
        label: language === 'ar' ? 'ملخص الطلب' : 'Cart Summary',
        config: {
          ...defaults.cartSummary.config,
          // Set correct language texts
          subtotalText: language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
          discountText: language === 'ar' ? 'الخصم' : 'Discount',
          shippingText: language === 'ar' ? 'الشحن' : 'Shipping',
          totalText: language === 'ar' ? 'الإجمالي' : 'Total'
        },
        style: defaults.cartSummary.style
      };
    
    case 'text/html':
      return {
        ...baseField,
        content: '<p>HTML Content</p>'
      };
    
    default:
      return baseField;
  }
};