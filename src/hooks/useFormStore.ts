
import { create } from 'zustand';

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
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  resetFormState: () => void;
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
  buttonStyle: 'rounded'
};

export const useFormStore = create<FormStore>((set) => ({
  formState: {...defaultFormState},
  setFormState: (form) => set((state) => ({
    formState: {
      ...state.formState,
      ...form
    }
  })),
  resetFormState: () => set({ formState: {...defaultFormState} })
}));
