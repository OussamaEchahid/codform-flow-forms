
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
  product_id?: string;  // Ensuring product_id is properly defined
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
  };
  
  // Add function to update floating button configuration
  updateFloatingButton: (config: any) => void;
}

const defaultFormState: FormState = {
  id: '',
  title: 'New Form',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  product_id: undefined,  // Default is undefined
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
  resetFormState: () => set({ formState: {...defaultFormState} }),
  
  // Initialize floating button configuration with enabled=true to make sure it's active by default
  floatingButton: {
    enabled: true, // Default to true to ensure it's active by default
    text: 'Order Now',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    borderRadius: '4px',
    showIcon: true,
    icon: 'shopping-cart',
    animation: 'none', // Default animation to none
    marginBottom: '20px', // Default bottom margin
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
