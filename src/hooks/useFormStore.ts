
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

// Default styles - these are the guaranteed default settings
const defaultFormStyle: FormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '1.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
  borderColor: '#9b87f5',
  borderWidth: '2px',
  backgroundColor: '#F9FAFB', // Fixed form background color
  paddingTop: '20px',
  paddingBottom: '20px',
  paddingLeft: '20px',
  paddingRight: '20px',
  formGap: '16px',
  formDirection: 'ltr',
  floatingLabels: false
};

// Default form state with guaranteed values
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
    
    // Handle style updates separately from other form properties
    let updatedStyle = { ...currentStyle };
    
    // If the form has style updates, apply them while preserving fixed default settings
    if (form.style) {
      // Deep copy to prevent reference issues
      const newStyleProps = JSON.parse(JSON.stringify(form.style));
      
      // Apply the style updates normally
      updatedStyle = {
        ...updatedStyle,
        ...newStyleProps,
      };
      console.log('Applied standard style update');
    }
    
    // Create a deep copy of the new form state to prevent mutation
    const newFormState = {
      ...state.formState,
      ...form
    };
    
    // Make sure we don't accidentally delete the style object
    if (!newFormState.style) {
      newFormState.style = updatedStyle;
    } else {
      newFormState.style = updatedStyle;
    }
    
    console.log('Final form state style:', newFormState.style);
    
    return {
      formState: newFormState
    };
  }),
  
  resetFormState: () => set({ formState: JSON.parse(JSON.stringify(defaultFormState)) }),
  
  // Add custom method for style updates to prevent reference issues
  updateFormStyle: (styleUpdates) => set((state) => {
    console.log('updateFormStyle called with:', styleUpdates);
    
    // Create a deep copy of the current style
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // Apply updates normally
    const updatedStyle = {
      ...currentStyle,
      ...styleUpdates,
    };
    
    console.log('Applied style update');
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
