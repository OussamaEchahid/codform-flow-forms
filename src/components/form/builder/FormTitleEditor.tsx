
import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Palette } from 'lucide-react';
import TitleEditorForm from './title-editor/TitleEditorForm';

interface FormTitleEditorProps {
  formTitle: string;
  formDescription: string;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onAddTitleField: () => void;
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
  isDraggable?: boolean;
  formDirection?: 'ltr' | 'rtl';
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  formTitle,
  formDescription,
  onFormTitleChange,
  onFormDescriptionChange,
  onAddTitleField,
  formTitleField,
  onUpdateTitleField,
  isDraggable = false,
  formDirection
}) => {
  const { language } = useI18n();
  const [backgroundColor, setBackgroundColor] = useState<string>('#9b87f5');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [descriptionColor, setDescriptionColor] = useState<string>('#ffffff');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(language === 'ar' ? 'right' : 'center');
  const [isEditing, setIsEditing] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [titleFontSize, setTitleFontSize] = useState('24px');
  const [descriptionFontSize, setDescriptionFontSize] = useState('14px');

  // تكوين قابلية السحب
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: formTitleField?.id || 'form-title-editor',
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // تهيئة القيم من formTitleField إذا كان موجودًا
  useEffect(() => {
    if (formTitleField) {
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');
      setTextColor(formTitleField.style?.color || '#ffffff');
      setDescriptionColor(formTitleField.style?.descriptionColor || '#ffffff');
      setTextAlign((formTitleField.style?.textAlign as 'left' | 'center' | 'right') || 'center');
      setShowTitle(formTitleField.style?.showTitle !== false);
      setShowDescription(formTitleField.style?.showDescription !== false);
      setTitleFontSize(formTitleField.style?.titleFontSize || '24px');
      setDescriptionFontSize(formTitleField.style?.descriptionFontSize || '14px');
    }
  }, [formTitleField]);

  // تحديث الحقل
  const handleFieldUpdate = () => {
    if (!formTitleField) {
      onAddTitleField();
      return;
    }

    const updatedField: FormField = {
      ...formTitleField,
      label: formTitle,
      helpText: formDescription,
      style: {
        ...formTitleField.style,
        backgroundColor,
        color: textColor,
        descriptionColor,
        textAlign,
        showTitle,
        showDescription,
        titleFontSize,
        descriptionFontSize,
        formDirection
      }
    };

    onUpdateTitleField(updatedField);
    setIsEditing(false);
  };

  // إذا لم نكن في وضع التحرير ولا يوجد حقل، عرض العرض المبسط
  if (!isEditing && !formTitleField) {
    return (
      <Card className="mb-4 p-4 border-2 border-dashed border-purple-200 bg-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </h3>
            <p className="text-sm text-gray-600">
              {formTitle}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddTitleField} 
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Pencil className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'إضافة عنوان قابل للتعديل' : 'Add Editable Title'}
          </Button>
        </div>
      </Card>
    );
  }

  // إذا كان الحقل موجودًا أو نحن في وضع التحرير، عرض المحرر الكامل
  return (
    <div
      ref={isDraggable ? setNodeRef : undefined}
      style={isDraggable ? style : undefined}
      className={`mb-4 ${isDraggable ? 'cursor-move' : ''}`}
      data-field-type="form-title"
    >
      <Card className="p-4 border-2 border-purple-300 bg-white">
        {isEditing ? (
          <TitleEditorForm
            title={formTitle}
            description={formDescription}
            backgroundColor={backgroundColor}
            textColor={textColor}
            descriptionColor={descriptionColor}
            textAlign={textAlign}
            showTitle={showTitle}
            showDescription={showDescription}
            titleFontSize={titleFontSize}
            descriptionFontSize={descriptionFontSize}
            formDirection={formDirection}
            onTitleChange={onFormTitleChange}
            onDescriptionChange={onFormDescriptionChange}
            onBackgroundColorChange={setBackgroundColor}
            onTextColorChange={setTextColor}
            onDescriptionColorChange={setDescriptionColor}
            onTextAlignChange={setTextAlign}
            onShowTitleChange={setShowTitle}
            onShowDescriptionChange={setShowDescription}
            onTitleFontSizeChange={setTitleFontSize}
            onDescriptionFontSizeChange={setDescriptionFontSize}
            onSave={handleFieldUpdate}
            onCancel={() => setIsEditing(false)}
            language={language}
          />
        ) : (
          <div className="flex items-center">
            {isDraggable && (
              <div 
                {...attributes} 
                {...listeners} 
                className="p-2 cursor-grab"
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formTitle}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 mr-1 text-purple-600" />
                    <div 
                      className="w-5 h-5 rounded-full" 
                      style={{ backgroundColor }}
                    ></div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="text-purple-700 hover:bg-purple-50"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FormTitleEditor;
