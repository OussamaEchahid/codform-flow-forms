
import { create } from 'zustand';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // خصائص التنسيق
  borderColor: string;
  borderWidth: string;
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  formGap: string;
  formDirection: 'ltr' | 'rtl';
  floatingLabels: boolean;
}

export interface FormState {
  id: string;
  title: string;
  description?: string;
  data: any[];
  isPublished: boolean;
  shop_id?: string;
  created_at?: string;
  updated_at?: string;
  style?: FormStyle;
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  resetFormState: () => void;
  
  // إعدادات الزر العائم
  floatingButton: {
    enabled: boolean;
    text: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    borderWidth?: string;
    paddingY?: string;
    marginBottom?: string;
    showIcon?: boolean;
    icon?: string;
    animation?: string;
    position?: 'bottom' | 'top' | 'left' | 'right';
    showOnMobile?: boolean;
    showOnDesktop?: boolean;
  };
  
  // تحديث إعدادات الزر العائم
  updateFloatingButton: (config: any) => void;
  
  // إضافة طريقة مخصصة لتحديث نمط النموذج لمنع مشاكل المرجعية
  updateFormStyle: (styleUpdates: Partial<FormStyle>) => void;
}

// الأنماط الافتراضية - هذه هي الإعدادات الافتراضية المضمونة
const defaultFormStyle: FormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '1.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
  borderColor: '#9b87f5',
  borderWidth: '2px',
  backgroundColor: '#F9FAFB', // لون خلفية النموذج الثابت
  paddingTop: '20px',
  paddingBottom: '20px',
  paddingLeft: '20px',
  paddingRight: '20px',
  formGap: '16px',
  formDirection: 'ltr',
  floatingLabels: false
};

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  style: { ...defaultFormStyle }
};

export const useFormStore = create<FormStore>((set) => ({
  formState: {...defaultFormState},
  
  setFormState: (form) => set((state) => {
    // إنشاء نسخة عميقة من النمط الحالي لتجنب مشاكل المرجعية
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // معالجة تحديثات النمط بشكل منفصل عن خصائص النموذج الأخرى
    let updatedStyle = { ...currentStyle };
    
    // إذا كان النموذج يحتوي على تحديثات نمط، فطبقها مع الحفاظ على الإعدادات الافتراضية الثابتة
    if (form.style) {
      // نسخة عميقة لمنع مشاكل المرجعية
      const newStyleProps = JSON.parse(JSON.stringify(form.style));
      
      // حل مشكلة تغيير لون الخلفية: عند تحديث نمط العنوان، لا تغير خلفية النموذج بأكملها
      // خلفية العنوان تُحفظ في field.style.backgroundColor للحقل من النوع 'form-title'
      updatedStyle = {
        ...updatedStyle,
        ...newStyleProps,
        // دائمًا تأكد من الحفاظ على لون خلفية النموذج إلا إذا تم تغييره صراحةً لكل النموذج
        backgroundColor: newStyleProps.backgroundColor || currentStyle.backgroundColor || defaultFormStyle.backgroundColor,
      };
    }
    
    // إنشاء نسخة عميقة من حالة النموذج الجديدة لتجنب التعديل
    const newFormState = {
      ...state.formState,
      ...form
    };
    
    // تأكد من أننا لا نحذف عن طريق الخطأ كائن النمط
    if (!newFormState.style) {
      newFormState.style = updatedStyle;
    } else {
      newFormState.style = updatedStyle;
    }
    
    return {
      formState: newFormState
    };
  }),
  
  resetFormState: () => set({ formState: JSON.parse(JSON.stringify(defaultFormState)) }),
  
  // إضافة طريقة مخصصة لتحديثات النمط لمنع مشاكل المرجعية
  updateFormStyle: (styleUpdates) => set((state) => {
    // إنشاء نسخة عميقة من النمط الحالي
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // تطبيق التحديثات مع الحفاظ على القيم الافتراضية الأساسية
    const updatedStyle = {
      ...currentStyle,
      ...styleUpdates,
      // دائمًا حافظ على لون الخلفية ما لم يتم تغييره صراحةً
      // لا تسمح بنسخ لون خلفية العنوان إلى خلفية النموذج بالكامل
      backgroundColor: styleUpdates.hasOwnProperty('backgroundColor') ? 
                        styleUpdates.backgroundColor : 
                        currentStyle.backgroundColor || defaultFormStyle.backgroundColor
    };
    
    // سجل تغييرات النمط للتصحيح
    console.log('Updating form style:', updatedStyle);
    
    return {
      formState: {
        ...state.formState,
        style: updatedStyle
      }
    };
  }),
  
  // تكوين الزر العائم
  floatingButton: {
    enabled: false,
    text: 'Order Now',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    borderRadius: '4px',
    showIcon: true,
    icon: 'shopping-cart',
    position: 'bottom',
    showOnMobile: true,
    showOnDesktop: true,
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: '500',
    borderColor: '#000000',
    borderWidth: '0px',
    paddingY: '12px',
    marginBottom: '20px',
    animation: 'none',
  },
  
  // تحديث الزر العائم
  updateFloatingButton: (config) => set((state) => ({
    floatingButton: {
      ...state.floatingButton,
      ...config,
    }
  })),
}));

export default useFormStore;
