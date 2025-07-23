
/**
 * CODFORM Quantity Offers Handler - DISABLED
 * This script has been disabled to prevent offer duplication
 * All quantity offers are now handled by the React component only
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  console.log("🚫 QUANTITY OFFERS - DISABLED to prevent offer duplication");
  console.log("✅ All quantity offers are now handled by React component only");

  // Return disabled API
  return {
    disabled: true,
    display: function() {
      console.log("🚫 Display disabled - offers handled by React component");
    },
    load: function() {
      console.log("🚫 Load disabled - offers handled by React component");
      return Promise.resolve({ disabled: true });
    },
    debug: function() {
      console.log("🚫 Debug disabled - offers handled by React component");
      return Promise.resolve({ disabled: true });
    }
  };
})();

// Disable global debug function
window.debugQuantityOffers = function() {
  console.log("🚫 Debug disabled - offers handled by React component");
  return Promise.resolve({ disabled: true });
};
