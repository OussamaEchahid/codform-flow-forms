import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, MessageSquare, CheckSquare, Image, FileText, CreditCard, DollarSign, Truck, ShoppingCart, ArrowRight, Check, Send, Users, IdCard, Smartphone, PhoneCall, Home, Building, Map, StickyNote, Edit, Package, Banknote, Handshake, ShoppingBag, Heart, Star, Target, Gift, Crown, Zap, Sparkles, Award, Diamond, Gem, Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import FieldEditor from './FieldEditor';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFieldUpdate?: (updatedField: FormField) => void;
  disabled?: boolean;
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
  const [editedField, setEditedField] = useState<FormField>(field);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  
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
  };

  // Define constants for field type checks
  const isFormTitle = field.type === 'form-title';
  const isWhatsAppButton = field.type === 'whatsapp';
  const shouldShowSubmitSpecificSettings = field.type === 'submit';

  // When component mounts or field changes, sync the edited field state
  useEffect(() => {
    setEditedField(field);
  }, [field]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFieldChange = (property: string, value: any) => {
    const updatedField = {
      ...editedField,
      [property]: value
    };
    setEditedField(updatedField);
    
    if (onFieldUpdate) {
      onFieldUpdate(updatedField);
    }
  };

  const handleStyleChange = (property: string, value: any) => {
    const updatedField = {
      ...editedField,
      style: {
        ...editedField.style || {},
        [property]: value
      }
    };
    setEditedField(updatedField);
    
    if (onFieldUpdate) {
      onFieldUpdate(updatedField);
    }
  };

  // Font family options
  const fontFamilies = [
    { value: 'Tajawal', label: 'Tajawal' },
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Amiri', label: 'Amiri' },
    { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
    { value: 'Almarai', label: 'Almarai' },
    { value: 'sans-serif', label: language === 'ar' ? 'الافتراضي' : 'Default' },
    { value: 'serif', label: language === 'ar' ? 'مُسَّرف' : 'Serif' },
    { value: 'monospace', label: language === 'ar' ? 'أحادي المسافة' : 'Monospace' },
  ];

  // Available icons for fields
  const availableIcons = [
    { value: 'user', label: language === 'ar' ? 'مستخدم' : 'User', component: <User size={16} /> },
    { value: 'phone', label: language === 'ar' ? 'هاتف' : 'Phone', component: <Phone size={16} /> },
    { value: 'mail', label: language === 'ar' ? 'بريد' : 'Mail', component: <Mail size={16} /> },
    { value: 'map-pin', label: language === 'ar' ? 'موقع' : 'Location', component: <MapPin size={16} /> },
    { value: 'message-square', label: language === 'ar' ? 'رسالة' : 'Message', component: <MessageSquare size={16} /> },
    { value: 'home', label: language === 'ar' ? 'منزل' : 'Home', component: <Home size={16} /> },
    { value: 'building', label: language === 'ar' ? 'مبنى' : 'Building', component: <Building size={16} /> },
    { value: 'smartphone', label: language === 'ar' ? 'جوال' : 'Mobile', component: <Smartphone size={16} /> },
    { value: 'id-card', label: language === 'ar' ? 'بطاقة' : 'ID Card', component: <IdCard size={16} /> },
    { value: 'heart', label: language === 'ar' ? 'قلب' : 'Heart', component: <Heart size={16} /> },
    { value: 'star', label: language === 'ar' ? 'نجمة' : 'Star', component: <Star size={16} /> },
  ];

  const getFieldIcon = () => {
    const iconProps = { size: 16, className: "text-gray-600" };
    
    switch (field.type) {
      case 'form-title': return <FileText {...iconProps} />;
      case 'text': return <User {...iconProps} />;
      case 'email': return <Mail {...iconProps} />;
      case 'phone': return <Phone {...iconProps} />;
      case 'textarea': return <MessageSquare {...iconProps} />;
      case 'checkbox': return <CheckSquare {...iconProps} />;
      case 'image': return <Image {...iconProps} />;
      case 'whatsapp': return <MessageSquare {...iconProps} className="text-green-500" />;
      case 'submit': return <Send {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getFieldDisplayName = () => {
    if (field.label) return field.label;
    
    const typeNames = {
      'form-title': language === 'ar' ? 'عنوان النموذج' : 'Form Title',
      'text': language === 'ar' ? 'حقل نص' : 'Text Input',
      'email': language === 'ar' ? 'بريد إلكتروني' : 'Email',
      'phone': language === 'ar' ? 'رقم هاتف' : 'Phone',
      'textarea': language === 'ar' ? 'نص متعدد الأسطر' : 'Multi-line Text',
      'checkbox': language === 'ar' ? 'خانة اختيار' : 'Checkbox',
      'image': language === 'ar' ? 'صورة' : 'Image',
      'whatsapp': language === 'ar' ? 'زر واتساب' : 'WhatsApp Button',
      'submit': language === 'ar' ? 'زر الإرسال' : 'Submit Button',
    };
    
    return typeNames[field.type as keyof typeof typeNames] || field.type;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion type="single" collapsible value={isExpanded ? field.id : ''}>
        <AccordionItem value={field.id} className="border rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical size={16} className="text-gray-400" />
              </div>
              
              {getFieldIcon()}
              
              <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-sm">
                  {getFieldDisplayName()}
                </span>
                {field.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDuplicate}
                className="flex items-center gap-1 h-8 px-2"
              >
                <Copy size={12} />
              </Button>
              
              {field.type !== 'submit' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDelete}
                  className="flex items-center gap-1 hover:text-red-500 hover:border-red-200 h-8 px-2"
                >
                  <Trash size={12} />
                </Button>
              )}
               
              {/* زر خاص للصور لفتح ImageFieldEditor */}
              {field.type === 'image' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFieldEditor(true)}
                  className="flex items-center gap-1 h-8 px-2"
                >
                  <Edit size={12} />
                  {language === 'ar' ? 'تحرير' : 'Edit'}
                </Button>
              )}
               
              <div className="ml-3">
                <AccordionTrigger onClick={toggleExpand} className="py-0">
                </AccordionTrigger>
              </div>
            </div>
          </div>
          
          <AccordionContent className="border-t pt-2">
            <div className="p-3">
              <h2 className="font-medium text-sm border-b pb-2 mb-4">
                {isFormTitle 
                  ? (language === 'ar' ? 'إعدادات العنوان' : 'Title Configuration')
                  : (language === 'ar' ? 'إعدادات الحقل' : 'Field Settings')
                }
              </h2>
              
              {/* للصور: إعدادات بسيطة + زر التحرير */}
              {field.type === 'image' ? (
                <div className="space-y-4">
                  {/* Image URL */}
                  <div className="space-y-1">
                    <Label htmlFor={`image-url-${field.id}`}>
                      {language === 'ar' ? 'رابط الصورة' : 'Image URL'}
                    </Label>
                    <Input
                      id={`image-url-${field.id}`}
                      type="url"
                      value={editedField.src || ''}
                      onChange={(e) => handleFieldChange('src', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {/* Image Width */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>{language === 'ar' ? 'عرض الصورة' : 'Image Width'}</Label>
                      <span className="text-sm">{editedField.width || 100}%</span>
                    </div>
                    <Slider
                      value={[parseInt(editedField.width?.toString() || '100')]}
                      onValueChange={(value) => handleFieldChange('width', value[0].toString())}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Alignment */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'المحاذاة' : 'Alignment'}</Label>
                    <Select
                      value={editedField.style?.textAlign || 'center'}
                      onValueChange={(value) => handleStyleChange('textAlign', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
                        <SelectItem value="center">{language === 'ar' ? 'وسط' : 'Center'}</SelectItem>
                        <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      {language === 'ar' 
                        ? 'أو استخدم زر "تحرير" أعلاه للمزيد من الخيارات'
                        : 'Or use "Edit" button above for more options'
                      }
                    </p>
                  </div>
                </div>
               ) : isFormTitle ? (
                 /* إعدادات عنوان النموذج */
                 <div className="grid grid-cols-2 gap-4">
                   {/* Left column */}
                   <div className="space-y-4">
                     {/* Title Text */}
                     <div className="space-y-1">
                       <Label htmlFor={`field-title-${field.id}`}>
                         {language === 'ar' ? 'عنوان النص' : 'Title'}
                       </Label>
                       <Input
                         id={`field-title-${field.id}`}
                         value={editedField.content || editedField.label || ''}
                         onChange={(e) => {
                           handleFieldChange('content', e.target.value);
                           handleFieldChange('label', e.target.value);
                         }}
                         className={language === 'ar' ? 'text-right' : ''}
                       />
                     </div>
                     
                     {/* Color */}
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
                         <span className="text-sm">{parseFloat(editedField.style?.fontSize?.replace('rem', '') || '1.5') || 1.5}</span>
                       </div>
                       <Slider
                         value={[parseFloat(editedField.style?.fontSize?.replace('rem', '') || '1.5') || 1.5]}
                         onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}rem`)}
                         max={4}
                         min={0.75}
                         step={0.25}
                         className="w-full"
                       />
                     </div>
                     
                     {/* Font family */}
                     <div className="space-y-1">
                       <Label>{language === 'ar' ? 'نوع الخط' : 'Font family'}</Label>
                       <Select
                         value={editedField.style?.fontFamily || 'Tajawal'}
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
                   </div>
                   
                   {/* Right column */}
                   <div className="space-y-4">
                     {/* Text Weight */}
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label>{language === 'ar' ? 'وزن النص' : 'Text weight'}</Label>
                         <span className="text-sm">({editedField.style?.fontWeight || '600'})</span>
                       </div>
                       <Slider
                         value={[parseInt(editedField.style?.fontWeight || '600')]}
                         onValueChange={(value) => handleStyleChange('fontWeight', value[0].toString())}
                         max={900}
                         min={100}
                         step={100}
                         className="w-full"
                       />
                     </div>
                     
                     {/* Padding Top */}
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label>{language === 'ar' ? 'مسافة علوية' : 'padding-top'}</Label>
                         <span className="text-sm">({parseInt(editedField.style?.paddingTop?.replace('px', '') || '12') || 12})</span>
                       </div>
                       <Slider
                         value={[parseInt(editedField.style?.paddingTop?.replace('px', '') || '12') || 12]}
                         onValueChange={(value) => handleStyleChange('paddingTop', `${value[0]}px`)}
                         max={30}
                         min={0}
                         step={1}
                         className="w-full"
                       />
                     </div>
                     
                     {/* Padding Bottom */}
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label>{language === 'ar' ? 'مسافة سفلية' : 'padding-bottom'}</Label>
                         <span className="text-sm">({parseInt(editedField.style?.paddingBottom?.replace('px', '') || '12') || 12})</span>
                       </div>
                       <Slider
                         value={[parseInt(editedField.style?.paddingBottom?.replace('px', '') || '12') || 12]}
                         onValueChange={(value) => handleStyleChange('paddingBottom', `${value[0]}px`)}
                         max={30}
                         min={0}
                         step={1}
                         className="w-full"
                       />
                     </div>
                   </div>
                 </div>
                 ) : isWhatsAppButton ? (
                   /* إعدادات زر الواتساب */
                   <div className="grid grid-cols-2 gap-4">
                     {/* Left column */}
                     <div className="space-y-4">
                       {/* WhatsApp Number */}
                       <div className="space-y-1">
                         <Label htmlFor={`whatsapp-number-${field.id}`}>
                           {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
                         </Label>
                         <Input
                           id={`whatsapp-number-${field.id}`}
                           value={editedField.whatsappNumber || ''}
                           onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                           placeholder="966501234567"
                         />
                       </div>
                       
                       {/* Message */}
                       <div className="space-y-1">
                         <Label htmlFor={`whatsapp-message-${field.id}`}>
                           {language === 'ar' ? 'الرسالة' : 'Message'}
                         </Label>
                         <Input
                           id={`whatsapp-message-${field.id}`}
                           value={editedField.message || ''}
                           onChange={(e) => handleFieldChange('message', e.target.value)}
                           placeholder={language === 'ar' ? 'مرحباً، أريد الاستفسار...' : 'Hello, I want to inquire...'}
                         />
                       </div>
                       
                       {/* Button Text */}
                       <div className="space-y-1">
                         <Label htmlFor={`whatsapp-label-${field.id}`}>
                           {language === 'ar' ? 'نص الزر' : 'Button Text'}
                         </Label>
                         <Input
                           id={`whatsapp-label-${field.id}`}
                           value={editedField.label || ''}
                           onChange={(e) => handleFieldChange('label', e.target.value)}
                           placeholder={language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                         />
                       </div>
                     </div>
                     
                     {/* Right column */}
                     <div className="space-y-4">
                       {/* Background Color */}
                       <div className="space-y-1">
                         <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
                         <div className="flex gap-2 items-center">
                           <Input
                             type="color"
                             value={editedField.style?.backgroundColor || '#25D366'}
                             onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                             className="w-9 h-9 p-1"
                           />
                           <Input
                             value={editedField.style?.backgroundColor || '#25D366'}
                             onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                             className="flex-1"
                           />
                         </div>
                       </div>
                       
                       {/* Text Color */}
                       <div className="space-y-1">
                         <Label>{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
                         <div className="flex gap-2 items-center">
                           <Input
                             type="color"
                             value={editedField.style?.color || '#ffffff'}
                             onChange={(e) => handleStyleChange('color', e.target.value)}
                             className="w-9 h-9 p-1"
                           />
                           <Input
                             value={editedField.style?.color || '#ffffff'}
                             onChange={(e) => handleStyleChange('color', e.target.value)}
                             className="flex-1"
                           />
                         </div>
                       </div>
                       
                       {/* Font Size */}
                       <div className="space-y-1">
                         <div className="flex items-center justify-between">
                           <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
                           <span className="text-sm">{editedField.style?.fontSize || '16'}px</span>
                         </div>
                         <Slider
                           value={[parseInt(editedField.style?.fontSize || '16')]}
                           onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}px`)}
                           max={24}
                           min={12}
                           step={1}
                           className="w-full"
                         />
                       </div>
                     </div>
                   </div>
                  ) : (
                    /* Regular field settings للحقول الأخرى */
                   <div className="grid grid-cols-2 gap-4">
                      {/* Left column - General field settings */}
                      <div className="space-y-4">
                        {/* Label text - لجميع الحقول */}
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
                       
                        {/* Background color - only for submit button */}
                        {shouldShowSubmitSpecificSettings && (
                          <>
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
                            
                            {/* Border color */}
                            <div className="space-y-1">
                              <Label>{language === 'ar' ? 'لون الحدود' : 'Border color'}</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="color"
                                  value={editedField.style?.borderColor || '#transparent'}
                                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                  className="w-9 h-9 p-1"
                                />
                                <Input
                                  value={editedField.style?.borderColor || '#transparent'}
                                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            
                            {/* Border width */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label>{language === 'ar' ? 'عرض الحدود' : 'Border width'}</Label>
                                <span className="text-sm">{editedField.style?.borderWidth || '0'}px</span>
                              </div>
                              <Slider
                                value={[parseInt(editedField.style?.borderWidth?.replace('px', '') || '0')]}
                                onValueChange={(value) => handleStyleChange('borderWidth', `${value[0]}px`)}
                                max={5}
                                min={0}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            
                            {/* Animation */}
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Switch 
                                id={`animation-${field.id}`} 
                                checked={editedField.style?.animation || false}
                                onCheckedChange={(checked) => handleStyleChange('animation', checked)}
                              />
                              <Label htmlFor={`animation-${field.id}`}>
                                {language === 'ar' ? 'تحريك' : 'Animation'}
                              </Label>
                            </div>
                            
                            {/* Animation type */}
                            {editedField.style?.animation && (
                              <div className="space-y-1">
                                <Label>{language === 'ar' ? 'نوع التحريك' : 'Animation type'}</Label>
                                <Select
                                  value={editedField.style?.animationType || 'pulse'}
                                  onValueChange={(value) => handleStyleChange('animationType', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pulse">{language === 'ar' ? 'نبضة' : 'Pulse'}</SelectItem>
                                    <SelectItem value="bounce">{language === 'ar' ? 'ارتداد' : 'Bounce'}</SelectItem>
                                    <SelectItem value="shake">{language === 'ar' ? 'اهتزاز' : 'Shake'}</SelectItem>
                                    <SelectItem value="wiggle">{language === 'ar' ? 'تمايل' : 'Wiggle'}</SelectItem>
                                    <SelectItem value="flash">{language === 'ar' ? 'وميض' : 'Flash'}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                         )}
                        
                        {/* Icon Selection - للحقول العادية فقط */}
                        {!shouldShowSubmitSpecificSettings && ['text', 'email', 'phone', 'textarea'].includes(field.type) && (
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'أيقونة الحقل' : 'Field Icon'}</Label>
                            <Select
                              value={editedField.icon || 'user'}
                              onValueChange={(value) => handleFieldChange('icon', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة' : 'Select icon'} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIcons.map(icon => (
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
                        )}
                        
                        {/* Icon Color - للحقول العادية فقط */}
                        {!shouldShowSubmitSpecificSettings && ['text', 'email', 'phone', 'textarea'].includes(field.type) && (
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="color"
                                value={editedField.style?.iconColor || '#9b87f5'}
                                onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                                className="w-9 h-9 p-1"
                              />
                              <Input
                                value={editedField.style?.iconColor || '#9b87f5'}
                                onChange={(e) => handleStyleChange('iconColor', e.target.value)}
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
                     </div>
                     
                     {/* Right column - Style settings */}
                     <div className="space-y-4">
                       {/* Font size */}
                       <div className="space-y-1">
                         <div className="flex items-center justify-between">
                           <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                           <span className="text-sm">{editedField.style?.fontSize || '16'}px</span>
                         </div>
                         <Slider
                           value={[parseInt(editedField.style?.fontSize || '16')]}
                           onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}px`)}
                           max={24}
                           min={10}
                           step={1}
                           className="w-full"
                         />
                       </div>
                       
                       {/* Padding Y */}
                       <div className="space-y-1">
                         <div className="flex items-center justify-between">
                           <Label>{language === 'ar' ? 'الحشو العمودي' : 'Padding Y'}</Label>
                           <span className="text-sm">{editedField.style?.paddingY || '8'}px</span>
                         </div>
                         <Slider
                           value={[parseInt(editedField.style?.paddingY || '8')]}
                           onValueChange={(value) => handleStyleChange('paddingY', `${value[0]}px`)}
                           max={20}
                           min={0}
                           step={1}
                           className="w-full"
                         />
                       </div>
                     </div>
                   </div>
                 )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* FieldEditor للصور */}
      {showFieldEditor && field.type === 'image' && (
        <FieldEditor
          field={field}
          onSave={(updatedField) => {
            if (onFieldUpdate) {
              onFieldUpdate(updatedField);
            }
            setShowFieldEditor(false);
          }}
          onClose={() => setShowFieldEditor(false)}
        />
      )}
    </div>
  );
};

export default SortableField;