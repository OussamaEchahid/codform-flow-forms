
/**
 * Helper functions for form navigation
 * These functions use window.location.href to ensure full page reloads
 * which helps resolve issues with state persistence and form rendering
 */

/**
 * Navigate to the form builder page with the given form ID
 * Using window.location.href to ensure a full page refresh
 * which fixes issues with form editing
 */
export const navigateToFormBuilder = (formId?: string) => {
  try {
    console.log(`Navigating to form builder with formId: ${formId || 'new'}`);
    
    if (formId) {
      // Navigate to edit existing form
      window.location.href = `/form-builder/${formId}?ts=${Date.now()}`;
    } else {
      // Navigate to create new form
      window.location.href = '/form-builder/new?ts=' + Date.now();
    }
  } catch (error) {
    console.error('Error navigating to form builder:', error);
    // Fallback navigation
    window.location.href = formId 
      ? `/form-builder/${formId}` 
      : '/form-builder/new';
  }
};

/**
 * Navigate back to the forms list page with a cache-busting parameter
 */
export const navigateToFormsList = () => {
  try {
    console.log('Navigating to forms list');
    window.location.href = `/forms?ts=${Date.now()}`;
  } catch (error) {
    console.error('Error navigating to forms list:', error);
    // Fallback navigation
    window.location.href = '/forms';
  }
};
