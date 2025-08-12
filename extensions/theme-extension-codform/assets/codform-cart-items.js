/**
 * CODFORM Cart Items Handler
 * بناء على نفس طريقة cart-summary لضمان التوافق مع النظام
 */

(function() {
  'use strict';

  console.log('🛒 CODFORM Cart Items System: Starting initialization...');

  let cachedProductPrice = null;
  let cachedCurrency = null;
  let isInitialized = false;

  /**
   * Fetch product data from current Shopify page or API
   */
  async function fetchProductPrice() {
    try {
      console.log('🛒 Cart Items: Getting product data from current page...');

      let productData = {
        price: 29.99,
        currency: 'SAR',
        title: 'Product',
        image: null
      };

      // Try to get product data from current page URL
      const currentUrl = window.location.href;
      const isProductPage = currentUrl.includes('/products/');
      
      if (isProductPage) {
        // Extract product handle from URL
        const urlParts = currentUrl.split('/products/');
        if (urlParts.length > 1) {
          const productHandle = urlParts[1].split('?')[0].split('#')[0];
          console.log('🛒 Cart Items: Found product handle:', productHandle);
          
          try {
            // Use Shopify Product API
            const productApiUrl = `/products/${productHandle}.js`;
            const response = await fetch(productApiUrl);
            
            if (response.ok) {
              const product = await response.json();
              console.log('🛒 Cart Items: Got product from API:', product);
              
              if (product && product.variants && product.variants.length > 0) {
                const variant = product.variants[0];
                productData.price = variant.price / 100; // Convert from cents
                productData.title = product.title;
                productData.image = product.featured_image;
                
                // Get currency from Shopify theme
                if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) {
                  productData.currency = window.Shopify.currency.active;
                } else if (window.theme && window.theme.moneyWithCurrencyFormat) {
                  // Extract currency from money format
                  const currencyMatch = window.theme.moneyWithCurrencyFormat.match(/\b[A-Z]{3}\b/);
                  if (currencyMatch) {
                    productData.currency = currencyMatch[0];
                  }
                }
                
                console.log('🛒 Cart Items: Product data loaded:', productData);
              }
            }
          } catch (apiError) {
            console.log('🛒 Cart Items: API call failed, using fallbacks:', apiError);
          }
        }
      }

      // Try to get data from DOM elements if API failed
      if (productData.price === 29.99) {
        // Try to find price in DOM
        const priceSelectors = [
          '.price .money',
          '.product-price .money',
          '.current-price',
          '[data-price]',
          '.price-current'
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = document.querySelector(selector);
          if (priceElement) {
            const priceText = priceElement.textContent || priceElement.getAttribute('data-price');
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              productData.price = parseFloat(priceMatch[0].replace(',', ''));
              console.log('🛒 Cart Items: Found price in DOM:', productData.price);
              break;
            }
          }
        }
        
        // Try to find title in DOM
        const titleSelectors = [
          'h1.product-title',
          '.product-title h1',
          'h1[data-product-title]',
          '.product-single__title',
          'h1'
        ];
        
        for (const selector of titleSelectors) {
          const titleElement = document.querySelector(selector);
          if (titleElement && titleElement.textContent.trim()) {
            productData.title = titleElement.textContent.trim();
            console.log('🛒 Cart Items: Found title in DOM:', productData.title);
            break;
          }
        }
        
        // Try to find image in DOM
        const imageSelectors = [
          '.product-single__photos img',
          '.product-image img',
          '[data-product-image]',
          '.featured-image img'
        ];
        
        for (const selector of imageSelectors) {
          const imageElement = document.querySelector(selector);
          if (imageElement && imageElement.src) {
            productData.image = imageElement.src;
            console.log('🛒 Cart Items: Found image in DOM:', productData.image);
            break;
          }
        }
      }

      // **سيتم التطبيق من خلال النظام الموحد لاحقاً**
      // Apply currency conversion تم إلغاؤه هنا لتجنب التضارب
      console.log('🛒 Cart Items: Currency conversion will be handled by unified system');

      // Cache the results
      cachedProductPrice = productData.price;
      cachedCurrency = productData.currency;
      window.CodformProductData = productData; // Store globally for access

      console.log(`🛒 Cart Items: Final product data - Price: ${productData.price}, Currency: ${productData.currency}, Title: ${productData.title}`);

      return productData;

    } catch (error) {
      console.error('🚨 Cart Items - Error getting product data:', error);
      
      // Use fallback values
      const fallbackData = {
        price: 29.99,
        currency: 'SAR',
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
   * Format currency using the same logic as cart-summary
   */
  function formatCurrency(amount, currency, displaySettings = {}) {
    try {
      console.log(`🛒 Cart Items: Formatting currency - Amount: ${amount}, Currency: ${currency}`);
      
      // DO NOT use Smart Currency System as it's causing issues
      // Force use our own formatting to ensure consistency
      
      // Enhanced currency symbols with Arabic support
      const symbols = {
        'SAR': 'ر.س',
        'MAD': 'د.م',
        'AED': 'د.إ', // Dirhams
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'EGP': 'ج.م',
        'JOD': 'د.ا',
        'KWD': 'د.ك',
        'QAR': 'ر.ق',
        'BHD': 'د.ب',
        'OMR': 'ر.ع'
      };

      const symbol = symbols[currency] || currency;
      const formattedAmount = parseFloat(amount).toFixed(2);
      
      // Format based on currency
      let formatted;
      if (['SAR', 'MAD', 'AED', 'EGP', 'JOD', 'KWD', 'QAR', 'BHD', 'OMR'].includes(currency)) {
        // Arabic currencies - symbol after amount
        formatted = `${formattedAmount} ${symbol}`;
      } else {
        // Western currencies - symbol before amount
        formatted = `${symbol}${formattedAmount}`;
      }
      
      console.log(`🛒 Cart Items: Formatted currency: ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('🚨 Cart Items - Error formatting currency:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * Render cart items field
   */
  function renderCartItems(field, formStyle, formDirection) {
    console.log('🛒 Cart Items: Rendering field...');

    if (!cachedProductPrice || !cachedCurrency) {
      console.warn('🛒 Cart Items: No cached data available, showing placeholder');
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

    const fieldStyle = field.style || {};
    const direction = formDirection || 'ltr';
    const isRTL = direction === 'rtl';
    
    // Dynamic labels based on direction
    const priceLabel = isRTL ? 'السعر:' : 'Price:';
    const quantityLabel = isRTL ? 'الكمية:' : 'Quantity:';
    const fontFamily = isRTL ? "'Cairo', sans-serif" : "inherit";
    
    // Apply currency settings for initial display - COMPLETE FIX
    let displayPrice = cachedProductPrice;
    let displayCurrency = cachedCurrency;
    
    // ✅ Use currency manager for proper custom rates application
    let formattedPrice = formatCurrency(cachedProductPrice, cachedCurrency);
    
    // Apply custom rates from currency manager if available
    if (window.CodformCurrencyManager && window.CodformCurrencyManager.formatCurrency) {
      formattedPrice = window.CodformCurrencyManager.formatCurrency(cachedProductPrice, cachedCurrency);
    } else if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.formatCurrency) {
      formattedPrice = window.CodformUnifiedSystem.formatCurrency(cachedProductPrice, cachedCurrency);
    }
    
    // Get product data from cache
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
          <!-- Product Information -->
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: ${fontFamily};
          ">
            <!-- Product Image -->
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
            
            <!-- Product Details -->
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
              ">${priceLabel} <span class="cart-items-price" data-currency="${cachedCurrency}">${formattedPrice}</span></p>
            </div>
            
            <!-- Quantity Controls -->
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
   * Increase quantity
   */
  function increaseQuantity(button) {
    const quantitySpan = button.previousElementSibling;
    let currentQuantity = parseInt(quantitySpan.textContent);
    const newQuantity = currentQuantity + 1;
    quantitySpan.textContent = newQuantity;
    
    console.log('🛒 Cart Items: Quantity increased to:', newQuantity);
    
    // Update price display based on new quantity
    updatePriceDisplay(newQuantity);
    
    // Update shared state
    if (window.CodformStateManager) {
      window.CodformStateManager.updateQuantity(newQuantity);
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('codform:quantity-changed', {
      detail: { quantity: newQuantity, source: 'cart-items' }
    }));
  }

  /**
   * Decrease quantity
   */
  function decreaseQuantity(button) {
    const quantitySpan = button.nextElementSibling;
    let currentQuantity = parseInt(quantitySpan.textContent);
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      quantitySpan.textContent = newQuantity;
      
      console.log('🛒 Cart Items: Quantity decreased to:', newQuantity);
      
      // Update price display based on new quantity
      updatePriceDisplay(newQuantity);
      
      // Update shared state
      if (window.CodformStateManager) {
        window.CodformStateManager.updateQuantity(newQuantity);
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('codform:quantity-changed', {
        detail: { quantity: newQuantity, source: 'cart-items' }
      }));
    }
  }

  /**
   * Initialize cart items system
   */
  async function initialize() {
    if (isInitialized) {
      console.log('🛒 Cart Items: Already initialized');
      return;
    }

    try {
      console.log('🛒 Cart Items: Initializing...');
      
      // Fetch product data from API
      await fetchProductPrice();
      
      isInitialized = true;
      console.log('🛒 Cart Items: Initialization complete');
      
      return true;
    } catch (error) {
      console.error('🚨 Cart Items: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Update price display based on quantity
   */
  function updatePriceDisplay(quantity) {
    if (!cachedProductPrice || !cachedCurrency) {
      console.warn('🛒 Cart Items: Missing cached data for price update');
      return;
    }
    
    console.log(`🛒 Cart Items: Updating price for quantity ${quantity} - Base price: ${cachedProductPrice}, Currency: ${cachedCurrency}`);
    
    // Apply currency settings for the total price
    let unitPrice = cachedProductPrice;
    let displayCurrency = cachedCurrency;
    
    // Check for form currency settings
    try {
      const savedCurrencySettings = localStorage.getItem('codform_currency_settings');
      console.log(`🛒 Cart Items: Currency settings for update:`, savedCurrencySettings);
      
      if (savedCurrencySettings) {
        const settings = JSON.parse(savedCurrencySettings);
        console.log(`🛒 Cart Items: Parsed settings for update:`, settings);
        
        if (settings.currency && settings.exchangeRates) {
          // Always use the form's configured currency
          displayCurrency = settings.currency;
          
          // If we need to convert from original currency
          if (settings.currency !== cachedCurrency) {
            const rate = settings.exchangeRates[settings.currency];
            console.log(`🛒 Cart Items: Exchange rate for update ${settings.currency}:`, rate);
            
            if (rate && rate > 0) {
              unitPrice = cachedProductPrice * rate;
              console.log(`🛒 Cart Items: Converted unit price: ${cachedProductPrice} x ${rate} = ${unitPrice}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('🚨 Cart Items: Error applying currency settings during update:', error);
    }
    
    // Calculate total price based on quantity
    const totalPrice = unitPrice * quantity;
    console.log(`🛒 Cart Items: Total price calculation: ${unitPrice} x ${quantity} = ${totalPrice} ${displayCurrency}`);
    
    const formattedPrice = formatCurrency(totalPrice, displayCurrency);
    console.log(`🛒 Cart Items: Formatted price: ${formattedPrice}`);
    
    // Update all price elements in cart items
    document.querySelectorAll('.codform-cart-items .cart-items-price').forEach(priceElement => {
      priceElement.textContent = formattedPrice;
      priceElement.setAttribute('data-currency', displayCurrency);
      console.log(`🛒 Cart Items: Updated price element to: ${formattedPrice}`);
    });
    
    console.log(`🛒 Cart Items: Price updated - Quantity: ${quantity}, Total: ${formattedPrice}`);
  }

  /**
   * Update currency when form settings change
   */
  function updateCurrency() {
    // Clear cache to force refresh
    cachedProductPrice = null;
    cachedCurrency = null;
    
    // Re-initialize with new data
    initialize().then(() => {
      // Update any existing cart items displays
      document.querySelectorAll('.codform-cart-items').forEach(cartItem => {
        const priceElement = cartItem.querySelector('.cart-items-price');
        if (priceElement && cachedProductPrice && cachedCurrency) {
          const quantity = parseInt(cartItem.querySelector('.cart-items-quantity')?.textContent || '1');
          updatePriceDisplay(quantity);
        }
      });
    });
  }

  /**
   * ULTIMATE FIX: Prevent ANY external system from changing our prices
   */
  function lockPriceDisplay() {
    console.log('🔒 Cart Items: Activating ULTIMATE price lock system');
    
    // Get the correct values
    const savedCurrencySettings = localStorage.getItem('codform_currency_settings');
    let targetCurrency = cachedCurrency;
    let conversionRate = 1;
    
    if (savedCurrencySettings) {
      try {
        const settings = JSON.parse(savedCurrencySettings);
        if (settings.currency && settings.exchangeRates) {
          targetCurrency = settings.currency;
          conversionRate = settings.exchangeRates[settings.currency] || 1;
        }
      } catch (e) {
        console.error('Error parsing currency settings:', e);
      }
    }

    // Calculate correct price
    function getCorrectPrice(quantity = 1) {
      const convertedPrice = cachedProductPrice * conversionRate * quantity;
      return formatCurrency(convertedPrice, targetCurrency);
    }

    // Override any attempts to change price
    function forcePriceCorrection() {
      const priceElements = document.querySelectorAll('.codform-cart-items .cart-items-price');
      priceElements.forEach((priceElement) => {
        const quantityElement = document.querySelector('.cart-items-quantity');
        const quantity = quantityElement ? parseInt(quantityElement.textContent || '1') : 1;
        const correctPrice = getCorrectPrice(quantity);
        
        // Force the correct price
        if (priceElement.textContent !== correctPrice) {
          priceElement.textContent = correctPrice;
          priceElement.setAttribute('data-currency', targetCurrency);
          priceElement.setAttribute('data-locked', 'true');
          console.log(`🔒 Cart Items: Price LOCKED to ${correctPrice}`);
        }
      });
    }

    // Immediate correction
    forcePriceCorrection();

    // Monitor and correct every 100ms for the first 3 seconds
    let corrections = 0;
    const intensiveMonitor = setInterval(() => {
      forcePriceCorrection();
      corrections++;
      if (corrections >= 30) { // 3 seconds
        clearInterval(intensiveMonitor);
        console.log('🔒 Cart Items: Intensive monitoring complete');
      }
    }, 100);

    // Continuous monitoring with MutationObserver
    const observer = new MutationObserver(() => {
      forcePriceCorrection();
    });

    const cartItems = document.querySelector('.codform-cart-items');
    if (cartItems) {
      observer.observe(cartItems, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }

    // Override Shopify's money formatting functions if they exist
    if (window.Shopify && window.Shopify.formatMoney) {
      const originalFormatMoney = window.Shopify.formatMoney;
      window.Shopify.formatMoney = function(cents, format) {
        // If this is being called on our cart items, use our format
        const cartContext = document.querySelector('.codform-cart-items');
        if (cartContext && document.activeElement && cartContext.contains(document.activeElement)) {
          const quantity = parseInt(document.querySelector('.cart-items-quantity')?.textContent || '1');
          return getCorrectPrice(quantity);
        }
        return originalFormatMoney.call(this, cents, format);
      };
    }

    return observer;
  }

  // Auto-initialize when the document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize().then(() => {
        // Activate ULTIMATE price lock after initialization
        setTimeout(lockPriceDisplay, 200);
      });
    });
  } else {
    setTimeout(() => {
      initialize().then(() => {
        // Activate ULTIMATE price lock after initialization
        setTimeout(lockPriceDisplay, 200);
      });
    }, 100);
  }

  // Listen for currency changes
  window.addEventListener('codform:currency-changed', updateCurrency);

  // ✅ استمع للتحديثات من النظام الموحد
  window.addEventListener('currencySettingsUpdated', function(event) {
    console.log('🛒 Cart Items: Currency settings updated, refreshing display');
    setTimeout(() => {
      if (window.CodformUnifiedSystem && window.CodformUnifiedSystem.updateCartItems) {
        window.CodformUnifiedSystem.updateCartItems();
      } else {
        // Fallback للتحديث اليدوي
        const existingCartItems = document.querySelector('.codform-cart-items');
        if (existingCartItems) {
          const quantityElement = existingCartItems.querySelector('.cart-items-quantity');
          const quantity = quantityElement ? parseInt(quantityElement.textContent) : 1;
          updatePriceDisplay(quantity);
        }
      }
    }, 100);
  });

  // Export global API
  window.CodformCartItems = {
    render: renderCartItems,
    increaseQuantity: increaseQuantity,
    decreaseQuantity: decreaseQuantity,
    initialize: initialize,
    updateCurrency: updateCurrency,
    updatePriceDisplay: updatePriceDisplay
  };

  console.log('🛒 CODFORM Cart Items System: Setup complete');

})();