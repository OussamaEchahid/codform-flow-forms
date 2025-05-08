
import React, { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileCheck, Palette, Save, BookTemplateIcon } from 'lucide-react';

interface FormHeaderProps {
  formTitle?: string;
  onTitleChange?: (title: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onStyleOpen: () => void;
  onTemplateOpen: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished?: boolean;
  lastSaved?: number | null;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  formTitle,
  onTitleChange,
  onSave,
  onPublish,
  onStyleOpen,
  onTemplateOpen,
  isSaving,
  isPublishing,
  isPublished = false,
  lastSaved
}) => {
  const { language } = useI18n();

  // Memoize the formatted time to prevent recalculation on every render
  const formattedLastSaved = useMemo(() => {
    if (!lastSaved) return null;
    
    const date = new Date(lastSaved);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }, [lastSaved, language]);

  return (
    <div className="flex items-center justify-between bg-white p-4 border-b shadow-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
          type="button"
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
          type="button"
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
          <span className="text-sm text-gray-500 mx-2">
            {language === 'ar' ? `آخر حفظ: ${formattedLastSaved}` : `Last saved: ${formattedLastSaved}`}
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onStyleOpen}
          className="flex items-center gap-2"
          type="button"
        >
          <Palette size={16} />
          <span>{language === 'ar' ? 'تخصيص المظهر' : 'Customize Appearance'}</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={onTemplateOpen}
          className="flex items-center gap-2"
          type="button"
        >
          <BookTemplateIcon size={16} />
          <span>{language === 'ar' ? 'استخدام قالب' : 'Use Template'}</span>
        </Button>
      </div>
    </div>
  );
};

export default React.memo(FormHeader);
