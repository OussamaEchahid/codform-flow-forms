
/**
 * مقتطف من محرر عنوان النموذج الذي يعمل بشكل صحيح
 * يوضح كيفية تحديث خصائص النمط وتمريرها إلى المعاينة
 */

import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';

interface FormTitleEditorProps {
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  formTitleField,
  onUpdateTitleField
}) => {
  // مهم: تعريف جميع متغيرات الحالة المحلية
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    formTitleField?.style?.textAlign || (language === 'ar' ? 'right' : 'left')
  );
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '1.5rem');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '0.875rem');
  // مهم: إزالة استخدام descriptionFontWeight واستخدام قيمة ثابتة بدلاً من ذلك
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');

  // هذه الدالة هي المفتاح لتحديث خصائص النمط بشكل صحيح
  const handleUpdateStyle = (property: string, value: string) => {
    if (!formTitleField) return;
    
    // إنشاء نسخة محدثة من الحقل مع الخاصية الجديدة
    const updatedField = {
      ...formTitleField,
      style: {
        ...formTitleField.style,
        [property]: value
      }
    };
    
    // تحديث المتغيرات المحلية لضمان تحديث واجهة المستخدم
    if (property === 'color') setTitleColor(value);
    if (property === 'textAlign') setTitleAlignment(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    // مهم: تحديث لون الخلفية
    if (property === 'backgroundColor') setBackgroundColor(value);
    
    // إرسال الحقل المحدث إلى المكون الأب
    onUpdateTitleField(updatedField);
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

  // في منتقي وزن الخط للوصف، استخدام قيمة ثابتة
  const renderDescriptionWeightSelector = () => {
    return (
      <div>
        <Label htmlFor="desc-weight" className={language === 'ar' ? 'text-right block' : ''}>
          {language === 'ar' ? 'سمك الوصف' : 'Description Weight'}
        </Label>
        <select
          id="desc-weight"
          value="normal" // استخدام قيمة ثابتة 'normal' بدلاً من متغير
          onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
          <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
          <option value="bold">{language === 'ar' ? 'سميك' : 'Bold'}</option>
        </select>
      </div>
    );
  };

  return (
    // ... باقي الكود
    <div className="form-title-editor">
      {/* منتقي لون الخلفية */}
      {renderBackgroundColorPicker()}
      
      {/* منتقي وزن الخط للوصف */}
      {renderDescriptionWeightSelector()}
    </div>
  );
};

export default FormTitleEditor;
