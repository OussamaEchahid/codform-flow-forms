
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to ensure string values
export function ensureString(value: any): string {
  if (typeof value === 'boolean') {
    return '';
  }
  return typeof value === 'string' ? value : '';
}

// Helper for CSS color values
export function ensureColor(value: any): string {
  if (typeof value === 'boolean') {
    return '';
  }
  return typeof value === 'string' ? value : '';
}

// Helper for numeric values like fontSize, borderRadius, etc.
export function ensureSize(value: any): string {
  if (typeof value === 'boolean') {
    return '';
  }
  return typeof value === 'string' ? value : '';
}

