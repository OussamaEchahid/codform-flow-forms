
import { v4 as uuidv4 } from 'uuid';

// تعريف أنواع النموذج
export type FormId = string;
export type FieldId = string;

// أنواع حقول النموذج المدعومة
export type FormFieldType =
  'text' |
  'textarea' |
  'select' |
  'radio' |
  'checkbox' |
  'title' |
  'countdown' |
  'image' |
  'whatsapp' |
  'cart-items' |
  'cart-summary' |
  'shipping' |  // إضافة نوع الشحن
  'phone' |  
  'email' |  // إضافة نوع البريد الإلكتروني
  'form-title' |  
  'text/html' |  
  'submit'; // إضافة نوع زر الإرسال

// تعريف خيارات الحقل
export interface FormFieldOption {
  value: string;
  label: string;
}

// نمط الحقل - خصائص تنسيق الحقل
export interface FormFieldStyle {
  // الخصائص العامة
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  padding?: string;
  margin?: string;
  opacity?: string;
  
  // خصائص خاصة بالتسميات
  labelColor?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  
  // خصائص خاصة بالمساعدة
  helpTextColor?: string;
  helpTextFontSize?: string;
  
  // خصائص العرض
  display?: string;
  showLabel?: boolean;
  showIcon?: boolean;
  paddingY?: string;
  
  // خصائص خاصة بالعنوان
  showTitle?: boolean;
  showDescription?: boolean;
  descriptionColor?: string;
  descriptionFontSize?: string;
  
  // خصائص عناصر السلة والملخص
  priceFontSize?: string;
  priceColor?: string;
  valueFontSize?: string;
  valueColor?: string;
  totalLabelFontSize?: string;
  totalLabelColor?: string;
  totalValueFontSize?: string;
  totalValueColor?: string;
  
  // خصائص إضافية للحقول
  fullWidth?: boolean;
  fontFamily?: string;
  icon?: string;
  
  // خصائص التأثيرات الحركية
  animation?: boolean;
  animationType?: 'pulse' | 'shake' | 'bounce' | 'wiggle' | 'flash' | 'none';
}

// تعريف حقل النموذج
export interface FormField {
  id: FieldId;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  icon?: string;
  style?: FormFieldStyle;
  options?: FormFieldOption[];
  defaultValue?: string;
  maxLength?: number;
  minLength?: number;
  max?: number;
  min?: number;
  step?: number;
  pattern?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  rows?: number;
  src?: string; // لحقول الصور
  alt?: string; // نص بديل للصور
  width?: string; // عرض الصور أو الحقول
  height?: string; // ارتفاع الصور أو الحقول
  autoplay?: boolean; // لحقول الفيديو
  controls?: boolean; // لحقول الفيديو
  autoSubmit?: boolean; // تقديم تلقائي بعد الاختيار
  content?: string; // محتوى HTML أو نص عادي
  alignment?: 'left' | 'center' | 'right'; // محاذاة العناصر
  phoneCode?: string; // رمز البلد لأرقام الهاتف
  format?: string; // تنسيق للتاريخ أو أنواع أخرى
  validation?: string; // قواعد التحقق المخصصة
  data?: Record<string, any>; // بيانات إضافية للحقل
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationSchema?: any; // مخطط التحقق
}

// تعريف خطوة النموذج
export interface FormStep {
  id: string;
  title?: string;
  fields: FormField[];
}

// تعريف زر عائم
export interface FloatingButtonConfig {
  enabled: boolean;
  text?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'bottom' | 'top' | 'left' | 'right';
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  icon?: string;
  showIcon?: boolean;
  marginBottom?: string;
  action?: 'scroll-to-form' | 'open-popup' | 'whatsapp';
  whatsappNumber?: string;
  whatsappMessage?: string;
  animation?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

// تعريف النموذج
export interface Form {
  id: FormId;
  title: string;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  style: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: 'rounded' | 'square' | 'pill';
  };
  steps: FormStep[];
  settings?: {
    redirectUrl?: string;
    successMessage?: string;
    errorMessage?: string;
    submitButtonText?: string;
    submitButtonIcon?: string;
    storeDataInDatabase?: boolean;
    sendEmail?: boolean;
    emailTo?: string;
    emailSubject?: string;
    emailTemplate?: string;
    autoResponder?: boolean;
    autoResponderSubject?: string;
    autoResponderTemplate?: string;
    trackFormAnalytics?: boolean;
    confirmationRequired?: boolean;
    confirmationMessage?: string;
    customClasses?: string;
    customJavaScript?: string;
    customCss?: string;
  };
  floatingButton?: FloatingButtonConfig;
}

