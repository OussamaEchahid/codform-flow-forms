/**
 * CODFORM Cart Items Handler - محسن للمعدلات المخصصة
 * إصدار محسن لحل مشكلة معدلات التحويل المخصصة
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

      // 5) Local storage cache
      try {
        const cached = localStorage.getItem('codform_shop_base_currency');
        if (cached && /^[A-Z]{3}$/.test(cached)) return cached;
      } catch (_) {}

    } catch (e) {
      console.warn('⚠️ Cart Items: detectShopBaseCurrency failed', e);
    }
    return 'USD'; // Safe fallback
  }

  /**
   * Fetch product data from current Shopify page or API
   */
  async function fetchProductPrice() {
    try {
      console.log('🛒 Cart Items: Getting product data from current page...');

      let productData = {
        price: 29.99,
        currency: detectShopBaseCurrency() || 'USD',
        title: 'Product',
        image: null
      };

      // Try to get product data from current page URL
      const currentUrl = window.location.href;
      const isProductPage = currentUrl.includes('/products/');
      
      if (isProductPage) {
        const urlParts = currentUrl.split('/products/');
        if (urlParts.length > 1) {
          const productHandle = urlParts[1].split('?')[0].split('#')[0];
          console.log('🛒 Cart Items: Found product handle:', productHandle);
          
          try {
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
      }

      // Cache the results
      cachedProductPrice = productData.price;
      cachedCurrency = productData.currency;
      window.CodformProductData = productData;

      // Broadcast for other widgets
      try {
        window.dispatchEvent(new CustomEvent('codform:product-data', {
          detail: { price: productData.price, currency: productData.currency, title: productData.title, image: productData.image }
        }));
      } catch (_) {}

      console.log(`🛒 Cart Items: Final product data - Price: ${productData.price}, Currency: ${productData.currency}, Title: ${productData.title}`);
      return productData;

    } catch (error) {
      console.error('🚨 Cart Items - Error getting product data:', error);
      
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
      // Determine preferred target currency
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

    const isLoading = (!cachedProductPrice || !cachedCurrency);
    if (isLoading) {
      console.warn('🛒 Cart Items: No cached data yet, rendering skeleton UI');
    }

    const fieldStyle = field.style || {};
    const direction = formDirection || 'ltr';
    const isRTL = direction === 'rtl';
    const priceForRender = cachedProductPrice ?? 0;
    const currencyForRender = cachedCurrency ?? (window.CodformFormData?.currency || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || detectShopBaseCurrency());
    
    // Dynamic labels based on direction
    const priceLabel = isRTL ? 'السعر:' : 'Price:';
    const quantityLabel = isRTL ? 'الكمية:' : 'Quantity:';
    const fontFamily = isRTL ? "'Cairo', sans-serif" : "inherit";
    
    // Resolve target currency from form settings first
    const targetCurrency =
      (window.CodformFormData && window.CodformFormData.currency)
      || (window.currentFormData && window.currentFormData.savedFormCurrency)
      || window.formCurrency
      || (document.querySelector('.cart-summary-field') && document.querySelector('.cart-summary-field').getAttribute('data-currency'))
      || (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function' && window.CodformSmartCurrency.getCurrentCurrency())
      || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active)
      || currencyForRender;
    
    // Convert unit price to target currency if needed
    let unitPrice = priceForRender;
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function' && currencyForRender !== targetCurrency) {
      unitPrice = window.CodformCurrencyManager.convertCurrency(priceForRender, currencyForRender, targetCurrency);
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
              ">${priceLabel} <span class="cart-items-price" data-currency="${targetCurrency}" data-base-price="${priceForRender}" data-base-currency="${currencyForRender}">${formattedPrice}</span></p>
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
                background-color: #ffffff;
              ">
                <button class="cart-items-decrease" onclick="window.CodformCartItems.decreaseQuantity(this)" style="
                  background: none;
                  border: none;
                  padding: 8px 12px;
                  color: #6b7280;
                  cursor: pointer;
                  font-size: 16px;
                  line-height: 1;
                  user-select: none;
                ">−</button>
                
                <span class="cart-items-quantity" style="
                  padding: 8px 12px;
                  font-weight: 500;
                  color: #374151;
                  min-width: 40px;
                  text-align: center;
                  border-left: 1px solid #d1d5db;
                  border-right: 1px solid #d1d5db;
                ">1</span>
                
                <button class="cart-items-increase" onclick="window.CodformCartItems.increaseQuantity(this)" style="
                  background: none;
                  border: none;
                  padding: 8px 12px;
                  color: #6b7280;
                  cursor: pointer;
                  font-size: 16px;
                  line-height: 1;
                  user-select: none;
                ">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Increase quantity - محسن
   */
  function increaseQuantity(button) {
    const quantityElement = button.parentElement.querySelector('.cart-items-quantity');
    const currentQuantity = parseInt(quantityElement.textContent) || 1;
    const newQuantity = currentQuantity + 1;
    
    quantityElement.textContent = newQuantity;
    console.log(`🛒 Cart Items: Quantity increased to ${newQuantity}`);
    
    // فترة انتظار قصيرة لضمان تطبيق المعدلات المخصصة
    setTimeout(() => {
      updatePriceDisplay(newQuantity);
    }, 50);
  }

  /**
   * Decrease quantity - محسن
   */
  function decreaseQuantity(button) {
    const quantityElement = button.parentElement.querySelector('.cart-items-quantity');
    const currentQuantity = parseInt(quantityElement.textContent) || 1;
    
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      quantityElement.textContent = newQuantity;
      console.log(`🛒 Cart Items: Quantity decreased to ${newQuantity}`);
      
      // فترة انتظار قصيرة لضمان تطبيق المعدلات المخصصة
      setTimeout(() => {
        updatePriceDisplay(newQuantity);
      }, 50);
    }
  }

  /**
   * Initialize the cart items system - محسن للمعدلات المخصصة
   */
  async function initialize() {
    console.log('🛒 Cart Items: Initializing system...');
    
    if (isInitialized) {
      console.log('🛒 Cart Items: Already initialized, skipping...');
      return;
    }
    
    try {
      // Load product data first
      await fetchProductPrice();
      
      // Wait for currency settings AND custom rates to be ready
      console.log('🛒 Cart Items: Waiting for currency manager and custom rates...');
      await waitForCurrencyReady(8000); // زيادة المهلة إلى 8 ثوان
      
      // Check if custom rates are actually loaded
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
        const rates = window.CodformCurrencyManager.getRates();
        console.log('🛒 Cart Items: Available rates during init:', rates);
        
        if (rates.MAD && rates.MAD !== 10) {
          console.log(`🛒 Cart Items: ✅ Custom MAD rate found: ${rates.MAD}`);
        } else {
          console.warn('🛒 Cart Items: ⚠️ Custom MAD rate NOT found or still default (10)');
        }
      }
      
      // Initial price render with delay to ensure rates are ready
      setTimeout(() => {
        console.log('🛒 Cart Items: Rendering initial price display...');
        updatePriceDisplay(1);
        console.log('🛒 Cart Items: Initial price display completed');
      }, 500);
      
      isInitialized = true;
      console.log('✅ Cart Items: System fully initialized with custom rates');
      
    } catch (error) {
      console.error('🚨 Cart Items: Initialization failed:', error);
    }
  }

  /**
   * Wait for currency manager to be ready with custom rates - محسن
   */
  function waitForCurrencyReady(timeoutMs = 8000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let checkCount = 0;
      
      function checkReady() {
        checkCount++;
        console.log(`🛒 Cart Items: Currency readiness check #${checkCount}`);
        
        // Check if Currency Manager is available and has custom rates loaded
        if (window.CodformCurrencyManager && 
            typeof window.CodformCurrencyManager.getRates === 'function') {
          
          const rates = window.CodformCurrencyManager.getRates();
          console.log('🛒 Cart Items: Current rates during check:', rates);
          
          // تحقق أكثر دقة للمعدلات المخصصة
          const hasCustomMAD = rates && rates.MAD && rates.MAD !== 10; // 10 is default
          const hasCustomRates = rates && Object.keys(rates).length > 5; // more than just defaults
          
          console.log(`🛒 Cart Items: Custom MAD rate check: ${rates.MAD} (is custom: ${hasCustomMAD})`);
          
          if (hasCustomMAD || hasCustomRates) {
            console.log('✅ Cart Items: Currency Manager is ready with CUSTOM rates!');
            resolve();
            return;
          }
        }
        
        // التحقق من تهيئة Currency Manager
        if (!window.CodformCurrencyManager) {
          console.log('🛒 Cart Items: Currency Manager not available yet...');
        }
        
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(checkReady, 300); // فحص كل 300ms
        } else {
          console.warn('⚠️ Cart Items: Currency readiness timeout, proceeding with available rates');
          console.log('⚠️ Final rates at timeout:', window.CodformCurrencyManager?.getRates?.() || 'No rates');
          resolve();
        }
      }
      
      checkReady();
    });
  }

  /**
   * Update price display with current quantity - محسن للمعدلات المخصصة
   */
  function updatePriceDisplay(quantity = 1) {
    console.log(`🛒 Cart Items: 🔄 UPDATING PRICE DISPLAY for quantity: ${quantity}`);
    console.log(`🛒 Cart Items: Currency Manager available: ${!!window.CodformCurrencyManager}`);
    
    // تحقق مفصل من معدلات العملة
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
      const currentRates = window.CodformCurrencyManager.getRates();
      console.log(`🛒 Cart Items: 💰 CURRENT RATES IN SYSTEM:`, currentRates);
      console.log(`🛒 Cart Items: 🔍 MAD RATE CHECK: ${currentRates.MAD} (expected: 12, default: 10)`);
      
      if (currentRates.MAD === 12) {
        console.log(`🛒 Cart Items: ✅ CORRECT - Custom MAD rate is loaded (12)`);
      } else if (currentRates.MAD === 10) {
        console.log(`🛒 Cart Items: ❌ WRONG - Still using default MAD rate (10)`);
      } else {
        console.log(`🛒 Cart Items: ⚠️ UNKNOWN - MAD rate is ${currentRates.MAD}`);
      }
    }
    
    const priceElements = document.querySelectorAll('.cart-items-price');
    console.log(`🛒 Cart Items: Found ${priceElements.length} price elements to update`);
    
    priceElements.forEach((priceElement, index) => {
      console.log(`🛒 Cart Items: 📝 Processing price element ${index + 1}/${priceElements.length}`);
      
      const basePriceStr = priceElement.getAttribute('data-base-price');
      const baseCurrency = priceElement.getAttribute('data-base-currency');
      const targetCurrency = priceElement.getAttribute('data-currency');
      
      console.log(`🛒 Cart Items: Element ${index + 1} data:`, {
        basePrice: basePriceStr,
        baseCurrency: baseCurrency,
        targetCurrency: targetCurrency
      });
      
      if (!basePriceStr || !baseCurrency || !targetCurrency) {
        console.warn(`🛒 Cart Items: Element ${index + 1} missing required data attributes`);
        return;
      }
      
      const basePrice = parseFloat(basePriceStr);
      if (isNaN(basePrice)) {
        console.warn(`🛒 Cart Items: Element ${index + 1} invalid base price:`, basePriceStr);
        return;
      }
      
      // Calculate total for quantity
      const totalBasePrice = basePrice * quantity;
      console.log(`🛒 Cart Items: Element ${index + 1} total calculation: ${basePrice} × ${quantity} = ${totalBasePrice}`);
      
      // Resolve target currency from form or system preferences
      let finalTargetCurrency = targetCurrency;
      
      // مصادر العملة المستهدفة بالترتيب
      const currencySources = [
        () => window.CodformFormData?.currency,
        () => window.currentFormData?.savedFormCurrency,
        () => window.formCurrency,
        () => document.querySelector('.cart-summary-field')?.getAttribute('data-currency'),
        () => window.CodformSmartCurrency?.getCurrentCurrency?.(),
        () => window.Shopify?.currency?.active,
        () => targetCurrency
      ];
      
      for (const source of currencySources) {
        try {
          const currency = source();
          if (currency && currency !== 'auto-detect') {
            finalTargetCurrency = currency;
            console.log(`🛒 Cart Items: Target currency resolved from source: ${finalTargetCurrency}`);
            break;
          }
        } catch (e) {}
      }
      
      console.log(`🛒 Cart Items: Element ${index + 1} final target currency: ${finalTargetCurrency}`);
      
      let finalPrice = totalBasePrice;
      let formattedPrice = `${finalPrice} ${finalTargetCurrency}`;
      
      // Use Currency Manager for conversion and formatting
      if (window.CodformCurrencyManager) {
        try {
          // Convert currency if different
          if (baseCurrency !== finalTargetCurrency && typeof window.CodformCurrencyManager.convertCurrency === 'function') {
            console.log(`🛒 Cart Items: 💱 STARTING CONVERSION: ${totalBasePrice} ${baseCurrency} → ${finalTargetCurrency}`);
            
            finalPrice = window.CodformCurrencyManager.convertCurrency(totalBasePrice, baseCurrency, finalTargetCurrency);
            
            console.log(`🛒 Cart Items: 💱 CONVERSION COMPLETE: ${finalPrice} ${finalTargetCurrency}`);
            
            // تحقق خاص للتحويل إلى MAD
            if (finalTargetCurrency === 'MAD') {
              console.log(`🛒 Cart Items: 🔍 🇲🇦 MAD CONVERSION VERIFICATION:`);
              console.log(`🛒 Cart Items: Input: ${totalBasePrice} ${baseCurrency}`);
              console.log(`🛒 Cart Items: Output: ${finalPrice} MAD`);
              
              if (baseCurrency === 'USD') {
                const expectedWith12 = totalBasePrice * 12;
                const expectedWith10 = totalBasePrice * 10;
                
                console.log(`🛒 Cart Items: Expected with rate 12: ${expectedWith12} MAD`);
                console.log(`🛒 Cart Items: Expected with rate 10: ${expectedWith10} MAD`);
                console.log(`🛒 Cart Items: Actual result: ${finalPrice} MAD`);
                
                if (Math.abs(finalPrice - expectedWith12) < 0.01) {
                  console.log(`🛒 Cart Items: ✅ PERFECT! Using CUSTOM rate (12)`);
                } else if (Math.abs(finalPrice - expectedWith10) < 0.01) {
                  console.log(`🛒 Cart Items: ❌ WRONG! Using DEFAULT rate (10)`);
                } else {
                  console.log(`🛒 Cart Items: 🤔 UNKNOWN rate detected`);
                }
              }
            }
          } else {
            console.log(`🛒 Cart Items: No conversion needed (same currency: ${baseCurrency})`);
          }
          
          // Format the price
          if (typeof window.CodformCurrencyManager.formatCurrency === 'function') {
            formattedPrice = window.CodformCurrencyManager.formatCurrency(finalPrice, finalTargetCurrency);
            console.log(`🛒 Cart Items: Element ${index + 1} formatted: ${formattedPrice}`);
          }
        } catch (error) {
          console.error(`🚨 Cart Items: Element ${index + 1} Currency Manager error:`, error);
          formattedPrice = `${finalPrice.toFixed(2)} ${finalTargetCurrency}`;
        }
      } else {
        console.warn(`🛒 Cart Items: Element ${index + 1} Currency Manager not available`);
        formattedPrice = `${finalPrice.toFixed(2)} ${finalTargetCurrency}`;
      }
      
      // Update the price element
      priceElement.textContent = formattedPrice;
      priceElement.style.visibility = 'visible';
      
      console.log(`🛒 Cart Items: ✅ Element ${index + 1} FINAL RESULT: ${formattedPrice}`);
    });
    
    console.log(`🛒 Cart Items: 🎉 Price display update COMPLETED for all ${priceElements.length} elements`);
  }

  /**
   * Update currency settings and refresh prices
   */
  function updateCurrency() {
    console.log('🛒 Cart Items: Currency update triggered, clearing cache...');
    
    // Clear cached data to force refresh
    cachedProductPrice = null;
    cachedCurrency = null;
    
    // Re-initialize the system
    setTimeout(() => {
      console.log('🛒 Cart Items: Re-initializing after currency change...');
      isInitialized = false;
      initialize();
    }, 100);
  }

  // تهيئة تلقائية عند تحميل الصفحة - محسن
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initialize, 1000); // انتظار أطول عند التحميل
    });
  } else {
    // الصفحة محملة بالفعل - انتظار أطول لضمان تحميل Currency Manager
    setTimeout(initialize, 1500);
  }

  // مراقبة أحداث النظام - محسن للمعدلات المخصصة
  window.addEventListener('codform:currency-changed', function(event) {
    console.log('🛒 Cart Items: Currency changed event received:', event.detail);
    updateCurrency();
  });
  
  window.addEventListener('currencySettingsUpdated', function(event) {
    console.log('🛒 Cart Items: Currency settings updated event received:', event.detail);
    
    // انتظار قصير ثم تحديث الأسعار
    setTimeout(() => {
      const qty = parseInt(document.querySelector('.codform-cart-items .cart-items-quantity')?.textContent || '1');
      updatePriceDisplay(qty || 1);
    }, 200);
  });
  
  // إشعار جديد للمعدلات المخصصة
  window.addEventListener('codform:currency-rates-updated', function(event) {
    console.log('🛒 Cart Items: Currency rates updated event received:', event.detail);
    
    if (event.detail && event.detail.rates) {
      console.log('🛒 Cart Items: New rates available:', event.detail.rates);
      
      // تحديث فوري للأسعار
      setTimeout(() => {
        const qty = parseInt(document.querySelector('.codform-cart-items .cart-items-quantity')?.textContent || '1');
        updatePriceDisplay(qty || 1);
      }, 100);
    }
  });
  
  // إشعار مخصص لتحديث Cart Items
  window.addEventListener('codform:cart-items-refresh', function(event) {
    console.log('🛒 Cart Items: Refresh event received:', event.detail);
    
    setTimeout(() => {
      const qty = parseInt(document.querySelector('.codform-cart-items .cart-items-quantity')?.textContent || '1');
      updatePriceDisplay(qty || 1);
    }, 100);
  });
  
  window.addEventListener('codform:form-currency-resolved', function(event) {
    console.log('🛒 Cart Items: Form currency resolved:', event.detail);
    updateCurrency();
  });

  // مراقبة تحديثات بيانات المنتج
  window.addEventListener('codform:product-data', function(event) {
    console.log('🛒 Cart Items: Product data updated:', event.detail);
    
    if (event.detail) {
      cachedProductPrice = event.detail.price || cachedProductPrice;
      cachedCurrency = event.detail.currency || cachedCurrency;
      
      // تحديث العرض
      setTimeout(() => {
        const qty = parseInt(document.querySelector('.codform-cart-items .cart-items-quantity')?.textContent || '1');
        updatePriceDisplay(qty || 1);
      }, 200);
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

  console.log('✅ Cart Items: Global API exported to window.CodformCartItems');

})();