
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import TitleEditorForm from '../builder/title-editor/TitleEditorForm';

interface EditFormTitleEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
}

const EditFormTitleEditor: React.FC<EditFormTitleEditorProps> = ({
  field,
  onChange
}) => {
  const { language } = useI18n();
  
  const [label, setLabel] = useState(field.label || '');
  const [helpText, setHelpText] = useState(field.helpText || '');
  const [backgroundColor, setBackgroundColor] = useState(field.style?.backgroundColor || '#9b87f5');
  const [textColor, setTextColor] = useState(field.style?.color || '#ffffff');
  const [descriptionColor, setDescriptionColor] = useState(field.style?.descriptionColor || '#ffffff');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>((field.style?.textAlign as 'left' | 'center' | 'right') || 'center');
  const [showDescription, setShowDescription] = useState(field.style?.showDescription !== false);
  
  const handleUpdate = () => {
    const updatedField = {
      ...field,
      label,
      helpText,
      style: {
        ...field.style,
        backgroundColor,
        color: textColor,
        descriptionColor,
        textAlign,
        showDescription,
      }
    };
    onChange(updatedField);
  };
  
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
      </h3>
      
      <TitleEditorForm
        title={label}
        description={helpText}
        backgroundColor={backgroundColor}
        textColor={textColor}
        descriptionColor={descriptionColor}
        textAlign={textAlign}
        showDescription={showDescription}
        onTitleChange={setLabel}
        onDescriptionChange={setHelpText}
        onBackgroundColorChange={setBackgroundColor}
        onTextColorChange={setTextColor}
        onDescriptionColorChange={setDescriptionColor}
        onTextAlignChange={setTextAlign}
        onShowDescriptionChange={setShowDescription}
        onSave={handleUpdate}
        language={language}
      />
    </Card>
  );
};

export default EditFormTitleEditor;
