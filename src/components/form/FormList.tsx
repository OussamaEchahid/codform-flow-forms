
import React from 'react';
import { FormData } from '@/lib/hooks/form/types';
import { useI18n } from '@/lib/i18n';
import FormListItem from './FormListItem';
import EmptyFormList from './EmptyFormList';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  hasError?: boolean;
  onRefresh?: () => void;
}

const FormList: React.FC<FormListProps> = ({
  forms,
  isLoading,
  onSelectForm,
  hasError = false,
  onRefresh
}) => {
  const { language } = useI18n();
  
  // إضافة تسجيل للتصحيح
  console.log('FormList render:', { 
    formsLength: forms?.length || 0, 
    isLoading, 
    hasError 
  });

  if (isLoading && forms.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-6 w-6 border-t-2 border-purple-500 border-r-2 rounded-full mx-auto mb-2"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (hasError && forms.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-amber-600 mb-4">
          {language === 'ar'
            ? 'حدث خطأ في الاتصال. يمكنك إنشاء نموذج جديد أو إعادة المحاولة لاحقًا.'
            : 'Connection error occurred. You can create a new form or try again later.'}
        </p>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        )}
      </div>
    );
  }

  if (forms.length === 0) {
    return <EmptyFormList />;
  }

  return (
    <div className="divide-y">
      {forms.map((form) => (
        <FormListItem
          key={form.id}
          form={form}
          onSelectForm={() => onSelectForm(form.id)}
          onPublishToggle={() => {}}
          onDeleteRequest={() => {}}
          isActionInProgress={false}
        />
      ))}
      
      {/* إضافة مؤشر تحميل عند إضافة المزيد من النماذج */}
      {isLoading && forms.length > 0 && (
        <div className="p-4 text-center">
          <div className="animate-spin h-4 w-4 border-t-2 border-purple-500 border-r-2 rounded-full mx-auto"></div>
        </div>
      )}
    </div>
  );
};

export default FormList;
