
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

/**
 * Ensures the value is a valid CSS color string
 * @param value - The value to ensure is a color
 * @returns A color value string or empty string
 */
export function ensureColor(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  // Return empty string for boolean, null, undefined, or other types
  return '';
}

/**
 * Ensures the value is a valid CSS size string (px, rem, em, %, etc.)
 * @param value - The value to ensure is a size
 * @returns A size value string or empty string
 */
export function ensureSize(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  // Return empty string for boolean, null, undefined, or other types
  return '';
}
