
/**
 * Helper functions for form navigation
 * These functions use direct window.location for reliable navigation
 */

import { toast } from 'sonner';

// Store auth state in sessionStorage to prevent losing it during navigation
const saveAuthState = () => {
  try {
    // Get user data from localStorage if available
    const shopifyStore = localStorage.getItem('shopify_store');
    const shopifyConnected = localStorage.getItem('shopify_connected');
    
    // Save current auth state to sessionStorage for persistence during navigation
    sessionStorage.setItem('auth_state', JSON.stringify({
      shopify_store: shopifyStore,
      shopify_connected: shopifyConnected,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

/**
 * Navigate to form builder with specified form ID
 * Uses direct window.location for complete page reload
 */
export const navigateToFormBuilder = (formId?: string) => {
  try {
    console.log(`Navigating to form builder with formId: ${formId || 'new'}`);
    
    // Save auth state before navigation
    saveAuthState();
    
    // Store last navigation in sessionStorage
    sessionStorage.setItem('last_form_navigation', JSON.stringify({
      destination: formId ? `form-builder/${formId}` : 'form-builder/new',
      timestamp: Date.now()
    }));
    
    // Force full page reload to ensure clean state
    if (formId) {
      window.location.href = `/form-builder/${formId}`;
    } else {
      window.location.href = '/form-builder/new';
    }
  } catch (error) {
    console.error('Error navigating to form builder:', error);
    toast.error('حدث خطأ أثناء الانتقال إلى منشئ النماذج');
    
    // Fallback
    window.location.href = formId 
      ? `/form-builder/${formId}` 
      : '/form-builder/new';
  }
};

/**
 * Return to forms list with full page reload
 */
export const navigateToFormsList = () => {
  try {
    console.log('Navigating to forms list');
    
    // Save auth state before navigation
    saveAuthState();
    
    // Clear previous navigation data
    sessionStorage.removeItem('last_form_navigation');
    
    // Force full page reload
    window.location.href = '/forms';
  } catch (error) {
    console.error('Error navigating to forms list:', error);
    toast.error('حدث خطأ أثناء الانتقال إلى قائمة النماذج');
    
    // Fallback
    window.location.href = '/forms';
  }
};
