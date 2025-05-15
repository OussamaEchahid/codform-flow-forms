
/// <reference types="vite/client" />

// Type definitions for React component props
interface ShopifyProductSelectionProps {
  selectedProducts: string[];
  onChange: (products: string[]) => void;
  formId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface ShopifyIntegrationProps {
  formId: string;
  onSave: (settings: any) => Promise<void>;
  isSyncing?: boolean;
}
