
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
  
  // تكوين الزر العائم
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
  
  // دالة لتحديث تكوين الزر العائم
  updateFloatingButton: (config: any) => void;
  
  // حالة متزامنة للتتبع
  syncState: {
    lastSynced: string | null;
    isInSync: boolean;
    syncErrors: string[];
  };
  
  // دالة لتحديث حالة التزامن
  updateSyncState: (state: Partial<FormStore['syncState']>) => void;
  
  // وظيفة للتحقق من أن الحقل يحتوي على جميع الخصائص المطلوبة
  ensureFieldStyle: (fieldId: string, fieldType: string, defaultStyle?: Partial<FormFieldStyle>) => void;
  
  // وظيفة لتنسيق قيم الأنماط
  normalizeStyleValues: (style?: Record<string, any>) => Record<string, any>;
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
  styleVersion: 2,
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
  
  // تهيئة تكوين الزر العائم
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
  
  // طريقة تحديث الزر العائم
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
  
  // دالة لتحديث حالة التزامن
  updateSyncState: (state) => set((currentState) => ({
    syncState: {
      ...currentState.syncState,
      ...state,
    }
  })),
  
  // وظيفة للتحقق من الحقل وتحديثه
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
          textAlign: 'center',
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
          width: foundField.style.fullWidth === false ? 'auto' : '100%',
          textAlign: 'center'
        };
      }
      
      // دمج الأنماط المخصصة المقدمة
      foundField.style = {
        ...foundField.style,
        ...defaultStyle
      };
      
      // تحديث حالة النموذج
      set({ formState: updatedFormState });
      
      console.log(`Updated field ${fieldId} style with enhanced compatibility:`, foundField.style);
      return foundField.style;
    } else {
      console.warn(`Field ${fieldId} not found`);
      return null;
    }
  },
  
  // وظيفة لتنسيق قيم الأنماط
  normalizeStyleValues: (style = {}) => {
    const normalizedStyle = { ...style };
    
    // تحويل قيم rem إلى px
    if (normalizedStyle.fontSize && normalizedStyle.fontSize.includes('rem')) {
      const remValue = parseFloat(normalizedStyle.fontSize);
      normalizedStyle.fontSize = `${remValue * 16}px`;
    }
    
    if (normalizedStyle.descriptionFontSize && normalizedStyle.descriptionFontSize.includes('rem')) {
      const remValue = parseFloat(normalizedStyle.descriptionFontSize);
      normalizedStyle.descriptionFontSize = `${remValue * 16}px`;
    }
    
    // تنسيق الألوان
    ['color', 'backgroundColor', 'descriptionColor', 'borderColor'].forEach(colorProp => {
      if (normalizedStyle[colorProp] && normalizedStyle[colorProp].startsWith('#') && normalizedStyle[colorProp].length === 4) {
        // تحويل #rgb إلى #rrggbb
        const r = normalizedStyle[colorProp][1];
        const g = normalizedStyle[colorProp][2];
        const b = normalizedStyle[colorProp][3];
        normalizedStyle[colorProp] = `#${r}${r}${g}${g}${b}${b}`;
      }
    });
    
    return normalizedStyle;
  }
}));

export default useFormStore;
