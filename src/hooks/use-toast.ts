
import { toast as sonnerToast } from 'sonner';
import * as React from 'react';

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
};

export const useToast = () => {
  const toast = (props: Toast) => {
    const { variant, title, description, duration = 5000 } = props;

    switch (variant) {
      case 'destructive':
        sonnerToast.error(title, {
          description,
          duration,
        });
        break;
      case 'success':
        sonnerToast.success(title, {
          description,
          duration,
        });
        break;
      case 'warning':
        sonnerToast.warning(title, {
          description,
          duration,
        });
        break;
      default:
        sonnerToast(title, {
          description,
          duration,
        });
    }
  };

  return { toast };
};

// Export sonnerToast directly for simple cases
export { sonnerToast as toast };
