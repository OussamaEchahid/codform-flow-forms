import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures the value is a string
 * @param value - The value to ensure is a string
 * @returns A string value
 */
export function ensureString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  // Convert boolean to string or return empty string
  if (value === true) {
    return 'true';
  } else if (value === false) {
    return 'false';
  }
  
  // Handle undefined, null, or other types
  return value ? String(value) : '';
}
