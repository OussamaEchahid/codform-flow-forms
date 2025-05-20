
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { formTemplates } from '@/lib/form-utils';

interface FormTemplatesDialogProps {
  open: boolean;
  onSelect: (templateId: number) => void;
  onClose: () => void;
}

const FormTemplatesDialog: React.FC<FormTemplatesDialogProps> = ({
  open,
  onSelect,
  onClose,
}) => {
  const { language } = useI18n();

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex justify-between items-center">
          <span>{language === 'ar' ? 'قوالب النماذج الجاهزة' : 'Form Templates'}</span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {formTemplates.map(template => {
          // Calculate total fields and steps from the template data
          const totalFields = template.data.reduce((sum, step) => sum + step.fields.length, 0);
          const totalSteps = template.data.length;
          
          return (
            <div
              key={template.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelect(template.id)}
            >
              <div
                className="p-4 text-white font-bold"
                style={{ backgroundColor: template.primaryColor || '#9b87f5' }}
              >
                {template.title}
              </div>
              <div className="p-4">
                <p className="text-gray-600 mb-2">{template.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{totalFields} {language === 'ar' ? 'حقل' : 'fields'}</span>
                  <span>{totalSteps} {language === 'ar' ? 'خطوة' : 'steps'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إغلاق' : 'Close'}
        </Button>
      </div>
    </DialogContent>
  );
};

export default FormTemplatesDialog;
