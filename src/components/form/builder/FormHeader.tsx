
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileCheck, Palette, Save, TemplateIcon } from 'lucide-react';

interface FormHeaderProps {
  onSave: () => void;
  onPublish: () => void;
  onStyleOpen: () => void;
  onTemplateOpen: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished: boolean;
  lastSaved?: number | null;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  onSave,
  onPublish,
  onStyleOpen,
  onTemplateOpen,
  isSaving,
  isPublishing,
  isPublished,
  lastSaved
}) => {
  const { language } = useI18n();

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    
    const date = new Date(lastSaved);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 border-b shadow-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>{language === 'ar' ? 'حفظ' : 'Save'}</span>
            </>
          )}
        </Button>
        
        <Button 
          variant={isPublished ? "secondary" : "default"}
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-2"
        >
          {isPublishing ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          ) : (
            <FileCheck size={16} />
          )}
          <span>
            {isPublished 
              ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish') 
              : (language === 'ar' ? 'نشر النموذج' : 'Publish')}
          </span>
        </Button>
        
        {lastSaved && (
          <span className="text-xs text-gray-500 mx-2">
            {language === 'ar' ? `آخر حفظ: ${formatLastSaved()}` : `Last saved: ${formatLastSaved()}`}
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onStyleOpen}
          className="flex items-center gap-2"
        >
          <Palette size={16} />
          <span>{language === 'ar' ? 'تخصيص المظهر' : 'Customize Appearance'}</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={onTemplateOpen}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span>{language === 'ar' ? 'استخدام قالب' : 'Use Template'}</span>
        </Button>
      </div>
    </div>
  );
};

export default FormHeader;
