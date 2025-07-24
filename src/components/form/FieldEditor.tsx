import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Form, FormField as UIFormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import WhatsAppFieldEditor from './editor/WhatsAppFieldEditor';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

interface FieldFormValues {
  label: string;
  required: boolean;
  placeholder: string;
  helpText: string;
}

const FieldEditor = ({ field, onSave, onClose }: FieldEditorProps) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = useState<FormField>(field);
  const [activeTab, setActiveTab] = useState<string>("basic");

  const form = useForm<FieldFormValues>({
    defaultValues: {
      label: field.label || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
    },
  });

  const handleSaveField = (updatedField: FormField) => {
    setCurrentField(updatedField);
    onSave(updatedField);
  };

  const handleSubmit = (values: FieldFormValues) => {
    const updatedField: FormField = {
      ...currentField,
      label: values.label,
      required: values.required,
      placeholder: values.placeholder,
      helpText: values.helpText,
    };
    handleSaveField(updatedField);
  };

  // Handle animation change for submit button
  const handleAnimationChange = (checked: boolean) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        animation: checked
      }
    });
  };

  // Handle animation type change for submit button
  const handleAnimationTypeChange = (type: "pulse" | "shake" | "bounce" | "wiggle" | "flash") => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        animationType: type
      }
    });
  };

  // UNIFIED FONT SIZE HANDLER - affects both label and input
  const handleFontSizeChange = (fontSize: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        fontSize: fontSize, // This will be used for both labels and inputs
        labelFontSize: fontSize // Keep for backward compatibility
      }
    });
  };

  // Handle label color change
  const handleLabelColorChange = (color: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        labelColor: color
      }
    });
  };

  // Handle label font weight change
  const handleLabelFontWeightChange = (fontWeight: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        labelFontWeight: fontWeight
      }
    });
  };

  // Handle form title color change  
  const handleTitleColorChange = (color: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        color: color
      }
    });
  };

  // Handle form title font size change
  const handleTitleFontSizeChange = (fontSize: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        fontSize: fontSize
      }
    });
  };

  // Handle form title font weight change
  const handleTitleFontWeightChange = (fontWeight: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        fontWeight: fontWeight
      }
    });
  };

  // Handle form title background color change
  const handleTitleBackgroundChange = (backgroundColor: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        backgroundColor: backgroundColor
      }
    });
  };

  
  // أيقونات خاصة بزر الطلب - أيقونات متنوعة وإبداعية
  const submitIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "shopping-cart", label: language === 'ar' ? 'سلة التسوق' : 'Shopping Cart' },
    { value: "shopping-bag", label: language === 'ar' ? 'حقيبة تسوق' : 'Shopping Bag' },
    { value: "credit-card", label: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card' },
    { value: "banknote", label: language === 'ar' ? 'دفع نقدي' : 'Cash Payment' },
    { value: "handshake", label: language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery' },
    { value: "truck", label: language === 'ar' ? 'توصيل سريع' : 'Fast Delivery' },
    { value: "package", label: language === 'ar' ? 'طرد' : 'Package' },
    { value: "check", label: language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order' },
    { value: "send", label: language === 'ar' ? 'إرسال الطلب' : 'Send Order' },
    { value: "heart", label: language === 'ar' ? 'أضف للمفضلة' : 'Add to Favorites' },
    { value: "star", label: language === 'ar' ? 'طلب مميز' : 'Premium Order' },
    { value: "gift", label: language === 'ar' ? 'هدية' : 'Gift Order' },
    { value: "crown", label: language === 'ar' ? 'طلب VIP' : 'VIP Order' },
    { value: "zap", label: language === 'ar' ? 'طلب فوري' : 'Instant Order' },
    { value: "target", label: language === 'ar' ? 'اطلب الآن' : 'Order Now' }
  ];

  // أيقونات خاصة بحقول الاسم - أيقونات شخصية متنوعة
  const nameFieldIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "user", label: language === 'ar' ? 'مستخدم واحد' : 'Single User' },
    { value: "users", label: language === 'ar' ? 'عدة أشخاص' : 'Multiple Users' },
    { value: "id-card", label: language === 'ar' ? 'بطاقة هوية' : 'ID Card' },
    { value: "crown", label: language === 'ar' ? 'عميل مميز' : 'VIP Customer' },
    { value: "star", label: language === 'ar' ? 'عميل مفضل' : 'Star Customer' },
    { value: "award", label: language === 'ar' ? 'عضو مكرم' : 'Honored Member' },
    { value: "diamond", label: language === 'ar' ? 'عضو ألماسي' : 'Diamond Member' }
  ];

  // أيقونات خاصة برقم الهاتف - أيقونات اتصال متنوعة
  const phoneFieldIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "phone", label: language === 'ar' ? 'هاتف أرضي' : 'Landline Phone' },
    { value: "smartphone", label: language === 'ar' ? 'هاتف ذكي' : 'Smartphone' },
    { value: "phone-call", label: language === 'ar' ? 'مكالمة هاتفية' : 'Phone Call' },
    { value: "zap", label: language === 'ar' ? 'اتصال سريع' : 'Quick Call' },
    { value: "target", label: language === 'ar' ? 'رقم مباشر' : 'Direct Number' }
  ];

  // أيقونات خاصة بالعنوان - أيقونات مواقع متنوعة
  const addressFieldIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "map-pin", label: language === 'ar' ? 'دبوس الخريطة' : 'Map Pin' },
    { value: "home", label: language === 'ar' ? 'عنوان المنزل' : 'Home Address' },
    { value: "building", label: language === 'ar' ? 'عنوان العمل' : 'Office Address' },
    { value: "map", label: language === 'ar' ? 'خريطة تفصيلية' : 'Detailed Map' },
    { value: "target", label: language === 'ar' ? 'موقع دقيق' : 'Precise Location' },
    { value: "truck", label: language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address' }
  ];

  // أيقونات خاصة بالرسائل والبريد الإلكتروني - أيقونات تواصل إبداعية
  const messageFieldIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "mail", label: language === 'ar' ? 'بريد إلكتروني' : 'Email' },
    { value: "message-square", label: language === 'ar' ? 'رسالة نصية' : 'Text Message' },
    { value: "sticky-note", label: language === 'ar' ? 'ملاحظة لاصقة' : 'Sticky Note' },
    { value: "edit", label: language === 'ar' ? 'محرر النص' : 'Text Editor' },
    { value: "sparkles", label: language === 'ar' ? 'رسالة مميزة' : 'Special Message' },
    { value: "heart", label: language === 'ar' ? 'رسالة ودية' : 'Friendly Message' },
    { value: "star", label: language === 'ar' ? 'تعليق مهم' : 'Important Comment' }
  ];

  // دالة لاختيار الأيقونات المناسبة لكل نوع حقل
  const getIconsForFieldType = (fieldType: string) => {
    console.log('Field type:', fieldType); // للتحقق من نوع الحقل
    switch (fieldType) {
      case 'submit':
        console.log('Submit icons:', submitIcons); // للتحقق من الأيقونات
        return submitIcons;
      case 'text':
        if (currentField.label?.toLowerCase().includes('name') || currentField.label?.toLowerCase().includes('اسم')) {
          return nameFieldIcons;
        }
        return nameFieldIcons; // default for text fields
      case 'phone':
        return phoneFieldIcons;
      case 'textarea':
        if (currentField.label?.toLowerCase().includes('address') || currentField.label?.toLowerCase().includes('عنوان')) {
          return addressFieldIcons;
        }
        return messageFieldIcons; // default for textarea
      case 'email':
        return messageFieldIcons;
      default:
        return submitIcons;
    }
  };

  // دالة لعرض الأيقونة في واجهة الاختيار
  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      // أيقونات زر الطلب
      case 'shopping-cart': return '🛒';
      case 'shopping-bag': return '🛍️';
      case 'credit-card': return '💳';
      case 'banknote': return '💰';
      case 'handshake': return '🤝';
      case 'truck': return '🚚';
      case 'package': return '📦';
      case 'check': return '✅';
      case 'send': return '📤';
      case 'heart': return '❤️';
      case 'star': return '⭐';
      case 'gift': return '🎁';
      case 'crown': return '👑';
      case 'zap': return '⚡';
      case 'target': return '🎯';
      
      // أيقونات الاسم
      case 'user': return '👤';
      case 'users': return '👥';
      case 'id-card': return '🆔';
      case 'award': return '🏆';
      case 'diamond': return '💎';
      
      // أيقونات الهاتف
      case 'phone': return '📞';
      case 'smartphone': return '📱';
      case 'phone-call': return '☎️';
      
      // أيقونات العنوان
      case 'map-pin': return '📍';
      case 'home': return '🏠';
      case 'building': return '🏢';
      case 'map': return '🗺️';
      
      // أيقونات الرسائل
      case 'mail': return '📧';
      case 'message-square': return '💬';
      case 'sticky-note': return '📝';
      case 'edit': return '✏️';
      case 'sparkles': return '✨';
      
      default: return '';
    }
  };

  const handleIconChange = (iconValue: string) => {
    if (currentField.type === 'submit') {
      // لحقول submit button، نحفظ الأيقونة في style.icon
      setCurrentField({
        ...currentField,
        style: {
          ...currentField.style,
          icon: iconValue === 'none' ? undefined : iconValue,
          showIcon: iconValue !== 'none'
        }
      });
    } else {
      // للحقول الأخرى، نحفظها في icon
      setCurrentField({
        ...currentField,
        icon: iconValue === 'none' ? undefined : iconValue,
        style: {
          ...currentField.style,
          showIcon: iconValue !== 'none'
        }
      });
    }
  };

  const handleIconPositionChange = (position: 'left' | 'right') => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        iconPosition: position
      }
    });
  };

  const handleStyleChange = (property: string, value: string) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        [property]: value
      }
    });
  };

  const renderEditorByType = () => {
    switch (currentField.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل الحقل' : 'Edit Field'}
            </h3>
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</TabsTrigger>
                <TabsTrigger value="styling">{language === 'ar' ? 'تنسيق' : 'Styling'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <UIFormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="placeholder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'النص البديل' : 'Placeholder'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'مثال' : 'Example'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="required"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{language === 'ar' ? 'مطلوب' : 'Required'}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="helpText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     
                     <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                       <Button type="button" variant="outline" onClick={onClose}>
                         {language === 'ar' ? 'إلغاء' : 'Cancel'}
                       </Button>
                       <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                     </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تنسيق الحقل' : 'Field Styling'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <FormLabel>{language === 'ar' ? 'لون التسمية' : 'Label Color'}</FormLabel>
                      <div className="flex mt-1 gap-2 items-center">
                        <Input
                          type="color"
                          value={currentField.style?.labelColor || '#374151'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={currentField.style?.labelColor || '#374151'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'حجم الخط (للتسمية والحقل معاً)' : 'Font Size (Label & Input)'}</FormLabel>
                      <Select
                        value={currentField.style?.fontSize || '16px'}
                        onValueChange={handleFontSizeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">12px - {language === 'ar' ? 'صغير جدا' : 'Very Small'}</SelectItem>
                          <SelectItem value="14px">14px - {language === 'ar' ? 'صغير' : 'Small'}</SelectItem>
                          <SelectItem value="16px">16px - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="18px">18px - {language === 'ar' ? 'كبير' : 'Large'}</SelectItem>
                          <SelectItem value="20px">20px - {language === 'ar' ? 'كبير جدا' : 'Very Large'}</SelectItem>
                          <SelectItem value="24px">24px - {language === 'ar' ? 'ضخم' : 'Huge'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        {language === 'ar' ? 'هذا الإعداد يؤثر على التسمية والحقل معاً' : 'This setting affects both label and input field'}
                      </p>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'وزن خط التسمية' : 'Label Font Weight'}</FormLabel>
                      <Select
                        value={currentField.style?.labelFontWeight || '600'}
                        onValueChange={handleLabelFontWeightChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر وزن الخط' : 'Select font weight'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">400 - {language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                          <SelectItem value="500">500 - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="600">600 - {language === 'ar' ? 'شبه غامق' : 'Semi Bold'}</SelectItem>
                          <SelectItem value="700">700 - {language === 'ar' ? 'غامق' : 'Bold'}</SelectItem>
                          <SelectItem value="800">800 - {language === 'ar' ? 'أكثر غمقا' : 'Extra Bold'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={() => handleSaveField(currentField)}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      
      
      case 'form-title':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
            </h3>
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</TabsTrigger>
                <TabsTrigger value="styling">{language === 'ar' ? 'تنسيق' : 'Styling'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <UIFormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'نص العنوان' : 'Title Text'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'عنوان النموذج' : 'Form Title'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="helpText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'النص التوضيحي' : 'Description Text'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي اختياري' : 'Optional description text'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                      <Button type="button" variant="outline" onClick={onClose}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تنسيق العنوان' : 'Title Styling'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <FormLabel>{language === 'ar' ? 'لون النص' : 'Text Color'}</FormLabel>
                      <div className="flex mt-1 gap-2 items-center">
                        <Input
                          type="color"
                          value={currentField.style?.color || '#000000'}
                          onChange={(e) => handleTitleColorChange(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={currentField.style?.color || '#000000'}
                          onChange={(e) => handleTitleColorChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {language === 'ar' ? 'لون نص العنوان' : 'Title text color'}
                      </p>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</FormLabel>
                      <div className="flex mt-1 gap-2 items-center">
                        <Input
                          type="color"
                          value={currentField.style?.backgroundColor || 'transparent'}
                          onChange={(e) => handleTitleBackgroundChange(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={currentField.style?.backgroundColor || 'transparent'}
                          onChange={(e) => handleTitleBackgroundChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {language === 'ar' ? 'لون خلفية العنوان' : 'Title background color'}
                      </p>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</FormLabel>
                      <Select
                        value={currentField.style?.fontSize || '24px'}
                        onValueChange={handleTitleFontSizeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16px">16px - {language === 'ar' ? 'صغير' : 'Small'}</SelectItem>
                          <SelectItem value="18px">18px - {language === 'ar' ? 'متوسط صغير' : 'Medium Small'}</SelectItem>
                          <SelectItem value="20px">20px - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="24px">24px - {language === 'ar' ? 'كبير' : 'Large'}</SelectItem>
                          <SelectItem value="28px">28px - {language === 'ar' ? 'كبير جدا' : 'Very Large'}</SelectItem>
                          <SelectItem value="32px">32px - {language === 'ar' ? 'ضخم' : 'Huge'}</SelectItem>
                          <SelectItem value="36px">36px - {language === 'ar' ? 'ضخم جدا' : 'Extra Huge'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'وزن الخط' : 'Font Weight'}</FormLabel>
                      <Select
                        value={currentField.style?.fontWeight || 'bold'}
                        onValueChange={handleTitleFontWeightChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر وزن الخط' : 'Select font weight'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">400 - {language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                          <SelectItem value="500">500 - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="600">600 - {language === 'ar' ? 'شبه غامق' : 'Semi Bold'}</SelectItem>
                          <SelectItem value="700">700 - {language === 'ar' ? 'غامق' : 'Bold'}</SelectItem>
                          <SelectItem value="800">800 - {language === 'ar' ? 'أكثر غمقا' : 'Extra Bold'}</SelectItem>
                          <SelectItem value="900">900 - {language === 'ar' ? 'أسود' : 'Black'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={() => handleSaveField(currentField)}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      
      case 'whatsapp':
        return (
          <WhatsAppFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
        
      case 'image':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل حقل الصورة' : 'Edit Image Field'}
            </h3>
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</TabsTrigger>
                <TabsTrigger value="styling">{language === 'ar' ? 'تنسيق' : 'Styling'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <UIFormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="required"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{language === 'ar' ? 'مطلوب' : 'Required'}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="helpText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                      <Button type="button" variant="outline" onClick={onClose}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تنسيق تسمية الحقل' : 'Label Styling'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <FormLabel>{language === 'ar' ? 'لون التسمية' : 'Label Color'}</FormLabel>
                      <div className="flex mt-1 gap-2 items-center">
                        <Input
                          type="color"
                          value={currentField.style?.labelColor || '#333333'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={currentField.style?.labelColor || '#333333'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'حجم خط التسمية' : 'Label Font Size'}</FormLabel>
                      <Select
                        value={currentField.style?.labelFontSize || '16px'}
                        onValueChange={handleFontSizeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">12px - {language === 'ar' ? 'صغير جدا' : 'Very Small'}</SelectItem>
                          <SelectItem value="14px">14px - {language === 'ar' ? 'صغير' : 'Small'}</SelectItem>
                          <SelectItem value="16px">16px - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="18px">18px - {language === 'ar' ? 'كبير' : 'Large'}</SelectItem>
                          <SelectItem value="20px">20px - {language === 'ar' ? 'كبير جدا' : 'Very Large'}</SelectItem>
                          <SelectItem value="24px">24px - {language === 'ar' ? 'ضخم' : 'Huge'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'وزن خط التسمية' : 'Label Font Weight'}</FormLabel>
                      <Select
                        value={currentField.style?.labelFontWeight || '600'}
                        onValueChange={handleLabelFontWeightChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر وزن الخط' : 'Select font weight'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">400 - {language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                          <SelectItem value="500">500 - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="600">600 - {language === 'ar' ? 'شبه غامق' : 'Semi Bold'}</SelectItem>
                          <SelectItem value="700">700 - {language === 'ar' ? 'غامق' : 'Bold'}</SelectItem>
                          <SelectItem value="800">800 - {language === 'ar' ? 'أكثر غمقا' : 'Extra Bold'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={() => handleSaveField(currentField)}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 'cart-items':
      case 'cart-summary':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? `تعديل ${currentField.type === 'cart-items' ? 'عنصر المنتج المختار' : 'ملخص الطلب'}` : `Edit ${currentField.type === 'cart-items' ? 'Selected Product Component' : 'Order Summary'}`}
            </h3>
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</TabsTrigger>
                <TabsTrigger value="styling">{language === 'ar' ? 'تنسيق' : 'Styling'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <UIFormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <UIFormField
                      control={form.control}
                      name="helpText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                      <Button type="button" variant="outline" onClick={onClose}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تنسيق تسمية الحقل' : 'Label Styling'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <FormLabel>{language === 'ar' ? 'لون التسمية' : 'Label Color'}</FormLabel>
                      <div className="flex mt-1 gap-2 items-center">
                        <Input
                          type="color"
                          value={currentField.style?.labelColor || '#333333'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={currentField.style?.labelColor || '#333333'}
                          onChange={(e) => handleLabelColorChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'حجم خط التسمية' : 'Label Font Size'}</FormLabel>
                      <Select
                        value={currentField.style?.labelFontSize || '16px'}
                        onValueChange={handleFontSizeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">12px - {language === 'ar' ? 'صغير جدا' : 'Very Small'}</SelectItem>
                          <SelectItem value="14px">14px - {language === 'ar' ? 'صغير' : 'Small'}</SelectItem>
                          <SelectItem value="16px">16px - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="18px">18px - {language === 'ar' ? 'كبير' : 'Large'}</SelectItem>
                          <SelectItem value="20px">20px - {language === 'ar' ? 'كبير جدا' : 'Very Large'}</SelectItem>
                          <SelectItem value="24px">24px - {language === 'ar' ? 'ضخم' : 'Huge'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FormLabel>{language === 'ar' ? 'وزن خط التسمية' : 'Label Font Weight'}</FormLabel>
                      <Select
                        value={currentField.style?.labelFontWeight || '600'}
                        onValueChange={handleLabelFontWeightChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر وزن الخط' : 'Select font weight'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">400 - {language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                          <SelectItem value="500">500 - {language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="600">600 - {language === 'ar' ? 'شبه غامق' : 'Semi Bold'}</SelectItem>
                          <SelectItem value="700">700 - {language === 'ar' ? 'غامق' : 'Bold'}</SelectItem>
                          <SelectItem value="800">800 - {language === 'ar' ? 'أكثر غمقا' : 'Extra Bold'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button onClick={() => handleSaveField(currentField)}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 'submit':
        const animationTypes = [
          { value: "pulse" as const, label: language === 'ar' ? 'نبض' : 'Pulse' },
          { value: "shake" as const, label: language === 'ar' ? 'اهتزاز' : 'Shake' },
          { value: "bounce" as const, label: language === 'ar' ? 'ارتداد' : 'Bounce' },
          { value: "wiggle" as const, label: language === 'ar' ? 'تمايل' : 'Wiggle' },
          { value: "flash" as const, label: language === 'ar' ? 'وميض' : 'Flash' }
        ];
        
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل زر الإرسال' : 'Edit Submit Button'}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <UIFormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'نص الزر' : 'Button Text'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={language === 'ar' ? 'إرسال الطلب الآن' : 'Submit Order Now'} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Icon controls */}
                <div className="space-y-4 border rounded-md p-4">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'إعدادات الأيقونة' : 'Icon Settings'}
                  </h4>
                  
                  <div>
                    <FormLabel>{language === 'ar' ? 'اختر الأيقونة' : 'Select Icon'}</FormLabel>
                    <Select
                      value={currentField.style?.icon || currentField.icon || 'none'}
                      onValueChange={handleIconChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة' : 'Select icon'} />
                      </SelectTrigger>
                        <SelectContent>
                          {getIconsForFieldType(currentField.type).map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                {icon.value !== 'none' && (
                                  <span className="text-sm">
                                    {getIconComponent(icon.value)}
                                  </span>
                                )}
                                <span>{icon.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                   </div>

                  {/* إعدادات لون الأيقونة */}
                  {(() => {
                    const hasIcon = (currentField.icon && currentField.icon !== 'none') || 
                                   (currentField.style?.icon && currentField.style?.icon !== 'none');
                    console.log('Icon check:', {
                      fieldType: currentField.type,
                      fieldIcon: currentField.icon,
                      styleIcon: currentField.style?.icon,
                      hasIcon,
                      style: currentField.style
                    });
                    return hasIcon;
                  })() && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}
                      </label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="color"
                          value={currentField.style?.iconColor || '#6366f1'}
                          onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                          {currentField.style?.iconColor || '#6366f1'}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentField.style?.showIcon && (
                    <div>
                      <FormLabel>{language === 'ar' ? 'موقع الأيقونة' : 'Icon Position'}</FormLabel>
                      <Select
                        value={currentField.style?.iconPosition || 'left'}
                        onValueChange={(value) => handleIconPositionChange(value as 'left' | 'right')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر موقع الأيقونة' : 'Select icon position'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
                          <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Animation controls */}
                <div className="space-y-4 border rounded-md p-4">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تأثيرات الرسوم المتحركة للزر' : 'Button Animation Effects'}
                  </h4>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="animation"
                      checked={currentField.style?.animation || false}
                      onCheckedChange={handleAnimationChange}
                    />
                    <label htmlFor="animation" className="text-sm font-medium cursor-pointer">
                      {language === 'ar' ? 'تفعيل الرسوم المتحركة' : 'Enable Animation'}
                    </label>
                  </div>
                  
                  {currentField.style?.animation && (
                    <div className="pt-2">
                      <FormLabel>{language === 'ar' ? 'نوع التأثير' : 'Animation Type'}</FormLabel>
                      <Select
                        value={currentField.style?.animationType || 'pulse'}
                        onValueChange={(value) => handleAnimationTypeChange(value as "pulse" | "shake" | "bounce" | "wiggle" | "flash")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع التأثير' : 'Select animation type'} />
                        </SelectTrigger>
                        <SelectContent>
                          {animationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                </div>
              </form>
            </Form>
          </div>
        );
        
      default:
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل الحقل' : 'Edit Field'}
            </h3>
            <p>{language === 'ar' ? 'لا يوجد محرر لهذا النوع من الحقول' : 'No editor available for this field type'}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {renderEditorByType()}
      </div>
    </div>
  );
};

export default FieldEditor;
