import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import WhatsAppFieldEditor from './editor/WhatsAppFieldEditor';
import ImageFieldEditor from './editor/ImageFieldEditor';
import TextFieldEditor from './editor/TextFieldEditor';
import SubmitButtonEditor from './editor/SubmitButtonEditor';
import CountdownFieldEditor from './editor/CountdownFieldEditor';

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const FieldEditor = ({ field, onSave, onClose }: FieldEditorProps) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = useState<FormField>(field);

  const handleSaveField = (updatedField: FormField) => {
    onSave(updatedField);
    onClose();
  };

  const renderEditorByType = () => {
    switch (currentField.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return (
          <TextFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
      
      case 'submit':
        return (
          <SubmitButtonEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
      
      case 'image':
        console.log('🚀 Opening IMAGE field editor for field:', currentField);
        return (
          <ImageFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
      
      case 'countdown':
        return (
          <CountdownFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
      
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            {language === 'ar' ? 'نوع حقل غير مدعوم' : 'Unsupported field type'}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {renderEditorByType()}
      </div>
    </div>
  );
};

export default FieldEditor;