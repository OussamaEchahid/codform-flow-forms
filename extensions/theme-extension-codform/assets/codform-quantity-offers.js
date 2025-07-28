
/**
 * CODFORM Quantity Offers Handler - PRECISE FIX
 * إصلاح دقيق لعرض عروض الكمية بدون تخريب النموذج
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة
  function convertCurrency(amount, fromCurrency, toCurrency) {
    // معدلات التحويل المبسطة (يمكن تحسينها لاحقاً بـ API حقيقي)
    const exchangeRates = {
      'USD': { 'SAR': 3.75, 'MAD': 10.0, 'USD': 1 },
      'SAR': { 'USD': 0.27, 'MAD': 2.67, 'SAR': 1 },
      'MAD': { 'USD': 0.10, 'SAR': 0.375, 'MAD': 1 }
    };
    
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (rate) {
      return amount * rate;
    }
    
    // إذا لم يتم العثور على معدل التحويل، إرجاع المبلغ كما هو
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    return amount;
  }

  // دالة عرض quantity offers مع استخدام البيانات الصحيحة من API
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null, formDirection = null) {
    console.log("🎯 PRECISE FIX - Starting quantity offers display");
    
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

    // البحث عن الحاوية - نحاول أولاً الحاوية المحددة ثم البديلة للنموذج المنبثق
    let container = document.getElementById(`quantity-offers-before-${blockId}`);
    
    // للنموذج المنبثق، استخدم الحاوية المخصصة
    if (blockId === 'popup-form') {
      console.log('🔍 Looking for popup offers container...');
      container = document.getElementById('quantity-offers-before-popup-form');
      console.log('📦 Popup container found:', !!container);
    }
    
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      // حاول البحث عن أي حاوية تحتوي على quantity-offers في اسمها
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

    // استخدام التنسيق من البيانات مع لون أسود افتراضي للسعر
    const styling = {
      backgroundColor: quantityOffersData.styling?.backgroundColor || '#ffffff',
      textColor: quantityOffersData.styling?.textColor || '#000000',
      tagColor: quantityOffersData.styling?.tagColor || '#22c55e',
      priceColor: quantityOffersData.styling?.priceColor || '#000000' // اللون الافتراضي أسود
    };

      // استخدام بيانات المنتج المرسلة أولاً، ثم من API، ثم القيم الافتراضية
      let actualProductData = productData;
      
      // إذا لم تُمرر بيانات المنتج، استخدم البيانات المحفوظة عالمياً
      if (!actualProductData && window.CodformProductData) {
        actualProductData = window.CodformProductData;
        console.log("🛍️ Using global product data:", actualProductData);
      }
      
      // البحث عن السعر في بيانات العروض (من إعدادات النموذج)
      let formPriceFromOffers = null;
      
      // البحث في العروض عن السعر المحدد
      if (quantityOffersData.offers && Array.isArray(quantityOffersData.offers)) {
        for (const offer of quantityOffersData.offers) {
          if (offer.basePrice && parseFloat(offer.basePrice) > 0) {
            formPriceFromOffers = parseFloat(offer.basePrice);
            break;
          }
        }
      }
      
      // البحث في البيانات العامة للنموذج
      const formPrice = formPriceFromOffers || quantityOffersData.price || quantityOffersData.formPrice || quantityOffersData.basePrice;
      const hasFormPrice = formPrice && parseFloat(formPrice) > 0;
      const hasRealPrice = actualProductData && actualProductData.price && parseFloat(actualProductData.price) > 0;
      
      // أولوية للسعر من إعدادات النموذج، ثم سعر المنتج الأصلي، ثم السعر الافتراضي
      const productPrice = hasFormPrice ? parseFloat(formPrice) : 
                          hasRealPrice ? parseFloat(actualProductData.price) : 5000;
      
      console.log("💰 Price selection logic:", {
        formPriceFromOffers,
        formPrice,
        hasFormPrice,
        originalProductPrice: actualProductData?.price,
        hasRealPrice,
        selectedPrice: productPrice,
        source: hasFormPrice ? 'form settings' : hasRealPrice ? 'original product' : 'fallback',
        quantityOffersData: quantityOffersData
      });
      const productCurrency = actualProductData?.currency || 'USD';
      const formCurrency = defaultCurrency; // عملة النموذج
      
      // تحويل السعر من عملة المنتج إلى عملة النموذج
      const realPrice = convertCurrency(productPrice, productCurrency, formCurrency);
      const currency = formCurrency; // استخدام عملة النموذج
      const productImage = actualProductData?.image || actualProductData?.featuredImage;
      const productTitle = actualProductData?.title || 'المنتج';

      console.log("💰 CURRENCY CONVERSION:", {
        productPrice,
        productCurrency,
        formCurrency,
        convertedPrice: realPrice,
        conversionApplied: productCurrency !== formCurrency
      });

    // استمرار العمل مع السعر (حقيقي أو افتراضي)
    console.log(`💰 Using price: ${realPrice} (${hasRealPrice ? 'real' : 'fallback'})`);

    // رمز العملة الصحيح
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // عرض العروض مع إمكانية التحديد
    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      // حساب السعر النهائي مع الخصم مسبقاً
      const calculatedTotalPrice = (() => {
        let total = realPrice * (offer.quantity || 1);
        const discountValue = parseFloat(offer.discount || offer.discountValue || 0);
        const discountType = offer.discountType || (offer.discount ? 'percentage' : 'percentage');
        
        if (discountType === 'percentage' && discountValue > 0) {
          total = total - (total * discountValue / 100);
        } else if (discountType === 'fixed' && discountValue > 0) {
          total = Math.max(0, total - discountValue);
        }
        
        console.log("💰 Pre-calculated total price:", {
          originalTotal: realPrice * (offer.quantity || 1),
          discountType,
          discountValue,
          finalTotal: total
        });
        
        return total;
      })();
      
      offerElement.setAttribute('data-total-price', calculatedTotalPrice.toFixed(2));
      offerElement.style.cssText = `
        background-color: ${styling.backgroundColor};
        border: 2px solid ${index === 1 ? '#22c55e' : '#e5e7eb'};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Cairo', system-ui, Arial, sans-serif;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        ${index === 1 ? 'background-color: #f0fdf4;' : ''}
      `;

      // إضافة وظيفة التحديد
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من العروض الأخرى
        const allOffers = container.querySelectorAll('[data-offer-id]');
        allOffers.forEach(el => {
          el.style.borderColor = '#e5e7eb';
          el.style.backgroundColor = styling.backgroundColor;
          el.querySelector('.selected-indicator')?.remove();
        });
        
        // تحديد العرض الحالي
        this.style.borderColor = '#22c55e';
        this.style.backgroundColor = '#f0fdf4';
        
        // إضافة مؤشر التحديد
        const indicator = document.createElement('div');
        indicator.className = 'selected-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background-color: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
        `;
        indicator.innerHTML = '✓';
        this.appendChild(indicator);
        
        // حفظ البيانات المحددة مع السعر المحسوب
        const calculatedPrice = parseFloat(this.getAttribute('data-total-price'));
        window.selectedQuantityOffer = {
          quantity: parseInt(this.getAttribute('data-quantity')),
          totalPrice: calculatedPrice,
          currency: currency,
          text: offer.text,
          originalPrice: realPrice * parseInt(this.getAttribute('data-quantity')),
          savings: savingsPercentage
        };
        
        console.log("✅ Offer selected:", window.selectedQuantityOffer);
      });

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });

      // تحديد اتجاه التخطيط بناءً على اللغة بطريقة أكثر دقة
      const isRTL = formDirection === 'rtl' || 
                   (!formDirection && (defaultCurrency === 'SAR' || defaultCurrency === 'MAD')) ||
                   (!formDirection && quantityOffersData.language === 'ar') ||
                   (!formDirection && /[\u0600-\u06FF]/.test(offer.text || ''));
      
      const contentWrapper = document.createElement('div');
      contentWrapper.style.cssText = `
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        direction: ${isRTL ? 'rtl' : 'ltr'};
        cursor: pointer;
      `;

      // ترتيب الصورة حسب الاتجاه
      const imageSection = document.createElement('div');
      imageSection.style.cssText = `
        order: ${isRTL ? 1 : 1};
        flex-shrink: 0;
      `;
      
      if (productImage) {
        const imageElement = document.createElement('img');
        imageElement.src = productImage;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: block;
        `;
        imageElement.onerror = function() {
          console.log("❌ Image failed to load:", productImage);
          this.style.display = 'none';
        };
        imageSection.appendChild(imageElement);
      }

      // محتوى النص مع اتجاه ديناميكي
      const textContent = document.createElement('div');
      textContent.style.cssText = `
        flex: 1;
        text-align: ${isRTL ? 'right' : 'left'};
        direction: ${isRTL ? 'rtl' : 'ltr'};
        order: 2;
      `;

      // النص الرئيسي مع اتجاه ديناميكي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        font-size: 16px;
        color: ${styling.textColor};
        margin-bottom: 8px;
        direction: ${isRTL ? 'rtl' : 'ltr'};
        text-align: ${isRTL ? 'right' : 'left'};
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات مع اتجاه ديناميكي
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = `display: flex; gap: 8px; align-items: center; justify-content: ${isRTL ? 'flex-end' : 'flex-start'};`;

      if (offer.tag) {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      // حساب الخصم وعرض نسبة التوفير باستخدام السعر الصحيح
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      let savingsPercentage = 0;

      // تحويل قيم الخصم إلى أرقام وتحديد النوع الصحيح
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

      console.log("💰 FIXED Price calculation:", {
        quantity: offer.quantity,
        realPrice,
        originalPrice,
        discountType,
        discountValue,
        calculatedTotalPrice: totalPrice,
        savingsPercentage,
        offerStructure: offer
      });

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('span');
        savingsElement.style.cssText = `
          background-color: #22c55e;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        savingsElement.textContent = `وفر ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContent.appendChild(mainText);
      textContent.appendChild(tagsContainer);

      // قسم الأسعار مع اتجاه ديناميكي ومسافات مناسبة
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: ${isRTL ? 'right' : 'right'};
        min-width: 120px;
        direction: ${isRTL ? 'rtl' : 'ltr'};
        order: 3;
        padding: ${isRTL ? '0 20px 0 0' : '0 0 0 20px'};
        margin: ${isRTL ? '0 16px 0 0' : '0 0 0 16px'};
        display: flex;
        flex-direction: column;
        align-items: ${isRTL ? 'flex-end' : 'flex-end'};
        gap: 6px;
        border-left: ${isRTL ? 'none' : '1px solid #e5e7eb'};
        border-right: ${isRTL ? '1px solid #e5e7eb' : 'none'};
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (savingsPercentage > 0) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          text-decoration: line-through;
          margin-bottom: 4px;
          direction: ${isRTL ? 'rtl' : 'ltr'};
          text-align: ${isRTL ? 'left' : 'right'};
        `;
        originalPriceElement.textContent = isRTL ? `${currencySymbol} ${originalPrice.toFixed(2)}` : `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي الصحيح
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${styling.priceColor};
        direction: ${isRTL ? 'rtl' : 'ltr'};
        text-align: ${isRTL ? 'left' : 'right'};
      `;
      finalPriceElement.textContent = isRTL ? `${currencySymbol} ${totalPrice.toFixed(2)}` : `${totalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(finalPriceElement);

      // السعر لكل قطعة
      if (offer.quantity > 1) {
        const perItemElement = document.createElement('div');
        perItemElement.style.cssText = `
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
          direction: ${isRTL ? 'rtl' : 'ltr'};
          text-align: ${isRTL ? 'left' : 'right'};
        `;
        perItemElement.textContent = isRTL ? `${offer.quantity} × ${currencySymbol} ${realPrice.toFixed(2)}` : `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
        priceSection.appendChild(perItemElement);
      }

      // تجميع العناصر بترتيب صحيح للعربية: صورة، نص، سعر
      contentWrapper.appendChild(imageSection);
      contentWrapper.appendChild(textContent);
      contentWrapper.appendChild(priceSection);
      
      // إضافة المحتوى الكامل إلى العنصر الرئيسي
      offerElement.appendChild(contentWrapper);
      container.appendChild(offerElement);
    });

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.5s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);

    console.log("✅ PRECISE FIX - Quantity offers displayed with correct pricing");
  }

  // دالة تحميل وعرض العروض من API مع تحسينات
  async function loadAndDisplayOffers(blockId, productId, shop, formCurrency = 'SAR', passedProductData = null, formDirection = null) {
    try {
      // استخدام النطاق الحقيقي من Shopify
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
      
      // التحقق من وجود العروض والبيانات
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ Found quantity offers and product data");
        
        // استخدام product_id من بيانات العرض للتأكد من المنتج الصحيح
        const actualProductId = data.quantity_offers.product_id || productId;
        console.log("🎯 Quantity offer product_id:", data.quantity_offers.product_id);
        console.log("🎯 URL product:", productId);
        console.log("🎯 Using actual product ID:", actualProductId);
        
        // عرض العروض مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          actualProductId, // استخدام معرف المنتج من العرض
          data.form?.currency || 'SAR',
          data.product, // البيانات الحقيقية من API
          formDirection
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("❌ No quantity offers found or API error");
        console.log("- Success:", data.success);
        console.log("- Has quantity_offers:", !!data.quantity_offers);
        console.log("- Has offers:", data.quantity_offers?.offers?.length > 0);
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص محسنة
  function debugOffers(blockId, productId) {
    console.log("🔧 PRECISE FIX DEBUG - Starting diagnosis...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || 'codmagnet.com'; // استخدام النطاق الجديد كافتراضي
    
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

  // Enhanced load function with currency support
  function loadAndDisplayOffersWithCurrency(blockId, productId, shop, formCurrency = 'SAR') {
    console.log("💰 Loading quantity offers with currency:", formCurrency, "for product:", productId, "shop:", shop);
    
    // استخدام النطاق الجديد كافتراضي
    if (!shop) {
      shop = (typeof Shopify !== 'undefined' && Shopify.shop) ? Shopify.shop : 'codmagnet.com';
    }
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      return;
    }

    // استخدام edge function الأصلي
    const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`;
    
    console.log("🔄 Fetching quantity offers from:", apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("✅ Quantity offers data received:", data);
        
        if (data && data.success && data.quantity_offers) {
          // استخدام السعر من بيانات النموذج إذا كان متوفراً
          let formPrice = null;
          let productTitle = 'Gift Card';
          
          // البحث عن السعر في عروض الكمية
          if (data.quantity_offers.offers && Array.isArray(data.quantity_offers.offers)) {
            for (const offer of data.quantity_offers.offers) {
              if (offer.basePrice && parseFloat(offer.basePrice) > 0) {
                formPrice = parseFloat(offer.basePrice);
                console.log("💰 Found price from offers:", formPrice);
                break;
              }
            }
          }
          
          // البحث في بيانات النموذج الأخرى
          if (!formPrice && data.quantity_offers.price) {
            formPrice = parseFloat(data.quantity_offers.price);
            console.log("💰 Found price from form data:", formPrice);
          }
          
          // إنشاء بيانات المنتج مع السعر الصحيح
          const productData = {
            id: productId,
            title: productTitle,
            price: formPrice || 1000, // استخدام السعر من النموذج أو قيمة افتراضية
            currency: formCurrency,
            image: 'https://cdn.shopify.com/shop-files/gift_card_400x400.png?v=1'
          };
          
          console.log("🎯 Displaying quantity offers with price:", productData.price, "for product:", productId);
          displayQuantityOffers(data.quantity_offers, blockId, productId, formCurrency, productData);
        } else {
          console.log("ℹ️ No quantity offers found or data incomplete");
        }
      })
      .catch(error => {
        console.error("❌ Error loading quantity offers:", error);
      });
  }

  // Enhanced load function with product data support
  function loadAndDisplayOffersWithProduct(blockId, productId, shop, formCurrency = 'SAR', productData = null) {
    console.log("🛍️ Loading quantity offers with product data:", productData, "currency:", formCurrency);
    
    // حفظ بيانات المنتج في متغير عام
    window.CodformProductData = productData;
    
    // استخدام المتجر الصحيح
    if (!shop) {
      shop = 'codmagnet.com';
    }
    
    // للنموذج المنبثق، ابحث عن الحاوية المخصصة
    let container;
    if (blockId === 'popup-form') {
      container = document.getElementById('popup-quantity-offers');
      console.log('🔍 Looking for popup container:', !!container);
    } else {
      container = document.getElementById(`quantity-offers-before-${blockId}`);
    }
    
    if (!container) {
      console.error("❌ Container not found for product data loading!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
    
    console.log("📦 Container found, loading offers with product data...");
    return loadAndDisplayOffers(blockId, productId, shop, formCurrency, productData, null);
  }

  // Public API
  return {
    display: displayQuantityOffers,
    load: loadAndDisplayOffers,
    loadWithCurrency: loadAndDisplayOffersWithCurrency,
    loadWithProduct: loadAndDisplayOffersWithProduct,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - PRECISE FIX");
  return window.CodformQuantityOffers.debug(blockId, productId);
};
