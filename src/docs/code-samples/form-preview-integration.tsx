
/**
 * مثال تكاملي يوضح كيفية تكامل مكونات المعاينة
 * مع آلية التحديث المباشر للتغييرات
 */

import React, { useState } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import FormTitleEditor from '@/components/form/builder/FormTitleEditor';
import { Button } from '@/components/ui/button';

// نموذج مبسط لتوضيح تكامل المكونات
const FormEditorIntegrationExample: React.FC = () => {
  const { language } = useI18n();
  
  // حالة النموذج
  const [formTitle, setFormTitle] = useState('نموذج جديد');
  const [formDescription, setFormDescription] = useState('وصف النموذج');
  const [fields, setFields] = useState<FormField[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // حالة أنماط النموذج
  const [formStyle, setFormStyle] = useState({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '16px', // استخدام قيمة بكسل ثابتة
    buttonStyle: 'rounded',
  });
  
  // البحث عن حقل العنوان الموجود أو إنشاء واحد جديد
  const formTitleField = fields.find(f => f.type === 'form-title') || {
    id: 'form-title',
    type: 'form-title' as 'form-title',
    label: formTitle,
    helpText: formDescription,
    style: {
      color: '#ffffff',
      textAlign: language === 'ar' ? 'right' : 'left',
      fontWeight: 'bold',
      fontSize: '24px', // استخدام قيمة بكسل ثابتة بدلاً من 1.5rem
      descriptionColor: '#ffffff',
      descriptionFontSize: '14px', // استخدام قيمة بكسل ثابتة بدلاً من 0.875rem
      backgroundColor: '#9b87f5',
    }
  };
  
  // دالة لتحديث حقل العنوان
  const handleUpdateTitleField = (updatedField: FormField) => {
    // إذا كان حقل العنوان موجوداً بالفعل، قم بتحديثه
    if (fields.some(f => f.type === 'form-title')) {
      setFields(fields.map(f => f.type === 'form-title' ? updatedField : f));
    } 
    // إذا لم يكن موجوداً، أضفه
    else {
      setFields([updatedField, ...fields]);
    }
    
    // تحديث عنوان ووصف النموذج أيضاً
    setFormTitle(updatedField.label);
    if (updatedField.helpText) {
      setFormDescription(updatedField.helpText);
    }
    
    // مهم جداً: زيادة مفتاح التحديث لإجبار المعاينة على إعادة الرسم
    setRefreshKey(prev => prev + 1);
  };
  
  // دالة لتحديث أنماط النموذج
  const handleStyleChange = (key: string, value: string) => {
    setFormStyle(prev => ({
      ...prev,
      [key]: value
    }));
    
    // مهم جداً: زيادة مفتاح التحديث لإجبار المعاينة على إعادة الرسم
    setRefreshKey(prev => prev + 1);
  };
  
  // إضافة حقل عنوان جديد إذا لم يكن موجوداً
  const addTitleField = () => {
    if (!fields.some(f => f.type === 'form-title')) {
      const newTitleField: FormField = {
        id: 'form-title',
        type: 'form-title',
        label: formTitle,
        helpText: formDescription,
        style: {
          color: '#ffffff',
          textAlign: language === 'ar' ? 'right' : 'left',
          fontWeight: 'bold',
          fontSize: '24px', // استخدام قيمة بكسل ثابتة
          descriptionColor: '#ffffff',
          descriptionFontSize: '14px', // استخدام قيمة بكسل ثابتة
          backgroundColor: '#9b87f5',
        }
      };
      
      setFields([newTitleField, ...fields]);
      setRefreshKey(prev => prev + 1);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* لوحة المحرر */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">محرر النموذج</h2>
        
        <FormTitleEditor 
          formTitle={formTitle}
          formDescription={formDescription}
          onFormTitleChange={setFormTitle}
          onFormDescriptionChange={setFormDescription}
          onAddTitleField={addTitleField}
          formTitleField={fields.find(f => f.type === 'form-title')}
          onUpdateTitleField={handleUpdateTitleField}
        />
        
        <div className="border p-4 rounded-md bg-white">
          <h3 className="text-lg font-medium mb-4">أنماط النموذج</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium">اللون الرئيسي</label>
              <div className="flex">
                <input 
                  type="color" 
                  value={formStyle.primaryColor}
                  onChange={e => handleStyleChange('primaryColor', e.target.value)}
                  className="w-10 h-10 p-1"
                />
                <input 
                  type="text"
                  value={formStyle.primaryColor}
                  onChange={e => handleStyleChange('primaryColor', e.target.value)}
                  className="flex-1 border p-2 ml-2"
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">استدارة الحواف</label>
              <select 
                value={formStyle.borderRadius}
                onChange={e => handleStyleChange('borderRadius', e.target.value)}
                className="w-full border p-2"
              >
                <option value="0">بدون استدارة</option>
                <option value="0.25rem">استدارة خفيفة</option>
                <option value="0.5rem">استدارة متوسطة</option>
                <option value="1rem">استدارة كبيرة</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">حجم الخط</label>
              <select 
                value={formStyle.fontSize}
                onChange={e => handleStyleChange('fontSize', e.target.value)}
                className="w-full border p-2"
              >
                <option value="14px">صغير</option>
                <option value="16px">متوسط</option>
                <option value="18px">كبير</option>
                <option value="20px">كبير جداً</option>
              </select>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            تحديث المعاينة
          </Button>
        </div>
      </div>
      
      {/* لوحة المعاينة */}
      <div>
        <h2 className="text-xl font-bold mb-4">معاينة مباشرة</h2>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* مهم جداً: استخدام مفتاح التحديث في مكون المعاينة */}
          <FormPreview 
            key={refreshKey}
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={1}
            totalSteps={1}
            formStyle={formStyle}
            fields={fields}
          >
            <div></div>
          </FormPreview>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              مفتاح التحديث: {refreshKey}
              (يزيد مع كل تغيير لإعادة رسم المعاينة)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEditorIntegrationExample;
