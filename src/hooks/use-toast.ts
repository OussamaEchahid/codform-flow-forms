import { toast as sonnerToast } from 'sonner';
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastActionElement = React.ReactElement;

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps;

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: string;
    }
  | {
      type: ActionType['REMOVE_TOAST'];
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
      toastId,
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

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
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

interface ToastOptions {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  duration?: number;
}

// Main toast function
function toast(props: ToastOptions & { variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info' }) {
  const id = uuidv4();
  const { variant = 'default', ...options } = props;
  
  const toastData = { id, variant, ...options };

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: toastData,
  });

  // Also trigger the sonner toast for native integration
  switch (variant) {
    case 'destructive':
      sonnerToast.error(options.title, { id, description: options.description, duration: options.duration });
      break;
    case 'success':
      sonnerToast.success(options.title, { id, description: options.description, duration: options.duration });
      break;
    case 'warning':
      sonnerToast.warning(options.title, { id, description: options.description, duration: options.duration });
      break;
    case 'info':
      sonnerToast.info(options.title, { id, description: options.description, duration: options.duration });
      break;
    default:
      sonnerToast(options.title, { id, description: options.description, duration: options.duration });
  }

  return id;
}

// Adding helper methods to the toast function
toast.success = (title: string, options?: Omit<ToastOptions, 'title'>) => 
  toast({ title, ...options, variant: 'success' });

toast.warning = (title: string, options?: Omit<ToastOptions, 'title'>) => 
  toast({ title, ...options, variant: 'warning' });

toast.error = (title: string, options?: Omit<ToastOptions, 'title'>) => 
  toast({ title, ...options, variant: 'destructive' });

// Add info method
toast.info = (title: string, options?: Omit<ToastOptions, 'title'>) => 
  toast({ title, ...options, variant: 'info' });

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
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };
