
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  return <SonnerToaster richColors closeButton position="top-right" />;
}

// Enhanced toast function with additional utility methods
const enhancedToast = {
  // Original toast functions
  ...toast,
  
  // Enhanced error toast with more detailed error handling
  error: (message: string | React.ReactNode, options?: any) => {
    console.error('[Toast Error]:', message);
    return toast.error(message, {
      duration: 5000, // Longer duration for errors
      ...options
    });
  },
  
  // Network error specific toast
  networkError: (message: string | React.ReactNode = "Network connection error", options?: any) => {
    console.error('[Network Error]:', message);
    return toast.error(
      typeof message === 'string' 
        ? `🌐 ${message}` 
        : message,
      {
        duration: 5000,
        ...options
      }
    );
  },
  
  // API error specific toast
  apiError: (error: unknown, defaultMessage: string = "API request failed", options?: any) => {
    let displayMessage = defaultMessage;
    
    if (error instanceof Error) {
      displayMessage = error.message;
      console.error('[API Error]:', error);
    } else if (typeof error === 'string') {
      displayMessage = error;
      console.error('[API Error]:', error);
    } else {
      console.error('[API Error]:', error);
    }
    
    return toast.error(`⚠️ ${displayMessage}`, {
      duration: 5000,
      ...options
    });
  },
  
  // Form error specific toast
  formError: (error: unknown, defaultMessage: string = "Form validation failed", options?: any) => {
    let displayMessage = defaultMessage;
    
    if (error instanceof Error) {
      displayMessage = error.message;
    } else if (typeof error === 'string') {
      displayMessage = error;
    }
    
    return toast.error(`📝 ${displayMessage}`, {
      duration: 4000,
      ...options
    });
  },
  
  // Connection error specific toast for Shopify
  shopifyError: (error: unknown, defaultMessage: string = "Shopify connection error", options?: any) => {
    let displayMessage = defaultMessage;
    
    if (error instanceof Error) {
      displayMessage = error.message;
      console.error('[Shopify Error]:', error);
    } else if (typeof error === 'string') {
      displayMessage = error;
      console.error('[Shopify Error]:', error);
    } else {
      console.error('[Shopify Error]:', error);
    }
    
    return toast.error(`🛒 ${displayMessage}`, {
      duration: 5000,
      ...options
    });
  }
};

// Export the enhanced toast
export { enhancedToast as toast };
