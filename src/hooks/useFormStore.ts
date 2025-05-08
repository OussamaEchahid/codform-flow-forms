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
  // Style properties
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
  isDirty: false,
  lastSaved: Date.now()
};

// Using persist middleware to keep form state in localStorage as a backup
export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      formState: {...defaultFormState},
      setFormState: (form) => set((state) => ({
        formState: {
          ...state.formState,
          ...form,
          isDirty: true
        }
      })),
      updateFormData: (data) => set((state) => ({
        formState: {
          ...state.formState,
          data: data,
          isDirty: true
        }
      })),
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
