
import * as React from "react";
import { toast as sonnerToast, type ToastT, type ExternalToast } from "sonner";
import { toast as enhancedToast } from "@/components/ui/toaster";

// Re-export the enhanced toast
export const toast = enhancedToast;

// Define our ToastProps type based on Sonner's type but make it compatible with sonner's API
export type ToastProps = Omit<Partial<ToastT>, "id">;

export function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      sonnerToast.dismiss(toastId);
    },
  };
}

// Ensure the enhanced toast is exported as the default
export default toast;

// Add variants as methods to the toast function if not already added in the enhanced toast
if (!toast.success) {
  toast.success = (message: React.ReactNode, data?: ExternalToast) => {
    if (typeof message === "string") {
      return sonnerToast.success(message, data);
    }
    return sonnerToast.success(message as any, data);
  };
}

if (!toast.error) {
  toast.error = (message: React.ReactNode | string, options?: any) => {
    if (typeof message === "string") {
      return sonnerToast.error(message, options);
    }
    return sonnerToast.error(message as any, options);
  };
}

if (!toast.warning) {
  toast.warning = (message: React.ReactNode, data?: ExternalToast) => {
    if (typeof message === "string") {
      return sonnerToast.warning(message, data);
    }
    return sonnerToast.warning(message as any, data);
  };
}

if (!toast.info) {
  toast.info = (message: React.ReactNode, data?: ExternalToast) => {
    if (typeof message === "string") {
      return sonnerToast.info(message, data);
    }
    return sonnerToast.info(message as any, data);
  };
}

toast.dismiss = sonnerToast.dismiss;
