
import * as React from "react";
import { toast as sonnerToast } from "sonner";
import type { ToastT as SonnerToastType } from "sonner";

type ToastProps = SonnerToastType & {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

export type Toast = ToastProps;

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

toast.success = (props: string | Omit<ToastProps, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.success(props);
  }
  return sonnerToast.success(props);
};

toast.error = (props: string | Omit<ToastProps, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.error(props);
  }
  return sonnerToast.error(props);
};

toast.warning = (props: string | Omit<ToastProps, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.warning(props);
  }
  return sonnerToast.warning(props);
};

toast.info = (props: string | Omit<ToastProps, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.info(props);
  }
  return sonnerToast.info(props);
};

toast.dismiss = sonnerToast.dismiss;
