/* ===============================================================================
   CODFORM UTILITIES - Extracted from codform_form.liquid
   =============================================================================== */

function getProductId() {
  try {
    const productId = '{{ product.id }}' || '{{ product.variants.first.id }}' || '{{ block.settings.product_id }}' || 'auto-detect';
    // Product ID detected
    return productId.trim();
  } catch (error) {
    // Error getting product ID
    return 'auto-detect';
  }
}

window.getShopDomain = function() {
  try {
    const shopDomain = '{{ shop.domain }}' || '{{ shop.permanent_domain }}' || 'auto-detect';
    // Using shop domain
    return shopDomain;
  } catch (error) {
    // Error getting shop domain
    return 'auto-detect';
  }
}

function getStyleValue(style, property, fallback) {
  if (!style || typeof style !== 'object') return fallback;
  return style[property] || fallback;
}

function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `CF-${timestamp}-${random}`;
}

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

function detectLanguage(text) {
  if (!text) return 'en';
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text) ? 'ar' : 'en';
}

// Make functions globally available
window.getProductId = getProductId;
window.getStyleValue = getStyleValue;
window.generateOrderNumber = generateOrderNumber;
window.formatCurrency = formatCurrency;
window.detectLanguage = detectLanguage;