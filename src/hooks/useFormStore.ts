
import { create } from 'zustand';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // New styling properties
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
  
  // Add floating button configuration
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
  
  // Add function to update floating button configuration
  updateFloatingButton: (config: any) => void;
}

const defaultFormStyle: FormStyle = {
  primaryColor: '#9b87f5', // Default primary color for buttons
  borderRadius: '1.5rem', // Large border radius by default
  fontSize: '1rem',
  buttonStyle: 'rounded',
  borderColor: '#9b87f5', // Default border color
  borderWidth: '2px',     // Default border width
  backgroundColor: '#F9FAFB', // Default form background color - FIXED
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
    // Handle style updates separately to ensure defaults are preserved
    let updatedStyle = state.formState.style || { ...defaultFormStyle };
    
    // If form contains style updates, merge them properly
    if (form.style) {
      updatedStyle = {
        ...updatedStyle,
        ...form.style,
        // ALWAYS maintain the fixed default values regardless of what's passed
        backgroundColor: form.style.backgroundColor || updatedStyle.backgroundColor || defaultFormStyle.backgroundColor,
        borderColor: form.style.borderColor || updatedStyle.borderColor || defaultFormStyle.borderColor,
        borderWidth: form.style.borderWidth || updatedStyle.borderWidth || defaultFormStyle.borderWidth,
        borderRadius: form.style.borderRadius || updatedStyle.borderRadius || defaultFormStyle.borderRadius,
      };
    }
    
    return {
      formState: {
        ...state.formState,
        ...form,
        // Use the properly merged style
        style: updatedStyle
      }
    };
  }),
  resetFormState: () => set({ formState: {...defaultFormState} }),
  
  // Initialize floating button configuration with all required properties
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
  
  // Add method to update floating button
  updateFloatingButton: (config) => set((state) => ({
    floatingButton: {
      ...state.floatingButton,
      ...config,
    }
  })),
}));

export default useFormStore;
