
import React, { useState, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, MessageSquare, CheckSquare, Image, FileText, CreditCard, DollarSign, Truck, ShoppingCart, ArrowRight, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFieldUpdate?: (updatedField: FormField) => void;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete,
  onFieldUpdate
}) => {
  const { language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedField, setEditedField] = useState<FormField>({...field});
  const fieldId = field.id; // Store field id to ensure we update the right field
  
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
    },
    data: {
      type: field.type,
      id: field.id,
      originalField: field
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
    // Deep clone to avoid reference issues
    const clonedField = JSON.parse(JSON.stringify(field));
    console.log(`SortableField updated with field ID: ${fieldId}, type: ${field.type}, label: ${field.label}`);
    setEditedField(clonedField);
  }, [field, fieldId]);

  const handleFieldChange = useCallback((property: string, value: any) => {
    console.log(`Updating field ${fieldId} (${field.type}) property: ${property} with value:`, value);
    
    // Create a new field object with the updated property
    const updatedField = {
      ...editedField,
      [property]: value
    };
    
    // Update the local state
    setEditedField(updatedField);
    
    // Apply changes immediately by creating a new copy to update the original field
    // This ensures we don't modify the field reference directly
    if (onFieldUpdate) {
      const fieldToUpdate = {...updatedField, id: fieldId};
      console.log(`Applying field update for field ID: ${fieldId}, property: ${property}`);
      onFieldUpdate(fieldToUpdate);
    }
    
    // Show toast notification
    toast.success(language === 'ar' ? 'تم تطبيق التغييرات' : 'Changes applied');
  }, [editedField, fieldId, field.type, language, onFieldUpdate]);

  const handleStyleChange = useCallback((property: string, value: any) => {
    console.log(`Updating field ${fieldId} (${field.type}) style property: ${property} with value:`, value);
    
    // Create a new style object with the updated property
    const updatedStyle = {
      ...editedField.style || {},
      [property]: value
    };
    
    // If this is a title field and we're changing text alignment, make sure ignoreFormDirection is set
    if ((field.type === 'form-title' || field.type === 'title') && property === 'textAlign') {
      updatedStyle.ignoreFormDirection = true;
    }
    
    // Create a new field object with the updated style
    const updatedField = {
      ...editedField,
      style: updatedStyle
    };
    
    // Update the local state
    setEditedField(updatedField);
    
    // Apply changes immediately to the original field
    if (onFieldUpdate) {
      const fieldToUpdate = {...updatedField, id: fieldId};
      console.log(`Applying style update for field ID: ${fieldId}, style property: ${property}`);
      onFieldUpdate(fieldToUpdate);
    }
    
    // Show toast notification
    toast.success(language === 'ar' ? 'تم تطبيق التغييرات' : 'Changes applied');
  }, [editedField, fieldId, field.type, language, onFieldUpdate]);

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
    { value: 'check', label: language === 'ar' ? 'تحقق' : 'Check', component: <Check size={16} /> },
    { value: 'shopping-cart', label: language === 'ar' ? 'عربة تسوق' : 'Shopping Cart', component: <ShoppingCart size={16} /> },
    { value: 'arrow-right', label: language === 'ar' ? 'سهم' : 'Arrow', component: <ArrowRight size={16} /> },
    { value: 'send', label: language === 'ar' ? 'إرسال' : 'Send', component: <Send size={16} /> },
    { value: 'image', label: language === 'ar' ? 'صورة' : 'Image', component: <Image size={16} /> },
    { value: 'file-text', label: language === 'ar' ? 'ملف نصي' : 'Text File', component: <FileText size={16} /> },
    { value: 'credit-card', label: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card', component: <CreditCard size={16} /> },
    { value: 'dollar-sign', label: language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery', component: <DollarSign size={16} /> },
    { value: 'truck', label: language === 'ar' ? 'شحن' : 'Delivery', component: <Truck size={16} /> },
  ];
  
  // Find the icon component for current value
  const getIconComponent = (iconName: string) => {
    const icon = fieldIcons.find(i => i.value === iconName);
    return icon ? icon.component : null;
  };

  // Show different field settings based on field type
  const shouldShowSubmitSpecificSettings = field.type === 'submit';
  
  // Animation types for submit button
  const animationTypes = [
    { value: "pulse", label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: "shake", label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: "bounce", label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: "wiggle", label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: "flash", label: language === 'ar' ? 'وميض' : 'Flash' }
  ];
  
  // Icon positions
  const iconPositions = [
    { value: "left", label: language === 'ar' ? 'يسار' : 'Left' },
    { value: "right", label: language === 'ar' ? 'يمين' : 'Right' }
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg mb-3 overflow-hidden",
        isDragging ? "shadow-lg" : ""
      )}
      data-field-id={fieldId}
      data-field-type={field.type}
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
                  {/* Label text */}
                  <div className="space-y-1">
                    <Label htmlFor={`field-label-${fieldId}`}>
                      {language === 'ar' ? 'نص التسمية' : 'Label text'}
                    </Label>
                    <Input
                      id={`field-label-${fieldId}`}
                      value={editedField.label || ''}
                      onChange={(e) => handleFieldChange('label', e.target.value)}
                      className={language === 'ar' ? 'text-right' : ''}
                    />
                  </div>

                  {/* Placeholder - hide for submit button */}
                  {!shouldShowSubmitSpecificSettings && (
                    <div className="space-y-1">
                      <Label htmlFor={`field-placeholder-${fieldId}`}>
                        {language === 'ar' ? 'مكان النص' : 'Placeholder'}
                      </Label>
                      <Input
                        id={`field-placeholder-${fieldId}`}
                        value={editedField.placeholder || ''}
                        onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </div>
                  )}
                  
                  {/* Required field */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id={`field-required-${fieldId}`} 
                      checked={editedField.required || false}
                      onCheckedChange={(checked) => handleFieldChange('required', checked)}
                    />
                    <Label 
                      htmlFor={`field-required-${fieldId}`}
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
                  
                  {/* Background color - only for submit button */}
                  {shouldShowSubmitSpecificSettings && (
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الخلفية' : 'Background color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.backgroundColor || '#9b87f5'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="w-9 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.backgroundColor || '#9b87f5'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}
                  
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

                  {/* Animation - only for submit button */}
                  {shouldShowSubmitSpecificSettings && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'تحريك الزر' : 'Button animation'}</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch 
                          id={`field-animation-${fieldId}`}
                          checked={editedField.style?.animation !== false}
                          onCheckedChange={(checked) => handleStyleChange('animation', checked)}
                        />
                        <Label 
                          htmlFor={`field-animation-${fieldId}`}
                        >
                          {language === 'ar' ? 'تفعيل التحريك' : 'Enable animation'}
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* Animation type - only for submit button with animation */}
                  {shouldShowSubmitSpecificSettings && editedField.style?.animation !== false && (
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'نوع التحريك' : 'Animation type'}</Label>
                      <Select
                        value={editedField.style?.animationType || 'pulse'}
                        onValueChange={(value) => handleStyleChange('animationType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع التحريك' : 'Select animation type'} />
                        </SelectTrigger>
                        <SelectContent>
                          {animationTypes.map(animation => (
                            <SelectItem key={animation.value} value={animation.value}>{animation.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  {/* Show label */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id={`field-show-label-${fieldId}`}
                      checked={editedField.style?.showLabel !== false}
                      onCheckedChange={(checked) => handleStyleChange('showLabel', checked)}
                    />
                    <Label 
                      htmlFor={`field-show-label-${fieldId}`}
                    >
                      {language === 'ar' ? 'إظهار التسمية' : 'Show label'}
                    </Label>
                  </div>
                  
                  {/* Font size */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                      <span className="text-sm">{editedField.style?.fontSize || '16'}px</span>
                    </div>
                    <Input
                      type="number"
                      min="8"
                      max="72"
                      value={parseInt(editedField.style?.fontSize || '16')}
                      onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Label weight */}
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
                  
                  {/* Border radius */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'استدارة الحدود' : 'Border radius'}</Label>
                      <span className="text-sm">{editedField.style?.borderRadius || '8'}px</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={parseInt(editedField.style?.borderRadius || '8')}
                      onChange={(e) => handleStyleChange('borderRadius', `${e.target.value}px`)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Show icon in Live Preview */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id={`field-show-icon-${fieldId}`}
                      checked={editedField.style?.showIcon || false}
                      onCheckedChange={(checked) => handleStyleChange('showIcon', checked)}
                    />
                    <Label 
                      htmlFor={`field-show-icon-${fieldId}`}
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
                  
                  {/* Text alignment for titles */}
                  {(field.type === 'form-title' || field.type === 'title') && (
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'محاذاة النص' : 'Text alignment'}</Label>
                      <Select
                        value={editedField.style?.textAlign || (language === 'ar' ? 'right' : 'left')}
                        onValueChange={(value) => handleStyleChange('textAlign', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر محاذاة النص' : 'Select text alignment'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
                          <SelectItem value="center">{language === 'ar' ? 'وسط' : 'Center'}</SelectItem>
                          <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
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
