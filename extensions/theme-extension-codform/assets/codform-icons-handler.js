/**
 * CODFORM Icons Handler
 * Manages icon generation for form fields
 */

(function() {
  'use strict';

  /**
   * Generate SVG icon based on icon name and color
   * @param {string} iconName - Name of the icon
   * @param {string} iconColor - Color for the icon (default: #6b7280)
   * @returns {string} SVG HTML string
   */
  function getIconSvg(iconName, iconColor = '#6b7280') {
    // Base styles for different icon types
    const strokeStyle = `width: 18px; height: 18px; stroke: ${iconColor}; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;`;
    const filledStyle = `width: 18px; height: 18px; fill: ${iconColor}; stroke: none;`;
    
    let svgResult = '';
    
    switch(iconName) {
      case 'user':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        break;
      case 'phone':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
        break;
      case 'mail':
      case 'email':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
        break;
      case 'map-pin':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
        break;
      
      // NEW ICONS - COMPLETELY REWRITTEN WITH PROPER FILLED PATHS
      case 'home':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z"></path></svg>`;
        break;
      case 'heart':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
        break;
      case 'star':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`;
        break;
      case 'shopping-cart':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>`;
        break;
      case 'gift':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"></path></svg>`;
        break;
      case 'calendar':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"></path></svg>`;
        break;
      case 'clock':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"></path></svg>`;
        break;
      case 'message-circle':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>`;
        break;
      
      // الأيقونات المفقودة من النظام - نفس الطريقة التي نجحت
      case 'shopping-bag':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
        break;
      case 'credit-card':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`;
        break;
      case 'banknote':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`;
        break;
      case 'handshake':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14"></path><path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M21 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path></svg>`;
        break;
      case 'truck':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>`;
        break;
      case 'package':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M16.5 9.4 7.55 4.24"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
        break;
      case 'send':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9 22 2Z"></path></svg>`;
        break;
      case 'crown':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M2 18h20l-2-12-3 7-5-10-5 10-3-7-2 12z"></path></svg>`;
        break;
      case 'zap':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon></svg>`;
        break;
      case 'users':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
        break;
      case 'id-card':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><path d="M15 13.5v1.5"></path><path d="M15 9v1.5"></path></svg>`;
        break;
      case 'award':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>`;
        break;
      case 'smartphone':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
        break;
      case 'phone-call':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 2a9 9 0 0 1 8 7.94"></path><path d="M14.05 6A5 5 0 0 1 18 10"></path></svg>`;
        break;
      case 'building':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12h4"></path><path d="M6 20h4"></path><path d="M10 4h4"></path><path d="M10 8h4"></path></svg>`;
        break;
      case 'map':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>`;
        break;
      case 'message-square':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        break;
      case 'sticky-note':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path><path d="M15 3v6h6"></path></svg>`;
        break;
      case 'sparkles':
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${filledStyle}" viewBox="0 0 24 24"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>`;
        break;
      case 'none':
        svgResult = '';
        break;
      default:
        svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
    
    return svgResult;
  }

  // Make function globally available
  window.getIconSvg = getIconSvg;

})();