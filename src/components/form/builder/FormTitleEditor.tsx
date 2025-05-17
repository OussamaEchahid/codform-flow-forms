
import React, { useState, useEffect } from 'react';
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
  isDraggable = true
}) => {
  const { language } = useI18n();
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    // Force center alignment for titles (to match store behavior)
    'center'
  );
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '1.5rem');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '0.875rem');
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');
  const [isOpen, setIsOpen] = useState(true);

  // Set up sortable functionality if the component is draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: formTitleField?.id || 'title-editor',
    disabled: !isDraggable || !formTitleField,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : {};

  // Update local state when formTitleField changes
  useEffect(() => {
    if (formTitleField) {
      // Important: Use field values if they exist, otherwise use defaults
      setTitleColor(formTitleField.style?.color || '#ffffff');
      setTitleAlignment('center'); // Always center for consistency with store
      setTitleSize(formTitleField.style?.fontSize || '1.5rem');
      setTitleWeight(formTitleField.style?.fontWeight || 'bold');
      setDescColor(formTitleField.style?.descriptionColor || '#ffffff');
      setDescSize(formTitleField.style?.descriptionFontSize || '0.875rem');
      
      // Critical: Use field's backgroundColor if it exists, don't overwrite with default
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');
      
      // Log state for debugging
      console.log("FormTitleEditor initialized with background color:", 
                  formTitleField.style?.backgroundColor || '#9b87f5');
    }
  }, [formTitleField]);

  // Enhanced update style function that ensures immediate updates
  const handleUpdateStyle = (property: string, value: string) => {
    if (!formTitleField) return;
    
    // Create a deep copy of the field to avoid mutation issues
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    
    // Ensure style object exists
    if (!updatedField.style) {
      updatedField.style = {};
    }
    
    // Update the style property
    updatedField.style[property] = value;
    
    // Update local state for UI reflection
    if (property === 'color') setTitleColor(value);
    if (property === 'textAlign') setTitleAlignment(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    if (property === 'backgroundColor') {
      setBackgroundColor(value);
      console.log(`Background color updated to: ${value}`);
    }
    
    // Force textAlign to center for consistency with store display
    updatedField.style.textAlign = 'center';
    
    // Update parent component with new field data
    onUpdateTitleField(updatedField);
    
    // Log the update to help with debugging
    console.log(`Updated title field style: ${property} = ${value}`, updatedField);
  };

  const handleUpdateLabel = (value: string) => {
    if (!formTitleField) {
      onFormTitleChange(value);
      return;
    }
    
    // Create a deep copy to avoid mutation issues
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    updatedField.label = value;
    
    // Update parent component
    onUpdateTitleField(updatedField);
    onFormTitleChange(value);
    
    console.log(`Updated title field label: ${value}`);
  };

  const handleUpdateDescription = (value: string) => {
    if (!formTitleField) {
      onFormDescriptionChange(value);
      return;
    }
    
    // Create a deep copy to avoid mutation issues
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    updatedField.helpText = value;
    
    // Update parent component
    onUpdateTitleField(updatedField);
    onFormDescriptionChange(value);
    
    console.log(`Updated title field description: ${value}`);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`mb-4 border p-3 rounded-md bg-white ${isDragging ? 'shadow-lg' : ''}`}
      data-title-editor="true"
      data-bg-color={backgroundColor}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          {isDraggable && formTitleField && (
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
                  value={formTitleField ? formTitleField.label : formTitle}
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
                  value={formTitleField ? formTitleField.helpText : formDescription}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  className={`${language === 'ar' ? 'text-right' : ''} h-20`}
                />
              </div>
            </div>

            {!formTitleField ? (
              <Button 
                onClick={onAddTitleField}
                className="w-full mt-2"
              >
                {language === 'ar' ? 'تحويل العنوان إلى قابل للتعديل' : 'Convert to Editable Title'}
              </Button>
            ) : (
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
                        data-bg-color-picker="true"
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
                        <option value="1rem">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="1.25rem">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="1.5rem">{language === 'ar' ? 'كبير' : 'Large'}</option>
                        <option value="2rem">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
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
                      disabled={true} 
                      className="opacity-50"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={'default'}
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
                      disabled={true}
                      className="opacity-50"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar' 
                      ? 'محاذاة العنوان لليسار واليمين معطلة للحفاظ على التنسيق المتناسق في المتجر'
                      : 'Left and right alignment disabled for consistent formatting in the store'}
                  </p>
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
                        <option value="0.75rem">{language === 'ar' ? 'صغير جداً' : 'Extra Small'}</option>
                        <option value="0.875rem">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="1rem">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="1.125rem">{language === 'ar' ? 'كبير' : 'Large'}</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="desc-weight" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'سمك الوصف' : 'Description Weight'}
                      </Label>
                      <select
                        id="desc-weight"
                        value="normal"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        disabled
                      >
                        <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
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
