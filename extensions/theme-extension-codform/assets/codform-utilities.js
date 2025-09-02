/* ===============================================================================
   CODFORM UTILITIES - Extracted from codform_form.liquid
   =============================================================================== */

function getProductId() {
  try {
    // Prefer explicit ID passed from Liquid (reliable in Theme Editor & storefront)
    if (window.codformProductId && String(window.codformProductId).trim()) {
      return String(window.codformProductId);
    }

    // Try to get from page meta or product object
    if (window.meta && window.meta.product && window.meta.product.id) {
      return window.meta.product.id.toString();
    }

    // Try to get from Shopify product object
    if (typeof ShopifyAnalytics !== 'undefined' && ShopifyAnalytics.meta && ShopifyAnalytics.meta.product) {
      return ShopifyAnalytics.meta.product.id.toString();
    }

    // Try to extract from page content or forms (may return variant id)
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (productForm) {
      const hiddenId = productForm.querySelector('input[name="id"]');
      if (hiddenId && hiddenId.value) {
        return hiddenId.value;
      }
    }

    // Try to get from URL if we're on a product page
    const urlMatch = window.location.pathname.match(/\/products\/([^\/]+)/);
    if (urlMatch) {
      // We have a product handle, but we need the ID
      // This will be handled by auto-detect in the API
      return 'auto-detect';
    }

    return 'auto-detect';
  } catch (error) {
    console.error('Error getting product ID:', error);
    return 'auto-detect';
  }
}

window.getShopDomain = function() {
  try {
    // Prefer explicit domain passed from Liquid
    if (window.codformShopDomain && String(window.codformShopDomain).trim()) {
      return String(window.codformShopDomain);
    }

    // Try to get from Shopify object
    if (typeof Shopify !== 'undefined' && Shopify.shop) {
      return Shopify.shop;
    }

    // Try to get from window location
    const hostname = window.location.hostname;
    if (hostname.includes('.myshopify.com')) {
      return hostname;
    }

    // Try to extract from forms or meta tags
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const url = new URL(canonical.href);
      if (url.hostname.includes('.myshopify.com')) {
        return url.hostname;
      }
    }

    // Fallback - try to detect from page content
    return 'auto-detect';
  } catch (error) {
    console.error('Error getting shop domain:', error);
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

function formatCurrency(amount, currency = 'SAR', language = 'ar') {
  // استخدام CurrencyService إذا كان متاحاً للتنسيق المخصص
  if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
    return window.CurrencyService.formatCurrency(amount, currency, language);
  }

  // التنسيق الاحتياطي
  try {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error);

    // احترم إعدادات العرض إن توفرت من أي نظام
    let showSymbol = false; // عرض الكود افتراضياً
    let symbolPosition = 'after'; // افتراضي: بعد
    let decimalPlaces = 2;
    let customSymbols = {};

    try {
      if (window.CurrencyService && typeof window.CurrencyService.getDisplaySettings === 'function') {
        const s = window.CurrencyService.getDisplaySettings();
        showSymbol = s.showSymbol !== false;
        symbolPosition = s.symbolPosition || symbolPosition;
        decimalPlaces = (s.decimalPlaces ?? decimalPlaces);
        customSymbols = s.customSymbols || {};
      } else if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getDisplaySettings === 'function') {
        const s = window.CodformCurrencyManager.getDisplaySettings();
        showSymbol = s.showSymbol !== false && s.show_symbol !== false;
        symbolPosition = s.symbolPosition || s.symbol_position || symbolPosition;
        decimalPlaces = (s.decimalPlaces ?? s.decimal_places ?? decimalPlaces);
        customSymbols = s.customSymbols || s.custom_symbols || {};
      }
    } catch (_) {}

    const defaultSymbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'MAD': 'د.م' };
    const displayText = showSymbol ? (customSymbols[currency] || defaultSymbols[currency] || currency) : currency;
    const amt = Number.isFinite(amount) ? Number(amount).toFixed(decimalPlaces) : '0.00';

    const base = symbolPosition === 'before' ? `${displayText} ${amt}` : `${amt} ${displayText}`;
    const rtl = (typeof document !== 'undefined' && document.documentElement && document.documentElement.dir === 'rtl');
    return rtl ? `\u2066${base}\u2069` : base;
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