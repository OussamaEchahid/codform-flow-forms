
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { AlertCircle } from 'lucide-react';
import TextFieldEditor from './TextFieldEditor';

interface GenericFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const GenericFieldEditor = ({ field, onSave, onClose }: GenericFieldEditorProps) => {
  const { language } = useI18n();

  return (
    <div>
      <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-md">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <p>
          {language === 'ar' 
            ? 'لا يوجد محرر متخصص لهذا النوع من الحقول' 
            : 'No specialized editor available for this field type'}
        </p>
      </div>
      <TextFieldEditor field={field} onSave={onSave} onClose={onClose} />
    </div>
  );
};

export default GenericFieldEditor;
