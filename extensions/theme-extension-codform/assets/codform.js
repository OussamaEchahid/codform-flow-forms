
// CODFORM - نماذج الدفع عند الاستلام

(function() {
  // مباشرة إلى Edge Function Supabase URL - أكثر موثوقية
  const API_BASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1';
  
  // Load all the modules
  {% include 'modules/field-renderer.js' %}
  {% include 'modules/step-navigator.js' %}
  {% include 'modules/form-renderer.js' %}
  {% include 'modules/form-submitter.js' %}
  {% include 'modules/form-loader.js' %}
  {% include 'modules/initializer.js' %}
  
  // Initialize CODFORM when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('CODFORM: Script loaded');
    
    const { initCODFORM } = CODFORMInitializer(API_BASE_URL);
    initCODFORM();
  });
})();
