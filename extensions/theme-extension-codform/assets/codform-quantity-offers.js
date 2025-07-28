/**
 * CODFORM Quantity Offers Handler - EXACT PREVIEW MATCH
 * مطابقة دقيقة 100% للمعاينة في الحجم والتصميم والسعر
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة مع الأسعار الدقيقة والصحيحة لجميع الدول
  function convertCurrency(amount, fromCurrency, toCurrency) {
    console.log(`🔄 Starting conversion: ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    // معدلات التحويل الدقيقة والصحيحة لجميع العملات المدعومة
    const exchangeRates = {
      'USD': 1.0,
      'SAR': 3.75,
      'AED': 3.67,
      'EGP': 30.85,
      'QAR': 3.64,
      'KWD': 0.31,
      'BHD': 0.38,
      'OMR': 0.38,
      'JOD': 0.71,
      'LBP': 89500,
      'MAD': 9.85,
      'TND': 3.15,
      'DZD': 134.25,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.43,
      'AUD': 1.57,
      'MXN': 20.15,
      'BRL': 6.05,
      'ARS': 1005.5,
      'CLP': 975.2,
      'COP': 4285.5,
      'PEN': 3.75,
      'VES': 36500000,
      'UYU': 40.25,
      'IQD': 1310,
      'IRR': 42100,
      'TRY': 34.15,
      'ILS': 3.67,
      'SYP': 13000,
      'YER': 250,
      'NGN': 1675,
      'ZAR': 18.45,
      'KES': 130.5,
      'GHS': 15.85,
      'ETB': 125.5,
      'TZS': 2515,
      'UGX': 3785,
      'ZWL': 322,
      'ZMW': 27.85,
      'RWF': 1385
    };
    
    // تنظيف أسماء العملات
    fromCurrency = (fromCurrency || 'USD').toString().toUpperCase().trim();
    toCurrency = (toCurrency || 'MAD').toString().toUpperCase().trim();
    
    // إذا كانت نفس العملة
    if (fromCurrency === toCurrency) {
      console.log(`✅ Same currency, returning: ${amount} ${toCurrency}`);
      return amount;
    }
    
    // التحويل عبر الدولار الأمريكي كعملة أساسية
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (fromRate && toRate) {
      // تحويل للدولار أولاً ثم للعملة المطلوبة
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      console.log(`✅ CONVERSION SUCCESS: ${amount} ${fromCurrency} → ${convertedAmount.toFixed(2)} ${toCurrency}`);
      console.log(`🔄 Via USD: ${amount} → ${usdAmount.toFixed(4)} USD → ${convertedAmount.toFixed(2)} ${toCurrency}`);
      return convertedAmount;
    }
    
    console.warn(`❌ CONVERSION FAILED: No rate for ${fromCurrency} to ${toCurrency}, using original amount`);
    return amount;
  }

  // دالة عرض quantity offers مطابقة بالضبط للمعاينة
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null, formDirection = null) {
    console.log("🎯 EXACT PREVIEW MATCH - Starting quantity offers display");
    
    // تحديد اتجاه النموذج بناءً على محتواه الفعلي
    if (!formDirection) {
      // البحث عن النموذج المرتبط بهذا blockId
      const formContainer = document.getElementById(`quantity-offers-before-${blockId}`) 
        || document.querySelector(`#${blockId}`) 
        || document.querySelector(`[data-block-id="${blockId}"]`);
      
      if (formContainer) {
        // فحص النموذج الرئيسي والعناصر المحيطة
        const parentForm = formContainer.closest('form') || formContainer.closest('[dir]') || document.body;
        const formText = (formContainer.textContent || '') + (parentForm.textContent || '');
        
        // تحديد الاتجاه بناءً على خاصية dir أولاً
        if (parentForm && parentForm.dir) {
          formDirection = parentForm.dir;
        } else if (parentForm && parentForm.getAttribute('lang')) {
          // فحص لغة النموذج
          const lang = parentForm.getAttribute('lang').toLowerCase();
          formDirection = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
        } else {
          // فحص النص للكشف عن الأحرف العربية
          const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
          const arabicChars = (formText.match(arabicRegex) || []).length;
          const totalChars = formText.replace(/\s/g, '').length;
          // إذا كان أكثر من 30% من النص عربي، استخدم RTL
          formDirection = (arabicChars / totalChars) > 0.3 ? 'rtl' : 'ltr';
        }
      } else {
        formDirection = 'ltr'; // افتراضي
      }
    }
    
    console.log("🧭 Form direction detected:", {
      blockId,
      formDirection,
      method: 'dynamic detection'
    });
    
    // التحقق من صحة البيانات
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ Invalid quantity offers data");
      return;
    }

    const offers = quantityOffersData.offers;
    if (offers.length === 0) {
      console.log("ℹ️ No offers to display");
      return;
    }

    console.log("🔍 DEBUGGING offers display:", {
      offersLength: offers.length,
      blockId,
      containerId: `quantity-offers-before-${blockId}`
    });

    // البحث عن الحاوية
    let container = document.getElementById(`quantity-offers-before-${blockId}`);
    
    if (blockId === 'popup-form') {
      console.log('🔍 Looking for popup offers container...');
      container = document.getElementById('quantity-offers-before-popup-form');
    }
    
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      const anyContainer = document.querySelector('[id*="quantity-offers"]');
      if (anyContainer) {
        console.log("🔧 Using alternative container:", anyContainer.id);
        container = anyContainer;
      } else {
        console.error("❌ No quantity offers container found at all");
        return;
      }
    }

    // مسح المحتوى السابق
    container.innerHTML = '';
    container.style.display = 'block';

    // استخدام التنسيق من البيانات
    const styling = {
      backgroundColor: quantityOffersData.styling?.backgroundColor || '#ffffff',
      textColor: quantityOffersData.styling?.textColor || '#000000',
      tagColor: quantityOffersData.styling?.tagColor || '#22c55e',
      priceColor: quantityOffersData.styling?.priceColor || '#000000'
    };

    // استخدام بيانات المنتج المرسلة أولاً، ثم من API، ثم القيم الافتراضية
    let actualProductData = productData;
    
    if (!actualProductData && window.CodformProductData) {
      actualProductData = window.CodformProductData;
      console.log("🛍️ Using global product data:", actualProductData);
    }
    
    // الحصول على السعر الحقيقي للمنتج وعملته من البيانات الفعلية
    let productPrice = 10.0; // قيمة افتراضية
    let productCurrency = 'MAD'; // عملة افتراضية
    
    // محاولة الحصول على السعر الحقيقي من مصادر متعددة
    if (actualProductData && actualProductData.price) {
      productPrice = parseFloat(actualProductData.price);
      productCurrency = actualProductData.currency || 'MAD';
      console.log("💰 Price from product data:", productPrice, productCurrency);
    } else if (actualProductData && actualProductData.variants && actualProductData.variants.length > 0) {
      // إذا كان المنتج له variants، استخدم سعر أول variant
      const firstVariant = actualProductData.variants[0];
      if (firstVariant.price) {
        productPrice = parseFloat(firstVariant.price);
        productCurrency = firstVariant.currency || actualProductData.currency || 'MAD';
        console.log("💰 Price from variant:", productPrice, productCurrency);
      }
    } else {
      // محاولة الحصول على السعر من DOM إذا لم تكن البيانات متوفرة
      try {
        const priceElement = document.querySelector('.price, [class*="price"], [data-price]');
        if (priceElement) {
          const priceText = priceElement.textContent || priceElement.getAttribute('data-price');
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            productPrice = parseFloat(priceMatch[0].replace(',', ''));
            console.log("💰 Price from DOM:", productPrice);
          }
        }
      } catch (e) {
        console.log("⚠️ Could not extract price from DOM");
      }
    }
    
    // تحويل السعر من عملة المنتج الأصلية إلى عملة النموذج
    const realPrice = convertCurrency(productPrice, productCurrency, defaultCurrency);
    
    console.log("💰 REAL Product Price Logic:", {
      actualProductData: actualProductData,
      originalPrice: productPrice,
      originalCurrency: productCurrency,
      targetCurrency: defaultCurrency,
      convertedPrice: realPrice,
      conversionDetails: `${productPrice} ${productCurrency} → ${realPrice} ${defaultCurrency}`
    });
    
    // بيانات المنتج
    const productTitle = actualProductData?.title || 'المنتج';
    
    // تحسين الحصول على صورة المنتج من مصادر متعددة
    let productImage = null;
    if (actualProductData) {
      productImage = actualProductData.image || 
                    actualProductData.featured_image || 
                    actualProductData.featuredImage ||
                    (actualProductData.images && actualProductData.images.length > 0 ? actualProductData.images[0] : null) ||
                    (actualProductData.variants && actualProductData.variants.length > 0 && actualProductData.variants[0].image ? actualProductData.variants[0].image : null);
    }
    
    // محاولة الحصول على الصورة من DOM إذا لم تكن متوفرة في البيانات
    if (!productImage) {
      try {
        const imageSelectors = [
          'img[src*="product"]',
          '.product-image img',
          '[class*="product"] img',
          'img[alt*="product"]',
          '.featured-image img',
          'img[src*="shopify"]'
        ];
        
        for (const selector of imageSelectors) {
          const imgElement = document.querySelector(selector);
          if (imgElement && imgElement.src && imgElement.src.trim() !== '') {
            productImage = imgElement.src;
            console.log("🖼️ Found product image from DOM:", productImage);
            break;
          }
        }
      } catch (e) {
        console.log("⚠️ Could not extract image from DOM");
      }
    }
    
    console.log("🖼️ Product Image Debug:", {
      hasProductData: !!actualProductData,
      originalImage: actualProductData?.image,
      featuredImage: actualProductData?.featured_image,
      imagesArray: actualProductData?.images,
      finalImage: productImage
    });

    // رموز العملات الصحيحة لجميع الدول
    const getCurrencySymbol = (currency) => {
      const symbols = {
        'USD': '$', 'SAR': 'ر.س', 'AED': 'د.إ', 'EGP': 'ج.م', 'QAR': 'ر.ق',
        'KWD': 'د.ك', 'BHD': 'د.ب', 'OMR': 'ر.ع', 'JOD': 'د.أ', 'LBP': 'ل.ل',
        'MAD': 'د.م', 'TND': 'د.ت', 'DZD': 'د.ج', 'EUR': '€', 'GBP': '£',
        'CAD': 'C$', 'AUD': 'A$', 'MXN': '$', 'BRL': 'R$', 'ARS': '$',
        'CLP': '$', 'COP': '$', 'PEN': 'S/', 'VES': 'Bs.', 'UYU': '$U',
        'IQD': 'ع.د', 'IRR': '﷼', 'TRY': '₺', 'ILS': '₪', 'SYP': 'ل.س',
        'YER': '﷼', 'NGN': '₦', 'ZAR': 'R', 'KES': 'KSh', 'GHS': '₵',
        'ETB': 'Br', 'TZS': 'TSh', 'UGX': 'USh', 'ZWL': 'Z$', 'ZMW': 'ZK', 'RWF': 'FRw'
      };
      return symbols[currency] || currency;
    };
    
    const currencySymbol = getCurrencySymbol(defaultCurrency);

    // حاوية العروض - نفس تصميم المعاينة بالضبط
    const offersContainer = document.createElement('div');
    offersContainer.style.cssText = `
      margin-bottom: 16px;
      direction: ${formDirection === 'rtl' ? 'rtl' : 'ltr'};
    `;

    // عرض العروض مع التخطيط المطابق للمعاينة بالضبط
    offers.forEach((offer, index) => {
      // حساب السعر النهائي مع الخصم
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      let savingsPercentage = 0;

      const discountValue = parseFloat(offer.discount || offer.discountValue || 0);
      const discountType = offer.discountType || (offer.discount ? 'percentage' : 'percentage');

      if (discountType === 'percentage' && discountValue > 0) {
        const discount = (originalPrice * discountValue) / 100;
        totalPrice = originalPrice - discount;
        savingsPercentage = discountValue;
      } else if (discountType === 'fixed' && discountValue > 0) {
        totalPrice = Math.max(0, originalPrice - discountValue);
        savingsPercentage = Math.round((discountValue / originalPrice) * 100);
      }

      const isDiscounted = savingsPercentage > 0;
      const isHighlighted = index === 1;

      console.log("💰 Price calculation:", {
        quantity: offer.quantity,
        realPrice,
        originalPrice,
        discountType,
        discountValue,
        finalTotalPrice: totalPrice,
        savingsPercentage
      });

      // عنصر العرض - نفس التصميم والحجم بالضبط من المعاينة
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      offerElement.setAttribute('data-total-price', totalPrice.toFixed(2));
      
      // التصميم المطابق للمعاينة بالضبط
      offerElement.style.cssText = `
        padding: 12px;
        border-radius: 8px;
        border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
        background-color: ${isHighlighted ? '#f0fdf4' : styling.backgroundColor};
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 8px;
        direction: ${formDirection === 'rtl' ? 'rtl' : 'ltr'};
        box-shadow: ${isHighlighted ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
      `;

      // إضافة وظيفة النقر لاختيار العرض
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من جميع العروض
        const allOffers = container.querySelectorAll('[data-offer-id]');
        allOffers.forEach(el => {
          el.style.borderColor = '#e5e7eb';
          el.style.backgroundColor = styling.backgroundColor;
          el.style.boxShadow = 'none';
        });
        
        // تحديد العرض المختار
        this.style.borderColor = '#22c55e';
        this.style.backgroundColor = '#f0fdf4';
        this.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
        
        // تحديث كمية المنتج في النموذج
        const quantity = this.getAttribute('data-quantity');
        const totalPrice = this.getAttribute('data-total-price');
        
        console.log(`✅ Selected offer: ${quantity} items for ${totalPrice} ${currencySymbol}`);
        
        // إرسال حدث لتحديث النموذج
        window.dispatchEvent(new CustomEvent('quantityOfferSelected', {
          detail: {
            offerId: this.getAttribute('data-offer-id'),
            quantity: parseInt(quantity),
            totalPrice: parseFloat(totalPrice),
            currency: defaultCurrency
          }
        }));
      });

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        if (this.style.borderColor !== 'rgb(34, 197, 94)') {
          this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      });

      offerElement.addEventListener('mouseleave', function() {
        if (this.style.borderColor !== 'rgb(34, 197, 94)') {
          this.style.boxShadow = isHighlighted ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
        }
      });

      // الجانب الأيسر: الصورة والنص - إصلاح الاتجاه للعربية
      const leftSection = document.createElement('div');
      leftSection.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        flex-direction: row;
        order: 1;
      `;
      
      console.log('🔍 Direction and layout debug:', {
        formDirection,
        isRTL: formDirection === 'rtl',
        layoutType: 'Arabic layout setup'
      });

      // الصورة - يجب أن تكون على اليمين في العربية (order: 1)
      const imageContainer = document.createElement('div');
      imageContainer.style.cssText = `
        width: 48px;
        height: 48px;
        background-color: #f3f4f6;
        border-radius: 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        order: ${formDirection === 'rtl' ? '1' : '2'};
      `;
      
      console.log('🖼️ Image container order for RTL:', {
        formDirection,
        imageOrder: formDirection === 'rtl' ? '1' : '2',
        textOrder: formDirection === 'rtl' ? '2' : '1'
      });

      // تحسين إدارة الصور
      let imageDisplayed = false;
      
      // محاولة تحميل الصورة الأساسية
      if (productImage && productImage.trim() !== '') {
        const imageElement = document.createElement('img');
        
        // تنظيف رابط الصورة
        let cleanImageUrl = productImage.trim();
        if (cleanImageUrl.startsWith('//')) {
          cleanImageUrl = 'https:' + cleanImageUrl;
        }
        
        imageElement.src = cleanImageUrl;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 7px;
        `;
        
        imageElement.onload = function() {
          console.log('✅ Product image loaded successfully:', cleanImageUrl);
          imageDisplayed = true;
        };
        
        imageElement.onerror = function() {
          console.log('❌ Primary image failed, trying fallback');
          this.remove();
          showFallbackIcon();
        };
        
        imageContainer.appendChild(imageElement);
      } else {
        showFallbackIcon();
      }
      
      function showFallbackIcon() {
        if (!imageDisplayed) {
          const iconElement = document.createElement('div');
          iconElement.innerHTML = `📦`;
          iconElement.style.cssText = `
            font-size: 20px;
            color: #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          imageContainer.appendChild(iconElement);
          console.log('📦 Using fallback icon for product image');
        }
      }

      // النص والعلامات - يجب أن تكون على اليسار في العربية (order: 2)
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        order: ${formDirection === 'rtl' ? '2' : '1'};
      `;

      // النص الرئيسي - نفس حجم المعاينة بالضبط
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        color: ${styling.textColor};
        text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
        font-size: 16px;
        line-height: 1.4;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات والتوفير
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 4px;
      `;

      if (offer.tag) {
        const tagElement = document.createElement('div');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor};
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('div');
        savingsElement.style.cssText = `
          background-color: #22c55e;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        savingsElement.textContent = `وفر ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContainer.appendChild(mainText);
      textContainer.appendChild(tagsContainer);

      leftSection.appendChild(imageContainer);
      leftSection.appendChild(textContainer);

      // الجانب الأيمن: الأسعار - إصلاح الاتجاه
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: ${formDirection === 'rtl' ? 'left' : 'right'};
        display: flex;
        flex-direction: column;
        align-items: ${formDirection === 'rtl' ? 'flex-start' : 'flex-end'};
        gap: 2px;
        order: ${formDirection === 'rtl' ? '2' : '2'};
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (isDiscounted) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 400;
        `;
        originalPriceElement.textContent = formDirection === 'rtl' 
          ? `${currencySymbol} ${originalPrice.toFixed(2)}`
          : `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: 700;
        color: ${styling.priceColor};
        line-height: 1.2;
      `;
      finalPriceElement.textContent = formDirection === 'rtl' 
        ? `${currencySymbol} ${totalPrice.toFixed(2)}`
        : `${totalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(finalPriceElement);

      // السعر للقطعة الواحدة (إذا كانت الكمية أكثر من 1)
      if (offer.quantity > 1) {
        const unitPriceElement = document.createElement('div');
        unitPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
          font-weight: 400;
        `;
        unitPriceElement.textContent = formDirection === 'rtl' 
          ? `${offer.quantity} × ${currencySymbol} ${realPrice.toFixed(2)}`
          : `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
        priceSection.appendChild(unitPriceElement);
      }

      // تجميع العناصر
      offerElement.appendChild(leftSection);
      offerElement.appendChild(priceSection);
      
      offersContainer.appendChild(offerElement);

      console.log("💰 FINAL PREVIEW MATCH - Price display:", {
        totalPrice: totalPrice,
        display: finalPriceElement.textContent,
        calculation: `${realPrice} x ${offer.quantity} - discount = ${totalPrice.toFixed(2)}`
      });
    });

    // إضافة حاوية العروض إلى الحاوية الرئيسية
    container.appendChild(offersContainer);

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.3s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);

    console.log("✅ EXACT PREVIEW MATCH - Quantity offers displayed with identical styling");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayOffers(blockId, productId, shop, formCurrency = 'SAR', passedProductData = null, formDirection = null) {
    try {
      if (!shop) {
        shop = (typeof Shopify !== 'undefined' && Shopify.shop) ? Shopify.shop : 'codmagnet.com';
      }
      
      console.log("🎯 Loading quantity offers for product", productId, "in", blockId, "from shop", shop);
      
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`;
      
      console.log("🌐 API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 API Response:", data);
      
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ Found quantity offers and product data");
        
        const actualProductId = data.quantity_offers.product_id || productId;
        console.log("🎯 Using actual product ID:", actualProductId);
        
        // عرض العروض مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          actualProductId,
          data.form?.currency || 'SAR',
          data.product,
          formDirection
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("❌ No quantity offers found or API error");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص
  function debugOffers(blockId, productId) {
    console.log("🔧 EXACT PREVIEW MATCH DEBUG - Starting diagnosis...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || 'codmagnet.com';
    
    console.log("🔍 Debug Info:", {
      blockId,
      productId,
      shop,
      containerExists: !!container,
      windowShopify: window.Shopify
    });
    
    if (container) {
      console.log("📦 Container found, loading offers...");
      return loadAndDisplayOffers(blockId, productId, shop);
    } else {
      console.error("❌ Container not found!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
  }

  // Public API
  return {
    display: displayQuantityOffers,
    loadAndDisplayOffers: loadAndDisplayOffers,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - EXACT PREVIEW MATCH");
  return window.CodformQuantityOffers.debug(blockId, productId);
};