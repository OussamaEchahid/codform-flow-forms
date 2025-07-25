import DOMPurify from 'dompurify';

/**
 * Security utilities for input sanitization and validation
 */

// Configure DOMPurify for safe HTML sanitization
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
  SANITIZE_NAMED_PROPS: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, purifyConfig);
};

/**
 * Sanitize plain text input by removing/escaping dangerous characters
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove or escape potentially dangerous characters
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = email.toLowerCase().trim();
  
  if (!emailRegex.test(cleanEmail)) {
    return '';
  }
  
  return cleanEmail;
};

/**
 * Validate and sanitize phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure + only appears at the beginning
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    return '+' + parts.filter(part => part.length > 0).join('');
  }
  
  return cleaned;
};

/**
 * Validate and sanitize URLs
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    
    return urlObj.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitize object keys and values recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = sanitizeText(key);
    
    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeText(value);
    } else if (typeof value === 'object') {
      sanitized[cleanKey] = sanitizeObject(value);
    } else {
      sanitized[cleanKey] = value;
    }
  }
  
  return sanitized;
};

/**
 * Rate limiting utility for preventing abuse
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Export rate limiter instances
export const authRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute