
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp, GripVertical, Edit } from 'lucide-react';
import { FormField } from '@/lib/form-utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

interface FormTitleEditorProps {
  field?: FormField;
  onUpdateField?: (field: FormField) => void;
  isDraggable?: boolean;
  // Props that come from FormBuilderEditor
  formTitle?: string;
  formDescription?: string;
  onFormTitleChange?: (title: string) => void;
  onFormDescriptionChange?: (desc: string) => void;
  formTitleField?: FormField;
  onAddTitleField?: () => void;
  onUpdateTitleField?: (updatedField: FormField) => void;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  field,
  onUpdateField,
  isDraggable = true,
  // Add the new props with defaults
  formTitle = '',
  formDescription = '',
  onFormTitleChange,
  onFormDescriptionChange,
  formTitleField,
  onAddTitleField,
  onUpdateTitleField
}) => {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(true);
  
  // If there's no field and no formTitleField, but onAddTitleField exists, show an "Add Title Element" button
  if (!field && !formTitleField && onAddTitleField) {
    return (
      <div className="mb-4 border p-3 rounded-md bg-white">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
          </h3>
          <Button 
            onClick={onAddTitleField}
            variant="outline" 
          >
            {language === 'ar' ? 'إضافة عنصر عنوان' : 'Add Title Element'}
          </Button>
        </div>
        <div className="mt-2">
          <Input
            value={formTitle}
            onChange={(e) => onFormTitleChange && onFormTitleChange(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
            className={language === 'ar' ? 'text-right' : ''}
          />
          <Textarea
            value={formDescription}
            onChange={(e) => onFormDescriptionChange && onFormDescriptionChange(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
            className={`mt-2 ${language === 'ar' ? 'text-right' : ''} h-20`}
          />
        </div>
      </div>
    );
  }

  // Determine the active field to use (formTitleField, field, or create a default)
  const activeField = formTitleField || field || {
    id: uuidv4(),
    type: 'form-title',
    label: formTitle,
    helpText: formDescription,
    style: {
      color: '#ffffff',
      textAlign: language === 'ar' ? 'right' : 'left',
      fontSize: '24px',
      fontWeight: 'bold',
      descriptionColor: '#ffffff',
      descriptionFontSize: '14px',
      backgroundColor: '#9b87f5'
    }
  };
  
  // Initialize local state from activeField props with safe defaults
  const [titleColor, setTitleColor] = useState(activeField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    activeField?.style?.textAlign || (language === 'ar' ? 'right' : 'left')
  );
  const [titleSize, setTitleSize] = useState(activeField?.style?.fontSize || '24px');
  const [titleWeight, setTitleWeight] = useState(activeField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(activeField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(activeField?.style?.descriptionFontSize || '14px');
  const [backgroundColor, setBackgroundColor] = useState(activeField?.style?.backgroundColor || '#9b87f5');

  // Set up sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: activeField.id,
    disabled: !isDraggable,
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : {};
  
  // Unified handler for updating style properties
  const handleUpdateStyle = (property: string, value: string) => {
    const updatedField = {
      ...activeField,
      style: {
        ...activeField.style,
        [property]: value
      }
    };
    
    // Update local state
    if (property === 'color') setTitleColor(value);
    if (property === 'textAlign') setTitleAlignment(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    if (property === 'backgroundColor') setBackgroundColor(value);
    
    // Use appropriate update handler based on what's available
    if (onUpdateTitleField) {
      onUpdateTitleField(updatedField);
    } else if (onUpdateField) {
      onUpdateField(updatedField);
    }
  };

  // Unified handler for updating title label
  const handleUpdateLabel = (value: string) => {
    const updatedField = {
      ...activeField,
      label: value
    };
    
    // Use appropriate update handler
    if (onUpdateTitleField) {
      onUpdateTitleField(updatedField);
    } else if (onFormTitleChange) {
      onFormTitleChange(value);
    } else if (onUpdateField) {
      onUpdateField(updatedField);
    }
  };

  // Unified handler for updating description
  const handleUpdateDescription = (value: string) => {
    const updatedField = {
      ...activeField,
      helpText: value
    };
    
    // Use appropriate update handler
    if (onUpdateTitleField) {
      onUpdateTitleField(updatedField);
    } else if (onFormDescriptionChange) {
      onFormDescriptionChange(value);
    } else if (onUpdateField) {
      onUpdateField(updatedField);
    }
  };

  // Get the correct title and description values
  const titleValue = activeField.label || formTitle || '';
  const descriptionValue = activeField.helpText || formDescription || '';

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`mb-4 border p-3 rounded-md bg-white ${isDragging ? 'shadow-lg' : ''}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          {isDraggable && (
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded mr-2"
            >
              <GripVertical size={16} className="text-gray-500" />
            </div>
          )}
          
          <h3 className={`text-lg font-medium flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
          </h3>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="mx-2"
          >
            <Edit size={16} />
          </Button>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="form-title" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                </Label>
                <Input
                  id="form-title"
                  value={titleValue}
                  onChange={(e) => handleUpdateLabel(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              <div>
                <Label htmlFor="form-desc" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </Label>
                <Textarea
                  id="form-desc"
                  value={descriptionValue}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  className={`${language === 'ar' ? 'text-right' : ''} h-20`}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label htmlFor="title-color" className={language === 'ar' ? 'text-right block' : ''}>
                    {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                  </Label>
                  <div className="flex mt-1">
                    <Input
                      id="title-color"
                      type="color"
                      value={titleColor}
                      onChange={(e) => handleUpdateStyle('color', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={titleColor}
                      onChange={(e) => handleUpdateStyle('color', e.target.value)}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bg-color" className={language === 'ar' ? 'text-right block' : ''}>
                    {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                  </Label>
                  <div className="flex mt-1">
                    <Input
                      id="bg-color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'خصائص العنوان' : 'Title Properties'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="title-size" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'حجم العنوان' : 'Title Size'}
                    </Label>
                    <select
                      id="title-size"
                      value={titleSize}
                      onChange={(e) => handleUpdateStyle('fontSize', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="16px">{language === 'ar' ? 'صغير' : 'Small'}</option>
                      <option value="20px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                      <option value="24px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                      <option value="32px">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="title-weight" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'سمك العنوان' : 'Title Weight'}
                    </Label>
                    <select
                      id="title-weight"
                      value={titleWeight}
                      onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
                      <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                      <option value="bold">{language === 'ar' ? 'سميك' : 'Bold'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'محاذاة العنوان' : 'Title Alignment'}
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Button
                    type="button"
                    variant={titleAlignment === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStyle('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={titleAlignment === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStyle('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={titleAlignment === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStyle('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'خصائص الوصف' : 'Description Properties'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="desc-color" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                    </Label>
                    <div className="flex mt-1">
                      <Input
                        id="desc-color"
                        type="color"
                        value={descColor}
                        onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={descColor}
                        onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                        className="ml-2 flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="desc-size" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'حجم الوصف' : 'Description Size'}
                    </Label>
                    <select
                      id="desc-size"
                      value={descSize}
                      onChange={(e) => handleUpdateStyle('descriptionFontSize', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="12px">{language === 'ar' ? 'صغير جداً' : 'Extra Small'}</option>
                      <option value="14px">{language === 'ar' ? 'صغير' : 'Small'}</option>
                      <option value="16px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                      <option value="18px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FormTitleEditor;
