
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  return <SonnerToaster richColors closeButton position="top-right" />;
}

// Export toast function for easy access
export { toast };
