
import { create } from 'zustand';

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
  style: {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  }
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
