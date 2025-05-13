import * as React from "react";
import { toast as sonnerToast } from "sonner";

const TOAST_LIMIT = 5;
export const TOAST_REMOVE_DELAY = 1000000;

export type ToastActionElement = React.ReactElement<{
  className?: string;
  altText?: string;
  onClick?: () => void;
}>;

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  duration?: number;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  className?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  onOpenChange?: (open: boolean) => void;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
          })),
        };
      }

      addToRemoveQueue(toastId);

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t } : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action;

      if (toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      };
    }
  }
}

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

// This is the toast function that will be exported
export const toast = (props: string | Toast) => {
  if (typeof props === "string") {
    return sonnerToast(props);
  }
  return sonnerToast(props);
};

// Add variant-specific methods
toast.success = (props: string | Omit<Toast, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.success(props);
  }
  return sonnerToast.success(props);
};

toast.error = (props: string | Omit<Toast, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.error(props);
  }
  return sonnerToast.error(props);
};

toast.warning = (props: string | Omit<Toast, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.warning(props);
  }
  return sonnerToast.warning(props);
};

toast.info = (props: string | Omit<Toast, "variant">) => {
  if (typeof props === "string") {
    return sonnerToast.info(props);
  }
  return sonnerToast.info(props);
};

toast.dismiss = (toastId?: string) => {
  sonnerToast.dismiss(toastId);
};

// Hook for managing toast state
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toast,
    dismiss: (toastId?: string) => {
      toast.dismiss(toastId);
    },
  };
}
