
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';

export const useFormInitialization = (formId: string | undefined) => {
  const navigate = useNavigate();
  const { fetchForms } = useFormTemplates();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');

  // Form initialization - simplified to prevent re-fetching
  useEffect(() => {
    async function handleFormInit() {
      if (formId) {
        // Handle the "new" form ID case - redirect to dashboard instead of creating a form
        if (formId === 'new') {
          console.log('New form requested, redirecting to dashboard');
          navigate('/form-builder', { replace: true });
          return;
        }
        
        // For existing forms, set to editor mode
        setActiveTab('editor');
        // Only fetch forms once and filter out title fields
        const forms = await fetchForms();
        // Filter out title fields from fetched forms if needed
        if (forms) {
          // The filtering will happen in the FormBuilderEditor component
        }
      } else {
        setActiveTab('dashboard');
        fetchForms();
      }
    }
    
    handleFormInit();
  }, [formId, navigate]); // Removed fetchForms and language from dependencies to prevent loops

  return { activeTab };
};
