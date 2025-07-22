// Script لفحص وتشخيص مشاكل Quantity Offers
console.log("🔧 CODFORM DEBUG - Loading...");

(function() {
  'use strict';
  
  function debugQuantityOffers() {
    console.log("🔍 DEBUGGING QUANTITY OFFERS");
    
    // فحص حالة النموذج
    const containers = document.querySelectorAll('[id*="codform-container"]');
    console.log("📦 Found containers:", containers.length);
    
    containers.forEach((container, index) => {
      console.log(`📦 Container ${index}:`, {
        id: container.id,
        productId: container.getAttribute('data-product-id'),
        blockId: container.getAttribute('data-block-id')
      });
      
      // فحص العروض
      const offersContainer = container.querySelector('[id*="quantity-offers-before"]');
      console.log(`🎁 Offers container ${index}:`, {
        found: !!offersContainer,
        display: offersContainer?.style.display || 'not found',
        content: offersContainer?.innerHTML?.length || 0
      });
    });
    
    // تجربة تحميل العروض يدوياً
    testQuantityOffersAPI();
  }
  
  function testQuantityOffersAPI() {
    console.log("🧪 TESTING API MANUALLY");
    
    const container = document.querySelector('[id*="codform-container"]');
    if (!container) {
      console.error("❌ No container found");
      return;
    }
    
    const productId = container.getAttribute('data-product-id');
    const blockId = container.getAttribute('data-block-id');
    const shop = (typeof Shopify !== 'undefined' && Shopify.shop) ? Shopify.shop : window.location.hostname;
    
    console.log("📡 Testing with:", { productId, blockId, shop });
    
    const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&productId=${encodeURIComponent(productId)}&blockId=${encodeURIComponent(blockId)}`;
    
    console.log("🔗 API URL:", apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        console.log("📊 Response status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("📋 API Response:", data);
        
        if (data.quantity_offers) {
          console.log("✅ Quantity offers found in API response!");
          console.log("🎁 Offers data:", data.quantity_offers);
          
          // محاولة عرض العروض يدوياً
          showOffersManually(data.quantity_offers, blockId);
        } else {
          console.log("❌ No quantity_offers in API response");
        }
      })
      .catch(error => {
        console.error("❌ API Error:", error);
      });
  }
  
  function showOffersManually(quantityOffers, blockId) {
    console.log("🎨 Manually displaying offers...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Offers container not found:", `quantity-offers-before-${blockId}`);
      return;
    }
    
    const offers = quantityOffers.offers || [];
    const styling = quantityOffers.styling || {};
    
    if (offers.length === 0) {
      console.log("ℹ️ No offers to display");
      return;
    }
    
    let html = `
      <div style="
        background: ${styling.backgroundColor || '#ffffff'};
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 2px solid #22c55e;
      ">
        <h3 style="
          color: ${styling.textColor || '#000000'};
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
        ">🎁 عروض خاصة - تم التحميل يدوياً</h3>
    `;
    
    offers.forEach(offer => {
      const savings = offer.discountType === 'percentage' 
        ? `${offer.discountValue}%` 
        : `${offer.discountValue} درهم`;
        
      html += `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          margin: 8px 0;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: #fafafa;
        ">
          <span style="color: ${styling.textColor || '#000000'}; font-weight: 500;">
            ${offer.text}
          </span>
          <span style="
            background: ${styling.tagColor || '#22c55e'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin: 0 10px;
          ">
            ${offer.tag}
          </span>
          <span style="color: ${styling.priceColor || '#ef4444'}; font-weight: 600;">
            وفر ${savings}
          </span>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    container.style.display = 'block';
    
    console.log("✅ Offers displayed manually!");
  }
  
  // تشغيل التشخيص بعد 3 ثوان
  setTimeout(debugQuantityOffers, 3000);
  
  // إضافة دالة عامة للتشخيص
  window.debugCodform = debugQuantityOffers;
  window.testQuantityOffers = testQuantityOffersAPI;
  
})();

console.log("🔧 CODFORM DEBUG - Loaded. Run debugCodform() in console to test.");