// وظائف مساعدة لإنشاء عناصر جديدة
export const createNewField = (type: FormFieldType, language: 'en' | 'ar' = 'en'): FormField => {
  const id = `${type}-${Date.now()}`;
  const newField: FormField = {
    id,
    type,
  };

  // تعيين التسميات الافتراضية بناءً على نوع الحقل واللغة
  if (language === 'ar') {
    switch (type) {
      case 'text':
        newField.label = 'حقل نصي';
        newField.placeholder = 'أدخل النص هنا';
        break;
      case 'email':
        newField.label = 'البريد الإلكتروني';
        newField.placeholder = 'أدخل بريدك الإلكتروني';
        break;
      case 'phone':
        newField.label = 'رقم الهاتف';
        newField.placeholder = 'أدخل رقم الهاتف';
        break;
      case 'textarea':
        newField.label = 'وصف';
        newField.placeholder = 'أدخل وصفًا هنا';
        break;
      case 'select':
        newField.label = 'اختر خيارًا';
        newField.options = [
          { value: 'option1', label: 'الخيار الأول' },
          { value: 'option2', label: 'الخيار الثاني' },
          { value: 'option3', label: 'الخيار الثالث' }
        ];
        break;
      case 'radio':
        newField.label = 'اختر واحدًا';
        newField.options = [
          { value: 'option1', label: 'الخيار الأول' },
          { value: 'option2', label: 'الخيار الثاني' }
        ];
        break;
      case 'checkbox':
        newField.label = 'اختر كل ما ينطبق';
        newField.options = [
          { value: 'option1', label: 'الخيار الأول' },
          { value: 'option2', label: 'الخيار الثاني' }
        ];
        break;
      case 'title':
        newField.label = 'عنوان القسم';
        newField.style = {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333333',
        };
        break;
      case 'form-title':
        newField.label = 'عنوان النموذج';
        newField.helpText = 'وصف النموذج';
        newField.style = {
          backgroundColor: '#9b87f5',
          color: '#ffffff',
          fontSize: '24px',
          textAlign: 'right',
          fontWeight: 'bold',
          descriptionColor: '#ffffff',
          descriptionFontSize: '14px',
          showTitle: true,
          showDescription: true
        };
        break;
      case 'image':
        newField.label = 'صورة';
        newField.src = 'https://via.placeholder.com/400x200?text=صورة';
        break;
      case 'whatsapp':
        newField.label = 'تواصل عبر واتساب';
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
          animationType: 'pulse'
        };
        break;
      case 'shipping':
        newField.label = 'خيارات الشحن';
        newField.options = [
          { value: 'standard', label: 'الشحن القياسي' },
          { value: 'express', label: 'الشحن السريع' }
        ];
        break;
      case 'text/html':
        newField.label = 'محتوى HTML';
        newField.content = '<p>يمكنك إضافة أي محتوى HTML هنا</p>';
        break;
      case 'countdown':
        newField.label = 'العد التنازلي';
        break;
    }
  } else {
    // التسميات الإنجليزية الافتراضية
    switch (type) {
      case 'text':
        newField.label = 'Text';
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
        newField.label = 'Description';
        newField.placeholder = 'Enter a description here';
        break;
      case 'select':
        newField.label = 'Select an option';
        newField.options = [
          { value: 'option1', label: 'First Option' },
          { value: 'option2', label: 'Second Option' },
          { value: 'option3', label: 'Third Option' }
        ];
        break;
      case 'radio':
        newField.label = 'Choose one';
        newField.options = [
          { value: 'option1', label: 'First Option' },
          { value: 'option2', label: 'Second Option' }
        ];
        break;
      case 'checkbox':
        newField.label = 'Select all that apply';
        newField.options = [
          { value: 'option1', label: 'First Option' },
          { value: 'option2', label: 'Second Option' }
        ];
        break;
      case 'title':
        newField.label = 'Section Title';
        newField.style = {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333333',
        };
        break;
      case 'form-title':
        newField.label = 'Form Title';
        newField.helpText = 'Form Description';
        newField.style = {
          backgroundColor: '#9b87f5',
          color: '#ffffff',
          fontSize: '24px',
          textAlign: 'left',
          fontWeight: 'bold',
          descriptionColor: '#ffffff',
          descriptionFontSize: '14px',
          showTitle: true,
          showDescription: true
        };
        break;
      case 'image':
        newField.label = 'Image';
        newField.src = 'https://via.placeholder.com/400x200?text=Image';
        break;
      case 'whatsapp':
        newField.label = 'Contact via WhatsApp';
        break;
      case 'cart-items':
        newField.label = 'Selected Product';
        break;
      case 'cart-summary':
        newField.label = 'Order Summary';
        break;
      case 'submit':
        newField.label = 'Submit Order';
        newField.style = {
          backgroundColor: '#9b87f5',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse'
        };
        break;
      case 'shipping':
        newField.label = 'Shipping Options';
        newField.options = [
          { value: 'standard', label: 'Standard Shipping' },
          { value: 'express', label: 'Express Shipping' }
        ];
        break;
      case 'text/html':
        newField.label = 'HTML Content';
        newField.content = '<p>You can add any HTML content here</p>';
        break;
      case 'countdown':
        newField.label = 'Countdown Timer';
        break;
    }
  }

  return newField;
};

