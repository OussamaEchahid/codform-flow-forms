
/**
 * CODFORM Quantity Offers Handler - UNIFIED SYSTEM
 * معالج العروض الكمية - النظام الموحد
 * 
 * This system mirrors the React component logic to ensure
 * consistent behavior between preview and Shopify store
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // State management
  let isInitialized = false;
  const processedForms = new Set();
  
  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    FORM_WAIT_TIMEOUT: 15000,
    OFFER_CHECK_INTERVAL: 100
  };

  // Utility functions
  const log = (message, data = null) => {
    console.log(`🎯 CODFORM Offers: ${message}`, data || '');
  };

  const error = (message, data = null) => {
    console.error(`❌ CODFORM Offers: ${message}`, data || '');
  };

  const success = (message, data = null) => {
    console.log(`✅ CODFORM Offers: ${message}`, data || '');
  };

  // Form detection system
  const FormDetector = {
    findFormContainer: function(blockId) {
      const selectors = [
        `#codform-container-${blockId}`,
        `#codform-form-${blockId}`,
        `[data-block-id="${blockId}"]`,
        `.codform-form-container-${blockId}`,
        '.codform-form',
        '.codform-form-container'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          log(`Found form container: ${selector}`, element);
          return element;
        }
      }

      error(`No form container found for blockId: ${blockId}`);
      return null;
    },

    waitForForm: function(blockId, callback, timeout = CONFIG.FORM_WAIT_TIMEOUT) {
      let attempts = 0;
      const maxAttempts = timeout / CONFIG.OFFER_CHECK_INTERVAL;

      const checkForm = () => {
        const container = this.findFormContainer(blockId);
        
        if (container) {
          success(`Form ready after ${attempts * CONFIG.OFFER_CHECK_INTERVAL}ms`);
          callback(container);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          error(`Timeout waiting for form: ${blockId}`);
          return;
        }

        setTimeout(checkForm, CONFIG.OFFER_CHECK_INTERVAL);
      };

      checkForm();
    },

    getFormData: function(container) {
      const blockId = container.dataset.blockId || 
                      container.id.replace('codform-container-', '') ||
                      container.id.replace('codform-form-', '');
      
      const productId = container.dataset.productId || 
                       document.querySelector('[data-product-id]')?.dataset.productId;
      
      const shop = container.dataset.shop || 
                  window.Shopify?.shop?.domain || 
                  window.location.hostname;

      return { blockId, productId, shop };
    }
  };

  // Offer container management
  const ContainerManager = {
    findOfferContainer: function(blockId, position) {
      const containerId = `quantity-offers-${position}-${blockId}`;
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = this.createOfferContainer(blockId, position);
      }
      
      if (container) {
        this.prepareContainer(container);
      }
      
      return container;
    },

    createOfferContainer: function(blockId, position) {
      const formContainer = FormDetector.findFormContainer(blockId);
      if (!formContainer) {
        error(`Cannot create offer container without form container`);
        return null;
      }

      const container = document.createElement('div');
      container.id = `quantity-offers-${position}-${blockId}`;
      container.className = 'quantity-offers-container';
      container.style.cssText = `
        display: none;
        width: 100%;
        margin: 15px 0;
        position: relative;
        z-index: 10;
      `;

      this.insertContainer(container, formContainer, position);
      log(`Created offer container: ${container.id}`);
      return container;
    },

    insertContainer: function(container, formContainer, position) {
      const wrapper = formContainer.querySelector('.codform-form-wrapper') || formContainer;
      
      switch (position) {
        case 'before_form':
          wrapper.parentNode.insertBefore(container, wrapper);
          break;
        case 'after_form':
          wrapper.parentNode.insertBefore(container, wrapper.nextSibling);
          break;
        case 'inside_form':
        default:
          wrapper.insertBefore(container, wrapper.firstChild);
          break;
      }
    },

    prepareContainer: function(container) {
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      container.innerHTML = '';
    }
  };

  // Offer display system - mirrors React component logic
  const OfferRenderer = {
    render: function(container, offers, productData, styling = {}) {
      if (!container || !offers || !Array.isArray(offers) || offers.length === 0) {
        error('Invalid render parameters');
        return false;
      }

      // Validate product data
      if (!productData?.price || productData.price <= 0) {
        error('Invalid product price data', productData);
        return false;
      }

      const realPrice = parseFloat(productData.price);
      const currency = productData.currency || 'SAR';
      const currencySymbol = this.getCurrencySymbol(currency);

      log(`Rendering ${offers.length} offers`, {
        realPrice,
        currency,
        productTitle: productData.title
      });

      // Clear and prepare container
      ContainerManager.prepareContainer(container);

      // Create offer elements
      offers.forEach((offer, index) => {
        const offerElement = this.createOfferElement(offer, index, realPrice, currencySymbol, productData, styling);
        container.appendChild(offerElement);
      });

      success(`Rendered ${offers.length} offers successfully`);
      return true;
    },

    createOfferElement: function(offer, index, realPrice, currencySymbol, productData, styling) {
      const isHighlighted = index === 1;
      const totalPrice = this.calculatePrice(offer, realPrice);
      const originalPrice = realPrice * (offer.quantity || 1);
      const isDiscounted = totalPrice < originalPrice;
      
      const element = document.createElement('div');
      element.className = 'quantity-offer-item';
      element.style.cssText = `
        background-color: ${isHighlighted ? '#f0fdf4' : styling.backgroundColor || '#ffffff'};
        border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.3s ease;
        ${isHighlighted ? 'box-shadow: 0 4px 8px rgba(0,0,0,0.1);' : ''}
      `;

      // Left section: image and content
      const leftSection = this.createLeftSection(offer, productData, styling);
      
      // Right section: pricing
      const rightSection = this.createRightSection(offer, totalPrice, originalPrice, isDiscounted, currencySymbol, styling);

      element.appendChild(leftSection);
      element.appendChild(rightSection);

      // Add click handler
      element.addEventListener('click', () => {
        this.handleOfferClick(offer, totalPrice);
      });

      return element;
    },

    createLeftSection: function(offer, productData, styling) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';

      // Product image
      const imageContainer = document.createElement('div');
      imageContainer.style.cssText = `
        width: 60px;
        height: 60px;
        background-color: #f3f4f6;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        flex-shrink: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      if (productData.image) {
        const img = document.createElement('img');
        img.src = productData.image;
        img.alt = productData.title || 'Product';
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        img.onerror = () => {
          imageContainer.innerHTML = this.getPlaceholderIcon();
        };
        imageContainer.appendChild(img);
      } else {
        imageContainer.innerHTML = this.getPlaceholderIcon();
      }

      // Text content
      const textContent = document.createElement('div');
      textContent.style.cssText = 'flex: 1;';

      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        font-size: 15px;
        color: ${styling.textColor || '#000000'};
        margin-bottom: 6px;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      mainText.textContent = offer.offer_text || offer.text || `اشترِ ${offer.quantity} قطعة`;

      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

      if (offer.tag) {
        const tag = document.createElement('span');
        tag.style.cssText = `
          background-color: ${styling.tagColor || '#22c55e'};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        tag.textContent = offer.tag;
        tagsContainer.appendChild(tag);
      }

      textContent.appendChild(mainText);
      textContent.appendChild(tagsContainer);

      section.appendChild(imageContainer);
      section.appendChild(textContent);

      return section;
    },

    createRightSection: function(offer, totalPrice, originalPrice, isDiscounted, currencySymbol, styling) {
      const section = document.createElement('div');
      section.style.cssText = 'text-align: center; min-width: 100px;';

      if (isDiscounted) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          text-decoration: line-through;
          margin-bottom: 4px;
        `;
        originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currencySymbol}`;
        section.appendChild(originalPriceElement);
      }

      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${styling.priceColor || '#ef4444'};
        font-family: system-ui, -apple-system, sans-serif;
      `;
      finalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbol}`;
      section.appendChild(finalPriceElement);

      return section;
    },

    calculatePrice: function(offer, basePrice) {
      let totalPrice = basePrice * (offer.quantity || 1);
      
      if (offer.discount_type === 'percentage' && offer.discount_value > 0) {
        totalPrice = totalPrice - (totalPrice * offer.discount_value / 100);
      } else if (offer.discount_type === 'fixed' && offer.discount_value > 0) {
        totalPrice = totalPrice - offer.discount_value;
      }
      
      return Math.max(0, totalPrice);
    },

    getCurrencySymbol: function(currency) {
      const symbols = {
        'USD': '$',
        'SAR': 'ر.س',
        'MAD': 'د.م',
        'AED': 'د.إ',
        'EUR': '€',
        'GBP': '£'
      };
      return symbols[currency] || currency;
    },

    getPlaceholderIcon: function() {
      return `
        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20" style="width: 32px; height: 32px;">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
      `;
    },

    handleOfferClick: function(offer, totalPrice) {
      log(`Offer clicked: ${offer.offer_text || offer.text}`, {
        quantity: offer.quantity,
        price: totalPrice
      });
      
      // Trigger custom event for form integration
      window.dispatchEvent(new CustomEvent('codform:offerSelected', {
        detail: { offer, totalPrice }
      }));
    }
  };

  // API integration
  const ApiManager = {
    loadQuantityOffers: async function(blockId, productId, shop) {
      const cacheKey = `${blockId}-${productId}`;
      
      if (processedForms.has(cacheKey)) {
        log('Offers already loaded for this form');
        return { success: false, message: 'Already loaded' };
      }

      try {
        log(`Loading offers for: ${cacheKey}`);
        
        const apiUrl = `${CONFIG.API_BASE_URL}/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}&blockId=${encodeURIComponent(blockId)}`;
        
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
          processedForms.add(cacheKey);
          success('Offers loaded successfully');
          return { success: true, data };
        } else {
          log('No offers found for this product');
          return { success: false, message: 'No offers found' };
        }
        
      } catch (error) {
        error('Failed to load offers:', error.message);
        return { success: false, error: error.message };
      }
    }
  };

  // Main controller
  const OffersController = {
    initialize: function() {
      if (isInitialized) return;
      
      log('Initializing quantity offers system');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.autoDetectAndLoad();
        });
      } else {
        this.autoDetectAndLoad();
      }
      
      isInitialized = true;
    },

    autoDetectAndLoad: function() {
      // Look for form containers
      const containers = document.querySelectorAll('[data-product-id], .codform-form, .codform-form-container');
      
      containers.forEach(container => {
        const formData = FormDetector.getFormData(container);
        
        if (formData.blockId && formData.productId && formData.shop) {
          this.loadAndDisplay(formData.blockId, formData.productId, formData.shop);
        }
      });
    },

    loadAndDisplay: async function(blockId, productId, shop) {
      try {
        // Wait for form to be ready
        FormDetector.waitForForm(blockId, async (formContainer) => {
          // Load offers data
          const result = await ApiManager.loadQuantityOffers(blockId, productId, shop);
          
          if (result.success && result.data) {
            this.displayOffers(result.data, blockId);
          }
        });
      } catch (error) {
        error('Failed to load and display offers:', error.message);
      }
    },

    displayOffers: function(data, blockId) {
      const { quantity_offers, product } = data;
      
      if (!quantity_offers || !product) {
        error('Invalid offer data structure');
        return;
      }

      const position = quantity_offers.position || 'inside_form';
      const container = ContainerManager.findOfferContainer(blockId, position);
      
      if (!container) {
        error(`Could not find or create offer container for position: ${position}`);
        return;
      }

      // Render offers
      const rendered = OfferRenderer.render(
        container, 
        quantity_offers.offers, 
        product, 
        quantity_offers.styling || {}
      );

      if (rendered) {
        success(`Offers displayed successfully at position: ${position}`);
      }
    }
  };

  // Auto-initialize when script loads
  OffersController.initialize();

  // Public API
  return {
    load: ApiManager.loadQuantityOffers,
    display: OffersController.displayOffers,
    reset: function() {
      processedForms.clear();
      log('System reset completed');
    }
  };
})();

// Global helper functions
window.loadQuantityOffers = function(blockId, productId, shop) {
  return window.CodformQuantityOffers.load(blockId, productId, shop);
};

window.resetQuantityOffers = function() {
  return window.CodformQuantityOffers.reset();
};

success('Quantity Offers system initialized successfully');
