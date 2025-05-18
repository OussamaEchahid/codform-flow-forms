
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { LayoutAlignRight, LayoutAlignLeft } from 'lucide-react';

interface FormSettingsProps {
  formTitle: string;
  setFormTitle: (title: string) => void;
  formDescription: string;
  setFormDescription: (description: string) => void;
  formDirection?: 'ltr' | 'rtl';
  onToggleDirection?: () => void;
}

const FormSettings: React.FC<FormSettingsProps> = ({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formDirection = 'ltr',
  onToggleDirection
}) => {
  const { language } = useI18n();
  
  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="form-label">
          {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
        </label>
        <input 
          type="text" 
          className="form-input" 
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
        />
      </div>
      
      <div className="form-control">
        <label className="form-label">
          {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
        </label>
        <textarea 
          className="form-input h-24" 
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
        ></textarea>
      </div>

      {onToggleDirection && (
        <div className="form-control">
          <label className="form-label">
            {language === 'ar' ? 'اتجاه النموذج' : 'Form Direction'}
          </label>
          <div className="flex items-center space-x-2">
            <Button 
              type="button" 
              variant={formDirection === 'ltr' ? "default" : "outline"}
              size="sm"
              onClick={onToggleDirection}
              className="flex items-center gap-1"
            >
              <LayoutAlignLeft size={16} />
              {formDirection === 'ltr' ? 
                (language === 'ar' ? 'من اليسار إلى اليمين (نشط)' : 'Left to Right (Active)') : 
                (language === 'ar' ? 'من اليسار إلى اليمين' : 'Left to Right')}
            </Button>
            <Button 
              type="button" 
              variant={formDirection === 'rtl' ? "default" : "outline"}
              size="sm"
              onClick={onToggleDirection}
              className="flex items-center gap-1"
            >
              <LayoutAlignRight size={16} />
              {formDirection === 'rtl' ? 
                (language === 'ar' ? 'من اليمين إلى اليسار (نشط)' : 'Right to Left (Active)') : 
                (language === 'ar' ? 'من اليمين إلى اليسار' : 'Right to Left')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSettings;
