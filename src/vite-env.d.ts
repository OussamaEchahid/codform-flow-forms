
/// <reference types="vite/client" />

// Shopify integration component props
interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void; // Added missing prop
  isSyncing?: boolean; // Added missing prop
  formTitleElement?: any;
}

// Shopify product selection component props
interface ShopifyProductSelectionProps {
  formId: string;
  selectedProducts: string[]; // Added missing prop
  onChange: (products: string[]) => void; // Added missing prop
  onComplete?: () => void;
  onCancel?: () => void;
}

// Ensure string utility function type
type EnsureStringFunction = (value: string | boolean | undefined | null) => string;
