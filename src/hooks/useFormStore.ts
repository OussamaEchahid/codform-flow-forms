
import { create } from 'zustand';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // Styling properties
  borderColor: string;
  borderWidth: string;
  backgroundColor: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  formGap: string;
  formDirection: 'ltr' | 'rtl';
  floatingLabels: boolean;
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
  
  // Floating button configuration
  floatingButton: {
    enabled: boolean;
    text: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    borderWidth?: string;
    paddingY?: string;
    marginBottom?: string;
    showIcon?: boolean;
    icon?: string;
    animation?: string;
    position?: 'bottom' | 'top' | 'left' | 'right';
    showOnMobile?: boolean;
    showOnDesktop?: boolean;
  };
  
  // Update floating button configuration
  updateFloatingButton: (config: any) => void;
  
  // Add a dedicated method for updating form style to prevent reference issues
  updateFormStyle: (styleUpdates: Partial<FormStyle>) => void;
}

// Default styles - these are the guaranteed defaults
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

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  style: { ...defaultFormStyle }
};

export const useFormStore = create<FormStore>((set) => ({
  formState: {...defaultFormState},
  
  setFormState: (form) => set((state) => {
    // Create a deep copy of the current style to avoid reference issues
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // Handle style updates separately from other form properties
    let updatedStyle = { ...currentStyle };
    
    // If form contains style updates, apply them while preserving fixed defaults
    if (form.style) {
      // Deep copy to prevent reference issues
      const newStyleProps = JSON.parse(JSON.stringify(form.style));
      
      updatedStyle = {
        ...updatedStyle,
        ...newStyleProps,
        // Always ensure the default background color is maintained unless explicitly changed
        backgroundColor: newStyleProps.backgroundColor || currentStyle.backgroundColor || defaultFormStyle.backgroundColor,
      };
    }
    
    // Create a deep copy of the new form state to avoid mutation
    const newFormState = {
      ...state.formState,
      ...form
    };
    
    // Make sure we're not accidentally deleting the style object
    if (!newFormState.style) {
      newFormState.style = updatedStyle;
    } else {
      newFormState.style = updatedStyle;
    }
    
    return {
      formState: newFormState
    };
  }),
  
  resetFormState: () => set({ formState: JSON.parse(JSON.stringify(defaultFormState)) }),
  
  // Add dedicated method for style updates to prevent reference issues
  updateFormStyle: (styleUpdates) => set((state) => {
    // Create a deep copy of current style
    const currentStyle = state.formState.style ? 
      JSON.parse(JSON.stringify(state.formState.style)) : 
      { ...defaultFormStyle };
    
    // Apply updates while preserving key defaults
    const updatedStyle = {
      ...currentStyle,
      ...styleUpdates,
      // Always preserve the background color unless explicitly changed
      backgroundColor: styleUpdates.backgroundColor || currentStyle.backgroundColor || defaultFormStyle.backgroundColor
    };
    
    return {
      formState: {
        ...state.formState,
        style: updatedStyle
      }
    };
  }),
  
  // Floating button configuration
  floatingButton: {
    enabled: false,
    text: 'Order Now',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    borderRadius: '4px',
    showIcon: true,
    icon: 'shopping-cart',
    position: 'bottom',
    showOnMobile: true,
    showOnDesktop: true,
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: '500',
    borderColor: '#000000',
    borderWidth: '0px',
    paddingY: '12px',
    marginBottom: '20px',
    animation: 'none',
  },
  
  // Update floating button
  updateFloatingButton: (config) => set((state) => ({
    floatingButton: {
      ...state.floatingButton,
      ...config,
    }
  })),
}));

export default useFormStore;
