
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
  // Add the new props that are being passed from FormBuilderEditor
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
  // Add the new props with default values
  formTitle,
  formDescription,
  onFormTitleChange,
  onFormDescriptionChange,
  formTitleField,
  onAddTitleField,
  onUpdateTitleField,
}) => {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(true);
  
  // Use either directly provided field or formTitleField from parent
  const actualField = field || formTitleField;
  
  // Choose the appropriate update handler
  const handleFieldUpdate = onUpdateField || onUpdateTitleField;
  
  // Ensure field is properly initialized with default values
  const normalizedField = React.useMemo(() => {
    // If no field is available, return null - this handles the case where we're showing just the title/description inputs
    if (!actualField && !formTitleField) {
      return null;
    }
    
    const defaultField: FormField = {
      id: actualField?.id || uuidv4(),
      type: 'form-title',
      label: actualField?.label || formTitle || (language === 'ar' ? 'عنوان النموذج' : 'Form Title'),
      helpText: actualField?.helpText || formDescription || '',
      style: {
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'left',
        fontSize: '24px',
        fontWeight: 'bold',
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px',
        backgroundColor: '#9b87f5',
        ...(actualField?.style || {}),
      }
    };
    
    return defaultField;
  }, [actualField, formTitleField, formTitle, formDescription, language]);
  
  // Set up sortable functionality only if we have a field and isDraggable is true
  const sortableConfig = normalizedField && isDraggable ? {
    id: normalizedField.id,
    disabled: !isDraggable,
  } : { id: 'placeholder-id', disabled: true };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable(sortableConfig);

  const style = isDraggable && normalizedField ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : {};
  
  // Initialize local state from field props if field exists
  const [titleColor, setTitleColor] = useState(normalizedField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    normalizedField?.style?.textAlign || (language === 'ar' ? 'right' : 'left')
  );
  const [titleSize, setTitleSize] = useState(normalizedField?.style?.fontSize || '24px');
  const [titleWeight, setTitleWeight] = useState(normalizedField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(normalizedField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(normalizedField?.style?.descriptionFontSize || '14px');
  const [backgroundColor, setBackgroundColor] = useState(normalizedField?.style?.backgroundColor || '#9b87f5');

  // Handler for updating style properties when field exists
  const handleUpdateStyle = (property: string, value: string) => {
    if (!normalizedField || !handleFieldUpdate) return;
    
    const updatedField = {
      ...normalizedField,
      style: {
        ...normalizedField.style,
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
    
    // Update the field in the parent component
    handleFieldUpdate(updatedField);
  };

  // Handler for updating title label
  const handleUpdateLabel = (value: string) => {
    if (!normalizedField || !handleFieldUpdate) {
      // If no field exists but we have a title update handler, use that instead
      if (onFormTitleChange) {
        onFormTitleChange(value);
      }
      return;
    }
    
    const updatedField = {
      ...normalizedField,
      label: value
    };
    
    handleFieldUpdate(updatedField);
  };

  // Handler for updating description
  const handleUpdateDescription = (value: string) => {
    if (!normalizedField || !handleFieldUpdate) {
      // If no field exists but we have a description update handler, use that instead
      if (onFormDescriptionChange) {
        onFormDescriptionChange(value);
      }
      return;
    }
    
    const updatedField = {
      ...normalizedField,
      helpText: value
    };
    
    handleFieldUpdate(updatedField);
  };

  // Function to add a title field if one doesn't exist
  const handleAddTitleField = () => {
    if (onAddTitleField) {
      onAddTitleField();
    }
  };

  // Determine if we're in "convert to editable" mode (no field exists)
  const isConvertMode = !normalizedField;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`mb-4 border p-3 rounded-md bg-white ${isDragging ? 'shadow-lg' : ''}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          {isDraggable && normalizedField && (
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
          
          {isConvertMode && onAddTitleField && (
            <Button 
              onClick={handleAddTitleField}
              variant="outline" 
              size="sm" 
              className="mx-2"
            >
              {language === 'ar' ? 'تحويل إلى قابل للتعديل' : 'Make Editable'}
            </Button>
          )}
          
          {normalizedField && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mx-2"
            >
              <Edit size={16} />
            </Button>
          )}
          
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
                  value={(normalizedField?.label || formTitle) || ''}
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
                  value={(normalizedField?.helpText || formDescription) || ''}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  className={`${language === 'ar' ? 'text-right' : ''} h-20`}
                />
              </div>
            </div>

            {normalizedField && (
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
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FormTitleEditor;
