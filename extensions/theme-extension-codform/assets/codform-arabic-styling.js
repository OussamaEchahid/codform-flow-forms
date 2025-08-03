// ============================================================
// CODFORM ARABIC STYLING - Standalone Arabic Font Management
// ============================================================
// This file handles Arabic font detection and styling for codform fields

window.codformArabicStyling = {
  // Detect if content contains Arabic text
  isArabicText: function(text) {
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  },

  // Detect form language based on multiple sources
  detectFormLanguage: function(data, fieldsArray) {
    let formLanguage = 'en';
    
    // Check multiple sources for Arabic language
    if (data.form?.language === 'ar' || data.language === 'ar') {
      formLanguage = 'ar';
    } else if (data.form?.title && this.isArabicText(data.form.title)) {
      formLanguage = 'ar';
    } else if (fieldsArray && fieldsArray.some(field => 
      field.label && this.isArabicText(field.label)
    )) {
      formLanguage = 'ar';
    }
    
    return formLanguage;
  },

  // Apply Arabic styling to form container
  applyArabicStyling: function(container) {
    if (!container) return;
    
    // Add Arabic-specific CSS dynamically
    if (!document.getElementById('codform-arabic-styles')) {
      const arabicStyle = document.createElement('style');
      arabicStyle.id = 'codform-arabic-styles';
      arabicStyle.innerHTML = `
        .codform-arabic-form,
        .codform-arabic-form *,
        .codform-arabic-form input,
        .codform-arabic-form textarea,
        .codform-arabic-form label,
        .codform-arabic-form button {
          font-family: 'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif !important;
          font-feature-settings: "liga" 1, "kern" 1 !important;
          text-rendering: optimizeLegibility !important;
        }
        
        .codform-arabic-form input::placeholder,
        .codform-arabic-form textarea::placeholder {
          font-family: 'Cairo', 'Noto Sans Arabic', sans-serif !important;
          font-size: 15px !important;
          opacity: 0.7 !important;
          font-weight: 400 !important;
        }
      `;
      document.head.appendChild(arabicStyle);
    }
    
    // Apply Arabic class to container
    container.classList.add('codform-arabic-form');
    console.log('🔤 Arabic styling applied to form container');
  },

  // Initialize Arabic styling based on form data
  initializeArabicStyling: function(data, fieldsArray, container) {
    const formLanguage = this.detectFormLanguage(data, fieldsArray);
    console.log('🔍 CODFORM: Detected form language:', formLanguage);
    
    if (formLanguage === 'ar') {
      this.applyArabicStyling(container);
    }
    
    return formLanguage;
  }
};

// Make functions available globally for backward compatibility
window.detectFormLanguage = window.codformArabicStyling.detectFormLanguage.bind(window.codformArabicStyling);
window.applyArabicStyling = window.codformArabicStyling.applyArabicStyling.bind(window.codformArabicStyling);

console.log('📦 Arabic styling handler initialized');