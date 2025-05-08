
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface FormMetadataEditorProps {
  title: string;
  description: string;
  submitButtonText: string;
  onUpdateMeta: (field: 'title' | 'description' | 'submitButtonText', value: string) => void;
}

const FormMetadataEditor: React.FC<FormMetadataEditorProps> = ({
  title,
  description,
  submitButtonText,
  onUpdateMeta
}) => {
  const { language } = useI18n();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'معلومات النموذج الأساسية' : 'Form Basic Information'}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateMeta('title', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
          </label>
          <textarea
            value={description}
            onChange={(e) => onUpdateMeta('description', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
            rows={3}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'نص زر الإرسال' : 'Submit Button Text'}
          </label>
          <input
            type="text"
            value={submitButtonText}
            onChange={(e) => onUpdateMeta('submitButtonText', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder={language === 'ar' ? 'أدخل نص زر الإرسال' : 'Enter submit button text'}
          />
        </div>
      </div>
    </div>
  );
};

export default FormMetadataEditor;
