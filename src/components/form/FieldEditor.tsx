
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import EditorContainer from './editor/EditorContainer';
import TextFieldEditor from './editor/TextFieldEditor';
import OptionFieldEditor from './editor/OptionFieldEditor';
import ImageFieldEditor from './editor/ImageFieldEditor';
import GenericFieldEditor from './editor/GenericFieldEditor';
import WhatsAppFieldEditor from './editor/WhatsAppFieldEditor';

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const FieldEditor = ({ field, onSave, onClose }: FieldEditorProps) => {
  const { language } = useI18n();
  
  const renderEditorByType = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return <TextFieldEditor field={field} onSave={onSave} onClose={onClose} />;
      
      case 'select':
      case 'radio':
      case 'checkbox':
        return (
          <OptionFieldEditor 
            field={field} 
            onChange={onSave} // Pass onSave as onChange to match the component's expected props
            onSave={onSave} 
            onClose={onClose} 
          />
        );
      
      case 'whatsapp':
        return (
          <WhatsAppFieldEditor
            field={field}
            onSave={onSave}
            onCancel={onClose}
          />
        );
        
      case 'image':
        return <ImageFieldEditor field={field} onSave={onSave} onClose={onClose} />;
        
      default:
        return <GenericFieldEditor field={field} onSave={onSave} onClose={onClose} />;
    }
  };

  const editorTitle = language === 'ar' 
    ? `تعديل حقل ${field.label || field.type}` 
    : `Edit ${field.label || field.type} Field`;

  return (
    <EditorContainer title={editorTitle} onClose={onClose}>
      {renderEditorByType()}
    </EditorContainer>
  );
};

export default FieldEditor;
