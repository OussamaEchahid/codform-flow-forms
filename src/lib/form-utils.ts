import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type FormFieldType = 
  'text' | 
  'email' | 
  'tel' | 
  'number' | 
  'textarea' | 
  'select' | 
  'checkbox' | 
  'radio' | 
  'date' | 
  'time' | 
  'datetime-local' | 
  'file' | 
  'hidden' | 
  'image' | 
  'color' | 
  'range' | 
  'url' | 
  'month' | 
  'week' | 
  'password' |
  'title' |
  'html' |
  'step' |
  'submit' |
  'whatsapp' |
  'cart-items' |
  'cart-summary' |
  'shipping-options' |
  'phone' |  // Added phone type
  'form-title' |  // Added form-title type
  'edit-form-title' |  // Added edit-form-title type
  'text/html';  // Added text/html type

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldStyle {
  // Base properties
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  
  // Description properties
  descriptionColor?: string;
  descriptionFontSize?: string;
  
  // Border properties
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  
  // Animation properties
  animation?: boolean;
  animationType?: string;
  
  // Icon properties
  iconPosition?: string;
  icon?: string;
  fullWidth?: boolean;
  fontFamily?: string;
  
  // Label specific properties
  labelColor?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  
  // Additional properties needed
  showLabel?: boolean;
  showIcon?: boolean;
  paddingY?: string;
  
  // Cart item and summary specific properties
  priceFontSize?: string;
  priceColor?: string;
  valueFontSize?: string;
  valueColor?: string;
  totalLabelFontSize?: string;
  totalLabelColor?: string;
  totalValueFontSize?: string;
  totalValueColor?: string;
  
  // Additional properties for edit-form-title
  showDescription?: boolean; // Whether to show the description text
  titleAlignment?: 'left' | 'center' | 'right'; // Text alignment for the title
  descriptionAlignment?: 'left' | 'center' | 'right'; // Text alignment for the description
}

export interface FormField {
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  icon?: string;
  style?: FormFieldStyle;
  options?: Array<{
    value: string;
    label: string;
  }>;
  
  // Additional properties needed
  inputFor?: string;
  errorMessage?: string;
  
  // Additional properties
  defaultValue?: string | string[];
  disabled?: boolean;
  src?: string;
  alt?: string;
  width?: string | number;
  className?: string;
  content?: string;
  whatsappNumber?: string;
  message?: string;
  rows?: number;
}

export interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormData {
  id: string;
  title: string;
  description?: string | null;
  data: FormStep[];
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  is_published?: boolean;
  shop_id?: string | null;
  product_id?: string | null;
  style?: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
}

export interface FloatingButtonConfig {
  enabled: boolean;
  text: string;
  textColor?: string;
  backgroundColor?: string;
  
  // Position properties
  position?: 'bottom' | 'top' | 'left' | 'right';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  
  // Style properties
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  marginBottom?: string;
  
  // Icon properties
  showIcon?: boolean;
  icon?: string;
  
  // Animation properties
  animation?: string;
}

