
import { cn } from '@/lib/utils';

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
  'text/html';  // Added text/html type

export interface FormField {
  id: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  helpText?: string;
  name?: string;
  isStep?: boolean;
  stepId?: string;
  stepIndex?: number;
  [key: string]: any;
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
}

export interface FloatingButtonConfig {
  enabled?: boolean;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  paddingY?: string;
  marginBottom?: string;
  showIcon?: boolean;
  icon?: string;
  animation?: string;
  animationType?: string;
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
  const newId = `${type}-${Date.now()}`;
  let newField: FormField = {
    id: newId,
    type: type,
    required: false
  };
  
  switch(type) {
    case 'text':
      newField.label = 'Text Field';
      newField.placeholder = 'Enter text here';
      break;
    case 'email':
      newField.label = 'Email';
      newField.placeholder = 'Enter your email';
      break;
    case 'phone':
      newField.label = 'Phone Number';
      newField.placeholder = 'Enter your phone number';
      break;
    case 'textarea':
      newField.label = 'Text Area';
      newField.placeholder = 'Enter your message here';
      break;
    case 'select':
      newField.label = 'Select Option';
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ];
      break;
    case 'checkbox':
      newField.label = 'Checkbox Option';
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
      break;
    case 'radio':
      newField.label = 'Radio Option';
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
      break;
    case 'submit':
      newField.label = 'Submit Form';
      newField.style = {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: '1rem',
        animation: false
      };
      break;
    case 'form-title':
      newField.label = 'Form Title';
      newField.helpText = 'Form description goes here';
      newField.style = {
        textAlign: 'center',
        color: '#1a202c',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        backgroundColor: '#f7fafc'
      };
      break;
    case 'text/html':
      newField.label = 'HTML Content';
      newField.content = '<p>Enter your HTML content here</p>';
      break;
    case 'cart-items':
      newField.label = 'Cart Items';
      break;
    case 'cart-summary':
      newField.label = 'Order Summary';
      break;
    case 'whatsapp':
      newField.label = 'WhatsApp Contact';
      newField.phoneNumber = '';
      newField.message = 'Hello, I would like to inquire about...';
      break;
    case 'title':
      newField.label = 'Section Title';
      newField.style = {
        textAlign: 'center',
        fontSize: '1.25rem',
        fontWeight: 'bold'
      };
      break;
    default:
      newField.label = 'New Field';
      break;
  }
  
  return newField;
};

// Function to create a default form
export const createDefaultForm = (): FormStep[] => {
  return [
    {
      id: '1',
      title: 'Customer Information',
      fields: [
        createEmptyField('form-title'),
        createEmptyField('text'),
        createEmptyField('email'),
        createEmptyField('phone'),
        createEmptyField('textarea'),
        createEmptyField('submit')
      ]
    }
  ];
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
            type: 'form-title',
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
            type: 'text',
            label: 'Name',
            placeholder: 'Your name',
            required: true
          },
          {
            id: 'email-1',
            type: 'email',
            label: 'Email',
            placeholder: 'Your email address',
            required: true
          },
          {
            id: 'message-1',
            type: 'textarea',
            label: 'Message',
            placeholder: 'Your message',
            required: true
          },
          {
            id: 'submit-1',
            type: 'submit',
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
            type: 'form-title',
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
            type: 'cart-items',
            label: ''
          },
          {
            id: 'cart-summary-1',
            type: 'cart-summary',
            label: ''
          },
          {
            id: 'customer-name',
            type: 'text',
            label: 'Full Name',
            placeholder: 'Your full name',
            required: true
          },
          {
            id: 'customer-phone',
            type: 'phone',
            label: 'Phone Number',
            placeholder: 'Your phone number',
            required: true
          },
          {
            id: 'customer-address',
            type: 'textarea',
            label: 'Delivery Address',
            placeholder: 'Your complete address',
            required: true
          },
          {
            id: 'submit-2',
            type: 'submit',
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
            type: 'form-title',
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
            type: 'text',
            label: 'Full Name',
            placeholder: 'Your full name',
            required: true
          },
          {
            id: 'customer-email-3',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Your email address',
            required: true
          },
          {
            id: 'customer-phone-3',
            type: 'phone',
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
            type: 'date',
            label: 'Preferred Date',
            required: true
          },
          {
            id: 'appointment-time',
            type: 'time',
            label: 'Preferred Time',
            required: true
          },
          {
            id: 'appointment-service',
            type: 'select',
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
            type: 'textarea',
            label: 'Additional Notes',
            placeholder: 'Any specific requirements or concerns'
          },
          {
            id: 'submit-3',
            type: 'submit',
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
