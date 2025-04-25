
import { toast } from "sonner";

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
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
export const createEmptyField = (type: FormField['type']): FormField => {
  return {
    id: generateId(),
    type,
    label: 'حقل جديد',
    placeholder: '',
    required: false
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
    title: 'نموذج المتجر الأساسي',
    description: 'نموذج بسيط للمتاجر الصغيرة والمتوسطة',
    steps: 3,
    fields: 12,
    data: [
      {
        id: '1',
        title: 'معلومات العميل',
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'الاسم الكامل',
            placeholder: 'أدخل الاسم الكامل',
            required: true
          },
          {
            id: '2',
            type: 'email',
            label: 'البريد الإلكتروني',
            placeholder: 'example@mail.com',
            required: true
          },
          {
            id: '3',
            type: 'phone',
            label: 'رقم الهاتف',
            placeholder: '05xxxxxxxx',
            required: true
          }
        ]
      },
      {
        id: '2',
        title: 'عنوان التوصيل',
        fields: [
          {
            id: '4',
            type: 'text',
            label: 'المدينة',
            placeholder: 'أدخل المدينة',
            required: true
          },
          {
            id: '5',
            type: 'text',
            label: 'الحي',
            placeholder: 'أدخل الحي',
            required: true
          },
          {
            id: '6',
            type: 'textarea',
            label: 'العنوان التفصيلي',
            placeholder: 'أدخل العنوان التفصيلي',
            required: true
          }
        ]
      },
      {
        id: '3',
        title: 'تفاصيل المنتج',
        fields: [
          {
            id: '7',
            type: 'select',
            label: 'اللون',
            options: ['أحمر', 'أزرق', 'أسود', 'أبيض'],
            required: true
          },
          {
            id: '8',
            type: 'select',
            label: 'الحجم',
            options: ['صغير', 'متوسط', 'كبير'],
            required: true
          },
          {
            id: '9',
            type: 'textarea',
            label: 'ملاحظات إضافية',
            placeholder: 'أدخل أي ملاحظات إضافية تتعلق بالطلب',
            required: false
          }
        ]
      }
    ]
  }
];
