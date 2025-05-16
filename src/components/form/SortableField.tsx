
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { User, Phone, MapPin, Mail, MessageSquare, CheckSquare, CircleCheck, Image, FileText } from 'lucide-react';
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
import { toast } from 'sonner';

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
    // Update the parent component with the edited field
    onEdit();
    // Apply the changes by updating the original field object
    Object.assign(field, editedField);
    setIsEditing(false);
    toast.success(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
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
  
  // Available icons for fields
  const fieldIcons = [
    { value: 'user', label: language === 'ar' ? 'مستخدم' : 'User', component: User },
    { value: 'phone', label: language === 'ar' ? 'هاتف' : 'Phone', component: Phone },
    { value: 'map-pin', label: language === 'ar' ? 'موقع' : 'Location', component: MapPin },
    { value: 'mail', label: language === 'ar' ? 'بريد' : 'Email', component: Mail },
    { value: 'message-square', label: language === 'ar' ? 'رسالة' : 'Message', component: MessageSquare },
    { value: 'check-square', label: language === 'ar' ? 'تحقق' : 'Check', component: CheckSquare },
    { value: 'circle-check', label: language === 'ar' ? 'تحقق دائري' : 'Circle Check', component: CircleCheck },
    { value: 'image', label: language === 'ar' ? 'صورة' : 'Image', component: Image },
    { value: 'file-text', label: language === 'ar' ? 'ملف نصي' : 'Text File', component: FileText },
    { value: '', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null }
  ];

  // Function to render the selected icon
  const renderSelectedIcon = () => {
    const selectedIcon = fieldIcons.find(icon => icon.value === editedField.icon);
    if (selectedIcon && selectedIcon.component) {
      const IconComponent = selectedIcon.component;
      return <IconComponent size={18} className="mr-2" />;
    }
    return null;
  };

  // Simplified editor UI with two columns layout
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
              <div className="font-medium flex items-center">
                {field.icon && (
                  <span className="mr-2">
                    {(() => {
                      const iconInfo = fieldIcons.find(icon => icon.value === field.icon);
                      if (iconInfo && iconInfo.component) {
                        const IconComponent = iconInfo.component;
                        return <IconComponent size={16} className="text-gray-500" />;
                      }
                      return null;
                    })()}
                  </span>
                )}
                {field.label || (language === 'ar' ? "حقل بدون عنوان" : "Untitled field")}
              </div>
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
              <div className="p-3">
                <h2 className="font-medium text-sm border-b pb-2 mb-4">{language === 'ar' ? 'إعدادات الحقل' : 'Field Settings'}</h2>
                
                {/* Basic Field Configuration in two columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="space-y-4">
                    {/* Placeholder */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-placeholder-${field.id}`}>
                        {language === 'ar' ? 'مكان النص' : 'Placeholder'}
                      </Label>
                      <Input
                        id={`field-placeholder-${field.id}`}
                        value={editedField.placeholder || ''}
                        onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </div>
                    
                    {/* Required field */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch 
                        id={`field-required-${field.id}`} 
                        checked={editedField.required || false}
                        onCheckedChange={(checked) => handleFieldChange('required', checked)}
                      />
                      <Label 
                        htmlFor={`field-required-${field.id}`}
                        className={language === 'ar' ? 'text-right' : ''}
                      >
                        {language === 'ar' ? 'مطلوب' : 'Required'}
                      </Label>
                    </div>
                    
                    {/* Label color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون التسمية' : 'Label color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.labelColor || '#000000'}
                          onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                          className="w-9 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.labelColor || '#000000'}
                          onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {/* Font family */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'نوع الخط' : 'Font family'}</Label>
                      <Select
                        value={editedField.style?.fontFamily || 'sans-serif'}
                        onValueChange={(value) => handleStyleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع الخط' : 'Select font family'} />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map(font => (
                            <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Icon selection */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'أيقونة الحقل' : 'Field icon'}</Label>
                      <Select
                        value={editedField.icon || ''}
                        onValueChange={(value) => handleFieldChange('icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة' : 'Select icon'}>
                            <div className="flex items-center">
                              {renderSelectedIcon()}
                              <span>
                                {editedField.icon ? fieldIcons.find(icon => icon.value === editedField.icon)?.label : 
                                  (language === 'ar' ? 'اختر أيقونة' : 'Select icon')}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {fieldIcons.map(icon => (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center">
                                {icon.component && <icon.component size={16} className="mr-2" />}
                                {icon.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Text color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون النص' : 'Text color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.color || '#000000'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="w-9 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.color || '#000000'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {/* Font size */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                        <span className="text-sm">{editedField.style?.fontSize || '1.1'}</span>
                      </div>
                      <Slider
                        defaultValue={[parseFloat(editedField.style?.fontSize || '1.1')]}
                        value={[parseFloat(editedField.style?.fontSize || '1.1')]}
                        min={0}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => handleStyleChange('fontSize', value[0].toString())}
                      />
                    </div>
                    
                    {/* Padding-Y */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'المسافة العمودية' : 'Padding-Y'}</Label>
                        <span className="text-sm">{editedField.style?.paddingY || '8'}px</span>
                      </div>
                      <Slider
                        defaultValue={[parseInt(editedField.style?.paddingY || '8')]}
                        value={[parseInt(editedField.style?.paddingY || '8')]}
                        min={0}
                        max={50}
                        step={1}
                        onValueChange={(value) => handleStyleChange('paddingY', value[0].toString())}
                      />
                    </div>
                    
                    {/* Border radius */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'استدارة الحدود' : 'Border radius'}</Label>
                        <span className="text-sm">{editedField.style?.borderRadius || '6'}px</span>
                      </div>
                      <Slider
                        defaultValue={[parseInt(editedField.style?.borderRadius || '6')]}
                        value={[parseInt(editedField.style?.borderRadius || '6')]}
                        min={0}
                        max={30}
                        step={1}
                        onValueChange={(value) => handleStyleChange('borderRadius', value[0].toString())}
                      />
                    </div>
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-4">
                    {/* Input for */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-input-for-${field.id}`}>
                        {language === 'ar' ? 'حقل الإدخال المرتبط' : 'Input for'}
                      </Label>
                      <Input
                        id={`field-input-for-${field.id}`}
                        value={editedField.inputFor || ''}
                        onChange={(e) => handleFieldChange('inputFor', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </div>
                    
                    {/* Error message */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-error-message-${field.id}`}>
                        {language === 'ar' ? 'رسالة الخطأ' : 'Error message'}
                      </Label>
                      <Input
                        id={`field-error-message-${field.id}`}
                        value={editedField.errorMessage || ''}
                        onChange={(e) => handleFieldChange('errorMessage', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                        placeholder={language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}
                      />
                    </div>
                    
                    {/* Label text */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-label-${field.id}`}>
                        {language === 'ar' ? 'نص التسمية' : 'Label text'}
                      </Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={editedField.label || ''}
                        onChange={(e) => handleFieldChange('label', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </div>
                    
                    {/* Show label */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch 
                        id={`field-show-label-${field.id}`}
                        checked={editedField.style?.showLabel !== false}
                        onCheckedChange={(checked) => handleStyleChange('showLabel', checked)}
                      />
                      <Label 
                        htmlFor={`field-show-label-${field.id}`}
                      >
                        {language === 'ar' ? 'إظهار التسمية' : 'Show label'}
                      </Label>
                    </div>
                    
                    {/* Label text size */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'حجم خط التسمية' : 'Label text size'}</Label>
                        <span className="text-sm">{editedField.style?.labelFontSize || '1'}</span>
                      </div>
                      <Slider
                        defaultValue={[parseFloat(editedField.style?.labelFontSize || '1')]}
                        value={[parseFloat(editedField.style?.labelFontSize || '1')]}
                        min={0}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => handleStyleChange('labelFontSize', value[0].toString())}
                      />
                    </div>
                    
                    {/* Label weight */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'وزن خط التسمية' : 'Label weight'}</Label>
                        <span className="text-sm">{editedField.style?.labelFontWeight || '400'}</span>
                      </div>
                      <Slider
                        defaultValue={[parseInt(editedField.style?.labelFontWeight || '400')]}
                        value={[parseInt(editedField.style?.labelFontWeight || '400')]}
                        min={100}
                        max={900}
                        step={100}
                        onValueChange={(value) => handleStyleChange('labelFontWeight', value[0].toString())}
                      />
                    </div>
                    
                    {/* Background color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الخلفية' : 'Background color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.backgroundColor || '#ffffff'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="w-9 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.backgroundColor || '#ffffff'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {/* Border color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الحدود' : 'Border color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.borderColor || '#d1d5db'}
                          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                          className="w-9 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.borderColor || '#d1d5db'}
                          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {/* Border width */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'سماكة الحدود' : 'Border width'}</Label>
                        <span className="text-sm">{editedField.style?.borderWidth || '1'}px</span>
                      </div>
                      <Slider
                        defaultValue={[parseInt(editedField.style?.borderWidth || '1')]}
                        value={[parseInt(editedField.style?.borderWidth || '1')]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleStyleChange('borderWidth', value[0].toString())}
                      />
                    </div>
                    
                    {/* Show icon */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch 
                        id={`field-show-icon-${field.id}`}
                        checked={editedField.style?.showIcon || false}
                        onCheckedChange={(checked) => handleStyleChange('showIcon', checked)}
                      />
                      <Label 
                        htmlFor={`field-show-icon-${field.id}`}
                      >
                        {language === 'ar' ? 'إظهار الأيقونة' : 'Show icon'}
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4 border-t mt-4">
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
