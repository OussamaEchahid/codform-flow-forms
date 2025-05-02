
import React from 'react';
import { FormData } from '@/lib/hooks/form/types';
import { useI18n } from '@/lib/i18n';
import FormListItem from './FormListItem';
import EmptyFormList from './EmptyFormList';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2, WifiOff } from 'lucide-react';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  hasError?: boolean;
  onRefresh?: () => void;
  isOffline?: boolean;
}

const FormList: React.FC<FormListProps> = ({
  forms,
  isLoading,
  onSelectForm,
  hasError = false,
  onRefresh,
  isOffline = false
}) => {
  const { language } = useI18n();
  
  // Debug logging
  console.log('FormList render:', { 
    formsLength: forms?.length || 0, 
    isLoading, 
    hasError,
    isOffline 
  });

  // Show loading state when initially loading with no forms
  if (isLoading && forms.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
          <p className="text-gray-600 font-medium">
            {language === 'ar' ? 'جاري تحميل النماذج...' : 'Loading forms...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {language === 'ar' ? 'يرجى الانتظار' : 'Please wait'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state when there's an error and no forms
  if (hasError && forms.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-amber-600 font-medium mb-2">
            {language === 'ar'
              ? 'حدث خطأ في الاتصال. يمكنك إنشاء نموذج جديد أو إعادة المحاولة لاحقًا.'
              : 'Connection error occurred. You can create a new form or try again later.'}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {language === 'ar'
              ? 'قد يكون هناك مشكلة في الاتصال بالخادم. حاول مرة أخرى بعد بضع لحظات.'
              : 'There might be a problem connecting to the server. Try again in a moment.'}
          </p>
        </div>
        {onRefresh && (
          <Button variant="secondary" onClick={onRefresh} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        )}
      </div>
    );
  }
  
  // Show offline message when in offline mode with forms
  if (isOffline && forms.length > 0) {
    return (
      <div>
        <div className="p-4 mb-4 bg-blue-50 border border-blue-100 rounded-md text-blue-700 flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <p>
            {language === 'ar'
              ? 'أنت حاليًا غير متصل بالإنترنت. يتم عرض النماذج المحفوظة محليًا.'
              : 'You are currently offline. Showing locally saved forms.'}
          </p>
        </div>
        
        <div className="divide-y">
          {forms.map((form) => (
            <FormListItem
              key={form.id}
              form={form}
              onSelectForm={() => onSelectForm(form.id)}
              onPublishToggle={() => {}}
              onDeleteRequest={() => {}}
              isActionInProgress={false}
              isOfflineMode={isOffline}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state when there are no forms
  if (forms.length === 0) {
    return <EmptyFormList isOffline={isOffline} />;
  }

  // Show the list of forms
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
          isOfflineMode={isOffline}
        />
      ))}
      
      {/* Show loading indicator when adding more forms */}
      {isLoading && forms.length > 0 && (
        <div className="p-4 text-center">
          <div className="animate-spin h-4 w-4 border-t-2 border-purple-500 border-r-2 rounded-full mx-auto"></div>
        </div>
      )}
    </div>
  );
};

export default FormList;
