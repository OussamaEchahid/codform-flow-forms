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
  // Style properties stored in formStyle object for consistency
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
  // For storing form styling in database compatible format
  _formStyles?: any;
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

const defaultFormState: FormState = {
  id: '',
  title: 'نموذج جديد',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  submitButtonText: 'إرسال الطلب',
  formStyle: {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
  // Also set top-level style properties for backward compatibility
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
  isDirty: false,
  lastSaved: Date.now()
};

// Using persist middleware to keep form state in localStorage as a backup
export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      formState: {...defaultFormState},
      setFormState: (form) => set((state) => {
        // Ensure style properties are synchronized
        const formStyle = {
          ...(state.formState.formStyle || {}),
          ...(form.formStyle || {}),
          primaryColor: form.primaryColor || form.formStyle?.primaryColor || state.formState.formStyle?.primaryColor || state.formState.primaryColor,
          borderRadius: form.borderRadius || form.formStyle?.borderRadius || state.formState.formStyle?.borderRadius || state.formState.borderRadius,
          fontSize: form.fontSize || form.formStyle?.fontSize || state.formState.formStyle?.fontSize || state.formState.fontSize,
          buttonStyle: form.buttonStyle || form.formStyle?.buttonStyle || state.formState.formStyle?.buttonStyle || state.formState.buttonStyle,
        };
        
        // Ensure top-level style properties are synchronized with formStyle
        const updatedForm = {
          ...state.formState,
          ...form,
          formStyle,
          primaryColor: formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle,
          isDirty: form.isDirty !== false // Keep dirty flag unless explicitly set to false
        };
        
        return {
          formState: updatedForm
        };
      }),
      updateFormData: (data) => set((state) => ({
        formState: {
          ...state.formState,
          data: data,
          isDirty: true
        }
      })),
      updateFormStyle: (style) => set((state) => {
        const formStyle = {
          ...(state.formState.formStyle || {}),
          ...style,
        };
        
        return {
          formState: {
            ...state.formState,
            primaryColor: style.primaryColor || state.formState.primaryColor,
            borderRadius: style.borderRadius || state.formState.borderRadius,
            fontSize: style.fontSize || state.formState.fontSize,
            buttonStyle: style.buttonStyle || state.formState.buttonStyle,
            formStyle,
            isDirty: true
          }
        };
      }),
      resetFormState: () => set({ formState: {...defaultFormState} }),
      markAsSaved: () => set((state) => ({
        formState: {
          ...state.formState,
          isDirty: false,
          lastSaved: Date.now()
        }
      })),
      markAsDirty: () => set((state) => ({
        formState: {
          ...state.formState,
          isDirty: true
        }
      }))
    }),
    {
      name: 'form-store', // name for localStorage
      partialize: (state) => ({ formState: state.formState }), // Only store formState in localStorage
    }
  )
);
