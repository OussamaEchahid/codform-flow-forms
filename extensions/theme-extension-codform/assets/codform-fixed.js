// CODFORM Fixed JavaScript - Compatibility Mode
(function() {
  'use strict';
  
  console.log('CODFORM FIXED: Starting without syntax errors');
  
  // Constants
  var API_BASE_URL = 'https://lovable-forms-api.netlify.app/.netlify/functions/api-forms';
  
  // Helper functions
  function getStyleValue(style, property, fallback) {
    if (!style || typeof style !== 'object') return fallback;
    return style[property] || fallback;
  }
  
  // Icon SVG generator
  function getIconSvg(iconName, iconColor) {
    var strokeStyle = 'width: 18px; height: 18px; stroke: ' + iconColor + '; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;';
    
    switch(iconName) {
      case 'user':
        return '<svg xmlns="http://www.w3.org/2000/svg" style="' + strokeStyle + '" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      case 'phone':
        return '<svg xmlns="http://www.w3.org/2000/svg" style="' + strokeStyle + '" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      case 'email':
        return '<svg xmlns="http://www.w3.org/2000/svg" style="' + strokeStyle + '" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>';
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" style="' + strokeStyle + '" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg>';
    }
  }
  
  // Fixed field rendering function
  function renderFieldFixed(field, formStyle, formLanguage) {
    if (!field || !field.type) return '';
    
    var formDirection = (formLanguage === 'ar' || /[\u0600-\u06FF]/.test(field.label)) ? 'rtl' : 'ltr';
    var baseFontSize = getStyleValue(formStyle, 'baseFontSize', '16px');
    
    if (field.type === 'form-title') {
      var title = field.label || 'Form Title';
      var titleColor = getStyleValue(field.style, 'color', '#000000');
      var titleFontSize = getStyleValue(field.style, 'fontSize', '24px');
      var titleFontWeight = getStyleValue(field.style, 'fontWeight', 'bold');
      
      return '<div class="form-title-field" style="color: ' + titleColor + '; font-size: ' + titleFontSize + '; font-weight: ' + titleFontWeight + '; text-align: center; margin: 16px 0; font-family: Cairo, sans-serif;">' + title + '</div>';
    }
    
    if (['text', 'email', 'phone'].indexOf(field.type) !== -1) {
      var label = field.label || 'Field';
      var fieldId = field.id || 'field-' + Math.random().toString(36).substr(2, 9);
      var required = field.required || false;
      var placeholder = field.placeholder || '';
      
      var html = '<div class="codform-field-wrapper" style="margin-bottom: 16px; direction: ' + formDirection + ';">';
      
      // Label
      html += '<label for="' + fieldId + '" style="display: block; color: #333; font-size: ' + baseFontSize + '; font-weight: 600; margin-bottom: 8px; font-family: Cairo, sans-serif;">';
      html += label;
      if (required) html += '<span style="color: #EF4444; margin-left: 4px;">*</span>';
      html += '</label>';
      
      // Input
      var inputType = field.type === 'email' ? 'email' : (field.type === 'phone' ? 'tel' : 'text');
      html += '<input type="' + inputType + '" id="' + fieldId + '" name="' + fieldId + '" placeholder="' + placeholder + '"';
      if (required) html += ' required';
      html += ' style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: ' + baseFontSize + '; font-family: Cairo, sans-serif; direction: ' + formDirection + ';" />';
      
      html += '</div>';
      return html;
    }
    
    if (field.type === 'submit') {
      var buttonText = field.label || 'Submit';
      var buttonStyle = field.style || {};
      var backgroundColor = getStyleValue(buttonStyle, 'backgroundColor', '#9b87f5');
      var textColor = getStyleValue(buttonStyle, 'textColor', '#ffffff');
      
      return '<div style="margin-top: 24px;"><button type="submit" style="width: 100%; padding: 16px; background-color: ' + backgroundColor + '; color: ' + textColor + '; border: none; border-radius: 8px; font-size: 18px; font-weight: 600; font-family: Cairo, sans-serif; cursor: pointer; transition: all 0.3s ease;">' + buttonText + '</button></div>';
    }
    
    return '';
  }
  
  // Get shop domain function
  function getShopDomain() {
    try {
      return 'astrem.myshopify.com';
    } catch (error) {
      console.error('Error getting shop domain', error);
      return 'auto-detect';
    }
  }
  
  // Make it globally available
  window.getShopDomain = getShopDomain;
  
  // Popup functions
  window.codformOpenPopup = function() {
    console.log('Opening popup');
    var modal = document.getElementById('codform-popup-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  
  window.codformClosePopup = function() {
    console.log('Closing popup');
    var modal = document.getElementById('codform-popup-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };
  
  // Initialize form when ready
  function initializeCodform() {
    console.log('CODFORM FIXED: Ready to load forms');
    
    // Add focus/blur effects to form inputs
    var inputs = document.querySelectorAll('.codform-field-wrapper input, .codform-field-wrapper textarea');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('focus', function() {
        this.style.borderColor = '#3b82f6';
        this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
      });
      
      inputs[i].addEventListener('blur', function() {
        this.style.borderColor = '#d1d5db';
        this.style.boxShadow = 'none';
      });
    }
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCodform);
  } else {
    initializeCodform();
  }
  
})();