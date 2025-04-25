
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, FileCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormBuilderHeaderProps {
  onSave: () => void;
  onPublish: () => void;
  onStyleClick: () => void;
  onTemplateClick: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished: boolean;
}

const FormBuilderHeader = ({
  onSave,
  onPublish,
  onStyleClick,
  onTemplateClick,
  isSaving,
  isPublishing,
  isPublished,
}: FormBuilderHeaderProps) => {
  const { language } = useI18n();

  return (
    <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.location.href = '/forms'}>
          {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </Button>
        <div className="h-4 w-[1px] bg-gray-300"></div>
        <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2">
          <span>{language === 'ar' ? 'نموذج كـ نافذة منبثقة' : 'Form as popup'}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={onStyleClick}
        >
          {language === 'ar' ? 'تخصيص المظهر' : 'Customize Style'}
        </Button>
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={onTemplateClick}
        >
          {language === 'ar' ? 'قوالب النماذج' : 'Form Templates'}
        </Button>
        <Button 
          className="flex items-center gap-2 bg-[#9b87f5] hover:bg-[#7E69AB]" 
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <Save size={18} />
          )}
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
        <Button 
          variant={isPublished ? "secondary" : "default"}
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-2"
        >
          {isPublishing ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          ) : (
            <FileCheck size={16} />
          )}
          <span>{isPublished ? 'إلغاء النشر' : 'نشر النموذج'}</span>
        </Button>
      </div>
    </div>
  );
};

export default FormBuilderHeader;
