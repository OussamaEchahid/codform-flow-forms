/* ===============================================================================
   CODFORM SIMPLE UTILITIES - Basic helper functions
   =============================================================================== */

// Style utility function
function getStyleValue(style, property, fallback) {
  if (!style || typeof style !== 'object') return fallback;
  return style[property] || fallback;
}

// Generate order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `CF-${timestamp}-${random}`;
}

// Format currency
function formatCurrency(amount, currency = 'SAR') {
  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
}

// Detect language
function detectLanguage(text) {
  if (!text) return 'en';
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text) ? 'ar' : 'en';
}

// Make functions globally available
window.getStyleValue = getStyleValue;
window.generateOrderNumber = generateOrderNumber;
window.formatCurrency = formatCurrency;
window.detectLanguage = detectLanguage;