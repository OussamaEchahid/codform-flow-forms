
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
  // Style properties stored as top-level properties but also in the formStyle object for consistency
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
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

const defaultFormState: FormState = {
  id: '',
  title: 'نموذج جديد',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  submitButtonText: 'إرسال الطلب',
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
  formStyle: {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
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
          primaryColor: form.primaryColor || state.formState.primaryColor,
          borderRadius: form.borderRadius || state.formState.borderRadius,
          fontSize: form.fontSize || state.formState.fontSize,
          buttonStyle: form.buttonStyle || state.formState.buttonStyle,
        };
        
        return {
          formState: {
            ...state.formState,
            ...form,
            formStyle,
            isDirty: true
          }
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
