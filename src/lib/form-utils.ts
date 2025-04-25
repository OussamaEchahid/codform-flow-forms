import { toast } from "sonner";

export interface FieldStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  padding?: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  style?: FieldStyle;
  content?: string; // Add the content property to support text/html fields
}

export interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: number;
  title: string;
  description: string;
  steps: number;
  fields: number;
  data: FormStep[];
}

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Create a new empty form step
export const createEmptyStep = (stepNumber: number): FormStep => {
  return {
    id: generateId(),
    title: `خطوة ${stepNumber}`,
    fields: []
  };
};

// Create a new empty field
export const createEmptyField = (type: string): FormField => {
  return {
    id: generateId(),
    type,
    label: 'حقل جديد',
    placeholder: '',
    required: false,
    style: {
      backgroundColor: '#ffffff',
      color: '#333333',
      fontSize: '1rem',
      borderRadius: '0.5rem',
      borderWidth: '1px',
      borderColor: '#e2e8f0'
    }
  };
};

// Validate form data
export const validateFormData = (formData: any, fields: FormField[]): boolean => {
  for (const field of fields) {
    if (field.required && (!formData[field.id] || formData[field.id] === '')) {
      toast.error(`الحقل "${field.label}" مطلوب`);
      return false;
    }
    
    if (field.type === 'email' && formData[field.id]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData[field.id])) {
        toast.error(`البريد الإلكتروني غير صالح`);
        return false;
      }
    }
    
    if (field.type === 'phone' && formData[field.id]) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData[field.id].replace(/\D/g, ''))) {
        toast.error(`رقم الهاتف غير صالح`);
        return false;
      }
    }
  }
  
  return true;
};

// Sample form templates
export const formTemplates: FormTemplate[] = [
  {
    id: 1,
    title: 'نموذج التوصيل الأساسي',
    description: 'نموذج طلب بسيط للدفع عند الاستلام',
    steps: 1,
    fields: 5,
    data: [
      {
        id: '1',
        title: 'تفاصيل التوصيل',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'الاسم الكامل',
            placeholder: 'أدخل الاسم الكامل',
            required: true
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'رقم الهاتف',
            placeholder: 'أدخل رقم الهاتف',
            required: true
          },
          {
            id: 'city',
            type: 'text',
            label: 'المدينة',
            placeholder: 'أدخل المدينة',
            required: true
          },
          {
            id: 'address',
            type: 'textarea',
            label: 'العنوان',
            placeholder: 'أدخل العنوان التفصيلي',
            required: true
          },
          {
            id: 'email',
            type: 'email',
            label: 'البريد الإلكتروني',
            placeholder: 'example@email.com',
            required: false
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'نموذج التوصيل السريع',
    description: 'نموذج مع خيارات التوصيل السريع',
    steps: 1,
    fields: 6,
    data: [
      {
        id: '1',
        title: 'معلومات الطلب والتوصيل',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'الاسم الكامل',
            placeholder: 'أدخل الاسم الكامل',
            required: true
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'رقم الهاتف',
            placeholder: 'أدخل رقم الهاتف',
            required: true
          },
          {
            id: 'city',
            type: 'text',
            label: 'المدينة',
            placeholder: 'أدخل المدينة',
            required: true
          },
          {
            id: 'address',
            type: 'textarea',
            label: 'العنوان',
            placeholder: 'أدخل العنوان التفصيلي',
            required: true
          },
          {
            id: 'delivery',
            type: 'radio',
            label: 'نوع التوصيل',
            options: ['توصيل مجاني', 'توصيل سريع'],
            required: true
          }
        ]
      }
    ]
  }
];
