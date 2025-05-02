
/**
 * Helper functions for form navigation
 */

/**
 * Navigate to the form builder page with the given form ID
 * Using window.location.href to ensure a full page refresh
 * which fixes issues with form editing
 */
export const navigateToFormBuilder = (formId?: string) => {
  if (formId) {
    // Navigate to edit existing form
    window.location.href = `/form-builder/${formId}`;
  } else {
    // Navigate to create new form
    window.location.href = '/form-builder/new';
  }
};

/**
 * Navigate back to the forms list page
 */
export const navigateToFormsList = () => {
  window.location.href = '/forms';
};
