
/**
 * CODFORM Quantity Offers - CLEAN SIMPLE SOLUTION
 * الحل النظيف والبسيط لعرض عروض الكمية
 */

window.CodformQuantityOffers = (function() {
  'use strict';
  
  // تخزين العروض المحملة لتجنب الطلبات المكررة
  const loadedOffers = new Map();
  
  // دالة تحميل العروض من API
  async function loadOffers(blockId, productId, shop) {
    const cacheKey = `${shop}-${productId}-${blockId}`;
    
    // التحقق من الذاكرة المؤقتة
    if (loadedOffers.has(cacheKey)) {
      console.log(`🎯 Using cached offers for ${productId}`);
      return loadedOffers.get(cacheKey);
    }
    
    try {
      console.log(`🔄 Loading offers for product ${productId} on ${shop}`);
      
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}&blockId=${encodeURIComponent(blockId)}`;
      
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
      
      if (data.success && data.quantity_offers && data.product) {
        console.log(`✅ Loaded offers and product data for ${productId}`);
        
        // تخزين في الذاكرة المؤقتة
        loadedOffers.set(cacheKey, data);
        
        // عرض العروض مباشرة
        displayOffers(data, blockId);
        
        return { success: true, data };
      } else {
        console.log(`ℹ️ No offers found for product ${productId}`);
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error(`❌ Error loading offers for ${productId}:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  // دالة عرض العروض
  function displayOffers(data, blockId) {
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error(`❌ Container not found: quantity-offers-before-${blockId}`);
      return;
    }
    
    const { quantity_offers, product } = data;
    
    if (!quantity_offers || !quantity_offers.offers || quantity_offers.offers.length === 0) {
      console.log('ℹ️ No offers to display');
      return;
    }
    
    // مسح المحتوى السابق
    container.innerHTML = '';
    
    // التحقق من وجود بيانات المنتج الحقيقية
    if (!product || !product.price) {
      console.warn('⚠️ No real product data available');
      showWarning(container, 'لا توجد بيانات سعر حقيقية للمنتج');
      return;
    }
    
    const realPrice = parseFloat(product.price);
    const currency = product.currency || 'USD';
    const productImage = product.image;
    const productTitle = product.title || 'المنتج';
    
    console.log(`💰 Product info: ${productTitle} - ${realPrice} ${currency}`);
    
    // رمز العملة
    const currencySymbol = getCurrencySymbol(currency);
    
    // عرض العروض
    quantity_offers.offers.forEach((offer, index) => {
      const offerElement = createOfferElement(offer, index, realPrice, currency, currencySymbol, productImage, productTitle, quantity_offers.styling);
      container.appendChild(offerElement);
    });
    
    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    container.style.display = 'block';
    
    setTimeout(() => {
      container.style.transition = 'all 0.5s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);
    
    console.log(`✅ Displayed ${quantity_offers.offers.length} offers for ${productTitle}`);
  }
  
  // دالة إنشاء عنصر العرض
  function createOfferElement(offer, index, realPrice, currency, currencySymbol, productImage, productTitle, styling) {
    const isHighlighted = index === 1;
    
    // حساب السعر
    const totalPrice = calculatePrice(offer, realPrice);
    const originalPrice = realPrice * (offer.quantity || 1);
    const isDiscounted = offer.discountType !== 'none' && offer.discountValue > 0;
    
    let savingsPercentage = 0;
    if (isDiscounted) {
      if (offer.discountType === 'percentage') {
        savingsPercentage = offer.discountValue;
      } else if (offer.discountType === 'fixed') {
        savingsPercentage = Math.round((offer.discountValue / originalPrice) * 100);
      }
    }
    
    const offerElement = document.createElement('div');
    offerElement.style.cssText = `
      background-color: ${isHighlighted ? '#f0fdf4' : styling?.backgroundColor || '#ffffff'};
      border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
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
    `;
    
    // إضافة تأثيرات hover
    offerElement.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    });
    
    offerElement.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    });
    
    // الجزء الأيسر
    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';
    
    // الصورة
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = 'width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; background: #f9fafb;';
    
    if (productImage) {
      const img = document.createElement('img');
      img.src = productImage;
      img.alt = productTitle;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      img.onerror = function() {
        this.style.display = 'none';
        imageContainer.innerHTML = '<svg width="24" height="24" fill="#6b7280" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.innerHTML = '<svg width="24" height="24" fill="#6b7280" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
    }
    
    // النص
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1;';
    
    const mainText = document.createElement('div');
    mainText.style.cssText = `font-weight: 600; font-size: 15px; color: ${styling?.textColor || '#000000'}; margin-bottom: 6px;`;
    mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;
    
    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    
    if (offer.tag) {
      const tagElement = document.createElement('span');
      tagElement.style.cssText = `background-color: ${styling?.tagColor || '#22c55e'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;`;
      tagElement.textContent = offer.tag;
      tagsContainer.appendChild(tagElement);
    }
    
    if (savingsPercentage > 0) {
      const savingsElement = document.createElement('span');
      savingsElement.style.cssText = 'background-color: #22c55e; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;';
      savingsElement.textContent = `وفر ${savingsPercentage}%`;
      tagsContainer.appendChild(savingsElement);
    }
    
    textContainer.appendChild(mainText);
    textContainer.appendChild(tagsContainer);
    
    leftSection.appendChild(imageContainer);
    leftSection.appendChild(textContainer);
    
    // الجزء الأيمن - الأسعار
    const priceSection = document.createElement('div');
    priceSection.style.cssText = 'text-align: center; min-width: 100px;';
    
    if (isDiscounted) {
      const originalPriceElement = document.createElement('div');
      originalPriceElement.style.cssText = 'font-size: 12px; color: #6b7280; text-decoration: line-through; margin-bottom: 4px;';
      originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(originalPriceElement);
    }
    
    const finalPriceElement = document.createElement('div');
    finalPriceElement.style.cssText = `font-size: 18px; font-weight: bold; color: ${styling?.priceColor || '#ef4444'};`;
    finalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbol}`;
    priceSection.appendChild(finalPriceElement);
    
    if (offer.quantity > 1) {
      const perItemElement = document.createElement('div');
      perItemElement.style.cssText = 'font-size: 11px; color: #6b7280; margin-top: 2px;';
      perItemElement.textContent = `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
      priceSection.appendChild(perItemElement);
    }
    
    offerElement.appendChild(leftSection);
    offerElement.appendChild(priceSection);
    
    return offerElement;
  }
  
  // دالة حساب السعر
  function calculatePrice(offer, realPrice) {
    const baseTotal = realPrice * (offer.quantity || 1);
    
    if (offer.discountType === 'fixed' && offer.discountValue) {
      return baseTotal - offer.discountValue;
    } else if (offer.discountType === 'percentage' && offer.discountValue) {
      const discount = (baseTotal * offer.discountValue) / 100;
      return baseTotal - discount;
    }
    
    return baseTotal;
  }
  
  // دالة الحصول على رمز العملة
  function getCurrencySymbol(currency) {
    const symbols = {
      'USD': '$',
      'SAR': 'ر.س',
      'MAD': 'د.م',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  }
  
  // دالة عرض التحذير
  function showWarning(container, message) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      background-color: #fef3c7;
      border: 2px dashed #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      text-align: center;
      font-family: 'Cairo', system-ui, Arial, sans-serif;
      color: #92400e;
    `;
    warningDiv.innerHTML = `
      <p style="margin: 0; font-weight: 600;">⚠️ ${message}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;">يرجى التأكد من ربط المنتج بشكل صحيح</p>
    `;
    container.appendChild(warningDiv);
  }
  
  // دالة التشخيص
  function debug(blockId, productId, shop) {
    console.log("🔧 DEBUGGING - Quantity Offers Debug Info:");
    console.log("Parameters:", { blockId, productId, shop });
    console.log("Container exists:", !!document.getElementById(`quantity-offers-before-${blockId}`));
    console.log("Cached offers:", loadedOffers.size);
    
    return loadOffers(blockId, productId, shop);
  }
  
  // Public API
  return {
    load: loadOffers,
    display: displayOffers,
    debug: debug
  };
})();

// دالة تشخيص عامة للاستخدام من console
window.debugQuantityOffers = function(blockId, productId, shop) {
  return window.CodformQuantityOffers.debug(blockId, productId, shop);
};
