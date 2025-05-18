import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, AlignCenter, AlignLeft, AlignRight, Palette } from 'lucide-react';

interface FormTitleEditorProps {
  formTitle: string;
  formDescription: string;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onAddTitleField: () => void;
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
  isDraggable?: boolean;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  formTitle,
  formDescription,
  onFormTitleChange,
  onFormDescriptionChange,
  onAddTitleField,
  formTitleField,
  onUpdateTitleField,
  isDraggable = false
}) => {
  const { language } = useI18n();
  const [backgroundColor, setBackgroundColor] = useState<string>('#9b87f5');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [descriptionColor, setDescriptionColor] = useState<string>('#ffffff');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(language === 'ar' ? 'right' : 'center');
  const [isEditing, setIsEditing] = useState(false);

  // Sortable setup for draggable functionality
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

  // Initialize values from formTitleField if it exists
  useEffect(() => {
    if (formTitleField) {
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');
      setTextColor(formTitleField.style?.color || '#ffffff');
      setDescriptionColor(formTitleField.style?.descriptionColor || '#ffffff');
      setTextAlign((formTitleField.style?.textAlign as 'left' | 'center' | 'right') || 'center');
    }
  }, [formTitleField]);

  // Handle field updates
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
      }
    };

    onUpdateTitleField(updatedField);
    setIsEditing(false);
  };

  // If we're not editing and no field exists, show simplified view
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

  // If the field exists or we're editing, show the full editor
  return (
    <div
      ref={isDraggable ? setNodeRef : undefined}
      style={isDraggable ? style : undefined}
      className={`mb-4 ${isDraggable ? 'cursor-move' : ''}`}
    >
      <Card className="p-4 border-2 border-purple-300 bg-white">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              </label>
              <Input
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                className="w-full"
                placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
              </label>
              <Textarea
                value={formDescription}
                onChange={(e) => onFormDescriptionChange(e.target.value)}
                className="w-full"
                placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                </label>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-md mr-2" 
                    style={{ backgroundColor }}
                  ></div>
                  <Input 
                    type="color" 
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-8 p-0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'لون النص' : 'Text Color'}
                </label>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-md mr-2" 
                    style={{ backgroundColor: textColor }}
                  ></div>
                  <Input 
                    type="color" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-16 h-8 p-0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                </label>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-md mr-2" 
                    style={{ backgroundColor: descriptionColor }}
                  ></div>
                  <Input 
                    type="color" 
                    value={descriptionColor}
                    onChange={(e) => setDescriptionColor(e.target.value)}
                    className="w-16 h-8 p-0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
                </label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={textAlign === 'left' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setTextAlign('left')}
                    className="p-2"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={textAlign === 'center' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setTextAlign('center')}
                    className="p-2"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={textAlign === 'right' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setTextAlign('right')}
                    className="p-2"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleFieldUpdate}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>
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
              
              <div style={{ 
                backgroundColor, 
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginTop: '0.5rem',
                textAlign,
              }}>
                <h2 style={{ color: textColor, margin: 0 }}>
                  {formTitle}
                </h2>
                {formDescription && (
                  <p style={{ color: descriptionColor, margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                    {formDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FormTitleEditor;
