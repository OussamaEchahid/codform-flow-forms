
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface FormSettingsProps {
  formTitle: string;
  setFormTitle: (title: string) => void;
  formDescription: string;
  setFormDescription: (description: string) => void;
}

const FormSettings: React.FC<FormSettingsProps> = ({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription
}) => {
  const { language } = useI18n();
  
  return (
    <div className="space-y-4 text-right">
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
    </div>
  );
};

export default FormSettings;
