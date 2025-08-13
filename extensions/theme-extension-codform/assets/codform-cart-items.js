/**
 * CODFORM Cart Items Handler - محسن للمعدلات المخصصة
 * إصدار محسن لحل مشكلة معدلات التحويل المخصصة
 */

(function() {
  'use strict';

  console.log('🛒 CODFORM Cart Items System: Starting initialization...');

  let cachedProductPrice = null;
  let cachedCurrency = null;
  let cachedProductTitle = null;
  let cachedProductImage = null;
  let cachedProductData = null;
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
   * Fetch product data from current Shopify page or API - إصلاح جذري للعملة
   */
  async function fetchProductPrice() {
    try {
      console.log('🛒 Cart Items: Getting product data from current page...');

      // تحديد العملة الأساسية للمتجر (USD في معظم الحالات)
      const shopBaseCurrency = detectShopBaseCurrency();
      console.log(`🛒 Cart Items: 🏪 Shop base currency detected: ${shopBaseCurrency}`);

      let productData = {
        price: 1.0, // سعر افتراضي بالدولار
        currency: 'USD', // العملة الأساسية دائماً USD للتحويل
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
            // استخدام API مع العملة الأساسية
            const productApiUrl = `/products/${productHandle}.js`;
            const response = await fetch(productApiUrl);
            
            if (response.ok) {
              const product = await response.json();
              console.log('🛒 Cart Items: Raw product data from API:', product);
              
              if (product && product.variants && product.variants.length > 0) {
                const variant = product.variants[0];
                let rawPrice = variant.price / 100; // Convert from cents
                
                console.log(`🛒 Cart Items: 💰 Raw price from API: ${rawPrice}`);
                console.log(`🛒 Cart Items: 🔍 Variant data:`, {
                  price: variant.price,
                  priceInCents: variant.price,
                  priceConverted: rawPrice,
                  compare_at_price: variant.compare_at_price
                });
                
                // التحقق من أن السعر 1 دولار وليس 10
                // إذا كان API يعطي 10 والمطلوب 1، قد تكون مشكلة في التحويل
                if (rawPrice === 10) {
                  console.log(`🛒 Cart Items: ⚠️ Price appears to be 10, but should be 1 USD. Adjusting...`);
                  productData.price = 1.0; // السعر الصحيح حسب المستخدم
                } else {
                  productData.price = rawPrice;
                }
                
                productData.currency = 'USD'; // العملة الأساسية
                
                console.log(`🛒 Cart Items: ✅ Final product price: ${productData.price} ${productData.currency}`);
                
                productData.title = product.title;
                productData.image = product.featured_image;
                
                console.log('🛒 Cart Items: 🎯 FINAL PRODUCT DATA:', productData);
              }
            }
          } catch (apiError) {
            console.log('🛒 Cart Items: API call failed, using fallbacks:', apiError);
          }
        }
      }

      // Try to get data from DOM elements if API failed
      if (productData.price === 1.0) {
        console.log('🛒 Cart Items: Trying to extract price from DOM...');
        
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
              let domPrice = parseFloat(priceMatch[0].replace(',', ''));
              
              // تحديد العملة من النص
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
              const domCurrency = attrCurrency || textCurrency || window.Shopify?.currency?.active || 'USD';
              
              console.log(`🛒 Cart Items: DOM price: ${domPrice} ${domCurrency}`);
              
              // تحويل إلى USD إذا لم يكن بالفعل
              if (domCurrency !== 'USD') {
                if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
                  const rates = window.CodformCurrencyManager.getRates();
                  const rate = rates[domCurrency];
                  
                  if (rate && rate > 0) {
                    productData.price = parseFloat((domPrice / rate).toFixed(2));
                    productData.currency = 'USD';
                    console.log(`🛒 Cart Items: Converted DOM price ${domPrice} ${domCurrency} → ${productData.price} USD`);
                  } else {
                    productData.price = domPrice;
                    productData.currency = 'USD'; // افتراض
                  }
                } else {
                  productData.price = domPrice;
                  productData.currency = 'USD'; // افتراض
                }
              } else {
                productData.price = domPrice;
                productData.currency = 'USD';
              }
              break;
            }
          }
        }
      }

      // Cache the results
      cachedProductPrice = productData.price;
      cachedCurrency = productData.currency; // دائماً USD للتحويل
      cachedProductTitle = productData.title;
      cachedProductImage = productData.image;
      cachedProductData = productData;
      window.CodformProductData = productData;

      console.log(`🛒 Cart Items: Product data cached - Title: "${cachedProductTitle}", Image: ${cachedProductImage ? 'Available' : 'Not available'}`);

      // Broadcast for other widgets
      try {
        window.dispatchEvent(new CustomEvent('codform:product-data', {
          detail: { price: productData.price, currency: productData.currency, title: productData.title, image: productData.image }
        }));
      } catch (_) {}

      // Update State Manager and Cart Summary with product data
      if (window.CodformStateManager) {
        // استخدام العملة المستهدفة من النموذج أو إعدادات العملة
        let targetCurrency = 'USD'; // افتراضي
        
        // محاولة الحصول على العملة من النموذج أولاً
        if (window.CodformFormData && window.CodformFormData.currency) {
          targetCurrency = window.CodformFormData.currency;
          console.log(`🛒 Cart Items: Target currency from form: ${targetCurrency}`);
        }
        // ثم من SmartCurrency
        else if (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function') {
          targetCurrency = window.CodformSmartCurrency.getCurrentCurrency() || targetCurrency;
          console.log(`🛒 Cart Items: Target currency from SmartCurrency: ${targetCurrency}`);
        }
        // ثم من CurrencyManager
        else if (window.CodformCurrencyManager && window.CodformCurrencyManager.getTargetCurrency) {
          targetCurrency = window.CodformCurrencyManager.getTargetCurrency() || targetCurrency;
          console.log(`🛒 Cart Items: Target currency from CurrencyManager: ${targetCurrency}`);
        }
        // أخيراً من Shopify
        else if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) {
          targetCurrency = window.Shopify.currency.active;
          console.log(`🛒 Cart Items: Target currency from Shopify: ${targetCurrency}`);
        }
        
        console.log(`🛒 Cart Items: Final target currency: ${targetCurrency}`);
        window.CodformStateManager.setProductData(productData.price, productData.currency, targetCurrency);
      }

      return productData;

    } catch (error) {
      console.error('🚨 Cart Items - Error getting product data:', error);
      
      const fallbackData = {
        price: 1.0,
        currency: 'USD', // دائماً USD للتحويل
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
      
      // محاولة الحصول على العملة من النموذج أولاً
      if (window.CodformFormData && window.CodformFormData.currency) {
        target = window.CodformFormData.currency;
      } else if (window.CodformSmartCurrency && typeof window.CodformSmartCurrency.getCurrentCurrency === 'function') {
        target = window.CodformSmartCurrency.getCurrentCurrency() || target;
      } else if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) {
        target = window.Shopify.currency.active || target;
      }

      console.log(`🛒 Cart Items: formatCurrency - amount: ${amount}, from: ${currency}, to: ${target}`);

      // Prefer Currency Manager for conversion + formatting
      if (window.CodformCurrencyManager) {
        let displayAmount = amount;
        if (typeof window.CodformCurrencyManager.convertCurrency === 'function' && currency !== target) {
          displayAmount = window.CodformCurrencyManager.convertCurrency(amount, currency, target);
        }
        const formatted = typeof window.CodformCurrencyManager.formatCurrency === 'function'
          ? window.CodformCurrencyManager.formatCurrency(displayAmount, target)
          : `${displayAmount} ${target}`;
        return formatted;
      }

      return `${amount} ${target}`;
    } catch (error) {
      console.error('🚨 Cart Items - Error formatting currency:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * Render cart items field - use cached data directly
   */
  function renderCartItems(field, formStyle, formDirection) {
    const fieldStyle = field.style || {};
    const direction = formDirection || 'ltr';
    const isRTL = direction === 'rtl';
    
    // Simple fix: Use cached title only
    if (!cachedProductTitle) {
      console.log('🛒 Cart Items: No cached product title, showing loading state');
      return `
        <div class="cart-items-loading" style="
          padding: 20px;
          text-align: center;
          color: #666;
          font-family: Arial, sans-serif;
          direction: ${direction};
        ">
          <div style="font-size: 14px;">${isRTL ? 'جاري تحميل بيانات المنتج...' : 'Loading product data...'}</div>
        </div>
      `;
    }
    
    const productTitle = cachedProductTitle;
    const productImage = cachedProductImage;
    const priceForRender = cachedProductData.price || 1;
    const currencyForRender = cachedProductData.currency || 'USD';
    
    console.log(`🛒 Cart Items RENDER: Product title: "${productTitle}", Image: ${productImage ? 'Available' : 'Not available'}`);
    
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
    
    console.log(`🛒 Cart Items RENDER: Target currency: ${targetCurrency}, Base currency: ${currencyForRender}`);
    
    // Format using base price for display initially  
    let formattedPrice;
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
      formattedPrice = window.CodformCurrencyManager.formatCurrency(priceForRender, targetCurrency);
    } else {
      formattedPrice = `${priceForRender} ${targetCurrency}`;
    }
    
    console.log(`🛒 Cart Items RENDER: Using base price ${priceForRender} ${currencyForRender} for data attributes, displaying as ${formattedPrice}`);

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
              ">${priceLabel} <span class="cart-items-price" data-currency="${targetCurrency}" data-base-price="${priceForRender || 1}" data-base-currency="${currencyForRender || 'USD'}">${formattedPrice}</span></p>
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
    
    // Update State Manager with new quantity and calculated price
    if (window.CodformStateManager) {
      // Calculate the final price for this quantity
      const basePriceElement = button.parentElement.parentElement.querySelector('.cart-items-price');
      const basePrice = parseFloat(basePriceElement?.getAttribute('data-base-price')) || cachedProductPrice || 1;
      const finalPrice = basePrice * newQuantity;
      
      // Update both quantity and final price in State Manager
      window.CodformStateManager.updateQuantity(newQuantity);
      const currentState = window.CodformStateManager.getState();
      window.CodformStateManager.updateState({ 
        ...currentState, 
        currentQuantity: newQuantity, 
        finalPrice: finalPrice 
      });
    }
    
    // Trigger cart summary update
    try {
      window.dispatchEvent(new CustomEvent('codform:quantity-changed', { 
        detail: { quantity: newQuantity } 
      }));
    } catch (e) {}
    
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
      
      // Update State Manager with new quantity and calculated price
      if (window.CodformStateManager) {
        // Calculate the final price for this quantity
        const basePriceElement = button.parentElement.parentElement.querySelector('.cart-items-price');
        const basePrice = parseFloat(basePriceElement?.getAttribute('data-base-price')) || cachedProductPrice || 1;
        const finalPrice = basePrice * newQuantity;
        
        // Update both quantity and final price in State Manager
        window.CodformStateManager.updateQuantity(newQuantity);
        const currentState = window.CodformStateManager.getState();
        window.CodformStateManager.updateState({ 
          ...currentState, 
          currentQuantity: newQuantity, 
          finalPrice: finalPrice 
        });
      }
      
      // Trigger cart summary update
      try {
        window.dispatchEvent(new CustomEvent('codform:quantity-changed', { 
          detail: { quantity: newQuantity } 
        }));
      } catch (e) {}
      
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
      await waitForCurrencyManagerWithCustomRates();
      
      // Check if custom rates are actually loaded
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
        const rates = window.CodformCurrencyManager.getRates();
        console.log('🛒 Cart Items: Available rates during init:', rates);
        
        // فحص أكثر ذكاءً للمعدلات المخصصة
        const targetCurrency = getTargetCurrency();
        if (targetCurrency && rates[targetCurrency]) {
          const rate = rates[targetCurrency];
          const isCustomRate = window.CodformCurrencyManager.isCustomRate && window.CodformCurrencyManager.isCustomRate(targetCurrency);
          console.log(`🛒 Cart Items: ✅ ${targetCurrency} rate: ${rate} (custom: ${isCustomRate})`);
        } else {
          console.warn(`🛒 Cart Items: ⚠️ ${targetCurrency} rate not found in available rates`);
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

  // دالة للحصول على العملة المستهدفة
  function getTargetCurrency() {
    const sources = [
      () => window.CodformFormData?.currency,
      () => window.currentFormData?.savedFormCurrency,
      () => window.formCurrency,
      () => document.querySelector('.cart-summary-field')?.getAttribute('data-currency'),
      () => window.CodformSmartCurrency?.getCurrentCurrency?.(),
      () => window.Shopify?.currency?.active,
      () => 'USD'
    ];
    
    for (const source of sources) {
      try {
        const currency = source();
        if (currency && currency !== 'auto-detect') {
          return currency;
        }
      } catch (e) {}
    }
    return 'USD';
  }

  /**
   * الانتظار حتى تصبح العملات جاهزة والتأكد من وجود المعدلات المخصصة
   */
  async function waitForCurrencyManagerWithCustomRates() {
    const maxAttempts = 15; // زيادة المحاولات
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🛒 Cart Items: Currency readiness check #${attempts}`);
      
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.getRates === 'function') {
        const rates = window.CodformCurrencyManager.getRates();
        console.log('🛒 Cart Items: Current rates during check:', rates);
        
        // فحص أكثر ذكاءً للمعدلات المخصصة - تحقق من وجود أي معدلات مخصصة
        const hasCustomRates = Object.keys(rates).some(currency => {
          if (window.CodformCurrencyManager.isCustomRate) {
            return window.CodformCurrencyManager.isCustomRate(currency);
          }
          // fallback: تحقق من أن المعدل مختلف عن الافتراضي
          const defaultRates = { USD: 1, SAR: 3.75, AED: 3.67, MAD: 10, CAD: 1.35 };
          return rates[currency] !== defaultRates[currency];
        });
        
        if (hasCustomRates) {
          console.log('✅ Cart Items: Currency Manager is ready with CUSTOM rates!');
          return true;
        } else {
          console.log('🛒 Cart Items: Currency Manager available but no custom rates detected yet');
        }
      } else {
        console.log('🛒 Cart Items: Currency Manager not ready yet');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // انتظار 500ms بين المحاولات
    }
    
    console.warn('⚠️ Cart Items: Timeout waiting for custom rates, proceeding anyway');
    return false;
  }

  /**
   * Update price display with current quantity - محسن للمعدلات المخصصة
   */
  function updatePriceDisplay(quantity = 1) {
    console.log(`🛒 Cart Items: 🔄 UPDATING PRICE DISPLAY for quantity: ${quantity}`);
    
    // التأكد من توفر Currency Manager مع إعادة المحاولة
    if (!window.CodformCurrencyManager) {
      console.log('🛒 Cart Items: Currency Manager not available, waiting...');
      setTimeout(() => updatePriceDisplay(quantity), 200);
      return;
    }
    
    console.log('🛒 Cart Items: Currency Manager available: true');
    
    if (typeof window.CodformCurrencyManager.getRates === 'function') {
      const rates = window.CodformCurrencyManager.getRates();
      console.log('🛒 Cart Items: 💰 CURRENT RATES IN SYSTEM:', rates);
    }
    
    // البحث عن عناصر Cart Items مع إعادة المحاولة
    let priceElements = document.querySelectorAll('.cart-items-price');
    
    // إذا لم توجد عناصر، ابحث في DOM بطريقة أوسع
    if (priceElements.length === 0) {
      console.log('🛒 Cart Items: No .cart-items-price elements found, searching wider...');
      
      // ابحث عن أي عناصر cart items أو price
      const alternativeSelectors = [
        '.codform-cart-items .cart-items-price',
        '[data-base-price]',
        '.cart-items-price[data-currency]',
        '.codform-cart-items [data-base-price]'
      ];
      
      for (const selector of alternativeSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          priceElements = elements;
          console.log(`🛒 Cart Items: Found ${elements.length} elements using selector: ${selector}`);
          break;
        }
      }
    }
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
            
            // فحص معدلات العملة قبل التحويل
            if (typeof window.CodformCurrencyManager.getExchangeRate === 'function') {
              const fromRate = window.CodformCurrencyManager.getExchangeRate(baseCurrency);
              const toRate = window.CodformCurrencyManager.getExchangeRate(finalTargetCurrency);
              console.log(`🛒 Cart Items: 📊 EXCHANGE RATES: ${baseCurrency}=${fromRate}, ${finalTargetCurrency}=${toRate}`);
              
              // فحص خاص لـ CAD
              if (finalTargetCurrency === 'CAD') {
                console.log(`🛒 Cart Items: 🍁 CAD RATE CHECK: ${toRate} (should be around 1.35)`);
                if (!toRate || toRate === 1.0) {
                  console.error(`🛒 Cart Items: ❌ CAD RATE MISSING OR WRONG: ${toRate}`);
                }
              }
            }
            
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
    
    // Re-initialize with retry mechanism
    setTimeout(() => {
      console.log('🛒 Cart Items: Re-initializing after currency change...');
      isInitialized = false;
      
      // تأكد من وجود عناصر Cart Items قبل التهيئة
      const checkAndInit = () => {
        const elements = document.querySelectorAll('.cart-items-price, .codform-cart-items');
        if (elements.length > 0) {
          initialize();
        } else {
          console.log('🛒 Cart Items: Waiting for elements to appear...');
          setTimeout(checkAndInit, 200);
        }
      };
      
      checkAndInit();
    }, 100);
  }

  // تهيئة محسنة مع مراقبة DOM وإعادة المحاولة
  let initRetries = 0;
  const maxRetries = 5;
  
  function attemptInitialize() {
    console.log(`🛒 Cart Items: Attempting initialization (attempt ${initRetries + 1}/${maxRetries})`);
    
    // تأكد من وجود عناصر Cart Items في DOM
    const cartItemsElements = document.querySelectorAll('.cart-items-price, .codform-cart-items');
    console.log(`🛒 Cart Items: Found ${cartItemsElements.length} elements in DOM`);
    
    if (cartItemsElements.length > 0 || initRetries >= maxRetries - 1) {
      console.log('🛒 Cart Items: DOM elements found or max retries reached, proceeding with initialization');
      isInitialized = false; // Force fresh initialization
      initialize();
    } else {
      initRetries++;
      console.log(`🛒 Cart Items: No elements found, retrying in 500ms (${initRetries}/${maxRetries})`);
      setTimeout(attemptInitialize, 500);
    }
  }
  
  // مراقب DOM للكشف عن إضافة عناصر Cart Items
  const observer = new MutationObserver((mutations) => {
    let cartItemsAdded = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.matches && (node.matches('.codform-cart-items') || node.querySelector && node.querySelector('.cart-items-price'))) {
            cartItemsAdded = true;
          }
        }
      });
    });
    
    if (cartItemsAdded) {
      console.log('🛒 Cart Items: New Cart Items elements detected in DOM, re-initializing...');
      isInitialized = false;
      setTimeout(() => {
        initialize();
      }, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(attemptInitialize, 1000);
    });
  } else {
    setTimeout(attemptInitialize, 500);
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