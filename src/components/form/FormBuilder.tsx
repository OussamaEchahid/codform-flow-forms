
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';

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
  
  // Generate unique IDs for fields that may be missing them
  useEffect(() => {
    if (formData && Array.isArray(formData)) {
      let hasChanges = false;
      
      const updatedFormData = formData.map(field => {
        let updatedField = { ...field };
        let needsUpdate = false;
        
        // Ensure ID exists
        if (!updatedField.id) {
          updatedField.id = `field-${uuidv4().substring(0, 8)}`; // Generate ID for fields missing one
          needsUpdate = true;
        }
        
        // Ensure name attribute exists (fixes "form field element should have an id or name attribute" error)
        if (!updatedField.name) {
          updatedField.name = updatedField.id; // Use ID as name if missing
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          hasChanges = true;
        }
        
        return updatedField;
      });
      
      if (hasChanges) {
        console.log('Fixed missing field IDs and names in form data');
        onChange(updatedFormData);
      }
    }
  }, [formData, onChange]);
  
  // Add field to the form - direct implementation without debounce to fix the issue
  const addField = (type: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create unique ID for field
      const fieldId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Create new field with proper ID and name attributes
      const newField = {
        id: fieldId,
        name: fieldId, // Explicitly add name attribute to match ID
        type: type,
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
      
      // Add the field to form data
      const updatedFormData = [...formData, newField];
      onChange(updatedFormData);
      
      // Cache last field for recovery if needed
      try {
        localStorage.setItem('form_builder_last_field', JSON.stringify(newField));
      } catch (cacheError) {
        console.error('Error caching last field:', cacheError);
      }
    } catch (error) {
      console.error('Error adding field:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء إضافة الحقل. يرجى المحاولة مرة أخرى.' 
        : 'An error occurred adding the field. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Remove field from the form - direct implementation without debounce
  const removeField = (index: number) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const updatedFormData = [...formData];
      updatedFormData.splice(index, 1);
      onChange(updatedFormData);
    } catch (error) {
      console.error('Error removing field:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء إزالة الحقل. يرجى المحاولة مرة أخرى.' 
        : 'An error occurred removing the field. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="form-builder space-y-4">
      {/* Error messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Field list */}
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
                disabled={isProcessing}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                type="button"
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
      
      {/* Field type buttons */}
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
              type="button"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {language === 'ar' ? type.name : type.name_en}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Offline mode indicator */}
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
