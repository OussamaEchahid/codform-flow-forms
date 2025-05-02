
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Interface para el constructor de formularios
export interface FormBuilderProps {
  formData: any[];
  onChange: (newFormData: any[]) => void;
  isOfflineMode?: boolean;
}

// Tipos de campos para el formulario
const FIELD_TYPES = [
  { id: 'text', name: 'نص', name_en: 'Text' },
  { id: 'number', name: 'رقم', name_en: 'Number' },
  { id: 'select', name: 'قائمة منسدلة', name_en: 'Dropdown' },
  { id: 'checkbox', name: 'مربع اختيار', name_en: 'Checkbox' },
  { id: 'email', name: 'بريد إلكتروني', name_en: 'Email' },
  { id: 'phone', name: 'رقم هاتف', name_en: 'Phone' },
  { id: 'textarea', name: 'نص طويل', name_en: 'Textarea' }
];

const FormBuilder: React.FC<FormBuilderProps> = ({ 
  formData = [], 
  onChange,
  isOfflineMode = false
}) => {
  const { language } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // التحقق من الآداء
  useEffect(() => {
    // تتبع وقت العمليات الطويلة
    const startTime = performance.now();
    
    // التحقق من صحة البيانات
    try {
      if (formData && Array.isArray(formData) && formData.length > 100) {
        console.warn('Large form data detected, this might cause performance issues:', formData.length, 'fields');
      }
      
      // تسجيل وقت معالجة البيانات
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (processingTime > 100) {
        console.warn(`Form data processing took ${processingTime.toFixed(2)}ms, which might cause UI lag`);
      }
    } catch (e) {
      console.error('Error validating form data:', e);
    }
  }, [formData]);
  
  // إضافة حقل جديد إلى النموذج
  const addField = async (type: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // إنشاء حقل جديد
      const newField = {
        id: `field-${Date.now()}`,
        type,
        label: language === 'ar' ? 'حقل جديد' : 'New Field',
        required: false,
        placeholder: language === 'ar' ? 'أدخل قيمة' : 'Enter value',
        style: {
          color: "#333333", 
          fontSize: "1rem", 
          borderColor: "#e2e8f0", 
          borderWidth: "1px", 
          borderRadius: "0.5rem", 
          backgroundColor: "#ffffff"
        }
      };
      
      // إضافة الحقل إلى البيانات
      const updatedFormData = [...formData, newField];
      onChange(updatedFormData);
      
      // تخزين محلي للتغييرات
      try {
        localStorage.setItem('form_builder_last_field', JSON.stringify(newField));
      } catch (cacheError) {
        console.error('Error caching last field:', cacheError);
      }
    } catch (error) {
      console.error('Error adding field:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء إضافة الحقل. يرجى المحاولة مرة أخرى.' 
        : 'An error occurred while adding the field. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // حذف حقل من النموذج
  const removeField = (index: number) => {
    try {
      const updatedFormData = [...formData];
      updatedFormData.splice(index, 1);
      onChange(updatedFormData);
    } catch (error) {
      console.error('Error removing field:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء حذف الحقل.' 
        : 'Error removing field.');
    }
  };
  
  return (
    <div className="form-builder space-y-4">
      {/* عرض رسائل الخطأ */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* قائمة الحقول الحالية */}
      {formData && formData.length > 0 ? (
        <div className="space-y-2">
          {formData.map((field, index) => (
            <div key={field.id || index} className="p-3 border rounded bg-white flex justify-between items-center">
              <div>
                <span className="font-medium">{field.label || `Field ${index + 1}`}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({FIELD_TYPES.find(t => t.id === field.type)?.name_en || field.type})
                </span>
                {field.required && (
                  <span className="ml-2 text-red-500 text-xs">*</span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeField(index)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {language === 'ar' ? 'حذف' : 'Remove'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border rounded-md bg-gray-50">
          {language === 'ar' 
            ? 'لم تتم إضافة أي حقول بعد. أضف حقولًا لبدء إنشاء النموذج.'
            : 'No fields added yet. Add fields to start building your form.'}
        </div>
      )}
      
      {/* أزرار إضافة حقل */}
      <div className="pt-4 border-t">
        <h3 className="mb-2 font-medium">
          {language === 'ar' ? 'إضافة حقل جديد' : 'Add New Field'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.map(type => (
            <Button 
              key={type.id}
              variant="outline" 
              size="sm"
              onClick={() => addField(type.id)}
              className="flex items-center"
              disabled={isProcessing}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {language === 'ar' ? type.name : type.name_en}
            </Button>
          ))}
        </div>
      </div>
      
      {/* عرض معلومات الوضع غير المتصل */}
      {isOfflineMode && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200 rounded-md">
          {language === 'ar'
            ? 'أنت تعمل في وضع عدم الاتصال. سيتم حفظ التغييرات محليًا حتى يتم استعادة الاتصال.'
            : 'You are working in offline mode. Changes will be saved locally until connection is restored.'}
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
