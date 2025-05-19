
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

// Form field style type extension
interface FormFieldStyle {
  // Base properties
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  
  // Description properties
  descriptionColor?: string;
  descriptionFontSize?: string;
  // Note: descriptionFontWeight is removed as it's not needed
  
  // Border properties
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  
  // Shadow property
  boxShadow?: string;  // Added boxShadow property
  
  // Animation properties
  animation?: boolean;
  animationType?: string;
  
  // Icon properties
  iconPosition?: string;
  icon?: string;
  fullWidth?: boolean;
  fontFamily?: string;

  // Direction control property
  ignoreFormDirection?: boolean; // Added to fix TypeScript error
  
  // Cart item and summary specific properties
  priceFontSize?: string;
  priceColor?: string;
  labelFontSize?: string;
  labelColor?: string;
  valueFontSize?: string;
  valueColor?: string;
  totalLabelFontSize?: string;
  totalLabelColor?: string;
  totalValueFontSize?: string;
  totalValueColor?: string;
}

// Form field extended properties
interface FormField {
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  icon?: string;
  style?: FormFieldStyle;
  options?: Array<{
    value: string;
    label: string;
  }>;
  
  // Additional properties
  defaultValue?: string | string[];
  disabled?: boolean;
  src?: string;
  alt?: string;
  width?: string | number;
  className?: string;
  content?: string;
  whatsappNumber?: string;
  message?: string;
  rows?: number;
}

// Floating button configuration type
interface FloatingButtonConfig {
  enabled: boolean;
  text: string;
  textColor?: string;
  backgroundColor?: string;
  
  // Position properties
  position?: 'bottom' | 'top' | 'left' | 'right';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  
  // Style properties
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  marginBottom?: string;
  
  // Icon properties
  showIcon?: boolean;
  icon?: string;
  
  // Animation properties
  animation?: string;
}
