
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
  settings?: {
    enableIcons?: boolean;
    titleStyle?: boolean;
    directRenderMode?: boolean;
  };
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  updateFormSettings: (settings: Partial<FormState['settings']>) => void;
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
  },
  settings: {
    enableIcons: true,
    titleStyle: true,
    directRenderMode: false, // استخدام طريقة العرض المباشر (بدون JavaScript)
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
  updateFormSettings: (settings) => set((state) => ({
    formState: {
      ...state.formState,
      settings: {
        ...state.formState.settings,
        ...settings
      }
    }
  })),
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
