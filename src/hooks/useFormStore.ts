import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FormState {
  id: string;
  title: string;
  description?: string;
  data: any[];
  isPublished: boolean;
  is_published?: boolean; // Added for consistency with database field
  shop_id?: string;
  submitButtonText?: string;
  // Style properties are stored in formStyle object
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  // For backward compatibility, keep these top-level properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  // Track whether the form has unsaved changes
  isDirty?: boolean;
  // Track last save timestamp
  lastSaved?: number;
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  updateFormData: (data: any[]) => void;
  updateFormStyle: (style: Partial<FormState['formStyle']>) => void;
  resetFormState: () => void;
  markAsSaved: () => void;
  markAsDirty: () => void;
}

const defaultFormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
};

const defaultFormState: FormState = {
  id: '',
  title: 'نموذج جديد',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  submitButtonText: 'إرسال الطلب',
  formStyle: {...defaultFormStyle},
  // Also set top-level style properties for backward compatibility
  primaryColor: defaultFormStyle.primaryColor,
  borderRadius: defaultFormStyle.borderRadius,
  fontSize: defaultFormStyle.fontSize,
  buttonStyle: defaultFormStyle.buttonStyle,
  isDirty: false,
  lastSaved: Date.now()
};

// كود مساعد للدمج الآمن للكائنات بدون تغيير غير مقصود
const safeMerge = <T extends object>(original: T, updates: Partial<T>): T => {
  // إذا كان التحديث فارغاً، عد بالقيمة الأصلية كما هي
  if (!updates || Object.keys(updates).length === 0) {
    return original;
  }
  // إنشاء نسخة جديدة بدلاً من تعديل الأصل
  return { ...original, ...updates };
};

// Using persist middleware to keep form state in localStorage as a backup
export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      formState: {...defaultFormState},
      
      setFormState: (form) => set((state) => {
        // منع التحديثات غير الضرورية
        if (!form || Object.keys(form).length === 0) {
          return state;
        }
        
        // Prepare form style object, combining existing with new values
        const formStyle = safeMerge(
          state.formState.formStyle || defaultFormStyle,
          form.formStyle || {}
        );
        
        // If any top-level style properties are provided, update the formStyle object
        // but without triggering updates if values haven't changed
        if (form.primaryColor && form.primaryColor !== formStyle.primaryColor) {
          formStyle.primaryColor = form.primaryColor;
        }
        if (form.borderRadius && form.borderRadius !== formStyle.borderRadius) {
          formStyle.borderRadius = form.borderRadius;
        }
        if (form.fontSize && form.fontSize !== formStyle.fontSize) {
          formStyle.fontSize = form.fontSize;
        }
        if (form.buttonStyle && form.buttonStyle !== formStyle.buttonStyle) {
          formStyle.buttonStyle = form.buttonStyle;
        }
        
        // Update the form state with new values and sync style properties
        const updatedForm = {
          ...state.formState,
          ...form,
          formStyle,
          // Always sync top-level style properties with formStyle object
          primaryColor: formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle,
          // Keep dirty flag unless explicitly set to false
          isDirty: form.isDirty !== undefined ? form.isDirty : state.formState.isDirty
        };
        
        return {
          formState: updatedForm
        };
      }),
      
      updateFormData: (data) => set((state) => {
        // منع التحديثات غير الضرورية
        if (JSON.stringify(data) === JSON.stringify(state.formState.data)) {
          return state;
        }
        
        return {
          formState: {
            ...state.formState,
            data: data,
            isDirty: true
          }
        };
      }),
      
      updateFormStyle: (style) => set((state) => {
        // منع التحديثات غير الضرورية
        if (!style || Object.keys(style).length === 0) {
          return state;
        }
        
        const currentStyle = state.formState.formStyle || defaultFormStyle;
        
        // فحص ما إذا كانت هناك أي تغييرات فعلية
        let hasChanges = false;
        for (const key in style) {
          if (style[key as keyof typeof style] !== currentStyle[key as keyof typeof currentStyle]) {
            hasChanges = true;
            break;
          }
        }
        
        // إذا لم تكن هناك تغييرات، عد بالحالة كما هي
        if (!hasChanges) {
          return state;
        }
        
        const formStyle = safeMerge(currentStyle, style);
        
        return {
          formState: {
            ...state.formState,
            formStyle,
            // Keep top-level style properties in sync
            primaryColor: formStyle.primaryColor,
            borderRadius: formStyle.borderRadius,
            fontSize: formStyle.fontSize,
            buttonStyle: formStyle.buttonStyle,
            isDirty: true
          }
        };
      }),
      
      resetFormState: () => set({ 
        formState: {
          ...defaultFormState, 
          id: '', 
          lastSaved: Date.now()
        } 
      }),
      
      markAsSaved: () => set((state) => ({
        formState: {
          ...state.formState,
          isDirty: false,
          lastSaved: Date.now()
        }
      })),
      
      markAsDirty: () => set((state) => {
        // منع التحديثات غير الضرورية
        if (state.formState.isDirty) {
          return state;
        }
        
        return {
          formState: {
            ...state.formState,
            isDirty: true
          }
        };
      })
    }),
    {
      name: 'form-store', // name for localStorage
      partialize: (state) => ({ formState: state.formState }), // Only store formState in localStorage
    }
  )
);
