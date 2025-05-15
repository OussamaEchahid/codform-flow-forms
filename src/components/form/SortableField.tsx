
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const { language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedField, setEditedField] = useState<FormField>(field);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: field.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // When expanding, automatically set to edit mode
    if (!isExpanded) {
      setIsEditing(true);
      setEditedField({...field});
    } else {
      setIsEditing(false);
    }
  };

  const handleFieldChange = (property: string, value: any) => {
    setEditedField(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleStyleChange = (property: string, value: any) => {
    setEditedField(prev => ({
      ...prev,
      style: {
        ...prev.style || {},
        [property]: value
      }
    }));
  };

  const handleSaveChanges = () => {
    // This would typically make an API call or update state in a parent component
    // For now, we'll just close the editing mode
    setIsEditing(false);
  };

  // Array of font family options
  const fontFamilies = [
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Tajawal', label: 'Tajawal' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Open Sans', label: 'Open Sans' },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg mb-3 overflow-hidden",
        isDragging ? "shadow-lg" : ""
      )}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={field.id} className="border-0">
          <div className="flex justify-between items-center p-3">
            <div className="flex gap-2 items-center">
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded"
              >
                <GripVertical size={16} className="text-gray-500" />
              </div>
            </div>
            
            <div className={`flex-1 ${language === 'ar' ? 'text-right mr-2' : 'text-left ml-2'}`}>
              <div className="font-medium">{field.label || (language === 'ar' ? "حقل بدون عنوان" : "Untitled field")}</div>
              <div className="text-sm text-gray-500">
                {field.required ? (language === 'ar' ? 'مطلوب' : 'Required') : (language === 'ar' ? 'اختياري' : 'Optional')} | {field.type}
              </div>
            </div>
            
            <AccordionTrigger onClick={toggleExpand} className="py-0">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </AccordionTrigger>
          </div>
          
          <AccordionContent className="border-t pt-2">
            {isEditing ? (
              <div className="p-3 space-y-4">
                {/* Basic Field Properties Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-2">{language === 'ar' ? 'الإعدادات الأساسية' : 'Basic Settings'}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`field-label-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'نص التسمية' : 'Label Text'}
                    </Label>
                    <Input
                      id={`field-label-${field.id}`}
                      value={editedField.label || ''}
                      onChange={(e) => handleFieldChange('label', e.target.value)}
                      className={language === 'ar' ? 'text-right' : ''}
                    />
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox 
                      id={`field-show-label-${field.id}`}
                      checked={editedField.style?.showLabel !== false}
                      onCheckedChange={(checked) => handleStyleChange('showLabel', checked)}
                    />
                    <Label 
                      htmlFor={`field-show-label-${field.id}`}
                      className={language === 'ar' ? 'text-right' : ''}
                    >
                      {language === 'ar' ? 'إظهار التسمية' : 'Show Label'}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-placeholder-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'النص التوضيحي' : 'Placeholder'}
                    </Label>
                    <Input
                      id={`field-placeholder-${field.id}`}
                      value={editedField.placeholder || ''}
                      onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                      className={language === 'ar' ? 'text-right' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-input-for-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'حقل الإدخال المرتبط' : 'Input for'}
                    </Label>
                    <Input
                      id={`field-input-for-${field.id}`}
                      value={editedField.inputFor || ''}
                      onChange={(e) => handleFieldChange('inputFor', e.target.value)}
                      className={language === 'ar' ? 'text-right' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-error-message-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'رسالة الخطأ' : 'Error Message'}
                    </Label>
                    <Input
                      id={`field-error-message-${field.id}`}
                      value={editedField.errorMessage || ''}
                      onChange={(e) => handleFieldChange('errorMessage', e.target.value)}
                      className={language === 'ar' ? 'text-right' : ''}
                      placeholder={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox 
                      id={`field-required-${field.id}`} 
                      checked={editedField.required || false}
                      onCheckedChange={(checked) => handleFieldChange('required', checked)}
                    />
                    <Label 
                      htmlFor={`field-required-${field.id}`}
                      className={language === 'ar' ? 'text-right' : ''}
                    >
                      {language === 'ar' ? 'حقل مطلوب' : 'Required field'}
                    </Label>
                  </div>
                </div>

                {/* Label Styling */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium text-sm border-b pb-2">{language === 'ar' ? 'تنسيق التسمية' : 'Label Styling'}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`field-label-color-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون التسمية' : 'Label Color'}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id={`field-label-color-${field.id}`}
                        type="color"
                        value={editedField.style?.labelColor || '#000000'}
                        onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={editedField.style?.labelColor || '#000000'}
                        onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'حجم خط التسمية' : 'Label Text Size'}</Label>
                      <span className="text-sm">{editedField.style?.labelFontSize || '1'}</span>
                    </div>
                    <Slider
                      defaultValue={[parseFloat(editedField.style?.labelFontSize || '1')]}
                      min={0}
                      max={3}
                      step={0.1}
                      onValueChange={(value) => handleStyleChange('labelFontSize', value[0].toString())}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'وزن خط التسمية' : 'Label Weight'}</Label>
                      <span className="text-sm">{editedField.style?.labelFontWeight || '400'}</span>
                    </div>
                    <Slider
                      defaultValue={[parseInt(editedField.style?.labelFontWeight || '400')]}
                      min={100}
                      max={900}
                      step={100}
                      onValueChange={(value) => handleStyleChange('labelFontWeight', value[0].toString())}
                    />
                  </div>
                </div>

                {/* Input Styling */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium text-sm border-b pb-2">{language === 'ar' ? 'تنسيق الحقل' : 'Field Styling'}</h3>

                  <div className="space-y-2">
                    <Label htmlFor={`field-font-family-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'نوع الخط' : 'Font Family'}
                    </Label>
                    <Select
                      value={editedField.style?.fontFamily || 'sans-serif'}
                      onValueChange={(value) => handleStyleChange('fontFamily', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'ar' ? 'اختر نوع الخط' : 'Select font family'} />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-text-color-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون النص' : 'Text Color'}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id={`field-text-color-${field.id}`}
                        type="color"
                        value={editedField.style?.color || '#000000'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={editedField.style?.color || '#000000'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
                      <span className="text-sm">{editedField.style?.fontSize || '1.1'}</span>
                    </div>
                    <Slider
                      defaultValue={[parseFloat(editedField.style?.fontSize || '1.1')]}
                      min={0}
                      max={3}
                      step={0.1}
                      onValueChange={(value) => handleStyleChange('fontSize', value[0].toString())}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'وزن الخط' : 'Text Weight'}</Label>
                      <span className="text-sm">{editedField.style?.fontWeight || '400'}</span>
                    </div>
                    <Slider
                      defaultValue={[parseInt(editedField.style?.fontWeight || '400')]}
                      min={100}
                      max={900}
                      step={100}
                      onValueChange={(value) => handleStyleChange('fontWeight', value[0].toString())}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-bg-color-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id={`field-bg-color-${field.id}`}
                        type="color"
                        value={editedField.style?.backgroundColor || '#fafafa'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={editedField.style?.backgroundColor || '#fafafa'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Border and Spacing Settings */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium text-sm border-b pb-2">{language === 'ar' ? 'إعدادات الحدود والمسافات' : 'Border & Spacing'}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'المسافة العمودية' : 'Padding-Y'}</Label>
                      <span className="text-sm">{editedField.style?.paddingY || '8'}px</span>
                    </div>
                    <Slider
                      defaultValue={[parseInt(editedField.style?.paddingY || '8')]}
                      min={0}
                      max={50}
                      step={1}
                      onValueChange={(value) => handleStyleChange('paddingY', value[0].toString())}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-border-color-${field.id}`} className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون الحدود' : 'Border Color'}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id={`field-border-color-${field.id}`}
                        type="color"
                        value={editedField.style?.borderColor || '#f0f0f0'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="w-12 h-12 p-1"
                      />
                      <Input
                        value={editedField.style?.borderColor || '#f0f0f0'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'سماكة الحدود' : 'Border Width'}</Label>
                      <span className="text-sm">{editedField.style?.borderWidth || '1'}px</span>
                    </div>
                    <Slider
                      defaultValue={[parseInt(editedField.style?.borderWidth || '1')]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleStyleChange('borderWidth', value[0].toString())}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'استدارة الحدود' : 'Border Radius'}</Label>
                      <span className="text-sm">{editedField.style?.borderRadius || '6'}px</span>
                    </div>
                    <Slider
                      defaultValue={[parseInt(editedField.style?.borderRadius || '6')]}
                      min={0}
                      max={30}
                      step={1}
                      onValueChange={(value) => handleStyleChange('borderRadius', value[0].toString())}
                    />
                  </div>
                </div>

                {/* Icon Settings */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-medium text-sm border-b pb-2">{language === 'ar' ? 'إعدادات الأيقونة' : 'Icon Settings'}</h3>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox 
                      id={`field-show-icon-${field.id}`} 
                      checked={editedField.style?.showIcon || false}
                      onCheckedChange={(checked) => handleStyleChange('showIcon', checked)}
                    />
                    <Label 
                      htmlFor={`field-show-icon-${field.id}`}
                      className={language === 'ar' ? 'text-right' : ''}
                    >
                      {language === 'ar' ? 'إظهار الأيقونة' : 'Show Icon'}
                    </Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSaveChanges}
                  >
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <div className="flex flex-col gap-3 mb-3">
                  <h4 className="font-medium text-sm">
                    {language === 'ar' ? 'إعدادات الحقل' : 'Field Settings'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                      <span className="text-gray-500">{language === 'ar' ? 'النوع:' : 'Type:'}</span> {field.type}
                    </div>
                    <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                      <span className="text-gray-500">{language === 'ar' ? 'مطلوب:' : 'Required:'}</span> {field.required ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
                    </div>
                  </div>
                </div>
                
                {field.placeholder && (
                  <div className="mb-3 text-sm">
                    <span className="font-medium">{language === 'ar' ? 'النص التوضيحي:' : 'Placeholder:'}</span> {field.placeholder}
                  </div>
                )}
                
                {field.helpText && (
                  <div className="mb-3 text-sm">
                    <span className="font-medium">{language === 'ar' ? 'النص المساعد:' : 'Help Text:'}</span> {field.helpText}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1"
                  >
                    <Edit size={16} />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onDuplicate}
                    className="flex items-center gap-1"
                  >
                    <Copy size={14} />
                    {language === 'ar' ? 'نسخ' : 'Duplicate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onDelete}
                    className="flex items-center gap-1 hover:text-red-500 hover:border-red-200"
                  >
                    <Trash size={14} />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SortableField;
