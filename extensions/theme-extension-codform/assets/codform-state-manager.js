/**
 * CODFORM State Manager
 * Manages shared state between Quantity Offers, Cart Items, and Cart Summary
 */

(function() {
  'use strict';

  // Shared state object
  let state = {
    currentQuantity: 1,
    selectedOffer: null,
    productPrice: null,
    productCurrency: null,
    targetCurrency: null,
    basePrice: null, // السعر الأصلي للوحدة الواحدة
    finalPrice: null, // السعر النهائي بعد الخصم والكمية
    isOfferActive: false
  };

  // Event listeners array
  const listeners = [];

  /**
   * Update state and notify all listeners
   */
  function updateState(newState) {
    const previousState = { ...state };
    state = { ...state, ...newState };
    
    console.log('🔄 State updated:', {
      previous: previousState,
      current: state,
      changes: newState
    });

    // Notify all listeners
    listeners.forEach(listener => {
      try {
        listener(state, previousState);
      } catch (error) {
        console.error('❌ Error in state listener:', error);
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  function subscribe(listener) {
    listeners.push(listener);
    
    // Return unsubscribe function
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current state
   */
  function getState() {
    return { ...state };
  }

  /**
   * Set product data - enhanced for same currency handling
   */
  function setProductData(price, currency, targetCurrency) {
    // ✅ CRITICAL FIX: If currencies match, no conversion needed
    const effectivePrice = (currency === targetCurrency) ? price : price;
    
    updateState({
      productPrice: price,
      productCurrency: currency,
      targetCurrency: targetCurrency,
      basePrice: price,
      finalPrice: effectivePrice // Use price directly if same currency
    });
  }

  /**
   * Update quantity and recalculate prices
   */
  function updateQuantity(quantity) {
    const currentState = getState();
    let finalPrice = currentState.basePrice * quantity;
    let isOfferActive = false;
    let selectedOffer = null;

    // تحقق من وجود عروض كمية تنطبق على الكمية الجديدة
    if (window.availableQuantityOffers) {
      const applicableOffer = window.availableQuantityOffers.find(offer => 
        offer.quantity && offer.quantity <= quantity
      );

      if (applicableOffer) {
        selectedOffer = applicableOffer;
        isOfferActive = true;
        
        // تطبيق خصم العرض
        const discountValue = parseFloat(applicableOffer.discount || 0);
        const discountType = applicableOffer.discountType || 'percentage';
        
        if (discountType === 'percentage' && discountValue > 0) {
          finalPrice = finalPrice - (finalPrice * discountValue / 100);
        } else if (discountType === 'fixed' && discountValue > 0) {
          finalPrice = Math.max(0, finalPrice - discountValue);
        }
      }
    }

    updateState({
      currentQuantity: quantity,
      selectedOffer: selectedOffer,
      finalPrice: finalPrice,
      isOfferActive: isOfferActive
    });
  }

  /**
   * Set selected offer and update prices
   */
  function setSelectedOffer(offer) {
    const currentState = getState();
    let finalPrice = currentState.basePrice * offer.quantity;
    
    // تطبيق خصم العرض
    const discountValue = parseFloat(offer.discount || 0);
    const discountType = offer.discountType || 'percentage';
    
    if (discountType === 'percentage' && discountValue > 0) {
      finalPrice = finalPrice - (finalPrice * discountValue / 100);
    } else if (discountType === 'fixed' && discountValue > 0) {
      finalPrice = Math.max(0, finalPrice - discountValue);
    }

    updateState({
      currentQuantity: offer.quantity,
      selectedOffer: offer,
      finalPrice: finalPrice,
      isOfferActive: true
    });
  }

  /**
   * Clear selected offer
   */
  function clearOffer() {
    const currentState = getState();
    updateState({
      selectedOffer: null,
      finalPrice: currentState.basePrice * currentState.currentQuantity,
      isOfferActive: false
    });
  }

  /**
   * Calculate unit price based on current state
   */
  function getUnitPrice() {
    const currentState = getState();
    if (currentState.currentQuantity > 0) {
      return currentState.finalPrice / currentState.currentQuantity;
    }
    return currentState.basePrice;
  }

  /**
   * Get savings amount
   */
  function getSavings() {
    const currentState = getState();
    if (currentState.isOfferActive) {
      const originalTotal = currentState.basePrice * currentState.currentQuantity;
      return originalTotal - currentState.finalPrice;
    }
    return 0;
  }

  // Expose public API
  window.CodformStateManager = {
    updateState,
    subscribe,
    getState,
    setProductData,
    updateQuantity,
    setSelectedOffer,
    clearOffer,
    getUnitPrice,
    getSavings
  };

  console.log('✅ Codform State Manager initialized');

})();