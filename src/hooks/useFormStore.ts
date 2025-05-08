
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
    // Ensure translations object exists
    const translations = state.formState.translations || {
      ar: { title: '', description: '', submitButtonText: 'إرسال الطلب', fields: {} },
      en: { title: '', description: '', submitButtonText: 'Submit', fields: {} },
      fr: { title: '', description: '', submitButtonText: 'Soumettre', fields: {} }
    };
    
    // Get translated values for current language
    const currentLangTranslations = translations[language] || {};
    
    console.log(`Switching to language: ${language}, translations:`, currentLangTranslations);
    
    return {
      formState: {
        ...state.formState,
        formLanguage: language,
        rtl: language === 'ar',
        // Update form title, description and submit button from translations
        title: currentLangTranslations.title || state.formState.title,
        description: currentLangTranslations.description || state.formState.description,
        submitButtonText: currentLangTranslations.submitButtonText || 
          (language === 'ar' ? 'إرسال الطلب' : language === 'en' ? 'Submit' : 'Soumettre'),
        // Ensure translations object is preserved
        translations: translations
      }
    };
  }),
  
  getFieldTranslation: (fieldId, propertyName, language) => {
    const state = get();
    const currentLang = language || state.formState.formLanguage || 'ar';
    
    // Check if translations object exists
    if (!state.formState.translations) {
      console.log('No translations object found');
      return undefined;
    }
    
    // Safely access nested properties
    const langTranslations = state.formState.translations[currentLang];
    if (!langTranslations) {
      console.log(`No translations found for language: ${currentLang}`);
      return undefined;
    }
    
    const fields = langTranslations.fields;
    if (!fields) {
      console.log(`No fields found in ${currentLang} translations`);
      return undefined;
    }
    
    const fieldTranslations = fields[fieldId];
    if (!fieldTranslations) {
      console.log(`No translations found for field: ${fieldId}`);
      return undefined;
    }
    
    // Return the property value
    return fieldTranslations[propertyName];
  },
  
  setFieldTranslation: (fieldId, propertyName, value, language) => set((state) => {
    const currentLang = language || state.formState.formLanguage || 'ar';
    
    // Create a deep copy of existing translations or initialize new structure
    let newTranslations = { ar: {}, en: {}, fr: {} };
    
    // Copy existing translations if they exist
    if (state.formState.translations) {
      // Deep copy to avoid mutation
      newTranslations = JSON.parse(JSON.stringify(state.formState.translations));
    }
    
    // Ensure language object exists
    if (!newTranslations[currentLang]) {
      newTranslations[currentLang] = {};
    }
    
    // Ensure fields object exists
    if (!newTranslations[currentLang].fields) {
      newTranslations[currentLang].fields = {};
    }
    
    // Ensure field object exists
    if (!newTranslations[currentLang].fields[fieldId]) {
      newTranslations[currentLang].fields[fieldId] = {};
    }
    
    // Set the property
    newTranslations[currentLang].fields[fieldId][propertyName] = value;
    
    console.log(`Set translation for ${fieldId}.${propertyName} in ${currentLang}:`, value);
    
    return {
      formState: {
        ...state.formState,
        translations: newTranslations
      }
    };
  })
}));
