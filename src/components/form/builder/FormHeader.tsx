
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Save, FileCheck, FileText, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormHeaderProps {
  onSave: () => void;
  onPublish: () => void;
  onTemplateOpen: () => void;
  onPopupFormOpen: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished: boolean;
}

const FormHeader: React.FC<FormHeaderProps> = ({ 
  onSave, 
  onPublish, 
  onTemplateOpen,
  onPopupFormOpen, 
  isSaving,
  isPublishing,
  isPublished
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();

  return (
    <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/form-builder')}>
          {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </Button>
        <div className="h-4 w-[1px] bg-gray-300"></div>
        <Button 
          variant="outline"
          size="sm"
          onClick={onPopupFormOpen}
          className="flex items-center gap-2"
        >
          <Settings size={16} />
          {language === 'ar' ? 'تفعيل النموذج المنبثق' : 'Enable Popup Form'}
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={onTemplateOpen}
        >
          <FileText size={16} className="mr-2" />
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
            <Save size={18} className="mr-2" />
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
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
          ) : (
            <FileCheck size={16} className="mr-2" />
          )}
          <span>{isPublished ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish') : (language === 'ar' ? 'نشر النموذج' : 'Publish')}</span>
        </Button>
      </div>
    </div>
  );
};

export default FormHeader;
