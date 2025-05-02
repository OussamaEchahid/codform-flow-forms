
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import FormList from '@/components/form/FormList';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const FormsPage = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { forms, isLoading, error, fetchForms } = useFormFetch();
  const [retryCount, setRetryCount] = useState(0);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // جلب النماذج عند تحميل الصفحة
  useEffect(() => {
    console.log('FormsPage: Loading forms...');
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasInitiallyLoaded(true);
      } catch (err) {
        console.error('Error in FormsPage useEffect:', err);
      }
    };
    
    loadForms();
  }, [fetchForms, retryCount]);

  // معالجة اختيار نموذج
  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  // معالجة إنشاء نموذج جديد
  const handleCreateNew = () => {
    navigate('/form-builder/new');
  };

  // إعادة تحميل البيانات يدويًا
  const handleRefresh = () => {
    console.log('FormsPage: Manual refresh requested');
    setIsManualRefresh(true);
    setRetryCount(prevCount => prevCount + 1);
    
    setTimeout(() => {
      setIsManualRefresh(false);
      
      if (!error) {
        toast.success(language === 'ar' ? 'تم تحديث النماذج بنجاح' : 'Forms refreshed successfully');
      }
    }, 1000);
  };

  // لإظهار معلومات تصحيح الأخطاء
  console.log('FormsPage render state:', { 
    isLoading, 
    formsCount: forms?.length || 0, 
    hasError: !!error,
    hasInitiallyLoaded
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading && isManualRefresh}
          >
            {isManualRefresh ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent mr-2"></div>
                {language === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </>
            )}
          </Button>
          
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
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
          forms={forms} 
          isLoading={isLoading} 
          onSelectForm={handleSelectForm} 
          hasError={!!error}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default FormsPage;
