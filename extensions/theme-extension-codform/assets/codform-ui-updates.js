/**
 * CODFORM UI Updates Handler
 * Manages visual indicators and UI updates for integrated pricing system
 */

(function() {
  'use strict';

  /**
   * Update cart items UI to show current state
   */
  function updateCartItemsUI(state) {
    const cartItems = document.querySelectorAll('.codform-cart-item');
    
    cartItems.forEach(cartItem => {
      // تحديث الكمية
      const quantitySpan = cartItem.querySelector('span[style*="font-weight: 600"]');
      if (quantitySpan && !isNaN(parseInt(quantitySpan.textContent))) {
        quantitySpan.textContent = state.currentQuantity;
      }

      // تحديث السعر
      const priceElement = cartItem.querySelector('.product-price');
      if (priceElement && state.targetCurrency) {
        const unitPrice = state.finalPrice / state.currentQuantity;
        const currencySymbol = getCurrencySymbol(state.targetCurrency);
        const newPriceText = `${unitPrice.toFixed(2)} ${currencySymbol}`;
        
        // إضافة مؤشر بصري للعرض النشط
        if (state.isOfferActive) {
          const originalPrice = state.basePrice;
          const savings = originalPrice - unitPrice;
          
          priceElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; flex-direction: ${state.targetCurrency === 'ar' ? 'row-reverse' : 'row'};">
              <span style="color: #059669; font-weight: 700;">${newPriceText}</span>
              <span style="color: #9ca3af; text-decoration: line-through; font-size: 0.8em;">${originalPrice.toFixed(2)} ${currencySymbol}</span>
              <span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em;">
                ${savings > 0 ? `وفر ${savings.toFixed(2)} ${currencySymbol}` : 'عرض نشط'}
              </span>
            </div>
          `;
        } else {
          priceElement.textContent = newPriceText;
        }
      }
    });
  }

  /**
   * Update quantity offers UI to show selected state
   */
  function updateQuantityOffersUI(state) {
    const offerItems = document.querySelectorAll('.quantity-offer-item');
    
    offerItems.forEach((item, index) => {
      // إزالة التحديد من جميع العروض
      item.style.borderColor = '#e5e7eb';
      item.style.backgroundColor = '#ffffff';
      
      // تحديد العرض النشط
      if (state.selectedOffer && state.isOfferActive) {
        const itemText = item.querySelector('div[style*="font-weight: 600"]')?.textContent || '';
        const offerText = state.selectedOffer.text || `اشترِ ${state.selectedOffer.quantity || 1} قطعة`;
        
        if (itemText.includes(offerText) || itemText.includes(state.selectedOffer.quantity?.toString())) {
          item.style.borderColor = '#22c55e';
          item.style.backgroundColor = '#f0fdf4';
          
          // إضافة أيقونة تأكيد
          let checkIcon = item.querySelector('.offer-check-icon');
          if (!checkIcon) {
            checkIcon = document.createElement('div');
            checkIcon.className = 'offer-check-icon';
            checkIcon.innerHTML = '✓';
            checkIcon.style.cssText = `
              position: absolute;
              top: 8px;
              right: 8px;
              background: #22c55e;
              color: white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
            `;
            item.style.position = 'relative';
            item.appendChild(checkIcon);
          }
        } else {
          // إزالة أيقونة التأكيد من العروض غير المحددة
          const checkIcon = item.querySelector('.offer-check-icon');
          if (checkIcon) {
            checkIcon.remove();
          }
        }
      } else {
        // إزالة جميع أيقونات التأكيد إذا لم يكن هناك عرض نشط
        const checkIcon = item.querySelector('.offer-check-icon');
        if (checkIcon) {
          checkIcon.remove();
        }
      }
    });
  }

  /**
   * Add visual indicators for savings
   */
  function addSavingsIndicator(state) {
    if (!state.isOfferActive) return;

    const savings = window.CodformStateManager?.getSavings() || 0;
    if (savings <= 0) return;

    // البحث عن مكان لإظهار مؤشر التوفير
    const containers = [
      document.querySelector('.cart-summary-field'),
      document.querySelector('.codform-cart-item'),
      document.querySelector('[id*="quantity-offers"]')
    ];

    containers.forEach(container => {
      if (!container) return;

      // تحقق من وجود مؤشر التوفير
      let savingsIndicator = container.querySelector('.savings-indicator');
      if (!savingsIndicator) {
        savingsIndicator = document.createElement('div');
        savingsIndicator.className = 'savings-indicator';
        savingsIndicator.style.cssText = `
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 8px 0;
          text-align: center;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
          animation: pulse 2s infinite;
        `;
        container.appendChild(savingsIndicator);
      }

      const currencySymbol = getCurrencySymbol(state.targetCurrency);
      savingsIndicator.innerHTML = `
        🎉 توفير ${savings.toFixed(2)} ${currencySymbol}
        <div style="font-size: 0.8em; margin-top: 2px; opacity: 0.9;">
          بفضل العرض النشط
        </div>
      `;
    });
  }

  /**
   * Remove savings indicators when no offer is active
   */
  function removeSavingsIndicators() {
    const indicators = document.querySelectorAll('.savings-indicator');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Get currency symbol helper
   */
  function getCurrencySymbol(currency) {
    const symbols = {
      'USD': '$',
      'SAR': 'ر.س',
      'MAD': 'د.م',
      'AED': 'د.إ',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  }

  /**
   * Add animation styles to page
   */
  function addAnimationStyles() {
    if (document.querySelector('#codform-ui-animations')) return;

    const style = document.createElement('style');
    style.id = 'codform-ui-animations';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .quantity-offer-item {
        transition: all 0.3s ease;
      }
      
      .quantity-offer-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .offer-check-icon {
        animation: fadeIn 0.3s ease;
      }
      
      .savings-indicator {
        animation: fadeIn 0.5s ease;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Main UI update function
   */
  function updateUI(state) {
    console.log('🎨 Updating UI with state:', state);
    
    updateCartItemsUI(state);
    updateQuantityOffersUI(state);
    
    if (state.isOfferActive) {
      addSavingsIndicator(state);
    } else {
      removeSavingsIndicators();
    }
  }

  /**
   * Initialize UI updates system
   */
  function initialize() {
    addAnimationStyles();
    
    // Subscribe to state changes if State Manager is available
    if (window.CodformStateManager) {
      window.CodformStateManager.subscribe(function(newState, previousState) {
        // Only update UI if relevant state changed
        if (newState.isOfferActive !== previousState.isOfferActive ||
            newState.currentQuantity !== previousState.currentQuantity ||
            newState.finalPrice !== previousState.finalPrice ||
            newState.selectedOffer !== previousState.selectedOffer) {
          updateUI(newState);
        }
      });
    }

    // Listen for offer loading events
    window.addEventListener('codform:offers-loaded', function(event) {
      console.log('🎨 UI: Offers loaded, initializing UI');
      setTimeout(() => {
        if (window.CodformStateManager) {
          const state = window.CodformStateManager.getState();
          updateUI(state);
        }
      }, 500);
    });
  }

  // Export public API
  window.CodformUIUpdates = {
    updateUI,
    initialize,
    updateCartItemsUI,
    updateQuantityOffersUI,
    addSavingsIndicator,
    removeSavingsIndicators
  };

  // Auto-initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  console.log('✅ Codform UI Updates initialized');

})();