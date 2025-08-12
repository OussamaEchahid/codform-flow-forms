/**
 * CODFORM Cart Items Handler - النسخة الموحدة
 * نظام موحد مع إدارة العملات لضمان المزامنة الكاملة
 */

(function() {
  'use strict';

  console.log('🛒 CODFORM Cart Items UNIFIED System: Starting...');

  let cachedProductPrice = null;
  let cachedCurrency = null;
  let isInitialized = false;
  let currencySettings = null;

  /**
   * الحصول على بيانات المنتج من الصفحة الحالية
   */
  async function fetchProductPrice() {
    try {
      console.log('🛒 Cart Items: Getting product data...');

      let productData = {
        price: 29.99,
        currency: 'USD',
        title: 'Product',
        image: null
      };

      // محاولة الحصول على البيانات من Shopify API
      const currentUrl = window.location.href;
      const isProductPage = currentUrl.includes('/products/');
      
      if (isProductPage) {
        const urlParts = currentUrl.split('/products/');
        if (urlParts.length > 1) {
          const productHandle = urlParts[1].split('?')[0].split('#')[0];
          
          try {
            const productApiUrl = `/products/${productHandle}.js`;
            const response = await fetch(productApiUrl);
            
            if (response.ok) {
              const product = await response.json();
              
              if (product && product.variants && product.variants.length > 0) {
                const variant = product.variants[0];
                productData.price = variant.price / 100;
                productData.title = product.title;
                productData.image = product.featured_image;
                
                if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) {
                  productData.currency = window.Shopify.currency.active;
                }
              }
            }
          } catch (apiError) {
            console.log('🛒 Cart Items: API call failed, using fallbacks');
          }
        }
      }

      // حفظ النتائج في الكاش
      cachedProductPrice = productData.price;
      cachedCurrency = productData.currency;
      window.CodformProductData = productData;

      console.log(`🛒 Cart Items: Product data cached - ${productData.price} ${productData.currency}`);
      return productData;

    } catch (error) {
      console.error('🚨 Cart Items - Error getting product data:', error);
      
      // استخدام القيم الافتراضية
      const fallbackData = {
        price: 29.99,
        currency: 'USD',
        title: 'Product',
        image: null
      };
      
      cachedProductPrice = fallbackData.price;
      cachedCurrency = fallbackData.currency;
      window.CodformProductData = fallbackData;
      
      return fallbackData;
    }
  }

  /**
   * تنسيق العملة باستخدام النظام الموحد
   */
  function formatCurrency(amount, currency) {
    try {
      console.log(`🛒 Cart Items: Formatting ${amount} ${currency}`);
      
      // ✅ استخدام النظام الموحد إذا كان متوفر
      if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.formatCurrency) {
        const formatted = window.CodformUnifiedSystem.formatCurrency(amount, currency);
        console.log(`🛒 Cart Items: Unified formatting result: ${formatted}`);
        return formatted;
      }
      
      // ✅ استخدام CurrencyService إذا كان متوفر
      if (window.CurrencyService && window.CurrencyService.formatCurrency) {
        const formatted = window.CurrencyService.formatCurrency(amount, currency);
        console.log(`🛒 Cart Items: CurrencyService formatting result: ${formatted}`);
        return formatted;
      }
      
      // التنسيق المحلي كبديل
      const symbols = {
        'SAR': 'ر.س',
        'MAD': 'د.م',
        'AED': 'د.إ',
        'USD': '$',
        'EUR': '€'
      };

      const symbol = symbols[currency] || currency;
      const formattedAmount = parseFloat(amount).toFixed(1);
      
      if (['SAR', 'MAD', 'AED'].includes(currency)) {
        return `${formattedAmount} ${symbol}`;
      } else {
        return `${symbol}${formattedAmount}`;
      }
      
    } catch (error) {
      console.error('🚨 Cart Items: Error formatting currency:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * الحصول على العملة المفضلة الحالية
   */
  function getPreferredCurrency() {
    // ✅ استخدام النظام الموحد
    if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.getPreferredCurrency) {
      return window.CodformUnifiedSystem.getPreferredCurrency();
    }
    
    // البحث في localStorage
    try {
      const settings = localStorage.getItem('codform_currency_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.currency || 'AED';
      }
    } catch (error) {
      console.log('🛒 Cart Items: No currency settings found');
    }
    
    return 'AED'; // افتراضي
  }

  /**
   * تحويل العملة باستخدام النظام الموحد
   */
  function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // ✅ استخدام النظام الموحد
    if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.convertCurrency) {
      return window.CodformUnifiedSystem.convertCurrency(amount, fromCurrency, toCurrency);
    }
    
    // ✅ استخدام CurrencyService
    if (window.CurrencyService && window.CurrencyService.convertCurrency) {
      return window.CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
    }
    
    // معدلات افتراضية
    const rates = {
      'USD': 1.0,
      'SAR': 3.75,
      'MAD': 10.0,
      'AED': 3.67
    };
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    return (amount / fromRate) * toRate;
  }

  /**
   * عرض عناصر العربة
   */
  function renderCartItems(field, formStyle, formDirection) {
    console.log('🛒 Cart Items: Rendering field...');

    if (!cachedProductPrice || !cachedCurrency) {
      return `
        <div class="codform-cart-items" style="
          margin: 10px 0;
          padding: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
        ">
          <p>Loading product information...</p>
        </div>
      `;
    }

    const direction = formDirection || 'ltr';
    const isRTL = direction === 'rtl';
    
    // ✅ التطبيق الفوري للنظام الموحد
    const preferredCurrency = getPreferredCurrency();
    const convertedPrice = convertCurrency(cachedProductPrice, cachedCurrency, preferredCurrency);
    const formattedPrice = formatCurrency(convertedPrice, preferredCurrency);
    
    console.log(`🛒 Cart Items: Final display - ${cachedProductPrice} ${cachedCurrency} → ${convertedPrice} ${preferredCurrency} → ${formattedPrice}`);
    
    // التسميات
    const priceLabel = isRTL ? 'السعر:' : 'Price:';
    const quantityLabel = isRTL ? 'الكمية:' : 'Quantity:';
    const fontFamily = isRTL ? "'Cairo', sans-serif" : "inherit";
    
    // بيانات المنتج
    const productData = window.CodformProductData || {};
    const productTitle = productData.title || 'Product';
    const productImage = productData.image;

    return `
      <div class="codform-cart-items" style="
        margin: 10px 0;
        width: 100%;
        direction: ${direction};
      ">
        <div style="
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin-bottom: 12px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: ${fontFamily};
          ">
            <!-- صورة المنتج -->
            <div style="
              width: 60px;
              height: 60px;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            ">
              ${productImage ? `
                <img src="${productImage}" alt="${productTitle}" style="
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                " />
              ` : `
                <div style="
                  width: 100%;
                  height: 100%;
                  background-color: #f3f4f6;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 17a2 2 0 11-4 0 2 2 0 014 0zM9 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              `}
            </div>
            
            <!-- تفاصيل المنتج -->
            <div style="flex: 1;">
              <h3 style="
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 4px 0;
                font-size: 16px;
              ">${productTitle}</h3>
              <p style="
                color: #6b7280;
                margin: 0;
                font-size: 14px;
              ">${priceLabel} <span class="cart-items-price" data-currency="${preferredCurrency}" data-original-price="${cachedProductPrice}" data-original-currency="${cachedCurrency}">${formattedPrice}</span></p>
            </div>
            
            <!-- تحكم الكمية -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-${isRTL ? 'right' : 'left'}: auto;
            ">
              <label style="
                font-size: 14px;
                color: #374151;
                margin-${isRTL ? 'left' : 'right'}: 8px;
              ">${quantityLabel}</label>
              
              <div style="
                display: flex;
                align-items: center;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                overflow: hidden;
              ">
                <button 
                  type="button"
                  onclick="window.CodformCartItems.decreaseQuantity(this)"
                  style="
                    background-color: #f9fafb;
                    border: none;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-weight: bold;
                    color: #374151;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='#f3f4f6'"
                  onmouseout="this.style.backgroundColor='#f9fafb'"
                >-</button>
                
                <span class="cart-items-quantity" style="
                  padding: 0 12px;
                  font-weight: 500;
                  color: #1f2937;
                  background-color: white;
                  min-width: 40px;
                  text-align: center;
                  line-height: 32px;
                ">1</span>
                
                <button 
                  type="button"
                  onclick="window.CodformCartItems.increaseQuantity(this)"
                  style="
                    background-color: #f9fafb;
                    border: none;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-weight: bold;
                    color: #374151;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='#f3f4f6'"
                  onmouseout="this.style.backgroundColor='#f9fafb'"
                >+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * زيادة الكمية
   */
  function increaseQuantity(button) {
    const quantitySpan = button.previousElementSibling;
    let currentQuantity = parseInt(quantitySpan.textContent);
    const newQuantity = currentQuantity + 1;
    quantitySpan.textContent = newQuantity;
    
    console.log('🛒 Cart Items: Quantity increased to:', newQuantity);
    updateAllPriceDisplays();
    
    // إشعار المكونات الأخرى
    if (window.CodformStateManager) {
      window.CodformStateManager.updateQuantity(newQuantity);
    }
    
    window.dispatchEvent(new CustomEvent('codform:quantity-changed', {
      detail: { quantity: newQuantity, source: 'cart-items' }
    }));
  }

  /**
   * تقليل الكمية
   */
  function decreaseQuantity(button) {
    const quantitySpan = button.nextElementSibling;
    let currentQuantity = parseInt(quantitySpan.textContent);
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      quantitySpan.textContent = newQuantity;
      
      console.log('🛒 Cart Items: Quantity decreased to:', newQuantity);
      updateAllPriceDisplays();
      
      // إشعار المكونات الأخرى
      if (window.CodformStateManager) {
        window.CodformStateManager.updateQuantity(newQuantity);
      }
      
      window.dispatchEvent(new CustomEvent('codform:quantity-changed', {
        detail: { quantity: newQuantity, source: 'cart-items' }
      }));
    }
  }

  /**
   * تحديث جميع أسعار العرض - النسخة الموحدة
   */
  function updateAllPriceDisplays() {
    try {
      const priceElements = document.querySelectorAll('.cart-items-price');
      if (priceElements.length === 0 || !cachedProductPrice) {
        return;
      }

      console.log('🛒 Cart Items: Updating all price displays with UNIFIED system...');
      
      // الحصول على الكمية الحالية
      const quantityElement = document.querySelector('.cart-items-quantity');
      const currentQuantity = quantityElement ? parseInt(quantityElement.textContent) : 1;
      
      // السعر الأساسي مع الكمية
      const totalPrice = cachedProductPrice * currentQuantity;
      
      // ✅ التطبيق الموحد للعملة المفضلة
      const preferredCurrency = getPreferredCurrency();
      const convertedPrice = convertCurrency(totalPrice, cachedCurrency, preferredCurrency);
      const formattedPrice = formatCurrency(convertedPrice, preferredCurrency);
      
      console.log(`🛒 Cart Items: UNIFIED Update - ${totalPrice} ${cachedCurrency} → ${convertedPrice} ${preferredCurrency} → ${formattedPrice}`);
      
      // تحديث جميع عناصر الأسعار
      priceElements.forEach(priceElement => {
        priceElement.textContent = formattedPrice;
        priceElement.setAttribute('data-currency', preferredCurrency);
        console.log(`🛒 Cart Items: Updated price element: ${formattedPrice}`);
      });
      
    } catch (error) {
      console.error('🚨 Cart Items: Error updating price displays:', error);
    }
  }

  /**
   * تهيئة النظام الموحد
   */
  async function initialize() {
    if (isInitialized) {
      console.log('🛒 Cart Items: Already initialized');
      return;
    }

    try {
      console.log('🛒 Cart Items: Starting UNIFIED initialization...');
      
      // انتظار تحميل الصفحة
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        });
      }

      // تحميل بيانات المنتج
      await fetchProductPrice();
      
      // ✅ الاشتراك في أحداث النظام الموحد
      window.addEventListener('currencySettingsUpdated', (event) => {
        console.log('🛒 Cart Items: Currency settings updated:', event.detail);
        updateAllPriceDisplays();
      });
      
      // ✅ الاشتراك في CurrencyService إذا كان متوفر
      if (window.CurrencyService && window.CurrencyService.subscribe) {
        window.CurrencyService.subscribe((settings) => {
          console.log('🛒 Cart Items: CurrencyService updated:', settings);
          updateAllPriceDisplays();
        });
      }
      
      // ✅ الاشتراك في CodformUnifiedSystem إذا كان متوفر
      if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.subscribe) {
        window.CodformUnifiedSystem.subscribe((settings) => {
          console.log('🛒 Cart Items: UnifiedSystem updated:', settings);
          updateAllPriceDisplays();
        });
      }
      
      isInitialized = true;
      console.log('🛒 Cart Items: UNIFIED initialization complete');
      
      // تحديث فوري للأسعار
      setTimeout(updateAllPriceDisplays, 100);
      
    } catch (error) {
      console.error('🚨 Cart Items - Initialization error:', error);
      isInitialized = true;
    }
  }

  // ✅ تصدير النظام للاستخدام العالمي
  window.CodformCartItems = {
    initialize: initialize,
    renderCartItems: renderCartItems,
    increaseQuantity: increaseQuantity,
    decreaseQuantity: decreaseQuantity,
    updateAllPriceDisplays: updateAllPriceDisplays,
    formatCurrency: formatCurrency,
    getPreferredCurrency: getPreferredCurrency,
    convertCurrency: convertCurrency
  };

  // ✅ تهيئة تلقائية
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // تأخير قصير للسماح بتحميل الأنظمة الأخرى
    setTimeout(initialize, 200);
  }

  console.log('✅ CODFORM Cart Items UNIFIED System loaded and ready');

})();