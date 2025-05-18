import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, MessageSquare, CheckSquare, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFieldUpdate?: (updatedField: FormField) => void;
  selected?: boolean;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete,
  onFieldUpdate,
  selected = false
}) => {
  const { language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedField, setEditedField] = useState<FormField>(field);
  
  // تعديل خصائص السحب والإفلات لتعمل بشكل أفضل
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
  };
  
  // When component mounts or field changes, sync the edited field state
  useEffect(() => {
    setEditedField({...field});
  }, [field]);

  const handleFieldChange = (property: string, value: any) => {
    // Create a new field object with the updated property
    const updatedField = {
      ...editedField,
      [property]: value
    };
    
    // Update the local state
    setEditedField(updatedField);
    
    // Apply changes immediately by updating the original field
    Object.assign(field, updatedField);
    
    // Propagate changes to parent for immediate preview update
    if (onFieldUpdate) {
      onFieldUpdate({...updatedField});
    }
    
    // Show toast notification
    toast.success(language === 'ar' ? 'تم تطبيق التغييرات' : 'Changes applied');
  };

  const handleStyleChange = (property: string, value: any) => {
    // Create a new style object with the updated property
    const updatedStyle = {
      ...editedField.style || {},
      [property]: value
    };
    
    // Create a new field object with the updated style
    const updatedField = {
      ...editedField,
      style: updatedStyle
    };
    
    // Update the local state
    setEditedField(updatedField);
    
    // Apply changes immediately by updating the original field
    field.style = {...updatedStyle};
    
    // Fix for Label Color - only apply animation if this is specifically for animation
    if (property === 'animation' || property === 'animationType') {
      // Do nothing special, this is correct behavior
    } else if (property === 'labelColor') {
      // For labelColor, make sure we don't affect the animation setting
      if (field.style.animation !== undefined) {
        field.style.animation = updatedStyle.animation;
      }
    }
    
    // Propagate changes to parent for immediate preview update
    if (onFieldUpdate) {
      onFieldUpdate({...updatedField});
    }
    
    // Show toast notification
    toast.success(language === 'ar' ? 'تم تطبيق التغييرات' : 'Changes applied');
  };

  // Font family options
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
  
  // Icons mapping with components for visual display
  const fieldIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'user', label: language === 'ar' ? 'مستخدم' : 'User', component: <User size={16} /> },
    { value: 'phone', label: language === 'ar' ? 'هاتف' : 'Phone', component: <Phone size={16} /> },
    { value: 'map-pin', label: language === 'ar' ? 'موقع' : 'Location', component: <MapPin size={16} /> },
    { value: 'mail', label: language === 'ar' ? 'بريد' : 'Email', component: <Mail size={16} /> },
    { value: 'message-square', label: language === 'ar' ? 'رسالة' : 'Message', component: <MessageSquare size={16} /> },
    { value: 'check-square', label: language === 'ar' ? 'تحقق' : 'Check', component: <CheckSquare size={16} /> },
    { value: 'image', label: language === 'ar' ? 'صورة' : 'Image', component: <Image size={16} /> },
    { value: 'file-text', label: language === 'ar' ? 'ملف نصي' : 'Text File', component: <FileText size={16} /> },
  ];
  
  // Find the icon component for current value
  const getIconComponent = (iconName: string) => {
    const icon = fieldIcons.find(i => i.value === iconName);
    return icon ? icon.component : null;
  };

  // Show different field settings based on field type
  const shouldShowSubmitSpecificSettings = field.type === 'submit';
  const isTitleField = field.type === 'title' || field.type === 'form-title' || field.type === 'edit-form-title';
  
  // Animation types for submit button
  const animationTypes = [
    { value: "pulse", label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: "shake", label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: "bounce", label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: "wiggle", label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: "flash", label: language === 'ar' ? 'وميض' : 'Flash' }
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg mb-3 overflow-hidden",
        selected ? "ring-2 ring-codform-purple border-codform-purple" : "",
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
              <div className="font-medium">
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
            <div className="p-3">
              <h2 className="font-medium text-sm border-b pb-2 mb-4">{language === 'ar' ? 'إعدادات الحقل' : 'Field Settings'}</h2>
              
              {/* Basic Field Configuration in two columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Placeholder - hide for submit button */}
                  {!shouldShowSubmitSpecificSettings && (
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
                  )}
                  
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
                        value={editedField.style?.labelColor || '#9b87f5'}
                        onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                        className="w-9 h-9 p-1"
                      />
                      <Input
                        value={editedField.style?.labelColor || '#9b87f5'}
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
                  
                  {/* Font size - using text input to fix the issue */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                      <span className="text-sm">{editedField.style?.fontSize || '16'}px</span>
                    </div>
                    <Input
                      type="number"
                      min="8"
                      max="72"
                      value={parseFloat(editedField.style?.fontSize || '16')}
                      onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Padding-Y - using text input to fix the issue */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'المسافة العمودية' : 'Padding-Y'}</Label>
                      <span className="text-sm">{editedField.style?.paddingY || '8'}px</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={parseInt(editedField.style?.paddingY || '8')}
                      onChange={(e) => handleStyleChange('paddingY', `${e.target.value}px`)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Animation settings for submit button */}
                  {shouldShowSubmitSpecificSettings && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch 
                          id={`field-animation-${field.id}`}
                          checked={editedField.style?.animation || false}
                          onCheckedChange={(checked) => handleStyleChange('animation', checked)}
                        />
                        <Label 
                          htmlFor={`field-animation-${field.id}`}
                        >
                          {language === 'ar' ? 'تفعيل الرسوم المتحركة' : 'Enable Animation'}
                        </Label>
                      </div>
                      
                      {editedField.style?.animation && (
                        <div className="mt-2">
                          <Label>{language === 'ar' ? 'نوع الرسوم المتحركة' : 'Animation Type'}</Label>
                          <Select
                            value={editedField.style?.animationType || 'pulse'}
                            onValueChange={(value) => handleStyleChange('animationType', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={language === 'ar' ? 'اختر نوع التأثير' : 'Select animation type'} />
                            </SelectTrigger>
                            <SelectContent>
                              {animationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  {/* Input for - hide for submit button */}
                  {!shouldShowSubmitSpecificSettings && (
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
                  )}
                  
                  {/* Error message - hide for submit button */}
                  {!shouldShowSubmitSpecificSettings && (
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
                  )}
                  
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
                  
                  {/* Label weight - using text input to fix the issue */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'وزن خط التسمية' : 'Label weight'}</Label>
                      <span className="text-sm">{editedField.style?.labelFontWeight || '400'}</span>
                    </div>
                    <Select
                      value={editedField.style?.labelFontWeight || '400'}
                      onValueChange={(value) => handleStyleChange('labelFontWeight', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر وزن الخط' : 'Select font weight'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 (Thin)</SelectItem>
                        <SelectItem value="200">200 (Extra Light)</SelectItem>
                        <SelectItem value="300">300 (Light)</SelectItem>
                        <SelectItem value="400">400 (Regular)</SelectItem>
                        <SelectItem value="500">500 (Medium)</SelectItem>
                        <SelectItem value="600">600 (Semi Bold)</SelectItem>
                        <SelectItem value="700">700 (Bold)</SelectItem>
                        <SelectItem value="800">800 (Extra Bold)</SelectItem>
                        <SelectItem value="900">900 (Black)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Border color */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'لون الحدود' : 'Border color'}</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={editedField.style?.borderColor || '#9b87f5'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="w-9 h-9 p-1"
                      />
                      <Input
                        value={editedField.style?.borderColor || '#9b87f5'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {/* Border width - using text input to fix the issue */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'سماكة الحدود' : 'Border width'}</Label>
                      <span className="text-sm">{editedField.style?.borderWidth || '1'}px</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={parseInt(editedField.style?.borderWidth || '1')}
                      onChange={(e) => handleStyleChange('borderWidth', `${e.target.value}px`)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Show icon in Live Preview ONLY */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id={`field-show-icon-${field.id}`}
                      checked={editedField.style?.showIcon || false}
                      onCheckedChange={(checked) => handleStyleChange('showIcon', checked)}
                    />
                    <Label 
                      htmlFor={`field-show-icon-${field.id}`}
                    >
                      {language === 'ar' ? 'إظهار الأيقونة في المعاينة' : 'Show icon in preview'}
                    </Label>
                  </div>
                  
                  {/* Icon for Live Preview with visual icons */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'أيقونة المعاينة' : 'Preview icon'}</Label>
                    <Select
                      value={editedField.icon || 'none'}
                      onValueChange={(value) => handleFieldChange('icon', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة للمعاينة' : 'Select preview icon'}>
                          <div className="flex items-center gap-2">
                            {getIconComponent(editedField.icon || 'none')}
                            <span>{fieldIcons.find(i => i.value === (editedField.icon || 'none'))?.label || ''}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {fieldIcons.map(icon => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              {icon.component}
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Action buttons - Reduced to just Delete and Duplicate */}
              <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4 border-t mt-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SortableField;
