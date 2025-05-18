
import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useI18n } from '@/lib/i18n';

interface FormTitleEditorProps {
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
  formTitle?: string;
  formDescription?: string;
  onFormTitleChange?: (title: string) => void;
  onFormDescriptionChange?: (description: string) => void;
  onAddTitleField?: () => void;
  isDraggable?: boolean;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  formTitleField,
  onUpdateTitleField,
  formTitle,
  formDescription,
  onFormTitleChange,
  onFormDescriptionChange,
  onAddTitleField,
  isDraggable = false
}) => {
  const { language } = useI18n();

  // تعريف جميع متغيرات الحالة المحلية لتتبع خصائص النمط
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    formTitleField?.style?.textAlign || (language === 'ar' ? 'right' : 'left')
  );
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '24px');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '14px');
  // إضافة متغير حالة للون الخلفية بشكل واضح
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');

  // تحديث الحالة المحلية عند تغير formTitleField
  useEffect(() => {
    if (formTitleField?.style) {
      setTitleColor(formTitleField.style.color || '#ffffff');
      setTitleAlignment(formTitleField.style.textAlign || (language === 'ar' ? 'right' : 'left'));
      setTitleSize(formTitleField.style.fontSize || '24px');
      setTitleWeight(formTitleField.style.fontWeight || 'bold');
      setDescColor(formTitleField.style.descriptionColor || '#ffffff');
      setDescSize(formTitleField.style.descriptionFontSize || '14px');
      // تحديث لون الخلفية من الحقل المستلم
      setBackgroundColor(formTitleField.style.backgroundColor || '#9b87f5');
      
      console.log("FormTitleEditor - تم تحديث النمط من الخارج:", {
        backgroundColor: formTitleField.style.backgroundColor,
        localBackgroundColor: backgroundColor
      });
    }
  }, [formTitleField, language]);

  // دالة تحديث خصائص النمط بشكل صحيح
  const handleUpdateStyle = (property: string, value: string) => {
    if (!formTitleField) return;
    
    console.log(`تحديث نمط العنوان - الخاصية: ${property}، القيمة: ${value}`);
    
    // تحديث المتغيرات المحلية أولاً لضمان تحديث واجهة المستخدم
    if (property === 'color') setTitleColor(value);
    if (property === 'textAlign') setTitleAlignment(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    // مهم: تحديث لون الخلفية في الحالة المحلية
    if (property === 'backgroundColor') {
      console.log(`تحديث لون الخلفية في المحرر إلى: ${value}`);
      setBackgroundColor(value);
    }
    
    // إنشاء نسخة محدثة من الحقل مع الخاصية الجديدة
    const updatedField = {
      ...formTitleField,
      style: {
        ...formTitleField.style,
        [property]: value
      }
    };
    
    console.log("إرسال الحقل المحدث:", updatedField);
    
    // إرسال الحقل المحدث إلى المكون الأب
    onUpdateTitleField(updatedField);
  };

  // معالج تحديث عنوان النموذج
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFormTitleChange) {
      onFormTitleChange(e.target.value);
    }

    if (formTitleField) {
      const updatedField = {
        ...formTitleField,
        label: e.target.value
      };
      onUpdateTitleField(updatedField);
    }
  };

  // معالج تحديث وصف النموذج
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onFormDescriptionChange) {
      onFormDescriptionChange(e.target.value);
    }

    if (formTitleField) {
      const updatedField = {
        ...formTitleField,
        helpText: e.target.value
      };
      onUpdateTitleField(updatedField);
    }
  };

  // محدد لون الخلفية
  const renderBackgroundColorPicker = () => {
    return (
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
    );
  };

  // منتقي لون العنوان
  const renderTitleColorPicker = () => {
    return (
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
    );
  };

  // منتقي محاذاة النص
  const renderTextAlignmentSelector = () => {
    return (
      <div>
        <Label htmlFor="title-alignment" className={language === 'ar' ? 'text-right block' : ''}>
          {language === 'ar' ? 'محاذاة العنوان' : 'Title Alignment'}
        </Label>
        <select
          id="title-alignment"
          value={titleAlignment}
          onChange={(e) => handleUpdateStyle('textAlign', e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="left">{language === 'ar' ? 'يسار' : 'Left'}</option>
          <option value="center">{language === 'ar' ? 'وسط' : 'Center'}</option>
          <option value="right">{language === 'ar' ? 'يمين' : 'Right'}</option>
        </select>
      </div>
    );
  };

  // Apply isDraggable classes if needed
  const containerClasses = `space-y-4 ${isDraggable ? 'cursor-move' : ''}`;

  return (
    <div className={containerClasses}>
      {formTitleField ? (
        <>
          <div className="border p-4 rounded-md bg-white">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'خصائص العنوان' : 'Title Properties'}
            </h3>
            
            <div className="space-y-3">
              {/* إضافة اختيار لون الخلفية كأول خيار للتأكيد على أهميته */}
              {renderBackgroundColorPicker()}
              
              {/* منتقي لون العنوان */}
              {renderTitleColorPicker()}
              
              {/* منتقي محاذاة النص */}
              {renderTextAlignmentSelector()}
              
              {/* منتقي حجم الخط */}
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
                  <option value="24px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                  <option value="32px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                  <option value="40px">{language === 'ar' ? 'كبير جدًا' : 'X-Large'}</option>
                </select>
              </div>
              
              {/* منتقي وزن الخط */}
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
              
              {/* منتقي لون الوصف */}
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
              
              {/* منتقي حجم الوصف */}
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
                  <option value="12px">{language === 'ar' ? 'صغير جدًا' : 'X-Small'}</option>
                  <option value="14px">{language === 'ar' ? 'صغير' : 'Small'}</option>
                  <option value="16px">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                  <option value="18px">{language === 'ar' ? 'كبير' : 'Large'}</option>
                </select>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
          <p className="text-blue-700 text-sm">
            {language === 'ar' 
              ? 'انقر على زر "إضافة عنوان" أدناه لإضافة حقل عنوان للنموذج.'
              : 'Click the "Add Title" button below to add a title field to the form.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormTitleEditor;
