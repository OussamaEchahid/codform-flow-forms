
import { v4 as uuidv4 } from 'uuid';

export interface FormField {
  id: string;
  type: FormFieldType;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  validation?: string;
  rows?: number;
  content?: string;
  src?: string;
  alt?: string;
  width?: string;
  phoneNumber?: string;
  message?: string;
  whatsappNumber?: string;
  showImage?: boolean;
  showPrice?: boolean;
  showShipping?: boolean;
  showTax?: boolean;
  icon?: string; // Added icon property
  defaultValue?: string; // Added defaultValue property
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    titleColor?: string;
    titleFontSize?: string;
    descriptionColor?: string;
    descriptionFontSize?: string;
    priceColor?: string;
    priceFontSize?: string;
    labelColor?: string;
    labelFontSize?: string;
    valueColor?: string;
    valueFontSize?: string;
    totalLabelColor?: string;
    totalLabelFontSize?: string;
    totalValueColor?: string;
    totalValueFontSize?: string;
    borderColor?: string;
    borderRadius?: string;
    borderWidth?: string;
    animation?: boolean; // Animation flag
    animationType?: 'pulse' | 'shake' | 'bounce' | 'wiggle' | 'flash'; // Added animation types
    iconPosition?: 'left' | 'right'; // Added iconPosition property
    icon?: boolean; // Added icon property
  };
  disabled?: boolean;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'text/html'
  | 'cart-items'
  | 'cart-summary'
  | 'submit'
  | 'shipping'
  | 'countdown'
  | 'whatsapp'
  | 'image'
  | 'title';

export interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: number;
  title: string;
  description: string;
  data: FormStep[];
  primaryColor?: string; // Added this property
  fields?: number; // Added this property for FormTemplatesDialog
  steps?: number; // Added this property for FormTemplatesDialog
}

/**
 * Mock form templates for demonstration
 */
