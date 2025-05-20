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
  onUpdateTitleField
}) => {
  const {
    language
  } = useI18n();
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
        ...(actualField?.style || {})
      }
    };
    return defaultField;
  }, [actualField, formTitleField, formTitle, formDescription, language]);

  // Set up sortable functionality only if we have a field and isDraggable is true
  const sortableConfig = normalizedField && isDraggable ? {
    id: normalizedField.id,
    disabled: !isDraggable
  } : {
    id: 'placeholder-id',
    disabled: true
  };
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
    zIndex: isDragging ? 999 : 1
  } : {};

  // Initialize local state from field props if field exists
  const [titleColor, setTitleColor] = useState(normalizedField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(normalizedField?.style?.textAlign || (language === 'ar' ? 'right' : 'left'));
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

  // Return the JSX for the component
  return <div ref={setNodeRef} style={style} className={`relative mb-4 ${isDragging ? 'z-50' : ''}`} {...attributes}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md bg-white overflow-hidden">
        

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {isConvertMode ?
          // Convert mode - just show title/description inputs with a convert button
          <>
                <div className="space-y-2">
                  <Label htmlFor="form-title">
                    {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                  </Label>
                  <Input id="form-title" value={formTitle || ''} onChange={e => onFormTitleChange && onFormTitleChange(e.target.value)} placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">
                    {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                  </Label>
                  <Textarea id="form-description" value={formDescription || ''} onChange={e => onFormDescriptionChange && onFormDescriptionChange(e.target.value)} placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'} rows={3} />
                </div>
                <Button onClick={handleAddTitleField} variant="outline" size="sm" className="w-full mt-2">
                  <Edit className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'تحويل إلى عنوان قابل للتحرير' : 'Convert to Editable Title'}
                </Button>
              </> :
          // Edit mode - show all styling options
          <>
                <div className="space-y-2">
                  <Label htmlFor="title-text">
                    {language === 'ar' ? 'نص العنوان' : 'Title Text'}
                  </Label>
                  <Input id="title-text" value={normalizedField?.label || ''} onChange={e => handleUpdateLabel(e.target.value)} placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description-text">
                    {language === 'ar' ? 'نص الوصف' : 'Description Text'}
                  </Label>
                  <Textarea id="description-text" value={normalizedField?.helpText || ''} onChange={e => handleUpdateDescription(e.target.value)} placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label>
                    {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
                  </Label>
                  <div className="flex space-x-2">
                    <Button type="button" size="sm" variant={titleAlignment === 'left' ? 'default' : 'outline'} onClick={() => handleUpdateStyle('textAlign', 'left')} className="flex-1">
                      <AlignLeft size={16} />
                    </Button>
                    <Button type="button" size="sm" variant={titleAlignment === 'center' ? 'default' : 'outline'} onClick={() => handleUpdateStyle('textAlign', 'center')} className="flex-1">
                      <AlignCenter size={16} />
                    </Button>
                    <Button type="button" size="sm" variant={titleAlignment === 'right' ? 'default' : 'outline'} onClick={() => handleUpdateStyle('textAlign', 'right')} className="flex-1">
                      <AlignRight size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-color">
                      {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                    </Label>
                    <div className="flex">
                      <Input id="title-color" type="color" value={titleColor} onChange={e => handleUpdateStyle('color', e.target.value)} className="w-10 h-10 p-1 border rounded" />
                      <Input value={titleColor} onChange={e => handleUpdateStyle('color', e.target.value)} className="flex-1 ml-2" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title-size">
                      {language === 'ar' ? 'حجم العنوان' : 'Title Size'}
                    </Label>
                    <div className="flex items-center">
                      <Input id="title-size" type="number" min="12" max="72" value={titleSize.replace('px', '')} onChange={e => handleUpdateStyle('fontSize', `${e.target.value}px`)} className="flex-1" />
                      <span className="ml-2">px</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="desc-color">
                      {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                    </Label>
                    <div className="flex">
                      <Input id="desc-color" type="color" value={descColor} onChange={e => handleUpdateStyle('descriptionColor', e.target.value)} className="w-10 h-10 p-1 border rounded" />
                      <Input value={descColor} onChange={e => handleUpdateStyle('descriptionColor', e.target.value)} className="flex-1 ml-2" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="desc-size">
                      {language === 'ar' ? 'حجم الوصف' : 'Description Size'}
                    </Label>
                    <div className="flex items-center">
                      <Input id="desc-size" type="number" min="10" max="36" value={descSize.replace('px', '')} onChange={e => handleUpdateStyle('descriptionFontSize', `${e.target.value}px`)} className="flex-1" />
                      <span className="ml-2">px</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="background-color">
                    {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                  </Label>
                  <div className="flex">
                    <Input id="background-color" type="color" value={backgroundColor} onChange={e => handleUpdateStyle('backgroundColor', e.target.value)} className="w-10 h-10 p-1 border rounded" />
                    <Input value={backgroundColor} onChange={e => handleUpdateStyle('backgroundColor', e.target.value)} className="flex-1 ml-2" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font-weight">
                    {language === 'ar' ? 'وزن الخط' : 'Font Weight'}
                  </Label>
                  <select id="font-weight" value={titleWeight} onChange={e => handleUpdateStyle('fontWeight', e.target.value)} className="w-full border rounded p-2">
                    <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
                    <option value="bold">{language === 'ar' ? 'غامق' : 'Bold'}</option>
                    <option value="lighter">{language === 'ar' ? 'خفيف' : 'Lighter'}</option>
                  </select>
                </div>
              </>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>;
};
export default FormTitleEditor;