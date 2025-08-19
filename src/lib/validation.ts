// Input validation utilities for security

/**
 * Validates Nigerian phone numbers
 * Accepts formats: 08012345678, 2348012345678, +2348012345678
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove spaces and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for valid Nigerian phone patterns
  const patterns = [
    /^0[789][01]\d{8}$/, // 08012345678, 09012345678, 07012345678
    /^234[789][01]\d{8}$/, // 2348012345678
    /^\+234[789][01]\d{8}$/, // +2348012345678
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validates price input
 */
export const validatePrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice > 0 && numPrice <= 1000000; // Max 1M Naira
};

/**
 * Validates customer name
 */
export const validateCustomerName = (name: string): boolean => {
  if (!name) return false;
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const namePattern = /^[a-zA-Z\s\-']{2,50}$/;
  return namePattern.test(name.trim());
};

/**
 * Validates receipt/transaction IDs
 */
export const validateReceiptNumber = (receiptNumber: string): boolean => {
  if (!receiptNumber) return false;
  
  // CFT format: CFT20250119001
  const receiptPattern = /^CFT\d{8}\d{3}$/;
  return receiptPattern.test(receiptNumber);
};

/**
 * Validates service notes/additional notes
 */
export const validateNotes = (notes: string): boolean => {
  if (!notes) return true; // Notes are optional
  
  // Maximum 500 characters, no HTML tags allowed
  return notes.length <= 500 && !/<[^>]*>/g.test(notes);
};

/**
 * Rate limiting helper for form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) { // 5 attempts per minute by default
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const transactionRateLimiter = new RateLimiter(10, 60000); // 10 transactions per minute