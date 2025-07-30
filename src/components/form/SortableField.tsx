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
import { toast } from 'sonner';

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
    // تأكد من أن الحقول الجديدة لها الإعدادات الافتراضية الصحيحة
    let fieldToSet = JSON.parse(JSON.stringify(field));
    
    // للعناوين الجديدة، تأكد من الإعدادات الافتراضية الصحيحة
    if (field.type === 'form-title' && (!field.style || !field.style.color)) {
      if (!fieldToSet.style) fieldToSet.style = {};
      fieldToSet.style.color = fieldToSet.style.color || '#000000'; // اللون الأسود كافتراضي
      fieldToSet.style.fontSize = fieldToSet.style.fontSize || '1.5rem';
      fieldToSet.style.fontWeight = fieldToSet.style.fontWeight || '600';
      fieldToSet.style.fontFamily = fieldToSet.style.fontFamily || 'Tajawal, Arial, sans-serif';
      fieldToSet.style.paddingTop = fieldToSet.style.paddingTop || '12px';
      fieldToSet.style.paddingBottom = fieldToSet.style.paddingBottom || '12px';
      fieldToSet.style.paddingLeft = fieldToSet.style.paddingLeft || '0px';
      fieldToSet.style.paddingRight = fieldToSet.style.paddingRight || '0px';
      
      console.log('Setting default styles for form title:', fieldToSet.style);
    }
    
    setEditedField(fieldToSet);
  }, [field]);

  const handleFieldChange = (property: string, value: any) => {
    const updatedField = {
      ...editedField,
      [property]: value
    };
    
    setEditedField(updatedField);
    field[property] = value;
    
    if (onFieldUpdate) {
      onFieldUpdate({...updatedField});
    }
    
    toast.success(language === 'ar' ? 'تم تطبيق التغييرات' : 'Changes applied');
  };

  const handleStyleChange = (property: string, value: any) => {
    const updatedStyle = {
      ...editedField.style || {},
      [property]: value
    };
    
    const updatedField = {
      ...editedField,
      style: updatedStyle
    };
    
    setEditedField(updatedField);
    
    if (!field.style) field.style = {};
    field.style[property] = value;
    
    console.log(`Style updated: ${property} = ${value}`, updatedField.style);
    
    if (onFieldUpdate) {
      onFieldUpdate({...updatedField});
    }
    
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
  
  // أيقونات خاصة بزر الطلب - أيقونات متنوعة وإبداعية
  const submitIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'shopping-cart', label: language === 'ar' ? 'سلة التسوق' : 'Shopping Cart', component: <ShoppingCart size={16} /> },
    { value: 'shopping-bag', label: language === 'ar' ? 'حقيبة تسوق' : 'Shopping Bag', component: <ShoppingBag size={16} /> },
    { value: 'credit-card', label: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card', component: <CreditCard size={16} /> },
    { value: 'banknote', label: language === 'ar' ? 'دفع نقدي' : 'Cash Payment', component: <Banknote size={16} /> },
    { value: 'handshake', label: language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery', component: <Handshake size={16} /> },
    { value: 'truck', label: language === 'ar' ? 'توصيل سريع' : 'Fast Delivery', component: <Truck size={16} /> },
    { value: 'package', label: language === 'ar' ? 'طرد' : 'Package', component: <Package size={16} /> },
    { value: 'check', label: language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order', component: <Check size={16} /> },
    { value: 'send', label: language === 'ar' ? 'إرسال الطلب' : 'Send Order', component: <Send size={16} /> },
    { value: 'heart', label: language === 'ar' ? 'أضف للمفضلة' : 'Add to Favorites', component: <Heart size={16} /> },
    { value: 'star', label: language === 'ar' ? 'طلب مميز' : 'Premium Order', component: <Star size={16} /> },
    { value: 'gift', label: language === 'ar' ? 'هدية' : 'Gift Order', component: <Gift size={16} /> },
    { value: 'crown', label: language === 'ar' ? 'طلب VIP' : 'VIP Order', component: <Crown size={16} /> },
    { value: 'zap', label: language === 'ar' ? 'طلب فوري' : 'Instant Order', component: <Zap size={16} /> },
    { value: 'target', label: language === 'ar' ? 'اطلب الآن' : 'Order Now', component: <Target size={16} /> }
  ];

  // أيقونات خاصة بحقول الاسم - أيقونات شخصية متنوعة
  const nameFieldIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'user', label: language === 'ar' ? 'مستخدم واحد' : 'Single User', component: <User size={16} /> },
    { value: 'users', label: language === 'ar' ? 'عدة أشخاص' : 'Multiple Users', component: <Users size={16} /> },
    { value: 'id-card', label: language === 'ar' ? 'بطاقة هوية' : 'ID Card', component: <IdCard size={16} /> },
    { value: 'crown', label: language === 'ar' ? 'عميل مميز' : 'VIP Customer', component: <Crown size={16} /> },
    { value: 'star', label: language === 'ar' ? 'عميل مفضل' : 'Star Customer', component: <Star size={16} /> },
    { value: 'award', label: language === 'ar' ? 'عضو مكرم' : 'Honored Member', component: <Award size={16} /> },
    { value: 'diamond', label: language === 'ar' ? 'عضو ألماسي' : 'Diamond Member', component: <Diamond size={16} /> }
  ];

  // أيقونات خاصة برقم الهاتف - أيقونات اتصال متنوعة
  const phoneFieldIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'phone', label: language === 'ar' ? 'هاتف أرضي' : 'Landline Phone', component: <Phone size={16} /> },
    { value: 'smartphone', label: language === 'ar' ? 'هاتف ذكي' : 'Smartphone', component: <Smartphone size={16} /> },
    { value: 'phone-call', label: language === 'ar' ? 'مكالمة هاتفية' : 'Phone Call', component: <PhoneCall size={16} /> },
    { value: 'zap', label: language === 'ar' ? 'اتصال سريع' : 'Quick Call', component: <Zap size={16} /> },
    { value: 'target', label: language === 'ar' ? 'رقم مباشر' : 'Direct Number', component: <Target size={16} /> }
  ];

  // أيقونات خاصة بالعنوان - أيقونات مواقع متنوعة
  const addressFieldIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'map-pin', label: language === 'ar' ? 'دبوس الخريطة' : 'Map Pin', component: <MapPin size={16} /> },
    { value: 'home', label: language === 'ar' ? 'عنوان المنزل' : 'Home Address', component: <Home size={16} /> },
    { value: 'building', label: language === 'ar' ? 'عنوان العمل' : 'Office Address', component: <Building size={16} /> },
    { value: 'map', label: language === 'ar' ? 'خريطة تفصيلية' : 'Detailed Map', component: <Map size={16} /> },
    { value: 'target', label: language === 'ar' ? 'موقع دقيق' : 'Precise Location', component: <Target size={16} /> },
    { value: 'truck', label: language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address', component: <Truck size={16} /> }
  ];

  // أيقونات خاصة بالرسائل والبريد الإلكتروني - أيقونات تواصل إبداعية
  const messageFieldIcons = [
    { value: 'none', label: language === 'ar' ? 'بدون أيقونة' : 'No Icon', component: null },
    { value: 'mail', label: language === 'ar' ? 'بريد إلكتروني' : 'Email', component: <Mail size={16} /> },
    { value: 'message-square', label: language === 'ar' ? 'رسالة نصية' : 'Text Message', component: <MessageSquare size={16} /> },
    { value: 'sticky-note', label: language === 'ar' ? 'ملاحظة لاصقة' : 'Sticky Note', component: <StickyNote size={16} /> },
    { value: 'edit', label: language === 'ar' ? 'محرر النص' : 'Text Editor', component: <Edit size={16} /> },
    { value: 'sparkles', label: language === 'ar' ? 'رسالة مميزة' : 'Special Message', component: <Sparkles size={16} /> },
    { value: 'heart', label: language === 'ar' ? 'رسالة ودية' : 'Friendly Message', component: <Heart size={16} /> },
    { value: 'star', label: language === 'ar' ? 'تعليق مهم' : 'Important Comment', component: <Star size={16} /> }
  ];

  // دالة لاختيار الأيقونات المناسبة لكل نوع حقل
  const getIconsForFieldType = (fieldType: string) => {
    switch (fieldType) {
      case 'submit':
        return submitIcons;
      case 'text':
        // إذا كان التسمية تحتوي على "اسم" أو "name"
        if (field.label?.toLowerCase().includes('name') || field.label?.toLowerCase().includes('اسم')) {
          return nameFieldIcons;
        }
        return nameFieldIcons; // افتراضي للنص
      case 'phone':
        return phoneFieldIcons;
      case 'textarea':
        // إذا كان التسمية تحتوي على "عنوان" أو "address"
        if (field.label?.toLowerCase().includes('address') || field.label?.toLowerCase().includes('عنوان')) {
          return addressFieldIcons;
        }
        return messageFieldIcons; // افتراضي للنصوص الطويلة
      case 'email':
        return messageFieldIcons;
      default:
        return submitIcons;
    }
  };
  
  const getIconComponent = (iconName: string) => {
    const allIcons = [...submitIcons, ...nameFieldIcons, ...phoneFieldIcons, ...addressFieldIcons, ...messageFieldIcons];
    const icon = allIcons.find(i => i.value === iconName);
    return icon ? icon.component : null;
  };

  // Check if this is a form title element
  const isFormTitle = field.type === 'form-title';
  const shouldShowSubmitSpecificSettings = field.type === 'submit';
  const shouldShowWhatsAppSpecificSettings = field.type === 'whatsapp';
  
  // Animation types for submit button
  const animationTypes = [
    { value: "pulse", label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: "shake", label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: "bounce", label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: "wiggle", label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: "flash", label: language === 'ar' ? 'وميض' : 'Flash' }
  ];
  
  // Text alignment options
  const textAlignOptions = [
    { value: "left", label: language === 'ar' ? 'يسار' : 'Left' },
    { value: "center", label: language === 'ar' ? 'وسط' : 'Center' },
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
                {field.label || field.content || (language === 'ar' ? "حقل بدون عنوان" : "Untitled field")}
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
              <h2 className="font-medium text-sm border-b pb-2 mb-4">
                {isFormTitle 
                  ? (language === 'ar' ? 'إعدادات العنوان' : 'Title Configuration')
                  : (language === 'ar' ? 'إعدادات الحقل' : 'Field Settings')
                }
              </h2>
              
              {/* Form Title Specific Settings */}
              {isFormTitle ? (
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
                    
                    {/* Text Color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={editedField.style?.color || '#000000'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="w-12 h-9 p-1"
                        />
                        <Input
                          value={editedField.style?.color || '#000000'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {/* Font Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                        <span className="text-sm">{parseFloat(editedField.style?.fontSize?.replace('rem', '') || '1.5') || 1.5}</span>
                      </div>
                      <Slider
                        value={[parseFloat(editedField.style?.fontSize?.replace('rem', '') || '1.5') || 1.5]}
                        onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}rem`)}
                        max={3}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Font Family */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'عائلة الخط' : 'Font family'}</Label>
                      <Select
                        value={editedField.style?.fontFamily || 'Tajawal'}
                        onValueChange={(value) => handleStyleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر عائلة الخط' : 'Select font family'} />
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
                    
                    {/* Padding Right */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'مسافة يمنى' : 'padding-right'}</Label>
                        <span className="text-sm">({parseInt(editedField.style?.paddingRight?.replace('px', '') || '0') || 0})</span>
                      </div>
                      <Slider
                        value={[parseInt(editedField.style?.paddingRight?.replace('px', '') || '0') || 0]}
                        onValueChange={(value) => handleStyleChange('paddingRight', `${value[0]}px`)}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Padding Left */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{language === 'ar' ? 'مسافة يسرى' : 'padding-left'}</Label>
                        <span className="text-sm">({parseInt(editedField.style?.paddingLeft?.replace('px', '') || '0') || 0})</span>
                      </div>
                      <Slider
                        value={[parseInt(editedField.style?.paddingLeft?.replace('px', '') || '0') || 0]}
                        onValueChange={(value) => handleStyleChange('paddingLeft', `${value[0]}px`)}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                {/* WhatsApp specific settings */}
                {shouldShowWhatsAppSpecificSettings ? (
                  <div className="space-y-4">
                    {/* Text Label */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-label-${field.id}`}>
                        {language === 'ar' ? 'النص' : 'Text'}
                      </Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={editedField.label || ''}
                        onChange={(e) => handleFieldChange('label', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-whatsapp-number-${field.id}`}>
                        {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp number'}
                      </Label>
                      <Input
                        id={`field-whatsapp-number-${field.id}`}
                        value={editedField.whatsappNumber || ''}
                        onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                        className={language === 'ar' ? 'text-right' : ''}
                        placeholder="123456789"
                      />
                    </div>

                    {/* Font family */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'عائلة الخط' : 'Font family'}</Label>
                      <Select
                        value={editedField.style?.fontFamily || 'Cairo'}
                        onValueChange={(value) => handleStyleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر عائلة الخط' : 'Select font family'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cairo">Cairo</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Font size */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'}</Label>
                          <span className="text-sm">{parseInt(editedField.style?.fontSize || '16')}px</span>
                        </div>
                        <Slider
                          value={[parseInt(editedField.style?.fontSize || '16')]}
                          onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}px`)}
                          max={50}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Text weight */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>{language === 'ar' ? 'وزن النص' : 'Text weight'}</Label>
                          <span className="text-sm">{editedField.style?.fontWeight || '400'}</span>
                        </div>
                        <Slider
                          value={[parseInt(editedField.style?.fontWeight || '400')]}
                          onValueChange={(value) => handleStyleChange('fontWeight', value[0].toString())}
                          max={900}
                          min={100}
                          step={100}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Text Color */}
                      <div className="space-y-1">
                        <Label>{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
                        <Input
                          type="color"
                          value={editedField.style?.color || '#ffffff'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="w-full h-10"
                        />
                      </div>

                      {/* Background color */}
                      <div className="space-y-1">
                        <Label>{language === 'ar' ? 'لون الخلفية' : 'Background color'}</Label>
                        <Input
                          type="color"
                          value={editedField.style?.backgroundColor || '#25d366'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="w-full h-10"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <Label htmlFor={`field-whatsapp-message-${field.id}`}>
                        {language === 'ar' ? 'الرسالة' : 'Message'}
                      </Label>
                      <textarea
                        id={`field-whatsapp-message-${field.id}`}
                        value={editedField.message || ''}
                        onChange={(e) => handleFieldChange('message', e.target.value)}
                        className={`w-full p-2 border border-gray-300 rounded-md resize-none ${language === 'ar' ? 'text-right' : ''}`}
                        rows={3}
                        placeholder={language === 'ar' ? 'مرحبا، أنا مهتم بـ {product}. هل يمكنك تقديم مزيد من المعلومات؟' : 'Hello, I\'m interested in {product}. Can you provide more information?'}
                      />
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'استخدم (product) لإظهار اسم المنتج' : 'Use (product) to show product name'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Padding-Y */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>{language === 'ar' ? 'المسافة العمودية' : 'Padding-Y'}</Label>
                          <span className="text-sm">{parseInt(editedField.style?.paddingY || '10')}px</span>
                        </div>
                        <Slider
                          value={[parseInt(editedField.style?.paddingY || '10')]}
                          onValueChange={(value) => handleStyleChange('paddingY', `${value[0]}px`)}
                          max={50}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Border radius */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>{language === 'ar' ? 'استدارة الحدود' : 'Border radius'}</Label>
                          <span className="text-sm">{parseInt(editedField.style?.borderRadius || '0')}px</span>
                        </div>
                        <Slider
                          value={[parseInt(editedField.style?.borderRadius || '0')]}
                          onValueChange={(value) => handleStyleChange('borderRadius', `${value[0]}px`)}
                          max={30}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Border width */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>{language === 'ar' ? 'سماكة الحدود' : 'Border width'}</Label>
                          <span className="text-sm">{parseInt(editedField.style?.borderWidth || '0')}px</span>
                        </div>
                        <Slider
                          value={[parseInt(editedField.style?.borderWidth || '0')]}
                          onValueChange={(value) => handleStyleChange('borderWidth', `${value[0]}px`)}
                          max={30}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Border color */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الحدود' : 'Border color'}</Label>
                      <Input
                        type="color"
                        value={editedField.style?.borderColor || '#25d366'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="w-full h-10"
                      />
                    </div>

                    {/* Animation */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'الرسوم المتحركة' : 'Animation'}</Label>
                      <Select
                        value={typeof editedField.style?.animation === 'string' ? editedField.style.animation : 'none'}
                        onValueChange={(value) => handleStyleChange('animation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع التأثير' : 'Select animation'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
                          <SelectItem value="pulse">{language === 'ar' ? 'نبض' : 'Pulse'}</SelectItem>
                          <SelectItem value="bounce">{language === 'ar' ? 'ارتداد' : 'Bounce'}</SelectItem>
                          <SelectItem value="shake">{language === 'ar' ? 'اهتزاز' : 'Shake'}</SelectItem>
                          <SelectItem value="swing">{language === 'ar' ? 'أرجحة' : 'Swing'}</SelectItem>
                          <SelectItem value="wobble">{language === 'ar' ? 'تذبذب' : 'Wobble'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Show icon */}
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch 
                          id={`field-show-icon-${field.id}`}
                          checked={editedField.style?.showIcon !== false}
                          onCheckedChange={(checked) => handleStyleChange('showIcon', checked)}
                        />
                        <Label htmlFor={`field-show-icon-${field.id}`}>
                          {language === 'ar' ? 'إظهار الأيقونة' : 'Show icon'}
                        </Label>
                      </div>

                      {/* Icon color */}
                      <div className="space-y-1">
                        <Label>{language === 'ar' ? 'لون الأيقونة' : 'Icon color'}</Label>
                        <Input
                          type="color"
                          value={editedField.style?.iconColor || '#ffffff'}
                          onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                          className="w-full h-10"
                        />
                      </div>
                    </div>

                    {/* Icon selection */}
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'الأيقونة' : 'Icon'}</Label>
                      <Select
                        value={editedField.style?.icon || 'whatsapp'}
                        onValueChange={(value) => handleStyleChange('icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر الأيقونة' : 'Select icon'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                            </div>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center gap-2">
                              <Facebook className="w-4 h-4" />
                              {language === 'ar' ? 'فيسبوك' : 'Facebook'}
                            </div>
                          </SelectItem>
                          <SelectItem value="instagram">
                            <div className="flex items-center gap-2">
                              <Instagram className="w-4 h-4" />
                              {language === 'ar' ? 'انستقرام' : 'Instagram'}
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter">
                            <div className="flex items-center gap-2">
                              <Twitter className="w-4 h-4" />
                              {language === 'ar' ? 'تويتر' : 'Twitter'}
                            </div>
                          </SelectItem>
                          <SelectItem value="youtube">
                            <div className="flex items-center gap-2">
                              <Youtube className="w-4 h-4" />
                              {language === 'ar' ? 'يوتيوب' : 'YouTube'}
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4" />
                              {language === 'ar' ? 'لينكد إن' : 'LinkedIn'}
                            </div>
                          </SelectItem>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {language === 'ar' ? 'هاتف' : 'Phone'}
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {language === 'ar' ? 'بريد إلكتروني' : 'Email'}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Left column - General field settings */}
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
                      
                      {/* Padding-Y */}
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
                    
                    {/* Right column - Additional settings */}
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
                      
                      {/* Border width */}
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
                      
                      {/* Border radius - only for submit button */}
                      {shouldShowSubmitSpecificSettings && (
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
                      )}
                      
                      {/* Show icon in Live Preview */}
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
                                <span>{getIconsForFieldType(field.type).find(i => i.value === (editedField.icon || 'none'))?.label || ''}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {getIconsForFieldType(field.type).map(icon => (
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
                      
                      {/* إعدادات لون الأيقونة */}
                      {editedField.icon && editedField.icon !== 'none' && (
                        <div className="space-y-1">
                          <Label>{language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={editedField.style?.iconColor || '#6366f1'}
                              onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                              className="w-12 h-8 p-1 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">
                              {editedField.style?.iconColor || '#6366f1'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              
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
