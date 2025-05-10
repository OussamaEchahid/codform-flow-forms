
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [localForms, setLocalForms] = useState<any[]>(Array.isArray(initialForms) ? initialForms : []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const maxRetries = 1; // Only one retry to prevent excessive waiting
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceFailsafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Generate a unique component instance ID for tracing
  const instanceIdRef = useRef<string>(`forms_${Math.random().toString(36).substring(2, 8)}`);
  
  // EMERGENCY FAILSAFE: Force loading state to complete after 5 seconds maximum
  useEffect(() => {
    console.log(`[${instanceIdRef.current}] Setting up emergency failsafe timeout`);
    
    // Initial boot timeout - guarantees we'll show something rather than infinite loading
    const initialTimeout = setTimeout(() => {
      if (!hasLoadedForms) {
        console.warn(`[${instanceIdRef.current}] EMERGENCY FAILSAFE: Force completion after 5 seconds`);
        setHasLoadedForms(true);
        setLoadingTimedOut(true);
        setLocalForms(Array.isArray(initialForms) ? initialForms : []);
        
        // Show toast only once
        toast.warning(language === 'ar' ? 
          'انتهت مهلة تحميل النماذج. عرض البيانات المتوفرة محليًا.' : 
          'Form loading timed out. Showing locally available data.'
        );
      }
    }, 5000); // 5 seconds maximum wait time for initial load
    
    initialLoadTimeoutRef.current = initialTimeout;
    
    // Clean up timeout
    return () => {
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
    };
  }, [initialForms, language]);
  
  // ULTIMATE FAILSAFE: Force show forms or empty state after 8 seconds no matter what
  useEffect(() => {
    console.log(`[${instanceIdRef.current}] Setting up ultimate failsafe timeout`);
    
    const failsafeTimeout = setTimeout(() => {
      console.warn(`[${instanceIdRef.current}] ULTIMATE FAILSAFE: Forcing component to usable state after 8 seconds`);
      
      setHasLoadedForms(true);
      setLoadingTimedOut(true);
      
      // Try to use forms from hook if available, otherwise use initialForms or empty array
      const availableForms = Array.isArray(forms) && forms.length > 0 
        ? forms 
        : (Array.isArray(initialForms) ? initialForms : []);
      
      setLocalForms(availableForms);
      setErrorOccurred(false); // Clear error state to ensure something is shown
      
      // Log all relevant state for debugging
      console.log({
        "Ultimate Failsafe": "Activated",
        "Current Forms State": forms,
        "Initial Forms": initialForms,
        "Using Forms": availableForms,
        "Loading State": isLoading,
        "Load Attempts": loadAttempts
      });
    }, 8000);
    
    forceFailsafeTimeoutRef.current = failsafeTimeout;
    
    return () => {
      if (forceFailsafeTimeoutRef.current) {
        clearTimeout(forceFailsafeTimeoutRef.current);
      }
    };
  }, [forms, initialForms, isLoading, loadAttempts]);

  // Fetch forms on component mount with safety limits and better error handling
  useEffect(() => {
    console.log(`[${instanceIdRef.current}] Starting form load, attempt ${loadAttempts}`);
    
    const loadForms = async () => {
      try {
        if (loadAttempts >= maxRetries) {
          console.warn(`[${instanceIdRef.current}] Max load attempts reached, using available forms`);
          setHasLoadedForms(true);
          
          // Set error state if we have no forms AND we've hit the retry limit
          if (!Array.isArray(forms) || forms.length === 0) {
            setErrorOccurred(true);
          }
          
          return;
        }
        
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.warn(`[${instanceIdRef.current}] Load timeout after 3 seconds, using available forms`);
          setHasLoadedForms(true);
          setLoadingTimedOut(true);
          
          // Only show toast once
          if (!hasLoadedForms) {
            toast.warning(language === 'ar' ? 
              'استغرق تحميل النماذج وقتًا طويلاً. نعرض البيانات المتوفرة حاليًا.' : 
              'Form loading is taking too long. Showing available data.'
            );
          }
        }, 3000); // 3 second timeout for faster fallback
        
        loadingTimeoutRef.current = timeout;
        
        console.log(`[${instanceIdRef.current}] Fetching forms...`);
        await fetchForms();
        console.log(`[${instanceIdRef.current}] Forms fetched successfully:`, forms);
        
        setLoadAttempts(prev => prev + 1);
        setHasLoadedForms(true);
        setErrorOccurred(false);
        
        // Clear timeout on successful load
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      } catch (error) {
        console.error(`[${instanceIdRef.current}] Error loading forms:`, error);
        
        // If we get an error, set the error state but still set hasLoadedForms
        // to prevent infinite loading
        setHasLoadedForms(true);
        setLoadingTimedOut(true);
        setErrorOccurred(true);
        
        toast.error(language === 'ar' ? 
          'حدث خطأ في تحميل النماذج. يرجى المحاولة لاحقًا.' : 
          'Error loading forms. Please try again later.'
        );
      }
    };

    if (!hasLoadedForms) {
      loadForms();
    }
    
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
      if (forceFailsafeTimeoutRef.current) {
        clearTimeout(forceFailsafeTimeoutRef.current);
        forceFailsafeTimeoutRef.current = null;
      }
    };
  }, [forceRefresh, loadAttempts, fetchForms, language, forms, hasLoadedForms]);

  // Update local forms when the forms from hook change with better safety checks
  useEffect(() => {
    try {
      // Only update if we actually have forms data from the hook
      if (forms && Array.isArray(forms)) {
        if (forms.length > 0) {
          console.log(`[${instanceIdRef.current}] Forms received from hook, updating local forms (count: ${forms.length})`);
          
          // Process to ensure we don't have duplicates
          const uniqueForms = forms.reduce((acc: any[], current) => {
            if (!current || !current.id) return acc;
            const existingForm = acc.find(form => form.id === current.id);
            if (!existingForm) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          console.log(`[${instanceIdRef.current}] Processed ${uniqueForms.length} unique forms`);
          setLocalForms(uniqueForms);
          setErrorOccurred(false);
        } else if (hasLoadedForms && loadAttempts >= maxRetries) {
          // Only set empty array if we've already tried loading and got no results
          console.log(`[${instanceIdRef.current}] No forms data from hook after multiple attempts, showing empty state`);
          setLocalForms([]);
        }
      }
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Error processing forms data:`, error);
      toast.error(language === 'ar' ? 
        'حدث خطأ في معالجة بيانات النماذج' : 
        'Error processing forms data'
      );
    }
  }, [forms, hasLoadedForms, loadAttempts, language]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorOccurred(false);
      console.log(`[${instanceIdRef.current}] Manually refreshing forms`);
      
      // Reset loading state and fetch fresh data
      await fetchForms();
      
      toast.success(language === 'ar' ? 
        'تم تحديث النماذج بنجاح' : 
        'Forms refreshed successfully'
      );
      
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Error during manual refresh:`, error);
      setErrorOccurred(true);
      
      toast.error(language === 'ar' ? 
        'فشل تحديث النماذج' : 
        'Failed to refresh forms'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      const newForm = await createDefaultForm();
      if (newForm) {
        // Navigate to form builder with the new form ID
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Error creating form:`, error);
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
      console.error(`[${instanceIdRef.current}] Error creating form from template:`, error);
      toast.error(
        language === 'ar'
          ? 'خطأ في إنشاء نموذج من القالب'
          : 'Error creating form from template'
      );
    }
  };

  // Show loading only if:
  // 1. isLoading is true AND
  // 2. We haven't already loaded forms AND
  // 3. We haven't hit the retry limit AND
  // 4. No timeout happened
  const shouldShowLoading = isLoading && !hasLoadedForms && loadAttempts < maxRetries && !loadingTimedOut;

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
          {/* Add refresh button to allow manually refreshing forms */}
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          
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
      
      {/* Show error alert if error occurred */}
      {errorOccurred && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {language === 'ar' 
              ? 'حدث خطأ في تحميل النماذج. يرجى النقر على زر "تحديث" للمحاولة مرة أخرى.'
              : 'Error loading forms. Please click the "Refresh" button to try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      <FormList 
        forms={localForms} 
        isLoading={shouldShowLoading || isRefreshing} 
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