// إنشاء نموذج فارغ جديد
export const createEmptyForm = (language: 'en' | 'ar' = 'en'): Form => {
  const formId = uuidv4();
  const currentDate = new Date().toISOString();
  
  // إنشاء حقل عنوان افتراضي بناءً على اللغة
  const titleField = createNewField('form-title', language);
  
  // إنشاء حقول افتراضية بناءً على اللغة
  const nameField = createNewField('text', language);
  nameField.id = `text-${Date.now()}-1`;
  nameField.label = language === 'ar' ? 'الاسم' : 'Name';
  nameField.placeholder = language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name';
  nameField.required = true;
  nameField.icon = 'user';
  
  const phoneField = createNewField('phone', language);
  phoneField.id = `phone-${Date.now()}-2`;
  phoneField.label = language === 'ar' ? 'رقم الهاتف' : 'Phone Number';
  phoneField.placeholder = language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter your phone number';
  phoneField.required = true;
  phoneField.icon = 'phone';
  
  const cityField = createNewField('text', language);
  cityField.id = `city-${Date.now()}`;
  cityField.label = language === 'ar' ? 'المدينة' : 'City';
  cityField.placeholder = language === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name';
  cityField.icon = 'map-pin';
  
  const submitButton = createNewField('submit', language);
  submitButton.style = {
    backgroundColor: '#9b87f5',
    color: '#ffffff',
    fontSize: '18px',
    animation: true,
    animationType: 'pulse'
  };
  
  return {
    id: formId,
    title: language === 'ar' ? 'نموذج جديد' : 'New Form',
    version: 1,
    createdAt: currentDate,
    updatedAt: currentDate,
    published: false,
    style: {
      primaryColor: '#9b87f5',
      borderRadius: '0.5rem',
      fontSize: '16px',
      buttonStyle: 'rounded',
    },
    steps: [
      {
        id: uuidv4(),
        title: language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information',
        fields: [
          titleField,
          nameField,
          phoneField,
          cityField,
          submitButton
        ]
      }
    ]
  };
};

