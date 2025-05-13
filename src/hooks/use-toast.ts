
import * as React from "react";

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
  onOpenChange: (open: boolean) => void;
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

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

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
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast(props: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
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
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

// Add variant-specific methods
toast.success = (props: string | Omit<ToasterToast, "id" | "variant">) => {
  if (typeof props === "string") {
    return toast({ description: props, variant: "success" });
  }
  return toast({ ...props, variant: "success" });
};

toast.error = (props: string | Omit<ToasterToast, "id" | "variant">) => {
  if (typeof props === "string") {
    return toast({ description: props, variant: "destructive" });
  }
  return toast({ ...props, variant: "destructive" });
};

toast.warning = (props: string | Omit<ToasterToast, "id" | "variant">) => {
  if (typeof props === "string") {
    return toast({ description: props, variant: "warning" });
  }
  return toast({ ...props, variant: "warning" });
};

toast.info = (props: string | Omit<ToasterToast, "id" | "variant">) => {
  if (typeof props === "string") {
    return toast({ description: props, variant: "info" });
  }
  return toast({ ...props, variant: "info" });
};

export { useToast, toast };
