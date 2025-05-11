
import { create } from 'zustand';

export interface FormState {
  id: string;
  title: string;
  description?: string;
  data: any[];
  isPublished: boolean;
  shop_id?: string;
  submitButtonText?: string; // Added this field
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  resetFormState: () => void;
}

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  submitButtonText: 'إرسال الطلب' // Added default value
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
