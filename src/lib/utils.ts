
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a value is a string
 * @param value - The value to convert to a string
 * @returns The string representation of the value
 */
export function ensureString(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/**
 * Ensures a value is a valid color string
 * @param value - The color value
 * @returns A valid color string or fallback
 */
export function ensureColor(value: any, fallback: string = '#000000'): string {
  if (!value) return fallback;
  return ensureString(value);
}

/**
 * Ensures a value is a valid CSS size (px, rem, em, %, etc)
 * @param value - The size value
 * @returns A valid size string or fallback
 */
export function ensureSize(value: any, fallback: string = '1rem'): string {
  if (!value) return fallback;
  return ensureString(value);
}
