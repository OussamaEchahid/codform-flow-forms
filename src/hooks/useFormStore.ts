
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
  // Add style properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  // Add language support
  formLanguage?: 'ar' | 'en' | 'fr';
  rtl?: boolean;
  // Translation objects for multi-language support
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
    en?: {
      title?: string;
      description?: string;
      submitButtonText?: string;
      fields?: Record<string, {
        label?: string;
        placeholder?: string;
        options?: string[];
      }>;
    };
    fr?: {
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
  setFormLanguage: (language: 'ar' | 'en' | 'fr') => void;
  getFieldTranslation: (fieldId: string, propertyName: 'label' | 'placeholder' | 'options', language?: 'ar' | 'en' | 'fr') => any;
  setFieldTranslation: (fieldId: string, propertyName: 'label' | 'placeholder' | 'options', value: any, language?: 'ar' | 'en' | 'fr') => void;
}

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
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
    },
    en: {
      title: 'New Form',
      description: '',
      submitButtonText: 'Submit',
      fields: {}
    },
    fr: {
      title: 'Nouveau Formulaire',
      description: '',
      submitButtonText: 'Soumettre',
      fields: {}
    }
  }
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
  setFormLanguage: (language) => set((state) => {
    // Get translated values based on selected language
    const translations = state.formState.translations || {};
    const currentLangTranslations = translations[language] || {};
    
    return {
      formState: {
        ...state.formState,
        formLanguage: language,
        rtl: language === 'ar',
        // Update form title, description and submit button if translations exist
        ...(currentLangTranslations.title && { title: currentLangTranslations.title }),
        ...(currentLangTranslations.description && { description: currentLangTranslations.description }),
        ...(currentLangTranslations.submitButtonText && { submitButtonText: currentLangTranslations.submitButtonText })
      }
    };
  }),
  getFieldTranslation: (fieldId, propertyName, language) => {
    const state = get();
    const currentLang = language || state.formState.formLanguage || 'ar';
    const translations = state.formState.translations || {};
    const langTranslations = translations[currentLang]?.fields || {};
    
    return langTranslations[fieldId]?.[propertyName];
  },
  setFieldTranslation: (fieldId, propertyName, value, language) => set((state) => {
    const currentLang = language || state.formState.formLanguage || 'ar';
    const translations = {...state.formState.translations} || {};
    
    // Ensure language object exists
    if (!translations[currentLang]) {
      translations[currentLang] = { fields: {} };
    }
    
    // Ensure fields object exists
    if (!translations[currentLang].fields) {
      translations[currentLang].fields = {};
    }
    
    // Ensure field entry exists
    if (!translations[currentLang].fields[fieldId]) {
      translations[currentLang].fields[fieldId] = {};
    }
    
    // Set the translation
    translations[currentLang].fields[fieldId] = {
      ...translations[currentLang].fields[fieldId],
      [propertyName]: value
    };
    
    return {
      formState: {
        ...state.formState,
        translations
      }
    };
  })
}));