export const formatCurrency = (amount: number, locale = 'ar-SA', currency = 'SAR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic validation: at least 8 digits, can include +, -, (), and spaces
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const generateFormFieldClassName = (field: FormField) => {
  return cn(
    "codform-field",
    field.className,
    field.type === 'hidden' && "hidden"
  );
};

export const loadForm = async (formId: string, productId?: string): Promise<FormData> => {
  try {
    // Build the URL with the optional productId parameter
    let url = `/api/forms/${formId}`;
    if (productId) {
      url += `?productId=${encodeURIComponent(productId)}`;
    }
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Failed to load form: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error loading form:", error);
    throw error;
  }
};

export const extractFormSections = (form: FormData): Array<{ title: string; fields: FormField[] }> => {
  // If there's no data or data is not an array with fields property, return empty array
  if (!form || !form.data || !Array.isArray(form.data)) {
    return [];
  }

  // Map each step in the form data to a section
  return form.data.map(step => ({
    title: step.title || '',
    fields: step.fields || []
  }));
};

// Function to create an empty field based on type
export const createEmptyField = (type: FormFieldType): FormField => {
  let newField: FormField = {
    id: uuidv4(),
    type,
    label: '',
    required: false,
  };

  // Add field-specific configuration
  switch (type) {
    case 'edit-form-title':
      newField.label = 'عنوان النموذج';
      newField.helpText = 'وصف النموذج';
      newField.style = {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px',
        titleAlignment: 'center',
        descriptionAlignment: 'center',
        showDescription: true,
      };
      break;
    case 'form-title':
      newField.label = 'عنوان النموذج المخصص';
      newField.helpText = 'وصف النموذج (اختياري)';
      newField.style = {
        textAlign: 'center',
        color: '#1A1F2C',
        fontSize: '24px',
        fontWeight: 'bold',
        descriptionColor: '#6b7280',
        descriptionFontSize: '14px',
        backgroundColor: '',
      };
      break;
    case 'text':
      newField.label = 'حقل نص';
      newField.placeholder = 'أدخل نصًا هنا';
      break;
    case 'email':
      newField.label = 'بريد إلكتروني';
      newField.placeholder = 'أدخل البريد الإلكتروني';
      break;
    case 'phone':
      newField.label = 'رقم هاتف';
      newField.placeholder = 'أدخل رقم الهاتف';
      break;
    case 'textarea':
      newField.label = 'نص متعدد الأسطر';
      newField.placeholder = 'أدخل نصًا هنا';
      break;
    case 'select':
      newField.label = 'قائمة منسدلة';
      newField.options = [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
        { value: 'option3', label: 'الخيار الثالث' }
      ];
      break;
    case 'checkbox':
      newField.label = 'خانة اختيار';
      newField.options = [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
        { value: 'option3', label: 'الخيار الثالث' }
      ];
      break;
    case 'radio':
      newField.label = 'زر راديو';
      newField.options = [
        { value: 'option1', label: 'الخيار الأول' },
        { value: 'option2', label: 'الخيار الثاني' },
        { value: 'option3', label: 'الخيار الثالث' }
      ];
      break;
    case 'cart-items':
      newField.label = 'المنتج المختار';
      break;
    case 'cart-summary':
      newField.label = 'ملخص الطلب';
      break;
    case 'submit':
      newField.label = 'إرسال الطلب';
      newField.style = {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        fontSize: '18px',
        animation: true,
        animationType: 'pulse',
      };
      break;
    case 'text/html':
      newField.label = 'نص/HTML';
      newField.content = '<p>محتوى HTML</p>';
      break;
    case 'title':
      newField.label = 'عنوان قسم';
      newField.style = {
        fontWeight: 'bold',
        fontSize: '20px',
      };
      break;
    case 'whatsapp':
      newField.label = 'طلب عبر الواتساب';
      break;
    case 'image':
      newField.label = 'صورة';
      break;
    default:
      newField.label = 'حقل جديد';
      break;
  }

  return newField;
};

// Create a complete default form with all required fields
export const createDefaultForm = (): FormStep[] => {
  const defaultFields: FormField[] = [];
  
  // Use new edit-form-title instead of form-title
  defaultFields.push({
    type: 'edit-form-title',
    id: uuidv4(),
    label: 'نموذج جديد',
    helpText: 'نموذج جديد',
    style: {
      backgroundColor: '#9b87f5',
      color: '#ffffff',
      fontSize: '24px',
      fontWeight: 'bold',
      descriptionColor: '#ffffff',
      descriptionFontSize: '14px',
      titleAlignment: 'center',
      descriptionAlignment: 'center',
      showDescription: true,
    }
  });
  
  // Add name field
  defaultFields.push({
    type: 'text',
    id: uuidv4(),
    label: 'الاسم الكامل',
    placeholder: 'أدخل الاسم الكامل',
    required: true,
    icon: 'user',
  });
  
  // Add phone field
  defaultFields.push({
    type: 'phone',
    id: uuidv4(),
    label: 'رقم الهاتف',
    placeholder: 'أدخل رقم الهاتف',
    required: true,
    icon: 'phone',
  });
  
  // Add city field
  defaultFields.push({
    type: 'text',
    id: uuidv4(),
    label: 'المدينة',
    placeholder: 'أدخل اسم المدينة',
    required: true,
    icon: 'map-pin',
  });
  
  // Add address field
  defaultFields.push({
    type: 'textarea',
    id: uuidv4(),
    label: 'العنوان',
    placeholder: 'أدخل العنوان الكامل',
    required: true,
  });
  
  // Add submit button with updated configuration
  defaultFields.push({
    type: 'submit',
    id: uuidv4(),
    label: 'الدفع عند الاستلام',
    style: {
      backgroundColor: '#000000',
      color: '#ffffff',
      fontSize: '1.15rem',
      fontWeight: '500',
      animation: true,
      animationType: 'shake',
      borderRadius: '6px',
      borderColor: '#eaeaff',
      borderWidth: '0px',
      paddingY: '12px',
      showIcon: true,
      icon: 'shopping-cart',
      iconPosition: 'left',
    },
  });
  
  const defaultStep: FormStep = {
    id: '1',
    title: 'Main Step',
    fields: defaultFields
  };
  
  return [defaultStep];
};

// Form templates
export const formTemplates = [
  {
    id: 1,
    title: 'Simple Contact Form',
    description: 'A basic contact form with name, email, and message fields',
    primaryColor: '#d97706',
    data: [
      {
        id: '1',
        title: 'Contact Information',
        fields: [
          {
            id: 'form-title-1',
            type: 'form-title' as FormFieldType,
            label: 'Contact Us',
            helpText: 'We\'ll get back to you as soon as possible',
            style: {
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backgroundColor: '#d97706'
            }
          },
          {
            id: 'name-1',
            type: 'text' as FormFieldType,
            label: 'Name',
            placeholder: 'Your name',
            required: true
          },
          {
            id: 'email-1',
            type: 'email' as FormFieldType,
            label: 'Email',
            placeholder: 'Your email address',
            required: true
          },
          {
            id: 'message-1',
            type: 'textarea' as FormFieldType,
            label: 'Message',
            placeholder: 'Your message',
            required: true
          },
          {
            id: 'submit-1',
            type: 'submit' as FormFieldType,
            label: 'Send Message',
            style: {
              backgroundColor: '#d97706',
              color: '#ffffff',
              fontSize: '1rem'
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Product Order Form',
    description: 'A form for collecting order information',
    primaryColor: '#3b82f6',
    data: [
      {
        id: '1',
        title: 'Order Information',
        fields: [
          {
            id: 'form-title-2',
            type: 'form-title' as FormFieldType,
            label: 'Place Your Order',
            helpText: 'Fill out the form below to place your order',
            style: {
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backgroundColor: '#3b82f6'
            }
          },
          {
            id: 'cart-items-1',
            type: 'cart-items' as FormFieldType,
            label: ''
          },
          {
            id: 'cart-summary-1',
            type: 'cart-summary' as FormFieldType,
            label: ''
          },
          {
            id: 'customer-name',
            type: 'text' as FormFieldType,
            label: 'Full Name',
            placeholder: 'Your full name',
            required: true
          },
          {
            id: 'customer-phone',
            type: 'phone' as FormFieldType,
            label: 'Phone Number',
            placeholder: 'Your phone number',
            required: true
          },
          {
            id: 'customer-address',
            type: 'textarea' as FormFieldType,
            label: 'Delivery Address',
            placeholder: 'Your complete address',
            required: true
          },
          {
            id: 'submit-2',
            type: 'submit' as FormFieldType,
            label: 'Place Order',
            style: {
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '1.2rem',
              animation: true,
              animationType: 'pulse'
            }
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Appointment Booking Form',
    description: 'A form for scheduling appointments',
    primaryColor: '#115e59',
    data: [
      {
        id: '1',
        title: 'Personal Information',
        fields: [
          {
            id: 'form-title-3',
            type: 'form-title' as FormFieldType,
            label: 'Book Your Appointment',
            helpText: 'Fill in your details to schedule an appointment',
            style: {
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backgroundColor: '#115e59'
            }
          },
          {
            id: 'customer-name-3',
            type: 'text' as FormFieldType,
            label: 'Full Name',
            placeholder: 'Your full name',
            required: true
          },
          {
            id: 'customer-email-3',
            type: 'email' as FormFieldType,
            label: 'Email Address',
            placeholder: 'Your email address',
            required: true
          },
          {
            id: 'customer-phone-3',
            type: 'phone' as FormFieldType,
            label: 'Phone Number',
            placeholder: 'Your phone number',
            required: true
          }
        ]
      },
      {
        id: '2',
        title: 'Appointment Details',
        fields: [
          {
            id: 'appointment-date',
            type: 'date' as FormFieldType,
            label: 'Preferred Date',
            required: true
          },
          {
            id: 'appointment-time',
            type: 'time' as FormFieldType,
            label: 'Preferred Time',
            required: true
          },
          {
            id: 'appointment-service',
            type: 'select' as FormFieldType,
            label: 'Service',
            required: true,
            options: [
              { label: 'Consultation', value: 'consultation' },
              { label: 'Follow-up', value: 'follow-up' },
              { label: 'Treatment', value: 'treatment' }
            ]
          },
          {
            id: 'appointment-notes',
            type: 'textarea' as FormFieldType,
            label: 'Additional Notes',
            placeholder: 'Any specific requirements or concerns'
          },
          {
            id: 'submit-3',
            type: 'submit' as FormFieldType,
            label: 'Book Appointment',
            style: {
              backgroundColor: '#115e59',
              color: '#ffffff',
              fontSize: '1.2rem'
            }
          }
        ]
      }
    ]
  }
];
