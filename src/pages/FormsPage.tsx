
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import FormList from '@/components/form/FormList';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import ShopifyConnectionBanner from '@/components/form/ShopifyConnectionBanner';

const FormsPage = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { forms, isLoading, error, fetchForms } = useFormFetch();
  const [retryCount, setRetryCount] = useState(0);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  // Load forms on page load with improved error handling
  useEffect(() => {
    console.log('FormsPage: Loading forms... Attempt:', retryCount);
    
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasInitiallyLoaded(true);
      } catch (err) {
        console.error('Error in FormsPage useEffect:', err);
      } finally {
        setInitialLoadAttempted(true);
      }
    };
    
    loadForms();
    
    // Set up an automatic retry if initial load fails
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    if (error && retryCount < 3 && !initialLoadAttempted) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000); // Retry after 3 seconds
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchForms, retryCount]);

  // Handle manual refresh with visual feedback
  const handleRefresh = useCallback(() => {
    console.log('FormsPage: Manual refresh requested');
    setIsManualRefresh(true);
    
    // Reset any error state and increment retry count
    setRetryCount(prevCount => prevCount + 1);
    
    // Attempt to fetch forms again
    fetchForms()
      .then(() => {
        if (!error) {
          toast.success(language === 'ar' ? 'تم تحديث النماذج بنجاح' : 'Forms refreshed successfully');
        }
      })
      .catch(err => {
        console.error('Manual refresh error:', err);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء تحديث النماذج' : 'Error refreshing forms');
      })
      .finally(() => {
        setIsManualRefresh(false);
      });
  }, [fetchForms, language, error]);

  // Handle form selection
  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  // Handle creating a new form
  const handleCreateNew = () => {
    navigate('/form-builder/new');
  };

  // Debug logging
  console.log('FormsPage render state:', { 
    isLoading, 
    formsCount: forms?.length || 0, 
    hasError: !!error,
    hasInitiallyLoaded,
    initialLoadAttempted
  });

  return (
    <div className="container mx-auto p-6">
      {/* Shopify Connection Banner (if needed) */}
      <ShopifyConnectionBanner />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading && isManualRefresh}
            className="flex items-center gap-2"
          >
            {isManualRefresh ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                {language === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </>
            )}
          </Button>
          
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === 'ar' 
              ? `حدث خطأ أثناء جلب النماذج. يمكنك إنشاء نموذج جديد أو إعادة المحاولة.` 
              : `Error fetching forms. You can create a new form or retry.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <FormList 
          forms={forms || []} 
          isLoading={(isLoading && !hasInitiallyLoaded) || (!initialLoadAttempted && retryCount < 3)} 
          onSelectForm={handleSelectForm} 
          hasError={!!error}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default FormsPage;
