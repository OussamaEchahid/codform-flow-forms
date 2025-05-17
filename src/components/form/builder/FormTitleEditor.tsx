
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
import { Switch } from '@/components/ui/switch';

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
  const {
    language
  } = useI18n();
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    formTitleField?.style?.textAlign || 'center');
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '1.5rem');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '0.875rem');
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');
  const [showDescription, setShowDescription] = useState(formTitleField?.style?.showDescription !== false);
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
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });
  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  } : {};

  // Update local state when formTitleField changes
  useEffect(() => {
    if (formTitleField) {
      // Important: Use field values if they exist, otherwise use defaults
      setTitleColor(formTitleField.style?.color || '#ffffff');
      setTitleAlignment(formTitleField.style?.textAlign || 'center');
      setTitleSize(formTitleField.style?.fontSize || '1.5rem');
      setTitleWeight(formTitleField.style?.fontWeight || 'bold');
      setDescColor(formTitleField.style?.descriptionColor || '#ffffff');
      setDescSize(formTitleField.style?.descriptionFontSize || '0.875rem');
      setShowDescription(formTitleField.style?.showDescription !== false);

      // Critical: Use field's backgroundColor if it exists, don't overwrite with default
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');

      // Log state for debugging
      console.log("FormTitleEditor initialized with background color:", formTitleField.style?.backgroundColor || '#9b87f5');
      console.log("FormTitleEditor showDescription:", formTitleField.style?.showDescription !== false);
    }
  }, [formTitleField]);

  // Enhanced update style function that ensures immediate updates
  const handleUpdateStyle = (property: string, value: string | boolean) => {
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
    if (property === 'color') setTitleColor(value as string);
    if (property === 'textAlign') setTitleAlignment(value as string);
    if (property === 'fontSize') setTitleSize(value as string);
    if (property === 'fontWeight') setTitleWeight(value as string);
    if (property === 'descriptionColor') setDescColor(value as string);
    if (property === 'descriptionFontSize') setDescSize(value as string);
    if (property === 'backgroundColor') {
      setBackgroundColor(value as string);
      console.log(`Background color updated to: ${value}`);
    }
    if (property === 'showDescription') {
      setShowDescription(value as boolean);
      console.log(`Show description updated to: ${value}`);
    }

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

  // Return the JSX for the component
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`form-title-editor bg-white rounded-lg border border-border shadow-sm mb-4 ${isDragging ? 'z-50' : ''}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isDraggable && formTitleField && (
              <div 
                className="cursor-grab flex items-center text-gray-400 hover:text-gray-600" 
                {...attributes} 
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <h3 className="text-sm font-medium">
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="form-title" className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              </Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => handleUpdateLabel(e.target.value)}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
              />
            </div>
            
            {/* Show Description Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-description" className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'إظهار الوصف' : 'Show Description'}
              </Label>
              <Switch
                id="show-description"
                checked={showDescription}
                onCheckedChange={(checked) => handleUpdateStyle('showDescription', checked)}
              />
            </div>
            
            {/* Description Input - Only shown if showDescription is true */}
            {showDescription && (
              <div className="space-y-2">
                <Label htmlFor="form-description" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  rows={3}
                />
              </div>
            )}
            
            {/* Style Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                {language === 'ar' ? 'خيارات التنسيق' : 'Style Options'}
              </h4>
              
              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bg-color" className="text-xs">
                  {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              
              {/* Title Color */}
              <div className="space-y-2">
                <Label htmlFor="title-color" className="text-xs">
                  {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="title-color"
                    type="color"
                    value={titleColor}
                    onChange={(e) => handleUpdateStyle('color', e.target.value)}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    type="text"
                    value={titleColor}
                    onChange={(e) => handleUpdateStyle('color', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
              
              {/* Title Size */}
              <div className="space-y-2">
                <Label htmlFor="title-size" className="text-xs">
                  {language === 'ar' ? 'حجم العنوان' : 'Title Size'}
                </Label>
                <Input
                  id="title-size"
                  type="text"
                  value={titleSize}
                  onChange={(e) => handleUpdateStyle('fontSize', e.target.value)}
                  className="h-8"
                />
              </div>
              
              {/* Title Weight */}
              <div className="space-y-2">
                <Label htmlFor="title-weight" className="text-xs">
                  {language === 'ar' ? 'سمك الخط' : 'Font Weight'}
                </Label>
                <select
                  id="title-weight"
                  value={titleWeight}
                  onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
              
              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs">
                  {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={titleAlignment === 'left' ? "default" : "outline"}
                    size="sm"
                    className={`h-8 flex-1 ${titleAlignment === 'left' ? 'bg-primary/10' : ''}`}
                    onClick={() => handleUpdateStyle('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={titleAlignment === 'center' ? "default" : "outline"}
                    size="sm"
                    className={`h-8 flex-1 ${titleAlignment === 'center' ? 'bg-primary/10' : ''}`}
                    onClick={() => handleUpdateStyle('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={titleAlignment === 'right' ? "default" : "outline"}
                    size="sm"
                    className={`h-8 flex-1 ${titleAlignment === 'right' ? 'bg-primary/10' : ''}`}
                    onClick={() => handleUpdateStyle('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Description Options - Only shown if showDescription is true */}
              {showDescription && (
                <>
                  {/* Description Color */}
                  <div className="space-y-2">
                    <Label htmlFor="desc-color" className="text-xs">
                      {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="desc-color"
                        type="color"
                        value={descColor}
                        onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                        className="h-8 w-12 p-1"
                      />
                      <Input
                        type="text"
                        value={descColor}
                        onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  {/* Description Size */}
                  <div className="space-y-2">
                    <Label htmlFor="desc-size" className="text-xs">
                      {language === 'ar' ? 'حجم الوصف' : 'Description Size'}
                    </Label>
                    <Input
                      id="desc-size"
                      type="text"
                      value={descSize}
                      onChange={(e) => handleUpdateStyle('descriptionFontSize', e.target.value)}
                      className="h-8"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Add title field button */}
            {!formTitleField && (
              <Button 
                type="button" 
                onClick={onAddTitleField}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إضافة حقل عنوان' : 'Add Title Field'}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FormTitleEditor;
