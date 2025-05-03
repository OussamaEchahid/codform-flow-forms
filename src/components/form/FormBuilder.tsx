
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
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  
  // Generate unique IDs for fields that may be missing them
  useEffect(() => {
    if (formData && Array.isArray(formData)) {
      let hasChanges = false;
      
      const updatedFormData = formData.map(field => {
        if (!field.id) {
          hasChanges = true;
          return {
            ...field,
            id: `field-${uuidv4().substring(0, 8)}` // Generate ID for fields missing one
          };
        }
        return field;
      });
      
      if (hasChanges) {
        console.log('Fixed missing field IDs in form data');
        onChange(updatedFormData);
      }
    }
  }, [formData, onChange]);
  
  // Debounce implementation to prevent rapid clicks
  useEffect(() => {
    if (pendingOperation && !isProcessing) {
      setIsProcessing(true);
      
      const timer = setTimeout(() => {
        try {
          if (pendingOperation.startsWith('add:')) {
            const fieldType = pendingOperation.split(':')[1];
            
            // Create new field with proper ID and name attributes
            const fieldId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const newField = {
              id: fieldId,
              name: fieldId, // Add name attribute
              type: fieldType,
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
          } else if (pendingOperation.startsWith('remove:')) {
            const index = parseInt(pendingOperation.split(':')[1]);
            if (!isNaN(index)) {
              const updatedFormData = [...formData];
              updatedFormData.splice(index, 1);
              onChange(updatedFormData);
            }
          }
        } catch (error) {
          console.error('Error processing operation:', error);
          setError(language === 'ar' 
            ? 'حدث خطأ أثناء معالجة العملية. يرجى المحاولة مرة أخرى.' 
            : 'An error occurred processing the operation. Please try again.');
        } finally {
          setIsProcessing(false);
          setPendingOperation(null);
        }
      }, 300); // Debounce delay
      
      return () => clearTimeout(timer);
    }
  }, [pendingOperation, isProcessing, formData, onChange, language]);
  
  // Add field to the form
  const addField = (type: string) => {
    if (isProcessing) return;
    
    setError(null);
    setPendingOperation(`add:${type}`);
  };
  
  // Remove field from the form
  const removeField = (index: number) => {
    if (isProcessing) return;
    
    setPendingOperation(`remove:${index}`);
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

