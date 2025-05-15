
/// <reference types="vite/client" />

// Shopify integration component props
interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void; // Added back the onSave prop
  isSyncing?: boolean; 
  formTitleElement?: any;
}

// Shopify product selection component props
interface ShopifyProductSelectionProps {
  formId: string;
  selectedProducts: string[]; 
  onChange: (products: string[]) => void; 
  onComplete?: () => void;
  onCancel?: () => void;
}

// Ensure string utility function type
type EnsureStringFunction = (value: string | boolean | undefined | null) => string;
