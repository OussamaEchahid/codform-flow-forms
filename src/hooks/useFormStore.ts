
import { create } from 'zustand';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // Formatting properties
  borderColor: string;
  borderWidth: string;
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  formGap?: string;
  formDirection?: 'ltr' | 'rtl';
  floatingLabels?: boolean;
  popupButton?: {
    enabled: boolean;
    text: string;
    position: string;
    fontSize: string;
    fontWeight: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    borderRadius: string;
    paddingY: string;
    animation: string;
    showIcon: boolean;
  };
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
  
  // Add custom method to update form style to prevent reference issues
  updateFormStyle: (styleUpdates: Partial<FormStyle>) => void;
}

// Default styles - UNIFIED FONT SIZE DEFAULTS
const defaultFormStyle: FormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '1.5rem',
  fontSize: '16px', // EXPLICIT DEFAULT FONT SIZE - this fixes the core issue
  buttonStyle: 'rounded',
  borderColor: '#9b87f5',
  borderWidth: '2px',
  backgroundColor: '#F9FAFB',
  paddingTop: '20px',
  paddingBottom: '20px',
  paddingLeft: '20px',
  paddingRight: '20px',
  formGap: '16px',
  formDirection: 'ltr',
  floatingLabels: false
};

// Default form state with guaranteed fontSize value
const defaultFormState: FormState = {
  id: '',
  title: '',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  style: { ...defaultFormStyle }
};

export const useFormStore = create<FormStore>((set) => ({
  formState: {...defaultFormState},
  
  setFormState: (form) => set((state) => {
    console.log('setFormState called with:', form);
    console.log('Current style:', state.formState.style);
    
    // Create a deep copy of the current style to prevent reference issues
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // ENSURE FONT SIZE IS ALWAYS SET - this is the key fix
    let updatedStyle = { 
      ...currentStyle,
      fontSize: currentStyle.fontSize || defaultFormStyle.fontSize // Always guarantee fontSize
    };
    
    // If the form has style updates, apply them while preserving fontSize defaults
    if (form.style) {
      // Deep copy to prevent reference issues
      const newStyleProps = JSON.parse(JSON.stringify(form.style));
      
      // Apply the style updates, ensuring fontSize is preserved
      updatedStyle = {
        ...updatedStyle,
        ...newStyleProps,
        fontSize: newStyleProps.fontSize || updatedStyle.fontSize || defaultFormStyle.fontSize
      };
      console.log('Applied style update with guaranteed fontSize:', updatedStyle.fontSize);
    }
    
    // Create a deep copy of the new form state to prevent mutation
    const newFormState = {
      ...state.formState,
      ...form,
      style: updatedStyle // Always use the updated style with guaranteed fontSize
    };
    
    console.log('Final form state style:', newFormState.style);
    
    return {
      formState: newFormState
    };
  }),
  
  resetFormState: () => set({ formState: JSON.parse(JSON.stringify(defaultFormState)) }),
  
  // UPDATED: Custom method for style updates with fontSize guarantee
  updateFormStyle: (styleUpdates) => set((state) => {
    console.log('updateFormStyle called with:', styleUpdates);
    
    // Create a deep copy of the current style
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // Apply updates with fontSize guarantee
    const updatedStyle = {
      ...currentStyle,
      ...styleUpdates,
      fontSize: styleUpdates.fontSize || currentStyle.fontSize || defaultFormStyle.fontSize
    };
    
    console.log('Applied style update with fontSize guarantee');
    console.log('Final style:', updatedStyle);
    
    return {
      formState: {
        ...state.formState,
        style: updatedStyle
      }
    };
  })
}));

export default useFormStore;
