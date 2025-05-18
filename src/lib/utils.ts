
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures the value is a string
 * @param value The value to ensure is a string
 * @returns A string representation of the value or an empty string if the value is undefined or null
 */
export function ensureString(value: string | boolean | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  return String(value);
}
