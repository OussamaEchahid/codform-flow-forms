
// Re-export the toast functions from sonner and our custom hook
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";

// Re-export with the same interface
export { useToast, toast };