// Add the form templates export
export const formTemplates = [
  {
    id: 1,
    title: "نموذج طلب منتج",
    description: "نموذج بسيط لطلب منتج",
    data: [
      {
        id: "1",
        title: "معلومات الطلب",
        fields: [
          {
            id: "form-title-1",
            type: "form-title",
            label: "طلب منتج",
            helpText: "يرجى ملء البيانات التالية لإتمام الطلب",
            style: {
              backgroundColor: "#9b87f5",
              color: "#ffffff",
              fontSize: "24px",
              textAlign: "right",
              fontWeight: "bold",
              descriptionColor: "#ffffff",
              descriptionFontSize: "14px",
              showTitle: true,
              showDescription: true
            }
          },
          {
            id: "cart-items-1",
            type: "cart-items",
            label: "المنتج المختار",
            required: true
          },
          {
            id: "text-1",
            type: "text",
            label: "الاسم الكامل",
            placeholder: "أدخل اسمك الكامل",
            required: true,
            icon: "user"
          },
          {
            id: "phone-1",
            type: "phone",
            label: "رقم الهاتف",
            placeholder: "أدخل رقم الهاتف",
            required: true,
            icon: "phone"
          },
          {
            id: "text-2",
            type: "text",
            label: "المدينة",
            placeholder: "أدخل اسم المدينة",
            required: true,
            icon: "map-pin"
          },
          {
            id: "textarea-1",
            type: "textarea",
            label: "العنوان التفصيلي",
            placeholder: "أدخل العنوان التفصيلي",
            required: true,
            icon: "home"
          },
          {
            id: "cart-summary-1",
            type: "cart-summary",
            label: "ملخص الطلب"
          },
          {
            id: "submit-1",
            type: "submit",
            label: "إرسال الطلب",
            style: {
              backgroundColor: "#9b87f5",
              color: "#ffffff",
              fontSize: "18px",
              animation: true,
              animationType: "pulse"
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "نموذج التواصل",
    description: "نموذج للتواصل معك",
    data: [
      {
        id: "1",
        title: "معلومات التواصل",
        fields: [
          {
            id: "form-title-1",
            type: "form-title",
            label: "تواصل معنا",
            helpText: "يرجى ملء البيانات التالية وسنقوم بالرد عليك في أقرب وقت ممكن",
            style: {
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "24px",
              textAlign: "right",
              fontWeight: "bold",
              descriptionColor: "#ffffff",
              descriptionFontSize: "14px",
              showTitle: true,
              showDescription: true
            }
          },
          {
            id: "text-1",
            type: "text",
            label: "الاسم الكامل",
            placeholder: "أدخل اسمك الكامل",
            required: true,
            icon: "user"
          },
          {
            id: "email-1",
            type: "email",
            label: "البريد الإلكتروني",
            placeholder: "أدخل بريدك الإلكتروني",
            required: true,
            icon: "mail"
          },
          {
            id: "phone-1",
            type: "phone",
            label: "رقم الهاتف",
            placeholder: "أدخل رقم الهاتف",
            icon: "phone"
          },
          {
            id: "select-1",
            type: "select",
            label: "موضوع الرسالة",
            placeholder: "اختر موضوع الرسالة",
            required: true,
            options: [
              { value: "inquiry", label: "استفسار" },
              { value: "feedback", label: "اقتراح" },
              { value: "complaint", label: "شكوى" },
              { value: "other", label: "أخرى" }
            ]
          },
          {
            id: "textarea-1",
            type: "textarea",
            label: "الرسالة",
            placeholder: "اكتب رسالتك هنا",
            required: true,
            rows: 5
          },
          {
            id: "submit-1",
            type: "submit",
            label: "إرسال الرسالة",
            style: {
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "18px",
              animation: true,
              animationType: "pulse"
            }
          }
        ]
      }
    ]
  }
];

// Define createDefaultForm as an alias to createEmptyForm for compatibility
export const createDefaultForm = createEmptyForm;

// Define createEmptyField as an alias to createNewField for compatibility
export const createEmptyField = createNewField;

// وظائف مساعدة أخرى
export const duplicateField = (field: FormField): FormField => {
  return {
    ...field,
    id: `${field.type}-${Date.now()}-copy`,
  };
};

export const isValidForm = (form: Form): boolean => {
  // التحقق من صحة النموذج
  return (
    !!form.id &&
    !!form.title &&
    !!form.steps &&
    Array.isArray(form.steps) &&
    form.steps.every(
      (step) =>
        !!step.id &&
        !!step.fields &&
        Array.isArray(step.fields) &&
        step.fields.every((field) => !!field.id && !!field.type)
    )
  );
};
