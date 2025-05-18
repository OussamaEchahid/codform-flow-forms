
import { create } from 'zustand';
import { FormFieldStyle } from '@/lib/form-utils';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
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
  formDirection?: 'ltr' | 'rtl';
  styleVersion?: number;
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  resetFormState: () => void;
  
  // إضافة تكوين للزر العائم
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
  
  // إضافة دالة لتحديث تكوين الزر العائم
  updateFloatingButton: (config: any) => void;
  
  // إضافة حالة متزامنة للتتبع
  syncState: {
    lastSynced: string | null;
    isInSync: boolean;
    syncErrors: string[];
  };
  
  // إضافة دالة لتحديث حالة التزامن
  updateSyncState: (state: Partial<FormStore['syncState']>) => void;
  
  // إضافة وظيفة للتحقق من أن الحقل يحتوي على جميع الخصائص المطلوبة
  ensureFieldStyle: (fieldId: string, fieldType: string, defaultStyle?: Partial<FormFieldStyle>) => void;
}

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  style: {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
  formDirection: 'rtl',
  styleVersion: 2, // إصدار النمط الجديد لتتبع التحديثات
};

export const useFormStore = create<FormStore>((set, get) => ({
  formState: {...defaultFormState},
  setFormState: (form) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      ...form 
    } 
  })),
  resetFormState: () => set({ formState: {...defaultFormState} }),
  
  // تهيئة تكوين الزر العائم مع كل الخصائص المطلوبة
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
  
  // إضافة طريقة لتحديث الزر العائم
  updateFloatingButton: (config) => set((state) => ({
    floatingButton: {
      ...state.floatingButton,
      ...config,
    }
  })),
  
  // تهيئة حالة التزامن
  syncState: {
    lastSynced: null,
    isInSync: false,
    syncErrors: [],
  },
  
  // إضافة دالة لتحديث حالة التزامن
  updateSyncState: (state) => set((currentState) => ({
    syncState: {
      ...currentState.syncState,
      ...state,
    }
  })),
  
  // إضافة وظيفة للتحقق من الحقل وتحديثه للتأكد من أنه يحتوي على جميع الخصائص المطلوبة
  ensureFieldStyle: (fieldId, fieldType, defaultStyle = {}) => {
    const { formState } = get();
    
    // البحث عن الخطوة والحقل
    const foundField = formState.data.flatMap((step: any) => step.fields).find((field: any) => field.id === fieldId);
    
    if (foundField) {
      const updatedFormState = { ...formState };
      
      // التأكد من وجود كائن النمط
      if (!foundField.style) {
        foundField.style = {};
      }
      
      // تطبيق الأنماط الافتراضية حسب النوع
      if (fieldType === 'form-title' || fieldType === 'title') {
        foundField.style = {
          ...foundField.style,
          textAlign: 'center', // دائمًا مركزية للتوافق مع عرض المتجر
          color: foundField.style.color || '#ffffff',
          fontSize: foundField.style.fontSize || (fieldType === 'form-title' ? '24px' : '20px'),
          fontWeight: foundField.style.fontWeight || 'bold',
          descriptionColor: foundField.style.descriptionColor || '#ffffff',
          descriptionFontSize: foundField.style.descriptionFontSize || '14px',
          backgroundColor: foundField.style.backgroundColor || defaultFormState.style?.primaryColor || '#9b87f5',
        };
      } else if (fieldType === 'submit') {
        foundField.style = {
          ...foundField.style,
          backgroundColor: foundField.style.backgroundColor || defaultFormState.style?.primaryColor || '#9b87f5',
          color: foundField.style.color || '#ffffff',
          fontSize: foundField.style.fontSize || '18px',
          fontWeight: foundField.style.fontWeight || '600',
          borderRadius: foundField.style.borderRadius || defaultFormState.style?.borderRadius || '8px',
          paddingY: foundField.style.paddingY || '14px',
          paddingX: foundField.style.paddingX || '24px',
        };
      }
      
      // دمج الأنماط المخصصة المقدمة
      foundField.style = {
        ...foundField.style,
        ...defaultStyle
      };
      
      // تحديث حالة النموذج
      set({ formState: updatedFormState });
      
      console.log(`Updated field ${fieldId} style:`, foundField.style);
    } else {
      console.warn(`Field ${fieldId} not found`);
    }
  }
}));

export default useFormStore;
