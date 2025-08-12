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
   * Fetch product price from Shopify API
   */
  async function fetchProductPrice() {
    try {
      // Get form and shop info
      const formId = window.codformProductId || 'auto-detect';
      const shopDomain = window.codformShopDomain || 'auto-detect';
      
      console.log(`🛒 Cart Items: Fetching product price for Form: ${formId}, Shop: ${shopDomain}`);

      // Use the same API endpoint as cart-summary
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/currency-settings?shopId=${encodeURIComponent(shopDomain)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🛒 Cart Items: Currency settings received:', data);

      // Extract currency and exchange rates
      const currency = data.display_settings?.currency || data.currency || 'SAR';
      const exchangeRates = data.exchange_rates || {};
      
      // Get product price from Shopify global variable
      const productPriceUSD = window.CodformProductPrice || 
                             (window.product && window.product.price ? window.product.price / 100 : null) ||
                             29.99; // fallback

      console.log(`🛒 Cart Items: Product price in USD: ${productPriceUSD}`);

      // Convert currency if needed
      let convertedPrice = productPriceUSD;
      if (currency !== 'USD' && exchangeRates[currency]) {
        convertedPrice = productPriceUSD * exchangeRates[currency];
        console.log(`🛒 Cart Items: Converted ${productPriceUSD} USD to ${convertedPrice} ${currency}`);
      }

      // Cache the results
      cachedProductPrice = convertedPrice;
      cachedCurrency = currency;

      return {
        price: convertedPrice,
        currency: currency,
        displaySettings: data.display_settings || {}
      };

    } catch (error) {
      console.error('🚨 Cart Items - Error fetching product data:', error);
      
      // Use fallback values
      cachedProductPrice = 29.99;
      cachedCurrency = 'SAR';
      
      return {
        price: 29.99,
        currency: 'SAR',
        displaySettings: {}
      };
    }
  }

  /**
   * Format currency using the same logic as cart-summary
   */
  function formatCurrency(amount, currency, displaySettings = {}) {
    try {
      // Use Smart Currency System if available
      if (window.CodformSmartCurrency && window.CodformSmartCurrency.formatCurrency) {
        return window.CodformSmartCurrency.formatCurrency(amount, currency);
      }

      // Fallback formatting
      const symbols = {
        'SAR': 'ر.س',
        'MAD': 'د.م',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
      };

      const symbol = symbols[currency] || currency;
      const formattedAmount = parseFloat(amount).toFixed(2);
      
      return `${formattedAmount} ${symbol}`;
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
    
    // Format the cached price
    const formattedPrice = formatCurrency(cachedProductPrice, cachedCurrency);
    
    // Get product title from Shopify global or fallback
    const productTitle = (window.product && window.product.title) || 
                        (window.CodformProductTitle) || 
                        'Product';

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
            <!-- Product Image Placeholder -->
            <div style="
              width: 60px;
              height: 60px;
              background-color: #f3f4f6;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e7eb;
            ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 17a2 2 0 11-4 0 2 2 0 014 0zM9 17a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
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
          priceElement.textContent = formatCurrency(cachedProductPrice, cachedCurrency);
          priceElement.setAttribute('data-currency', cachedCurrency);
        }
      });
    });
  }

  // Auto-initialize when the document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100);
  }

  // Listen for currency changes
  window.addEventListener('codform:currency-changed', updateCurrency);

  // Export global API
  window.CodformCartItems = {
    render: renderCartItems,
    increaseQuantity: increaseQuantity,
    decreaseQuantity: decreaseQuantity,
    initialize: initialize,
    updateCurrency: updateCurrency
  };

  console.log('🛒 CODFORM Cart Items System: Setup complete');

})();