export const formTemplates: FormTemplate[] = [
  {
    id: 1,
    title: 'نموذج تسجيل بسيط',
    description: 'نموذج أساسي لجمع معلومات المستخدمين.',
    data: [
      {
        id: '1',
        title: 'معلومات شخصية',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'الاسم',
            required: true,
            placeholder: 'أدخل اسمك'
          },
          {
            id: 'email',
            type: 'email',
            label: 'البريد الإلكتروني',
            required: true,
            placeholder: 'أدخل بريدك الإلكتروني'
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'نموذج طلب منتج',
    description: 'نموذج لطلب منتج مع تفاصيل الشحن.',
    data: [
      {
        id: '1',
        title: 'معلومات المنتج',
        fields: [
          {
            id: 'product_name',
            type: 'text',
            label: 'اسم المنتج',
            required: true,
            placeholder: 'أدخل اسم المنتج'
          },
          {
            id: 'quantity',
            type: 'text',
            label: 'الكمية',
            required: true,
            placeholder: 'أدخل الكمية المطلوبة'
          }
        ]
      },
      {
        id: '2',
        title: 'معلومات الشحن',
        fields: [
          {
            id: 'address',
            type: 'textarea',
            label: 'عنوان الشحن',
            required: true,
            placeholder: 'أدخل عنوان الشحن بالتفصيل'
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'نموذج استبيان',
    description: 'نموذج لجمع آراء العملاء.',
    data: [
      {
        id: '1',
        title: 'الآراء',
        fields: [
          {
            id: 'satisfaction',
            type: 'radio',
            label: 'ما مدى رضاك عن المنتج؟',
            required: true,
            options: [
              { value: 'satisfied', label: 'راض جداً' },
              { value: 'neutral', label: 'محايد' },
              { value: 'dissatisfied', label: 'غير راض' }
            ]
          },
          {
            id: 'comments',
            type: 'textarea',
            label: 'تعليقات إضافية',
            placeholder: 'أدخل تعليقاتك هنا'
          }
        ]
      }
    ]
  }
];

/**
 * Creates a default form template with standard fields
 */
export const createDefaultForm = (): FormStep[] => {
  return [
    {
      id: "1",
      title: "معلومات الطلب",
      fields: [
        {
          id: "full_name",
          type: "text",
          label: "الاسم الكامل",
          placeholder: "أدخل اسمك الكامل",
          required: true,
          helpText: "يرجى إدخال الاسم الثلاثي"
        },
        {
          id: "phone",
          type: "phone",
          label: "رقم الهاتف",
          placeholder: "05xxxxxxxx",
          required: true,
          validation: "^(05)\\d{8}$",
          helpText: "يرجى إدخال رقم هاتف صحيح يبدأ بـ 05"
        },
        {
          id: "city",
          type: "text",
          label: "المدينة",
          placeholder: "أدخل اسم المدينة",
          required: true
        },
        {
          id: "address",
          type: "textarea",
          label: "العنوان",
          placeholder: "أدخل عنوان التوصيل بالتفصيل",
          required: true
        },
        {
          id: "cart_items",
          type: "cart-items",
          label: "المنتج المختار",
          required: false
        },
        {
          id: "cart_summary",
          type: "cart-summary",
          label: "ملخص الطلب",
          required: false
        },
        {
          id: "submit",
          type: "submit",
          label: "إرسال الطلب الآن",
          required: false
        }
      ]
    }
  ];
};

/**
 * Creates a new empty form
 * @param title The title of the form
 * @returns The new form state
 */
export const createNewForm = (title: string = 'نموذج جديد'): FormStep[] => {
  return [
    {
      id: uuidv4(),
      title: 'الخطوة الأولى',
      fields: []
    }
  ];
};

export const createEmptyField = (type: string): FormField => {
  const baseField: FormField = {
    id: `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: type as any,
    label: getDefaultLabelForType(type),
    required: false,
  };

  // Add type-specific properties
  switch (type) {
    case 'text':
    case 'email':
    case 'phone':
      return {
        ...baseField,
        placeholder: '',
        validation: type === 'email' ? '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' : '',
      };
    case 'textarea':
      return {
        ...baseField,
        placeholder: '',
        rows: 4,
      };
    case 'select':
      return {
        ...baseField,
        options: [
          { value: 'option1', label: 'خيار 1' },
          { value: 'option2', label: 'خيار 2' }
        ],
        placeholder: 'اختر من القائمة',
      };
    case 'checkbox':
      return {
        ...baseField,
        options: [
          { value: 'option1', label: 'خيار 1' },
          { value: 'option2', label: 'خيار 2' }
        ],
      };
    case 'radio':
      return {
        ...baseField,
        options: [
          { value: 'option1', label: 'خيار 1' },
          { value: 'option2', label: 'خيار 2' }
        ],
      };
    case 'text/html':
      return {
        ...baseField,
        content: '<p>أدخل المحتوى هنا</p>',
      };
    case 'submit':
      return {
        ...baseField,
        label: 'إرسال الطلب الآن',
        style: {
          backgroundColor: '#9b87f5',
          color: 'white',
          fontSize: '1.1rem',
        }
      };
    case 'whatsapp':
      return {
        ...baseField,
        label: 'تواصل عبر واتساب',
        phoneNumber: '966500000000',
        message: 'أرغب في التواصل بخصوص طلب المنتج',
      };
    case 'image':
      return {
        ...baseField,
        src: '',
        alt: '',
        width: '100%',
      };
    case 'cart-items':
      return {
        ...baseField,
        showImage: true,
        showPrice: true,
      };
    case 'cart-summary':
      return {
        ...baseField,
        showShipping: true,
        showTax: false,
      };
    default:
      return baseField;
  }
};

/**
 * Gets default label based on field type
 */
const getDefaultLabelForType = (type: string): string => {
  switch (type) {
    case 'text': return 'حقل نصي';
    case 'email': return 'البريد الإلكتروني';
    case 'phone': return 'رقم الهاتف';
    case 'textarea': return 'ملاحظات إضافية';
    case 'select': return 'اختر من القائمة';
    case 'checkbox': return 'اختيارات متعددة';
    case 'radio': return 'اختيار واحد';
    case 'submit': return 'إرسال الطلب الآن';
    case 'text/html': return 'نص/HTML';
    case 'whatsapp': return 'تواصل عبر واتساب';
    case 'image': return 'صورة';
    case 'title': return 'عنوان';
    case 'cart-items': return 'المنتج المختار';
    case 'cart-summary': return 'ملخص الطلب';
    case 'shipping': return 'خيارات الشحن';
    case 'countdown': return 'العد التنازلي';
    default: return 'حقل جديد';
  }
};
