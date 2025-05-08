import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FormState {
  id: string;
  title: string;
  description?: string;
  data: any[];
  isPublished: boolean;
  is_published?: boolean; // Added for consistency with database field
  shop_id?: string;
  submitButtonText?: string;
  // Style properties are stored in formStyle object
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  // For backward compatibility, keep these top-level properties
  primaryColor?: string;
  borderRadius?: string;
  fontSize?: string;
  buttonStyle?: string;
  // Track whether the form has unsaved changes
  isDirty?: boolean;
  // Track last save timestamp
  lastSaved?: number;
}

interface FormStore {
  formState: FormState;
  setFormState: (form: Partial<FormState>) => void;
  updateFormData: (data: any[]) => void;
  updateFormStyle: (style: Partial<FormState['formStyle']>) => void;
  resetFormState: () => void;
  markAsSaved: () => void;
  markAsDirty: () => void;
}

// Default styles moved outside to prevent recreation
const defaultFormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
};

const defaultFormState: FormState = {
  id: '',
  title: 'نموذج جديد',
  description: '',
  data: [],
  isPublished: false,
  shop_id: undefined,
  submitButtonText: 'إرسال الطلب',
  formStyle: {...defaultFormStyle},
  // Also set top-level style properties for backward compatibility
  primaryColor: defaultFormStyle.primaryColor,
  borderRadius: defaultFormStyle.borderRadius,
  fontSize: defaultFormStyle.fontSize,
  buttonStyle: defaultFormStyle.buttonStyle,
  isDirty: false,
  lastSaved: Date.now()
};

// Safe object merge helper to prevent unintended changes
const safeMerge = <T extends object>(original: T, updates: Partial<T>): T => {
  // If update is empty, return the original unchanged
  if (!updates || Object.keys(updates).length === 0) {
    return original;
  }
  // Create a new copy instead of mutating the original
  return { ...original, ...updates };
};

// Using persist middleware to keep form state in localStorage as a backup
export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      formState: {...defaultFormState},
      
      setFormState: (form) => set((state) => {
        // Prevent unnecessary updates
        if (!form || Object.keys(form).length === 0) {
          return state;
        }
        
        // Handle formStyle changes carefully to prevent infinite loops
        let shouldUpdate = false;
        let updatedFormStyle = state.formState.formStyle || { ...defaultFormStyle };
        
        // If formStyle was provided directly, merge it safely
        if (form.formStyle) {
          const newFormStyle = safeMerge(updatedFormStyle, form.formStyle);
          
          // Only update if something actually changed
          if (JSON.stringify(newFormStyle) !== JSON.stringify(updatedFormStyle)) {
            updatedFormStyle = newFormStyle;
            shouldUpdate = true;
          }
        }
        
        // Handle top-level style properties (for backward compatibility)
        // Only update formStyle if these properties have actually changed
        ['primaryColor', 'borderRadius', 'fontSize', 'buttonStyle'].forEach(prop => {
          const key = prop as keyof typeof defaultFormStyle;
          if (form[key] && form[key] !== updatedFormStyle[key]) {
            updatedFormStyle[key] = form[key] as string;
            shouldUpdate = true;
          }
        });
        
        // If nothing changed in formStyle and no other fields changed, skip the update
        if (!shouldUpdate && Object.keys(form).every(key => 
          ['formStyle', 'primaryColor', 'borderRadius', 'fontSize', 'buttonStyle'].includes(key))) {
          return state;
        }
        
        // Update form state with new values and sync style properties
        return {
          formState: {
            ...state.formState,
            ...form,
            // Use the carefully updated formStyle
            formStyle: updatedFormStyle,
            // Keep these in sync with formStyle for backward compatibility
            primaryColor: updatedFormStyle.primaryColor,
            borderRadius: updatedFormStyle.borderRadius,
            fontSize: updatedFormStyle.fontSize,
            buttonStyle: updatedFormStyle.buttonStyle,
            // Keep dirty flag unless explicitly set
            isDirty: form.isDirty !== undefined ? form.isDirty : state.formState.isDirty
          }
        };
      }),
      
      updateFormData: (data) => set((state) => {
        // Prevent unnecessary updates
        if (JSON.stringify(data) === JSON.stringify(state.formState.data)) {
          return state;
        }
        
        return {
          formState: {
            ...state.formState,
            data: data,
            isDirty: true
          }
        };
      }),
      
      updateFormStyle: (style) => set((state) => {
        // Prevent unnecessary updates
        if (!style || Object.keys(style).length === 0) {
          return state;
        }
        
        const currentStyle = state.formState.formStyle || { ...defaultFormStyle };
        
        // Check if there are any actual changes
        let hasChanges = false;
        for (const key in style) {
          if (style[key as keyof typeof style] !== currentStyle[key as keyof typeof currentStyle]) {
            hasChanges = true;
            break;
          }
        }
        
        // If nothing changed, return state as is
        if (!hasChanges) {
          return state;
        }
        
        const updatedStyle = safeMerge(currentStyle, style);
        
        return {
          formState: {
            ...state.formState,
            formStyle: updatedStyle,
            // Keep top-level style properties in sync
            primaryColor: updatedStyle.primaryColor,
            borderRadius: updatedStyle.borderRadius,
            fontSize: updatedStyle.fontSize,
            buttonStyle: updatedStyle.buttonStyle,
            isDirty: true
          }
        };
      }),
      
      resetFormState: () => set({ 
        formState: {
          ...defaultFormState, 
          id: '', 
          lastSaved: Date.now()
        } 
      }),
      
      markAsSaved: () => set((state) => ({
        formState: {
          ...state.formState,
          isDirty: false,
          lastSaved: Date.now()
        }
      })),
      
      markAsDirty: () => set((state) => {
        // Prevent unnecessary updates
        if (state.formState.isDirty) {
          return state;
        }
        
        return {
          formState: {
            ...state.formState,
            isDirty: true
          }
        };
      })
    }),
    {
      name: 'form-store', // name for localStorage
      partialize: (state) => ({ formState: state.formState }), // Only store formState in localStorage
    }
  )
);
