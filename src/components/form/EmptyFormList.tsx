
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { FolderPlus, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EmptyFormListProps {
  isOffline?: boolean;
}

const EmptyFormList: React.FC<EmptyFormListProps> = ({ isOffline = false }) => {
  const { language } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-purple-100 p-4 mb-6">
        {isOffline ? (
          <WifiOff className="h-12 w-12 text-purple-500" />
        ) : (
          <FolderPlus className="h-12 w-12 text-purple-500" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isOffline ? 
          (language === 'ar' ? 'لا توجد نماذج متاحة في وضع عدم الاتصال' : 'No forms available offline') :
          (language === 'ar' ? 'لم تقم بإنشاء أي نماذج بعد' : 'No forms created yet')}
      </h3>
      
      <p className="text-gray-500 text-center mb-8 max-w-md">
        {isOffline ? 
          (language === 'ar' 
            ? 'لا يوجد لديك نماذج محفوظة محليًا. يمكنك إنشاء نموذج جديد حتى أثناء عدم الاتصال بالإنترنت.' 
            : 'You don\'t have any locally saved forms. You can create new forms even while offline.') :
          (language === 'ar'
            ? 'ابدأ بإنشاء النماذج الخاصة بك لجمع المعلومات من العملاء أو المستخدمين.'
            : 'Start creating your forms to collect information from customers or users.')}
      </p>
      
      <Button 
        onClick={() => navigate('/form-builder/new')} 
        className="flex items-center gap-2"
      >
        <FolderPlus className="h-4 w-4" />
        {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
      </Button>
    </div>
  );
};

export default EmptyFormList;
