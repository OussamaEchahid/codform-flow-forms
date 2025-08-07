/**
 * CODFORM ADVERTISING TRACKING SYSTEM
 * نظام تتبع الإعلانات للفيسبوك وسناب شات وتيك توك
 */

(function() {
  'use strict';

  console.log('📊 Advertising Tracking System loading...');

  // Global tracking configuration
  window.CodformAdvertisingTracking = {
    pixels: {
      facebook: [],
      snapchat: [],
      tiktok: []
    },
    isInitialized: false,
    trackingEnabled: true
  };

  /**
   * Load advertising pixels from API
   */
  async function loadAdvertisingPixels() {
    try {
      const shopDomain = window.codformShopDomain || '{{ shop.domain }}';
      if (!shopDomain || shopDomain === 'auto-detect') {
        console.log('⚠️ No shop domain found, skipping pixel loading');
        return;
      }

      const response = await fetch(
        `https://trlklwixfeaexhydzaue.supabase.co/rest/v1/advertising_pixels?shop_id=eq.${shopDomain}&enabled=eq.true&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const pixels = await response.json();
      console.log('✅ Loaded advertising pixels:', pixels);

      // Organize pixels by platform
      pixels.forEach(pixel => {
        const platform = pixel.platform.toLowerCase();
        if (platform === 'facebook') {
          window.CodformAdvertisingTracking.pixels.facebook.push(pixel);
        } else if (platform === 'snapchat') {
          window.CodformAdvertisingTracking.pixels.snapchat.push(pixel);
        } else if (platform === 'tiktok') {
          window.CodformAdvertisingTracking.pixels.tiktok.push(pixel);
        }
      });

      // Initialize pixels
      initializePixels();

    } catch (error) {
      console.error('❌ Error loading advertising pixels:', error);
    }
  }

  /**
   * Initialize advertising pixels
   */
  function initializePixels() {
    console.log('🚀 Initializing advertising pixels...');

    // Initialize Facebook pixels
    window.CodformAdvertisingTracking.pixels.facebook.forEach(pixel => {
      console.log('📘 Initializing Facebook pixel:', pixel.pixel_id);
      initializeFacebookPixel(pixel.pixel_id);
    });

    // Initialize Snapchat pixels
    window.CodformAdvertisingTracking.pixels.snapchat.forEach(pixel => {
      console.log('👻 Initializing Snapchat pixel:', pixel.pixel_id);
      initializeSnapchatPixel(pixel.pixel_id);
    });

    // Initialize TikTok pixels
    window.CodformAdvertisingTracking.pixels.tiktok.forEach(pixel => {
      console.log('🎵 Initializing TikTok pixel:', pixel.pixel_id);
      initializeTikTokPixel(pixel.pixel_id);
    });

    window.CodformAdvertisingTracking.isInitialized = true;
    console.log('✅ All advertising pixels initialized');
  }

  /**
   * Initialize Facebook Pixel
   */
  function initializeFacebookPixel(pixelId) {
    if (!pixelId || window.fbq) return;

    console.log(`📘 Initializing Facebook Pixel: ${pixelId}`);

    // Facebook Pixel Code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  /**
   * Initialize Snapchat Pixel
   */
  function initializeSnapchatPixel(pixelId) {
    if (!pixelId || window.snaptr) return;

    console.log(`👻 Initializing Snapchat Pixel: ${pixelId}`);

    // Snapchat Pixel Code
    (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
    {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
    a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
    r.src=n;var u=t.getElementsByTagName(s)[0];
    u.parentNode.insertBefore(r,u);})(window,document,
    'https://sc-static.net/scevent.min.js');

    window.snaptr('init', pixelId);
    window.snaptr('track', 'PAGE_VIEW');
  }

  /**
   * Initialize TikTok Pixel
   */
  function initializeTikTokPixel(pixelId) {
    if (!pixelId || window.ttq) return;

    console.log(`🎵 Initializing TikTok Pixel: ${pixelId}`);

    // TikTok Pixel Code
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    }(window, document, 'ttq');

    window.ttq.load(pixelId);
    window.ttq.page();
  }

  /**
   * Check if pixel should fire for current product
   */
  function shouldFirePixel(pixel, currentProductId) {
    // If targeting all products, always fire
    if (pixel.target_type === 'All') {
      console.log(`✅ Pixel ${pixel.pixel_id} targets all products`);
      return true;
    }

    // If targeting specific products, check if current product is included
    if (pixel.target_type === 'Product' && pixel.target_id) {
      const targetProductIds = pixel.target_id.split(',').map(id => id.trim());
      const shouldFire = targetProductIds.includes(currentProductId?.toString());
      console.log(`${shouldFire ? '✅' : '❌'} Pixel ${pixel.pixel_id} targeting products [${targetProductIds.join(', ')}], current product: ${currentProductId}`);
      return shouldFire;
    }

    // Default to true for backward compatibility
    return true;
  }

  /**
   * Track form submission event
   */
  function trackFormSubmission(productId = null) {
    if (!window.CodformAdvertisingTracking.isInitialized || !window.CodformAdvertisingTracking.trackingEnabled) {
      console.log('⚠️ Advertising tracking not initialized or disabled');
      return Promise.resolve();
    }

    // Get current product ID from various sources
    const currentProductId = productId || 
                            window.codformProductId || 
                            window.meta?.product?.id ||
                            window.product?.id ||
                            document.querySelector('[data-product-id]')?.getAttribute('data-product-id');

    console.log('📊 Tracking form submission for product:', currentProductId);

    const trackingPromises = [];

    // Track Facebook Lead event
    window.CodformAdvertisingTracking.pixels.facebook.forEach(pixel => {
      if (shouldFirePixel(pixel, currentProductId) && window.fbq) {
        console.log('📘 Tracking Facebook Lead event for pixel:', pixel.pixel_id);
        trackingPromises.push(new Promise(resolve => {
          try {
            if (pixel.event_type === 'Lead') {
              window.fbq('track', 'Lead');
            } else if (pixel.event_type === 'Purchase') {
              window.fbq('track', 'Purchase');
            } else {
              window.fbq('track', pixel.event_type);
            }
            setTimeout(resolve, 300);
          } catch (error) {
            console.error('❌ Facebook tracking error:', error);
            resolve();
          }
        }));
      }
    });

    // Track Snapchat events
    window.CodformAdvertisingTracking.pixels.snapchat.forEach(pixel => {
      if (shouldFirePixel(pixel, currentProductId) && window.snaptr) {
        console.log('👻 Tracking Snapchat event for pixel:', pixel.pixel_id);
        trackingPromises.push(new Promise(resolve => {
          try {
            if (pixel.event_type === 'Lead') {
              window.snaptr('track', 'SIGN_UP');
            } else if (pixel.event_type === 'Purchase') {
              window.snaptr('track', 'PURCHASE');
            } else {
              window.snaptr('track', 'SIGN_UP');
            }
            setTimeout(resolve, 300);
          } catch (error) {
            console.error('❌ Snapchat tracking error:', error);
            resolve();
          }
        }));
      }
    });

    // Track TikTok events
    window.CodformAdvertisingTracking.pixels.tiktok.forEach(pixel => {
      if (shouldFirePixel(pixel, currentProductId) && window.ttq) {
        console.log('🎵 Tracking TikTok event for pixel:', pixel.pixel_id);
        trackingPromises.push(new Promise(resolve => {
          try {
            if (pixel.event_type === 'Lead') {
              window.ttq.track('CompleteRegistration');
            } else if (pixel.event_type === 'Purchase') {
              window.ttq.track('PlaceAnOrder');
            } else {
              window.ttq.track('CompleteRegistration');
            }
            setTimeout(resolve, 300);
          } catch (error) {
            console.error('❌ TikTok tracking error:', error);
            resolve();
          }
        }));
      }
    });

    // Return a promise that resolves when all tracking is complete
    return Promise.all(trackingPromises).then(() => {
      console.log('✅ All advertising tracking completed');
    });
  }

  /**
   * Handle form submission with tracking
   */
  window.handleFormSubmit = function(event) {
    console.log('📋 Form submission detected, triggering advertising tracking');
    
    // Get product ID from event data or global variables
    const productId = event?.detail?.productId || 
                     window.codformProductId || 
                     window.meta?.product?.id ||
                     window.product?.id;
    
    // Track the event immediately with product context
    trackFormSubmission(productId);
    
    // Also dispatch custom event for other listeners
    document.dispatchEvent(new CustomEvent('formSubmitted', { 
      detail: { 
        productId: productId,
        shopDomain: window.codformShopDomain 
      } 
    }));
    
    // Continue with normal form submission
    if (event.target && event.target.type === 'submit') {
      // For submit buttons, let the form handle naturally
      return true;
    } else if (typeof window.openFormPopup === 'function') {
      // For popup buttons
      window.openFormPopup(event);
    }
  };

  /**
   * Listen for custom form submission events
   */
  document.addEventListener('formSubmitted', function(event) {
    console.log('📋 Custom form submission event detected');
    const productId = event.detail?.productId;
    trackFormSubmission(productId);
  });

  /**
   * Initialize the tracking system
   */
  function initializeAdvertisingTracking() {
    console.log('🚀 Initializing Advertising Tracking System...');
    
    // Load pixels from API
    loadAdvertisingPixels();
    
    console.log('✅ Advertising Tracking System initialized');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdvertisingTracking);
  } else {
    initializeAdvertisingTracking();
  }

  // Export for global access
  window.CodformAdvertisingTracking.track = trackFormSubmission;
  window.CodformAdvertisingTracking.init = initializeAdvertisingTracking;

  console.log('✅ Advertising Tracking System loaded');

})();