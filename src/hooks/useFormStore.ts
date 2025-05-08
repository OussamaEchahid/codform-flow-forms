import { create } from 'zustand';

export interface FormState {
  id: string;
  title: string;
  description?: string;
  data: any[];
  isPublished: boolean;
  is_published?: boolean;
  shop_id?: string;
  submitButtonText?: string;
  // Add style properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  // Fixed to Arabic with RTL only
  formLanguage: 'ar';
  rtl: boolean;
  // Add translations to the interface but keep it simple for Arabic only
  translations?: {
    ar?: {
      title?: string;
      description?: string;
      submitButtonText?: string;
      fields?: Record<string, {
        label?: string;
        placeholder?: string;
        options?: string[];
      }>;
    };
  };
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  resetFormState: () => void;
  getFieldTranslation: (fieldId: string, property: string, language: string) => any;
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
  formLanguage: 'ar',
  rtl: true,
  translations: {
    ar: {
      title: 'نموذج جديد',
      description: '',
      submitButtonText: 'إرسال الطلب',
      fields: {}
    }
  }
};

export const useFormStore = create<FormStore>((set, get) => ({
  formState: {...defaultFormState},
  
  setFormState: (form) => {
    console.log("Setting form state:", form);
    
    set((state) => ({ 
      formState: { 
        ...state.formState, 
        ...form 
      } 
    }));
  },
  
  resetFormState: () => set({ formState: {...defaultFormState} }),

  getFieldTranslation: (fieldId, property, language) => {
    // Since we're only supporting Arabic, just return field data directly
    const state = get().formState;
    
    // Check if translations and fields exist
    if (state.translations?.ar?.fields && state.translations.ar.fields[fieldId]) {
      return state.translations.ar.fields[fieldId][property];
    }
    
    return undefined;
  }
}));
