
import * as React from "react";
import { toast as sonnerToast, type ToastT } from "sonner";

// Define our ToastProps type based on Sonner's type
export type ToastProps = Partial<ToastT>;

export function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      sonnerToast.dismiss(toastId);
    },
  };
}

// Creating a custom toast function that maps to sonner toast
export const toast = (props: string | ToastProps) => {
  if (typeof props === "string") {
    return sonnerToast(props);
  }
  return sonnerToast(props);
};

// Add variants as methods to the toast function
toast.success = (props: string | ToastProps) => {
  if (typeof props === "string") {
    return sonnerToast.success(props);
  }
  return sonnerToast.success(props);
};

toast.error = (props: string | ToastProps) => {
  if (typeof props === "string") {
    return sonnerToast.error(props);
  }
  return sonnerToast.error(props);
};

toast.warning = (props: string | ToastProps) => {
  if (typeof props === "string") {
    return sonnerToast.warning(props);
  }
  return sonnerToast.warning(props);
};

toast.info = (props: string | ToastProps) => {
  if (typeof props === "string") {
    return sonnerToast.info(props);
  }
  return sonnerToast.info(props);
};

toast.dismiss = sonnerToast.dismiss;
