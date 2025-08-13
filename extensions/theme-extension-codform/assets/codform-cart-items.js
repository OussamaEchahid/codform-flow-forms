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

  // Robust detection of the shop BASE currency (not active/display)
  function detectShopBaseCurrency() {
    try {
      // 1) Shopify declared base currency (most reliable)
      const shopBase = window.Shopify?.currency?.shopCurrency || window.Shopify?.currency?.shop_currency;
      if (shopBase && /^[A-Z]{3}$/.test(shopBase)) return shopBase;

      // 2) ShopifyAnalytics
      try {
        const sa = window.ShopifyAnalytics?.meta?.currency;
        if (sa && /^[A-Z]{3}$/.test(sa)) return sa;
      } catch (_) {}

      // 3) Meta tags
      try {
        const metaCur = document.querySelector('meta[property="og:price:currency"]')?.content
          || document.querySelector('meta[property="product:price:currency"]')?.content
          || document.querySelector('meta[itemprop="priceCurrency"]')?.content;
        if (metaCur && /^[A-Z]{3}$/.test(metaCur)) return metaCur;
      } catch (_) {}

      // 4) JSON-LD blocks
      try {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent || 'null');
            const arr = Array.isArray(data) ? data : [data];
            for (const obj of arr) {
              const cur = obj?.offers?.priceCurrency || obj?.priceCurrency;
              if (cur && /^[A-Z]{3}$/.test(cur)) return cur;
            }
          } catch (_) {}
        }
      } catch (_) {}

      // 5) Money format strings in theme
      const moneyFormats = [
        window.Shopify && window.Shopify.money_format,
        window.Shopify && window.Shopify.money_with_currency_format,
        window.theme && window.theme.moneyFormat,
        window.theme && window.theme.moneyWithCurrencyFormat
      ];
      for (const fmt of moneyFormats) {
        if (typeof fmt === 'string') {
          const m = fmt.match(/\b[A-Z]{3}\b/);
          if (m) return m[0];
        }
      }

      // 6) Local storage cache from previous successful detections
      try {
        const cached = localStorage.getItem('codform_shop_base_currency');
        if (cached && /^[A-Z]{3}$/.test(cached)) return cached;
      } catch (_) {}

    } catch (e) {
      console.warn('⚠️ Cart Items: detectShopBaseCurrency failed', e);
    }
    // Safe fallback: assume USD (prevents mislabeling MAD as base)
    return 'USD';
  }

  /**
   * Fetch product data from current Shopify page or API
   */

  // Async base currency resolution via Supabase edge function (authoritative)
  async function detectShopBaseCurrencyAsync() {
    try {
      // Determine shop domain
      let shop = (window.Shopify && (window.Shopify.shop || window.Shopify.shop_domain)) || location.hostname;
      if (shop && !shop.includes('.myshopify.com')) {
        shop = `${shop}`; // some themes give clean domain; edge will normalize
      }
      const url = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-shop-info';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      const cur = data?.shop?.currency;
      if (cur && /^[A-Z]{3}$/.test(cur)) {
        try { localStorage.setItem('codform_shop_base_currency', cur); } catch (_) {}
        return cur;
      }
    } catch (_) {}
    return null;
  }

    try {
      console.log('🛒 Cart Items: Getting product data from current page...');

      let productData = {
        price: 29.99,
        currency: detectShopBaseCurrency() || 'MAD',
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
                
                // Determine source currency robustly (BASE currency of the shop)
                const finalBase = detectShopBaseCurrency();
                if (finalBase) {
                  productData.currency = finalBase;
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
            const raw = (priceElement.textContent || priceElement.getAttribute('data-price') || '').trim();
            const priceMatch = raw.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              productData.price = parseFloat(priceMatch[0].replace(',', ''));
              // Detect currency from the same text/element to avoid misinterpreting MAD as USD
              const detectFromText = (txt) => {
                if (!txt) return null;
                const t = txt.replace(/\s+/g, ' ');
                if (/\bMAD\b|د\.م/.test(t)) return 'MAD';
                if (/\bSAR\b|ر\.س/.test(t)) return 'SAR';
                if (/\bAED\b|د\.إ/.test(t)) return 'AED';
                if (/\bUSD\b|\$/.test(t)) return 'USD';
                if (/\bEUR\b|€/.test(t)) return 'EUR';
                if (/\bGBP\b|£/.test(t)) return 'GBP';
                return null;
              };
              const attrCurrency = priceElement.getAttribute('data-currency') || priceElement.closest('[data-currency]')?.getAttribute('data-currency');
              const textCurrency = detectFromText(raw);
              const resolved = attrCurrency || textCurrency;
              if (resolved) {
                productData.currency = resolved;
              }
              console.log('🛒 Cart Items: Found price in DOM:', productData.price, 'currency:', productData.currency);
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
      cachedCurrency = productData.currency; // keep source currency
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
   * Format currency using Currency Manager with custom conversion rates
   */
  function formatCurrency(amount, currency, displaySettings = {}) {
    try {
      // Determine preferred target currency from SmartCurrency/Form/Shopify
      let target = currency;
      if (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function') {
        target = window.CodformSmartCurrency.getCurrentCurrency() || target;
      } else if (window.CodformFormData && window.CodformFormData.currency) {
        target = window.CodformFormData.currency || target;
      } else if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) {
        target = window.Shopify.currency.active || target;
      }

      // Prefer Currency Manager for conversion + formatting
      if (window.CodformCurrencyManager) {
        let displayAmount = amount;
        if (typeof window.CodformCurrencyManager.convertCurrency === 'function' && currency !== target) {
          displayAmount = window.CodformCurrencyManager.convertCurrency(amount, currency, target);
        }
        const formatted = typeof window.CodformCurrencyManager.formatCurrency === 'function'
          ? window.CodformCurrencyManager.formatCurrency(displayAmount, target)
          : `${displayAmount} ${target}`;
        console.log(`🛒 Cart Items: Currency Manager formatted: ${formatted}`);
        return formatted;
      }

      // Fallback: simple formatting without conversion
      return `${amount} ${target}`;
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
    
    // Resolve target currency from form settings first (prefer unified system if available)
    const targetCurrency =
      (window.CodformFormData && window.CodformFormData.currency)
      || (window.currentFormData && window.currentFormData.savedFormCurrency)
      || window.formCurrency
      || (document.querySelector('.cart-summary-field') && document.querySelector('.cart-summary-field').getAttribute('data-currency'))
      || (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function' && window.CodformSmartCurrency.getCurrentCurrency())
      || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active)
      || (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.getPreferredCurrency === 'function' && window.CodformUnifiedSystem.getPreferredCurrency())
      || cachedCurrency;
    
    // Convert unit price to target currency if needed
    let unitPrice = cachedProductPrice;
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function' && cachedCurrency !== targetCurrency) {
      unitPrice = window.CodformCurrencyManager.convertCurrency(cachedProductPrice, cachedCurrency, targetCurrency);
    }
    
    // Format using Currency Manager when available
    let formattedPrice;
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
      formattedPrice = window.CodformCurrencyManager.formatCurrency(unitPrice, targetCurrency);
    } else {
      formattedPrice = `${unitPrice} ${targetCurrency}`;
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
              ">${priceLabel} <span class="cart-items-price" data-currency="${targetCurrency}" data-base-price="${cachedProductPrice}" data-base-currency="${cachedCurrency}" style="visibility: hidden;">${formattedPrice}</span></p>
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
      
      // Hide price until currency is resolved to avoid flicker
      setCartItemsLoading(true);
      
      // Fetch product data from API
      await fetchProductPrice();

      // Wait briefly for Currency Manager custom rates to load (ensures custom MAD rate applied)
      try { await waitForCurrencyReady(1800); } catch (e) {}

      // Attempt initial price render (will remain hidden until currency resolved)
      try {
        const existingCartItems = document.querySelector('.codform-cart-items');
        const quantity = parseInt(existingCartItems?.querySelector('.cart-items-quantity')?.textContent || '1');
        updatePriceDisplay(quantity || 1);
      } catch (e) {}
      
      isInitialized = true;
      console.log('🛒 Cart Items: Initialization complete');
      
      // Final fallback: if currency not resolved within 1.2s, show price using best-known target
      setTimeout(() => {
        try {
          const existingCartItems = document.querySelector('.codform-cart-items');
          const qty = parseInt(existingCartItems?.querySelector('.cart-items-quantity')?.textContent || '1');
          updatePriceDisplay(qty || 1);
          setCartItemsLoading(false);
        } catch (e) {}
      }, 1200);
      
      return true;
    } catch (error) {
      console.error('🚨 Cart Items: Initialization failed:', error);
      return false;
    }
  }

  function setCartItemsLoading(isLoading) {
    document.querySelectorAll('.codform-cart-items .cart-items-price').forEach(el => {
      el.style.visibility = isLoading ? 'hidden' : 'visible';
    });
  }

  // Wait until Currency Manager loads custom rates (or timeout)
  async function waitForCurrencyReady(timeoutMs = 1500) {
    const start = Date.now();
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
      const rates = window.CodformCurrencyManager.getRates();
      if (rates && Object.keys(rates).length > 0) return true;
    }
    return await new Promise((resolve) => {
      let resolved = false;
      const onUpdate = () => {
        if (resolved) return;
        try {
          const r = window.CodformCurrencyManager?.getRates?.() || {};
          if (Object.keys(r).length > 0) {
            resolved = true;
            window.removeEventListener('currencySettingsUpdated', onUpdate);
            resolve(true);
          }
        } catch (e) {}
      };
      window.addEventListener('currencySettingsUpdated', onUpdate);
      setTimeout(() => { if (!resolved) { window.removeEventListener('currencySettingsUpdated', onUpdate); resolve(false); } }, timeoutMs);
    });
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
    
    let targetCurrency =
      (window.CodformFormData && window.CodformFormData.currency) ||
      (window.currentFormData && window.currentFormData.savedFormCurrency) ||
      window.formCurrency ||
      (document.querySelector('.cart-summary-field') && document.querySelector('.cart-summary-field').getAttribute('data-currency')) ||
      (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function' && window.CodformSmartCurrency.getCurrentCurrency()) ||
      (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) ||
      (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.getPreferredCurrency === 'function' && window.CodformUnifiedSystem.getPreferredCurrency()) ||
      cachedCurrency;

    let unitPrice = cachedProductPrice;
    let formattedPrice;

    // Prefer Currency Manager first to guarantee custom rates usage
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function') {
      if (cachedCurrency !== targetCurrency) {
        unitPrice = window.CodformCurrencyManager.convertCurrency(cachedProductPrice, cachedCurrency, targetCurrency);
      }
      const totalPrice = unitPrice * quantity;
      if (typeof window.CodformCurrencyManager.formatCurrency === 'function') {
        formattedPrice = window.CodformCurrencyManager.formatCurrency(totalPrice, targetCurrency);
      } else {
        formattedPrice = `${totalPrice} ${targetCurrency}`;
      }
    } else if (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.formatCurrency === 'function') {
      const totalBase = cachedProductPrice * quantity; // base in source currency
      formattedPrice = window.CodformUnifiedSystem.formatCurrency(totalBase, cachedCurrency);
      targetCurrency = (window.CodformUnifiedSystem.getPreferredCurrency && window.CodformUnifiedSystem.getPreferredCurrency()) || targetCurrency;
    } else {
      // Final fallback: no conversion available
      const totalPrice = cachedProductPrice * quantity;
      formattedPrice = `${totalPrice} ${targetCurrency}`;
    }
    console.log(`🛒 Cart Items: Formatted price: ${formattedPrice}`);
    // Update all price elements in cart items
    document.querySelectorAll('.codform-cart-items .cart-items-price').forEach(priceElement => {
      priceElement.textContent = formattedPrice;
      priceElement.setAttribute('data-currency', targetCurrency);
      console.log(`🛒 Cart Items: Updated price element to: ${formattedPrice}`);
    });

    // Reveal prices when currency is reasonably resolved
    const canShow = Boolean(
      (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.getPreferredCurrency === 'function' && window.CodformUnifiedSystem.getPreferredCurrency()) ||
      (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getSettings === 'function') ||
      (window.CodformFormData && window.CodformFormData.currency) ||
      (window.currentFormData && window.currentFormData.savedFormCurrency) ||
      window.formCurrency ||
      (document.querySelector('.cart-summary-field') && document.querySelector('.cart-summary-field').getAttribute('data-currency'))
    );
    if (canShow) {
      setCartItemsLoading(false);
    }

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

    function resolveTargetCurrency() {
      return (window.CodformFormData && window.CodformFormData.currency)
        || (window.currentFormData && window.currentFormData.savedFormCurrency)
        || window.formCurrency
        || (document.querySelector('.cart-summary-field') && document.querySelector('.cart-summary-field').getAttribute('data-currency'))
        || (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function' && window.CodformSmartCurrency.getCurrentCurrency())
        || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active)
        || cachedCurrency;
    }

    // Calculate correct price string for a quantity
    function getCorrectPrice(quantity = 1) {
      const target = resolveTargetCurrency();
      let amount = cachedProductPrice;
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function' && cachedCurrency !== target) {
        amount = window.CodformCurrencyManager.convertCurrency(cachedProductPrice, cachedCurrency, target);
      }
      const total = amount * quantity;
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
        return window.CodformCurrencyManager.formatCurrency(total, target);
      }
      return `${total} ${target}`;
    }

    // Override any attempts to change price
    function forcePriceCorrection() {
      const priceElements = document.querySelectorAll('.codform-cart-items .cart-items-price');
      priceElements.forEach((priceElement) => {
        const quantityElement = document.querySelector('.cart-items-quantity');
        const quantity = quantityElement ? parseInt(quantityElement.textContent || '1') : 1;
        const correctPrice = getCorrectPrice(quantity);
        const target = resolveTargetCurrency();
        if (priceElement.textContent !== correctPrice) {
          priceElement.textContent = correctPrice;
          priceElement.setAttribute('data-currency', target);
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
      // Ensure price is visible once settings are applied
      setCartItemsLoading(false);
    }, 100);
  });
  
  // React once the form currency is resolved by Cart Summary/API
  window.addEventListener('codform:form-currency-resolved', function(e) {
    console.log('🛒 Cart Items: Form currency resolved event received');
    // Do not override source currency; just re-render with new target currency
    const existingCartItems = document.querySelector('.codform-cart-items');
    if (existingCartItems) {
      const quantity = parseInt(existingCartItems.querySelector('.cart-items-quantity')?.textContent || '1');
      updatePriceDisplay(quantity || 1);
      setCartItemsLoading(false);
    }
  });

  // Sync price/currency from Cart Summary product data (single source of truth)
  window.addEventListener('codform:product-data', function(event) {
    const detail = event.detail || {};
    if (typeof detail.price === 'number' && detail.currency) {
      console.log('🛒 Cart Items: Received product data from summary:', detail);
      cachedProductPrice = detail.price;
      cachedCurrency = detail.currency;
      window.CodformProductData = { ...(window.CodformProductData || {}), price: cachedProductPrice, currency: cachedCurrency };
      const existingCartItems = document.querySelector('.codform-cart-items');
      const qty = parseInt(existingCartItems?.querySelector('.cart-items-quantity')?.textContent || '1');
      updatePriceDisplay(qty || 1);
      setCartItemsLoading(false);
    }
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