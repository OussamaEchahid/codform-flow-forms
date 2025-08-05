import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, MessageSquare, CheckSquare, Image, FileText, CreditCard, DollarSign, Truck, ShoppingCart, ArrowRight, Check, Send, Users, IdCard, Smartphone, PhoneCall, Home, Building, Map, StickyNote, Edit, Package, Banknote, Handshake, ShoppingBag, Heart, Star, Target, Gift, Crown, Zap, Sparkles, Award, Diamond, Gem, Facebook, Instagram, Twitter, Youtube, Linkedin, AtSign, Inbox, MessageCircle, PenTool, Badge, Contact, Calendar, Clock, Tag, ThumbsUp, Bookmark, Flag, Globe, Headphones, Type, Upload } from 'lucide-react';
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
import CartItemsFieldEditor from './editor/CartItemsFieldEditor';
import { supabase } from '@/integrations/supabase/client';

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
    let fieldToSet = field;
    
    // Initialize cartSummaryConfig if it doesn't exist for cart-summary fields
    if (field.type === 'cart-summary' && !field.cartSummaryConfig) {
      fieldToSet = {
        ...field,
        cartSummaryConfig: {
          subtotalText: language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
          discountText: language === 'ar' ? 'الخصم' : 'Discount',
          shippingText: language === 'ar' ? 'الشحن' : 'Shipping',
          totalText: language === 'ar' ? 'الإجمالي' : 'Total',
          showDiscount: false,
          discountType: 'percentage',
          discountValue: 0,
          shippingType: 'auto',
          shippingValue: 0,
          autoCalculate: true
        }
      };
    }
    
    setEditedField(fieldToSet);
  }, [field, language]);

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

  // Available icons for different field types
  const getAvailableIconsForField = (fieldType: string) => {
    const fieldSpecificIcons = {
      text: [
        { value: 'user', label: language === 'ar' ? 'مستخدم' : 'User', component: <User size={16} /> },
        { value: 'id-card', label: language === 'ar' ? 'بطاقة هوية' : 'ID Card', component: <IdCard size={16} /> },
        { value: 'badge', label: language === 'ar' ? 'شارة' : 'Badge', component: <Badge size={16} /> },
        { value: 'contact', label: language === 'ar' ? 'جهة اتصال' : 'Contact', component: <Contact size={16} /> },
        { value: 'users', label: language === 'ar' ? 'مستخدمون' : 'Users', component: <Users size={16} /> },
        { value: 'edit', label: language === 'ar' ? 'تحرير' : 'Edit', component: <Edit size={16} /> },
        { value: 'file-text', label: language === 'ar' ? 'ملف نصي' : 'Text File', component: <FileText size={16} /> },
        { value: 'tag', label: language === 'ar' ? 'علامة' : 'Tag', component: <Tag size={16} /> },
      ],
      email: [
        { value: 'mail', label: language === 'ar' ? 'بريد إلكتروني' : 'Email', component: <Mail size={16} /> },
        { value: 'at-sign', label: language === 'ar' ? 'رمز @' : 'At Sign', component: <AtSign size={16} /> },
        { value: 'inbox', label: language === 'ar' ? 'صندوق الوارد' : 'Inbox', component: <Inbox size={16} /> },
        { value: 'send', label: language === 'ar' ? 'إرسال' : 'Send', component: <Send size={16} /> },
        { value: 'globe', label: language === 'ar' ? 'موقع ويب' : 'Website', component: <Globe size={16} /> },
      ],
      phone: [
        { value: 'phone', label: language === 'ar' ? 'هاتف' : 'Phone', component: <Phone size={16} /> },
        { value: 'smartphone', label: language === 'ar' ? 'هاتف ذكي' : 'Smartphone', component: <Smartphone size={16} /> },
        { value: 'phone-call', label: language === 'ar' ? 'مكالمة' : 'Phone Call', component: <PhoneCall size={16} /> },
        { value: 'headphones', label: language === 'ar' ? 'سماعات' : 'Headphones', component: <Headphones size={16} /> },
        { value: 'contact', label: language === 'ar' ? 'جهة اتصال' : 'Contact', component: <Contact size={16} /> },
      ],
      textarea: [
        { value: 'message-square', label: language === 'ar' ? 'رسالة مربعة' : 'Message Square', component: <MessageSquare size={16} /> },
        { value: 'message-circle', label: language === 'ar' ? 'رسالة دائرية' : 'Message Circle', component: <MessageCircle size={16} /> },
        { value: 'file-text', label: language === 'ar' ? 'ملف نصي' : 'Text File', component: <FileText size={16} /> },
        { value: 'edit', label: language === 'ar' ? 'تحرير' : 'Edit', component: <Edit size={16} /> },
        { value: 'pen-tool', label: language === 'ar' ? 'أداة القلم' : 'Pen Tool', component: <PenTool size={16} /> },
        { value: 'sticky-note', label: language === 'ar' ? 'ملاحظة لاصقة' : 'Sticky Note', component: <StickyNote size={16} /> },
      ]
    };

    const commonIcons = [
      { value: 'map-pin', label: language === 'ar' ? 'موقع' : 'Location', component: <MapPin size={16} /> },
      { value: 'home', label: language === 'ar' ? 'منزل' : 'Home', component: <Home size={16} /> },
      { value: 'building', label: language === 'ar' ? 'مبنى' : 'Building', component: <Building size={16} /> },
      { value: 'calendar', label: language === 'ar' ? 'تقويم' : 'Calendar', component: <Calendar size={16} /> },
      { value: 'clock', label: language === 'ar' ? 'ساعة' : 'Clock', component: <Clock size={16} /> },
      { value: 'star', label: language === 'ar' ? 'نجمة' : 'Star', component: <Star size={16} /> },
      { value: 'heart', label: language === 'ar' ? 'قلب' : 'Heart', component: <Heart size={16} /> },
      { value: 'thumbs-up', label: language === 'ar' ? 'إعجاب' : 'Thumbs Up', component: <ThumbsUp size={16} /> },
      { value: 'bookmark', label: language === 'ar' ? 'مرجعية' : 'Bookmark', component: <Bookmark size={16} /> },
      { value: 'flag', label: language === 'ar' ? 'علم' : 'Flag', component: <Flag size={16} /> },
    ];

    return [...(fieldSpecificIcons[fieldType as keyof typeof fieldSpecificIcons] || []), ...commonIcons];
  };

  const availableIcons = getAvailableIconsForField(field.type);

  const getFieldIcon = () => {
    const iconProps = { size: 16, className: "text-gray-600" };
    
    switch (field.type) {
      case 'form-title': return <FileText {...iconProps} />;
      case 'text': return <Type {...iconProps} />;
      case 'email': return <Mail {...iconProps} />;
      case 'phone': return <Phone {...iconProps} />;
      case 'textarea': return <MessageSquare {...iconProps} />;
      case 'checkbox': return <CheckSquare {...iconProps} />;
      case 'image': return <Image {...iconProps} />;
      case 'cart-items': return <ShoppingCart {...iconProps} />;
      case 'cart-summary': return <Package {...iconProps} />;
      case 'whatsapp': return <MessageSquare {...iconProps} className="text-green-500" />;
      case 'countdown': return <Clock {...iconProps} />;
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
      'cart-items': language === 'ar' ? 'عناصر السلة' : 'Cart Items',
      'cart-summary': language === 'ar' ? 'ملخص السلة' : 'Cart Summary',
      'whatsapp': language === 'ar' ? 'زر واتساب' : 'WhatsApp Button',
      'countdown': language === 'ar' ? 'العداد التنازلي' : 'Countdown Timer',
      'submit': language === 'ar' ? 'زر الإرسال' : 'Submit Button',
    };
    
    return typeNames[field.type as keyof typeof typeNames] || field.type;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion type="single" collapsible value={isExpanded ? field.id : ''}>
        <AccordionItem value={field.id} className="border rounded-lg bg-white shadow-sm w-full">
          <div className="flex items-center justify-between p-4 px-5">
            <div className="flex items-center gap-3 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical size={16} className="text-gray-400" />
              </div>
              
              <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-sm">
                  {getFieldDisplayName()}
                </span>
                {field.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
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
               
              <div className="ml-3">
                <AccordionTrigger onClick={toggleExpand} className="py-0">
                </AccordionTrigger>
              </div>
            </div>
          </div>
          
          <AccordionContent className="border-t pt-2">
            <div className="p-4 px-5">
              <h2 className="font-medium text-sm border-b pb-2 mb-4">
                {isFormTitle 
                  ? (language === 'ar' ? 'إعدادات العنوان' : 'Title Configuration')
                  : (language === 'ar' ? 'إعدادات الحقل' : 'Field Settings')
                }
              </h2>
              
              {/* لعناصر السلة: رسالة لاستخدام الإعدادات المتقدمة */}
              {field.type === 'cart-items' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {language === 'ar' ? 'عنوان المنتج' : 'Product Title'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'ar' 
                        ? 'سيتم عرض عنوان المنتج المرتبط تلقائياً'
                        : 'The linked product title will be displayed automatically'
                      }
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      onClick={() => setShowFieldEditor(true)}
                      className="w-full flex items-center gap-2"
                      variant="outline"
                    >
                      <ArrowRight size={16} />
                      {language === 'ar' ? 'الإعدادات المتقدمة' : 'Advanced Settings'}
                    </Button>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      {language === 'ar' 
                        ? 'استخدم الزر أعلاه للوصول لجميع إعدادات التخصيص المتقدمة'
                        : 'Use the button above to access all advanced customization settings'
                      }
                    </p>
                  </div>
                </div>
              ) : field.type === 'image' ? (
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
                  
                  {/* Upload Image - NEW FEATURE */}
                  <div className="space-y-3 p-3 border border-dashed border-blue-300 rounded-lg bg-blue-50">
                    <div className="text-center">
                      <Label className="text-sm font-medium text-blue-700">
                        {language === 'ar' ? '🚀 رفع صورة جديدة' : '🚀 Upload New Image'}
                      </Label>
                      <p className="text-xs text-blue-600 mt-1">
                        {language === 'ar' 
                          ? 'اختر صورة من جهازك للرفع المباشر'
                          : 'Choose an image from your device for direct upload'
                        }
                      </p>
                    </div>
                    
                    <div className="flex justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          // Check file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert(language === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' : 'File size too large (max 5MB)');
                            return;
                          }

                          // Check file type
                          if (!file.type.startsWith('image/')) {
                            alert(language === 'ar' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
                            return;
                          }

                          try {
                            // Upload to Supabase Storage
                            const fileExt = file.name.split('.').pop() || 'png';
                            const fileName = `${Date.now()}.${fileExt}`;
                            const filePath = `images/${fileName}`;

                            const { data: uploadData, error: uploadError } = await supabase.storage
                              .from('assets')
                              .upload(filePath, file);

                            if (uploadError) {
                              throw uploadError;
                            }

                            // Get public URL
                            const { data: { publicUrl } } = supabase.storage
                              .from('assets')
                              .getPublicUrl(filePath);

                            // Update field with new image URL
                            handleFieldChange('src', publicUrl);
                            
                            alert(language === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!');
                          } catch (error) {
                            console.error('Upload error:', error);
                            alert(language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image');
                          }
                          
                          // Reset the input
                          event.target.value = '';
                        }}
                        className="hidden"
                        id={`image-upload-${field.id}`}
                      />
                      <label htmlFor={`image-upload-${field.id}`} className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-400 text-blue-600"
                          asChild
                        >
                          <span className="flex items-center gap-2 px-4 py-2">
                            <Upload size={16} />
                            <span className="font-medium">
                              {language === 'ar' ? 'اختر صورة' : 'Choose Image'}
                            </span>
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    <p className="text-xs text-blue-500 text-center">
                      {language === 'ar' 
                        ? 'الحد الأقصى 5 ميجابايت • سيتم حفظها في المجلد'
                        : 'Max 5MB • Will be saved to storage'
                      }
                    </p>
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
                   ) : field.type === 'countdown' ? (
                     /* إعدادات العداد التنازلي */
                     <div className="grid grid-cols-2 gap-4">
                       {/* Left column */}
                       <div className="space-y-4">
                         {/* Title Text */}
                         <div className="space-y-1">
                           <Label htmlFor={`countdown-title-${field.id}`}>
                             {language === 'ar' ? 'عنوان العداد' : 'Countdown Title'}
                           </Label>
                           <Input
                             id={`countdown-title-${field.id}`}
                             value={editedField.label || ''}
                             onChange={(e) => handleFieldChange('label', e.target.value)}
                             placeholder={language === 'ar' ? 'المتبقي على العرض' : 'Remaining on offer'}
                             className={language === 'ar' ? 'text-right' : ''}
                           />
                         </div>
                         
                         {/* End Date */}
                         <div className="space-y-1">
                           <Label htmlFor={`countdown-enddate-${field.id}`}>
                             {language === 'ar' ? 'تاريخ انتهاء العداد' : 'End Date'}
                           </Label>
                           <Input
                             id={`countdown-enddate-${field.id}`}
                             type="datetime-local"
                             value={editedField.style?.endDate || ''}
                             onChange={(e) => handleStyleChange('endDate', e.target.value)}
                           />
                         </div>
                         
                         {/* Title Color */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'لون العنوان' : 'Title Color'}</Label>
                           <div className="flex gap-2 items-center">
                             <Input
                               type="color"
                               value={editedField.style?.titleColor || '#000000'}
                               onChange={(e) => handleStyleChange('titleColor', e.target.value)}
                               className="w-9 h-9 p-1"
                             />
                             <Input
                               value={editedField.style?.titleColor || '#000000'}
                               onChange={(e) => handleStyleChange('titleColor', e.target.value)}
                               className="flex-1"
                             />
                           </div>
                         </div>
                         
                         {/* Background Color */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
                           <div className="flex gap-2 items-center">
                             <Input
                               type="color"
                               value={editedField.style?.backgroundColor || 'hsl(var(--primary))'}
                               onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                               className="w-9 h-9 p-1"
                             />
                             <Input
                               value={editedField.style?.backgroundColor || 'hsl(var(--primary))'}
                               onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                               className="flex-1"
                             />
                           </div>
                         </div>
                         
                         {/* Counter Text Color */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'لون أرقام العداد' : 'Counter Color'}</Label>
                           <div className="flex gap-2 items-center">
                             <Input
                               type="color"
                               value={editedField.style?.counterColor || '#000000'}
                               onChange={(e) => handleStyleChange('counterColor', e.target.value)}
                               className="w-9 h-9 p-1"
                             />
                             <Input
                               value={editedField.style?.counterColor || '#000000'}
                               onChange={(e) => handleStyleChange('counterColor', e.target.value)}
                               className="flex-1"
                             />
                           </div>
                         </div>
                         
                         {/* Counter Background */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'لون خلفية العداد' : 'Counter Background'}</Label>
                           <div className="flex gap-2 items-center">
                             <Input
                               type="color"
                               value={editedField.style?.counterBackgroundColor || '#ffffff'}
                               onChange={(e) => handleStyleChange('counterBackgroundColor', e.target.value)}
                               className="w-9 h-9 p-1"
                             />
                             <Input
                               value={editedField.style?.counterBackgroundColor || '#ffffff'}
                               onChange={(e) => handleStyleChange('counterBackgroundColor', e.target.value)}
                               className="flex-1"
                             />
                           </div>
                         </div>
                       </div>
                       
                       {/* Right column */}
                       <div className="space-y-4">
                         {/* Title Font Size */}
                         <div className="space-y-1">
                           <div className="flex items-center justify-between">
                             <Label>{language === 'ar' ? 'حجم العنوان' : 'Title Size'}</Label>
                             <span className="text-sm">{parseInt(editedField.style?.titleSize?.replace('px', '') || '18')}px</span>
                           </div>
                           <Slider
                             value={[parseInt(editedField.style?.titleSize?.replace('px', '') || '18')]}
                             onValueChange={(value) => handleStyleChange('titleSize', `${value[0]}px`)}
                             max={36}
                             min={12}
                             step={1}
                             className="w-full"
                           />
                         </div>
                         
                         {/* Counter Font Size */}
                         <div className="space-y-1">
                           <div className="flex items-center justify-between">
                             <Label>{language === 'ar' ? 'حجم أرقام العداد' : 'Counter Size'}</Label>
                             <span className="text-sm">{parseInt(editedField.style?.counterFontSize?.replace('px', '') || '24')}px</span>
                           </div>
                           <Slider
                             value={[parseInt(editedField.style?.counterFontSize?.replace('px', '') || '24')]}
                             onValueChange={(value) => handleStyleChange('counterFontSize', `${value[0]}px`)}
                             max={48}
                             min={16}
                             step={1}
                             className="w-full"
                           />
                          </div>
                          
                          {/* Counter Line Height */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label>{language === 'ar' ? 'ارتفاع سطر العداد' : 'Counter Line Height'}</Label>
                              <span className="text-sm">{editedField.style?.counterLineHeight || '1.1'}</span>
                            </div>
                            <Slider
                              value={[parseFloat(editedField.style?.counterLineHeight || '1.1') * 10]}
                              onValueChange={(value) => handleStyleChange('counterLineHeight', `${value[0] / 10}`)}
                              max={20}
                              min={8}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          
                         {/* Border Radius */}
                         <div className="space-y-1">
                           <div className="flex items-center justify-between">
                             <Label>{language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}</Label>
                             <span className="text-sm">{parseInt(editedField.style?.borderRadius?.replace('px', '') || '8')}px</span>
                           </div>
                           <Slider
                             value={[parseInt(editedField.style?.borderRadius?.replace('px', '') || '8')]}
                             onValueChange={(value) => handleStyleChange('borderRadius', `${value[0]}px`)}
                             max={24}
                             min={0}
                             step={1}
                             className="w-full"
                           />
                         </div>
                         
                         {/* Font Family */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'نوع الخط' : 'Font Family'}</Label>
                           <Select
                             value={editedField.style?.fontFamily || 'Tajawal'}
                             onValueChange={(value) => handleStyleChange('fontFamily', value)}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {fontFamilies.map(font => (
                                 <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         
                         {/* Days Label */}
                         <div className="space-y-1">
                           <Label>{language === 'ar' ? 'تسمية الأيام' : 'Days Label'}</Label>
                           <Input
                             value={editedField.style?.daysLabel || (language === 'ar' ? 'أيام' : 'Days')}
                             onChange={(e) => handleStyleChange('daysLabel', e.target.value)}
                             className={language === 'ar' ? 'text-right' : ''}
                           />
                         </div>
                         
                          {/* Hours Label */}
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'تسمية الساعات' : 'Hours Label'}</Label>
                            <Input
                              value={editedField.style?.hoursLabel || (language === 'ar' ? 'ساعات' : 'Hrs')}
                              onChange={(e) => handleStyleChange('hoursLabel', e.target.value)}
                              className={language === 'ar' ? 'text-right' : ''}
                            />
                          </div>
                          
                          {/* Minutes Label */}
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'تسمية الدقائق' : 'Minutes Label'}</Label>
                            <Input
                              value={editedField.style?.minutesLabel || (language === 'ar' ? 'دقائق' : 'Mins')}
                              onChange={(e) => handleStyleChange('minutesLabel', e.target.value)}
                              className={language === 'ar' ? 'text-right' : ''}
                            />
                          </div>
                          
                          {/* Seconds Label */}
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'تسمية الثواني' : 'Seconds Label'}</Label>
                            <Input
                              value={editedField.style?.secondsLabel || (language === 'ar' ? 'ثواني' : 'Secs')}
                              onChange={(e) => handleStyleChange('secondsLabel', e.target.value)}
                              className={language === 'ar' ? 'text-right' : ''}
                            />
                          </div>
                        </div>
                     </div>
                    ) : field.type === 'cart-summary' ? (
                      /* Cart Summary Settings */
                      <div className="space-y-4">
                        {/* Content Settings */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-sm border-b pb-2">
                            {language === 'ar' ? 'إعدادات المحتوى' : 'Content Settings'}
                          </h3>
                          
                          {/* Text Direction */}
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'اتجاه النص' : 'Text Direction'}</Label>
                            <Select
                              value={editedField.cartSummaryConfig?.direction || 'auto'}
                              onValueChange={(value) => {
                                const config = { ...editedField.cartSummaryConfig, direction: value };
                                handleFieldChange('cartSummaryConfig', config);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">
                                  {language === 'ar' ? 'تلقائي' : 'Auto'}
                                </SelectItem>
                                <SelectItem value="rtl">
                                  {language === 'ar' ? 'من اليمين لليسار' : 'Right to Left'}
                                </SelectItem>
                                <SelectItem value="ltr">
                                  {language === 'ar' ? 'من اليسار لليمين' : 'Left to Right'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Cart Summary Title */}
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'عنوان ملخص السلة' : 'Cart Summary Title'}</Label>
                            <Input
                              value={editedField.label || ''}
                              onChange={(e) => handleFieldChange('label', e.target.value)}
                              placeholder={language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                              className={language === 'ar' ? 'text-right' : ''}
                            />
                          </div>
                         
                         {/* Text Labels */}
                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'نص المجموع الفرعي' : 'Subtotal Text'}</Label>
                             <Input
                               value={editedField.cartSummaryConfig?.subtotalText || (language === 'ar' ? 'المجموع الفرعي' : 'Subtotal')}
                               onChange={(e) => {
                                 const config = { ...editedField.cartSummaryConfig, subtotalText: e.target.value };
                                 handleFieldChange('cartSummaryConfig', config);
                               }}
                               className={language === 'ar' ? 'text-right' : ''}
                             />
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'نص الخصم' : 'Discount Text'}</Label>
                             <Input
                               value={editedField.cartSummaryConfig?.discountText || (language === 'ar' ? 'الخصم' : 'Discount')}
                               onChange={(e) => {
                                 const config = { ...editedField.cartSummaryConfig, discountText: e.target.value };
                                 handleFieldChange('cartSummaryConfig', config);
                               }}
                               className={language === 'ar' ? 'text-right' : ''}
                             />
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'نص الشحن' : 'Shipping Text'}</Label>
                             <Input
                               value={editedField.cartSummaryConfig?.shippingText || (language === 'ar' ? 'الشحن' : 'Shipping')}
                               onChange={(e) => {
                                 const config = { ...editedField.cartSummaryConfig, shippingText: e.target.value };
                                 handleFieldChange('cartSummaryConfig', config);
                               }}
                               className={language === 'ar' ? 'text-right' : ''}
                             />
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'نص الإجمالي' : 'Total Text'}</Label>
                             <Input
                               value={editedField.cartSummaryConfig?.totalText || (language === 'ar' ? 'الإجمالي' : 'Total')}
                               onChange={(e) => {
                                 const config = { ...editedField.cartSummaryConfig, totalText: e.target.value };
                                 handleFieldChange('cartSummaryConfig', config);
                               }}
                               className={language === 'ar' ? 'text-right' : ''}
                             />
                           </div>
                         </div>
                       </div>
                       
                       {/* Calculation Settings */}
                       <div className="space-y-3">
                         <h3 className="font-medium text-sm border-b pb-2">
                           {language === 'ar' ? 'إعدادات الحساب' : 'Calculation Settings'}
                         </h3>
                         
                         {/* Auto Calculate */}
                         <div className="flex items-center space-x-2 rtl:space-x-reverse">
                           <Switch 
                             checked={editedField.cartSummaryConfig?.autoCalculate || false}
                             onCheckedChange={(checked) => {
                               const config = { ...editedField.cartSummaryConfig, autoCalculate: checked };
                               handleFieldChange('cartSummaryConfig', config);
                             }}
                           />
                           <Label>{language === 'ar' ? 'حساب تلقائي من المنتج' : 'Auto Calculate from Product'}</Label>
                         </div>
                         
                         {/* Show Discount */}
                         <div className="flex items-center space-x-2 rtl:space-x-reverse">
                           <Switch 
                             checked={editedField.cartSummaryConfig?.showDiscount || false}
                             onCheckedChange={(checked) => {
                               const config = { ...editedField.cartSummaryConfig, showDiscount: checked };
                               handleFieldChange('cartSummaryConfig', config);
                             }}
                           />
                           <Label>{language === 'ar' ? 'إظهار الخصم' : 'Show Discount'}</Label>
                         </div>
                         
                         {/* Discount Settings */}
                         {editedField.cartSummaryConfig?.showDiscount && (
                           <div className="ml-6 space-y-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded">
                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <Label>{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</Label>
                                 <Select
                                   value={editedField.cartSummaryConfig?.discountType || 'percentage'}
                                   onValueChange={(value) => {
                                     const config = { ...editedField.cartSummaryConfig, discountType: value };
                                     handleFieldChange('cartSummaryConfig', config);
                                   }}
                                 >
                                   <SelectTrigger>
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="percentage">
                                       {language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}
                                     </SelectItem>
                                     <SelectItem value="fixed">
                                       {language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}
                                     </SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               
                               <div className="space-y-1">
                                 <Label>
                                   {language === 'ar' ? 'قيمة الخصم' : 'Discount Value'}
                                   {editedField.cartSummaryConfig?.discountType === 'percentage' ? ' (%)' : ''}
                                 </Label>
                                 <Input
                                   type="number"
                                   min="0"
                                   max={editedField.cartSummaryConfig?.discountType === 'percentage' ? 100 : undefined}
                                   value={editedField.cartSummaryConfig?.discountValue || 0}
                                   onChange={(e) => {
                                     const config = { ...editedField.cartSummaryConfig, discountValue: parseFloat(e.target.value) || 0 };
                                     handleFieldChange('cartSummaryConfig', config);
                                   }}
                                 />
                               </div>
                             </div>
                           </div>
                         )}
                         
                         {/* Shipping Settings */}
                         <div className="space-y-3">
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'نوع الشحن' : 'Shipping Type'}</Label>
                              <Select
                                value={editedField.cartSummaryConfig?.shippingType || 'manual'}
                                onValueChange={(value) => {
                                  const config = { ...editedField.cartSummaryConfig, shippingType: value };
                                  handleFieldChange('cartSummaryConfig', config);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">
                                    {language === 'ar' ? 'يدوي' : 'Manual'}
                                  </SelectItem>
                                  <SelectItem value="free">
                                    {language === 'ar' ? 'مجاني' : 'Free'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                           </div>
                           
                           {editedField.cartSummaryConfig?.shippingType === 'manual' && (
                             <div className="space-y-1 ml-6 p-3 border-l-2 border-green-200 bg-green-50/50 rounded">
                               <Label>{language === 'ar' ? 'قيمة الشحن' : 'Shipping Value'}</Label>
                               <Input
                                 type="number"
                                 min="0"
                                 step="0.01"
                                 value={editedField.cartSummaryConfig?.shippingValue || 0}
                                 onChange={(e) => {
                                   const config = { ...editedField.cartSummaryConfig, shippingValue: parseFloat(e.target.value) || 0 };
                                   handleFieldChange('cartSummaryConfig', config);
                                 }}
                               />
                             </div>
                           )}
                         </div>
                       </div>
                       
                       {/* Styling Settings */}
                       <div className="space-y-3">
                         <h3 className="font-medium text-sm border-b pb-2">
                           {language === 'ar' ? 'إعدادات التصميم' : 'Styling Settings'}
                         </h3>
                         
                         {/* Colors */}
                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
                             <div className="flex gap-2 items-center">
                               <Input
                                 type="color"
                                 value={editedField.style?.backgroundColor || '#f9fafb'}
                                 onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                 className="w-9 h-9 p-1"
                               />
                               <Input
                                 value={editedField.style?.backgroundColor || '#f9fafb'}
                                 onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                 className="flex-1"
                               />
                             </div>
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'لون الحدود' : 'Border Color'}</Label>
                             <div className="flex gap-2 items-center">
                               <Input
                                 type="color"
                                 value={editedField.style?.borderColor || '#e5e7eb'}
                                 onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                 className="w-9 h-9 p-1"
                               />
                               <Input
                                 value={editedField.style?.borderColor || '#e5e7eb'}
                                 onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                 className="flex-1"
                               />
                             </div>
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'لون التسميات' : 'Labels Color'}</Label>
                             <div className="flex gap-2 items-center">
                               <Input
                                 type="color"
                                 value={editedField.style?.labelColor || '#6b7280'}
                                 onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                                 className="w-9 h-9 p-1"
                               />
                               <Input
                                 value={editedField.style?.labelColor || '#6b7280'}
                                 onChange={(e) => handleStyleChange('labelColor', e.target.value)}
                                 className="flex-1"
                               />
                             </div>
                           </div>
                           
                           <div className="space-y-1">
                             <Label>{language === 'ar' ? 'لون الإجمالي' : 'Total Color'}</Label>
                             <div className="flex gap-2 items-center">
                              <Input
                                type="color"
                                value={editedField.style?.totalValueColor || '#059669'}
                                onChange={(e) => handleStyleChange('totalValueColor', e.target.value)}
                                className="w-9 h-9 p-1"
                              />
                              <Input
                                value={editedField.style?.totalValueColor || '#059669'}
                                onChange={(e) => handleStyleChange('totalValueColor', e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label>{language === 'ar' ? 'لون القيم' : 'Values Color'}</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="color"
                                value={editedField.style?.valueColor || '#1f2937'}
                                onChange={(e) => handleStyleChange('valueColor', e.target.value)}
                                className="w-9 h-9 p-1"
                              />
                              <Input
                                value={editedField.style?.valueColor || '#1f2937'}
                                onChange={(e) => handleStyleChange('valueColor', e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                         </div>
                         
                         {/* Font Settings */}
                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <Label>{language === 'ar' ? 'عائلة الخط' : 'Font Family'}</Label>
                              <Select
                                value={editedField.style?.fontFamily || 'Cairo'}
                                onValueChange={(value) => handleStyleChange('fontFamily', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fontFamilies.map(font => (
                                    <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                           </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label>{language === 'ar' ? 'حجم خط التسميات' : 'Labels Font Size'}</Label>
                                <span className="text-sm">{editedField.style?.labelFontSize || '1rem'}</span>
                              </div>
                              <Slider
                                value={[parseFloat(editedField.style?.labelFontSize?.replace('rem', '') || '1')]}
                                onValueChange={(value) => handleStyleChange('labelFontSize', `${value[0]}rem`)}
                                max={2}
                                min={0.8}
                                step={0.1}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label>{language === 'ar' ? 'حجم خط القيم' : 'Values Font Size'}</Label>
                                <span className="text-sm">{editedField.style?.valueFontSize || '1rem'}</span>
                              </div>
                              <Slider
                                value={[parseFloat(editedField.style?.valueFontSize?.replace('rem', '') || '1')]}
                                onValueChange={(value) => handleStyleChange('valueFontSize', `${value[0]}rem`)}
                                max={2}
                                min={0.8}
                                step={0.1}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label>{language === 'ar' ? 'حجم خط الإجمالي' : 'Total Font Size'}</Label>
                                <span className="text-sm">{editedField.style?.totalValueFontSize || '1.1rem'}</span>
                              </div>
                              <Slider
                                value={[parseFloat(editedField.style?.totalValueFontSize?.replace('rem', '') || '1.1')]}
                                onValueChange={(value) => handleStyleChange('totalValueFontSize', `${value[0]}rem`)}
                                max={2.5}
                                min={1}
                                step={0.1}
                                className="w-full"
                              />
                            </div>
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
                            max={80}
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
          }}
          onClose={() => setShowFieldEditor(false)}
        />
      )}
      
      {/* CartItemsFieldEditor لعناصر السلة */}
      {showFieldEditor && field.type === 'cart-items' && (
        <CartItemsFieldEditor
          field={field}
          onUpdate={(updates) => {
            if (onFieldUpdate) {
              onFieldUpdate({ ...field, ...updates });
            }
          }}
          onClose={() => setShowFieldEditor(false)}
        />
      )}
    </div>
  );
};

export default SortableField;