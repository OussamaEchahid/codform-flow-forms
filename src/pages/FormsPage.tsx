
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import FormList from '@/components/form/FormList';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FormsPage = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { forms, isLoading, error, fetchForms } = useFormFetch();
  const [retryCount, setRetryCount] = useState(0);

  // جلب النماذج عند تحميل الصفحة
  useEffect(() => {
    fetchForms().catch(err => {
      console.error('Error in FormsPage useEffect:', err);
    });
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
    setRetryCount(prevCount => prevCount + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <div className="flex gap-2">
          {error && (
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          )}
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
              ? `حدث خطأ أثناء جلب النماذج: ${error}. يمكنك إنشاء نموذج جديد أو إعادة المحاولة.` 
              : `Error fetching forms: ${error}. You can create a new form or retry.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <FormList 
          forms={forms} 
          isLoading={isLoading} 
          onSelectForm={handleSelectForm} 
          hasError={!!error}
        />
      </div>
    </div>
  );
};

export default FormsPage;
