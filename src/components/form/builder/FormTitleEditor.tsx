
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlignCenter, ChevronDown, ChevronUp, GripVertical, Edit } from 'lucide-react';
import { FormField } from '@/lib/form-utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

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
  const { language } = useI18n();
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '24px');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '14px');
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');
  const [isOpen, setIsOpen] = useState(true);

  // إعداد وظيفة السحب إذا كان المكون قابل للسحب
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
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : {};

  // تحديث الحالة المحلية عند تغير formTitleField
  useEffect(() => {
    if (formTitleField) {
      setTitleColor(formTitleField.style?.color || '#ffffff');
      setTitleSize(formTitleField.style?.fontSize || '24px');
      setTitleWeight(formTitleField.style?.fontWeight || 'bold');
      setDescColor(formTitleField.style?.descriptionColor || '#ffffff');
      setDescSize(formTitleField.style?.descriptionFontSize || '14px');
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');
    }
  }, [formTitleField]);

  // وظيفة تحديث النمط المحسنة التي تضمن التحديثات الفورية
  const handleUpdateStyle = (property: string, value: string) => {
    if (!formTitleField) return;
    
    // إنشاء نسخة عميقة من الحقل لتجنب مشكلات التعديل
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    
    // التأكد من وجود كائن النمط
    if (!updatedField.style) {
      updatedField.style = {};
    }
    
    // تحديث خاصية النمط
    updatedField.style[property] = value;
    
    // تحديث الحالة المحلية لعرض التغييرات في واجهة المستخدم
    if (property === 'color') setTitleColor(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    if (property === 'backgroundColor') setBackgroundColor(value);
    
    // دائمًا اجعل محاذاة النص مركزية للتوافق مع عرض المتجر
    updatedField.style.textAlign = 'center';
    
    // تحديث المكون الأب بمعلومات الحقل الجديدة
    onUpdateTitleField(updatedField);
    
    // تسجيل التحديث للمساعدة في التصحيح
    console.log(`Updated title field style: ${property} = ${value}`, updatedField);

    // إظهار رسالة نجاح التحديث للمستخدم
    toast.success(language === 'ar' ? 'تم تحديث النمط بنجاح' : 'Style updated successfully');
  };

  const handleUpdateLabel = (value: string) => {
    if (!formTitleField) {
      onFormTitleChange(value);
      return;
    }
    
    // إنشاء نسخة عميقة لتجنب مشكلات التعديل
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    updatedField.label = value;
    
    // تحديث المكون الأب
    onUpdateTitleField(updatedField);
    onFormTitleChange(value);
    
    console.log(`Updated title field label: ${value}`);
  };

  const handleUpdateDescription = (value: string) => {
    if (!formTitleField) {
      onFormDescriptionChange(value);
      return;
    }
    
    // إنشاء نسخة عميقة لتجنب مشكلات التعديل
    const updatedField = JSON.parse(JSON.stringify(formTitleField));
    updatedField.helpText = value;
    
    // تحديث المكون الأب
    onUpdateTitleField(updatedField);
    onFormDescriptionChange(value);
    
    console.log(`Updated title field description: ${value}`);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`mb-4 border p-3 rounded-md bg-white ${isDragging ? 'shadow-lg' : ''}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          {isDraggable && formTitleField && (
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded mr-2"
            >
              <GripVertical size={16} className="text-gray-500" />
            </div>
          )}
          
          <h3 className={`text-lg font-medium flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
          </h3>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="mx-2"
          >
            <Edit size={16} />
          </Button>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="form-title" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                </Label>
                <Input
                  id="form-title"
                  value={formTitleField ? formTitleField.label : formTitle}
                  onChange={(e) => handleUpdateLabel(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              <div>
                <Label htmlFor="form-desc" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </Label>
                <Textarea
                  id="form-desc"
                  value={formTitleField ? formTitleField.helpText : formDescription}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  className={`${language === 'ar' ? 'text-right' : ''} h-20`}
                />
              </div>
            </div>

            {!formTitleField ? (
              <Button 
                onClick={onAddTitleField}
                className="w-full mt-2"
              >
                {language === 'ar' ? 'تحويل العنوان إلى قابل للتعديل' : 'Convert to Editable Title'}
              </Button>
            ) : (
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label htmlFor="title-color" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                    </Label>
                    <div className="flex mt-1">
                      <Input
                        id="title-color"
                        type="color"
                        value={titleColor}
                        onChange={(e) => handleUpdateStyle('color', e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={titleColor}
                        onChange={(e) => handleUpdateStyle('color', e.target.value)}
                        className="ml-2 flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bg-color" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                    </Label>
                    <div className="flex mt-1">
                      <Input
                        id="bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                        className="ml-2 flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'خصائص العنوان' : 'Title Properties'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="title-size" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'حجم العنوان' : 'Title Size'}
                      </Label>
                      <select
                        id="title-size"
                        value={titleSize}
                        onChange={(e) => handleUpdateStyle('fontSize', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="16px">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="20px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="24px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                        <option value="32px">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="title-weight" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'سمك العنوان' : 'Title Weight'}
                      </Label>
                      <select
                        id="title-weight"
                        value={titleWeight}
                        onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
                        <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="bold">{language === 'ar' ? 'سميك' : 'Bold'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className={language === 'ar' ? 'text-right block' : ''}>
                    {language === 'ar' ? 'محاذاة العنوان' : 'Title Alignment'}
                  </Label>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      <AlignCenter className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'توسيط (مطلوب للعرض الصحيح في المتجر)' : 'Center (required for correct display in store)'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar' 
                      ? 'يجب أن يكون محاذاة العنوان للوسط دائمًا للحفاظ على التنسيق المتناسق في المتجر'
                      : 'Title alignment must be centered for consistent formatting in the store'}
                  </p>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'خصائص الوصف' : 'Description Properties'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="desc-color" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="desc-color"
                          type="color"
                          value={descColor}
                          onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={descColor}
                          onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="desc-size" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'حجم الوصف' : 'Description Size'}
                      </Label>
                      <select
                        id="desc-size"
                        value={descSize}
                        onChange={(e) => handleUpdateStyle('descriptionFontSize', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="12px">{language === 'ar' ? 'صغير جداً' : 'Extra Small'}</option>
                        <option value="14px">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="16px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="18px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FormTitleEditor;
