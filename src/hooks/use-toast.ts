
import * as React from "react";
import { toast as sonnerToast, type ToastT } from "sonner";
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
  toast.success = (props: string | ToastProps) => {
    if (typeof props === "string") {
      return sonnerToast.success(props);
    }
    return sonnerToast.success(props as any);
  };
}

if (!toast.error) {
  toast.error = (props: string | ToastProps) => {
    if (typeof props === "string") {
      return sonnerToast.error(props);
    }
    return sonnerToast.error(props as any);
  };
}

if (!toast.warning) {
  toast.warning = (props: string | ToastProps) => {
    if (typeof props === "string") {
      return sonnerToast.warning(props);
    }
    return sonnerToast.warning(props as any);
  };
}

if (!toast.info) {
  toast.info = (props: string | ToastProps) => {
    if (typeof props === "string") {
      return sonnerToast.info(props);
    }
    return sonnerToast.info(props as any);
  };
}

toast.dismiss = sonnerToast.dismiss;
