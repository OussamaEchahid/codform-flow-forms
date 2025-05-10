
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { toast } from 'sonner';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { forms, isLoading, fetchForms, createFormFromTemplate, createDefaultForm } = useFormTemplates();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [localForms, setLocalForms] = useState(initialForms || []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const maxRetries = 2; // Reduced max retries for faster fallback
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Safety mechanism: force loading state to complete after 6.5 seconds maximum
  useEffect(() => {
    // Initial boot timeout - guarantees we'll show something rather than infinite loading
    const initialTimeout = setTimeout(() => {
      if (!hasLoadedForms) {
        console.warn("FormBuilderDashboard: Initial load timeout reached, forcing load completion");
        setHasLoadedForms(true);
        setLoadingTimedOut(true);
        setLocalForms(initialForms || []);
        
        // Show toast only if we have no forms to show
        if (!forms || forms.length === 0) {
          toast.warning(language === 'ar' ? 
            'استغرق تحميل النماذج وقتًا طويلاً. يرجى التحقق من اتصالك بالإنترنت.' : 
            'Form loading is taking too long. Please check your internet connection.'
          );
        }
      }
    }, 6500); // 6.5 seconds maximum wait time for initial load
    
    initialLoadTimeoutRef.current = initialTimeout;
    
    // Clean up timeout
    return () => {
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
    };
  }, [forms, hasLoadedForms, initialForms, language]);

  // Fetch forms on component mount with safety limits
  useEffect(() => {
    console.log("FormBuilderDashboard: Starting form load, attempt", loadAttempts);
    
    const loadForms = async () => {
      try {
        if (loadAttempts >= maxRetries) {
          console.warn("FormBuilderDashboard: Max load attempts reached, using available forms");
          setHasLoadedForms(true);
          return;
        }
        
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.warn("FormBuilderDashboard: Load timeout, using available forms");
          setHasLoadedForms(true);
          setLoadingTimedOut(true);
          
          // Show toast on timeout
          toast.warning(language === 'ar' ? 
            'استغرق تحميل النماذج وقتًا طويلاً. يرجى التحقق من اتصالك بالإنترنت.' : 
            'Form loading is taking too long. Please check your internet connection.'
          );
        }, 3500); // Reduced to 3.5 second timeout for faster fallback
        
        loadingTimeoutRef.current = timeout;
        
        console.log("FormBuilderDashboard: Fetching forms...");
        await fetchForms();
        console.log("FormBuilderDashboard: Forms fetched successfully", forms);
        setLoadAttempts(prev => prev + 1);
        setHasLoadedForms(true);
        
        // Clear timeout on successful load
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النماذج' : 'Error loading forms');
        
        // Still set loaded to prevent infinite loading
        setHasLoadedForms(true);
        setLoadingTimedOut(true);
      }
    };

    loadForms();
    
    // Clear timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
        initialLoadTimeoutRef.current = null;
      }
    };
  }, [forceRefresh, loadAttempts, fetchForms, language, forms]);

  // Update local forms when the forms from hook change, ensuring uniqueness by ID
  useEffect(() => {
    if (forms && Array.isArray(forms) && forms.length > 0) {
      console.log("FormBuilderDashboard: Forms data received from hook, updating local forms", forms);
      // Remove duplicates by ID
      const uniqueForms = forms.reduce((acc: any[], current) => {
        const existingForm = acc.find(form => form.id === current.id);
        if (!existingForm && current && current.id) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setLocalForms(uniqueForms);
    } else if (hasLoadedForms && (loadAttempts >= maxRetries || loadingTimedOut)) {
      // If we've tried multiple times but forms is empty, ensure we show empty state
      // rather than eternal loading
      console.log("FormBuilderDashboard: No forms received, showing empty state");
      setLocalForms([]);
    }
  }, [forms, hasLoadedForms, loadAttempts, loadingTimedOut]);

  const handleCreateForm = async () => {
    try {
      const newForm = await createDefaultForm();
      if (newForm) {
        // Navigate to form builder with the new form ID
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error creating new form');
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      setIsTemplateDialogOpen(false);
      const newForm = await createFormFromTemplate(templateId);
      
      if (newForm) {
        // Navigate to form builder with the new form ID
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.error(
        language === 'ar'
          ? 'خطأ في إنشاء نموذج من القالب'
          : 'Error creating form from template'
      );
    }
  };

  // Only show loading if we're actually still loading and haven't hit our timeouts
  const shouldShowLoading = isLoading && !localForms.length && !hasLoadedForms && loadAttempts < maxRetries && !loadingTimedOut;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
          </p>
        </div>
        
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
          </Button>
          
          <Button onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>
      </div>
      
      <FormList 
        forms={localForms} 
        isLoading={shouldShowLoading} 
        onSelectForm={handleSelectForm}
      />
      
      <FormTemplatesDialog
        open={isTemplateDialogOpen}
        onSelect={handleSelectTemplate}
        onClose={() => setIsTemplateDialogOpen(false)}
      />
    </div>
  );
};

export default FormBuilderDashboard;
