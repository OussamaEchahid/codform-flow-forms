import React, { useState, useCallback, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import EditFormTitleEditor from './editor/EditFormTitleEditor';

interface FieldEditorProps {
  field: FormField;
  onSave: (updatedField: FormField) => void;
  onClose: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onClose }) => {
  const { language } = useI18n();
  
  // Local state to hold the field data
  const [editedField, setEditedField] = useState<FormField>(field);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Function to handle changes in the field data
  const handleFieldChange = useCallback((updatedField: FormField) => {
    console.log("Field changed in editor:", updatedField);
    setEditedField(updatedField);
    // Force refresh to ensure the preview updates
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Effect to update the edited field when original field changes
  useEffect(() => {
    console.log("FieldEditor: Original field updated, syncing to local state", field.id);
    setEditedField({...field});
  }, [field]);
  
  // Function to handle saving the changes
  const handleSave = useCallback(() => {
    try {
      // Create a deep copy to avoid reference issues
      const finalField = JSON.parse(JSON.stringify(editedField));
      
      // Ensure style object exists and required properties are set
      if (finalField.type === 'edit-form-title' || finalField.type === 'form-title') {
        if (!finalField.style) finalField.style = {};
        // Set default values if not present
        if (finalField.style.textAlign === undefined) {
          finalField.style.textAlign = 'center';
        }
        if (finalField.style.showDescription === undefined) {
          finalField.style.showDescription = true;
        }
      }
      
      console.log("Saving field with final values:", finalField);
      onSave(finalField);
    } catch (error) {
      console.error("Error saving field:", error);
    }
  }, [onSave, editedField]);
  
  // Log the field type when editor opens
  console.log(`FieldEditor opened for field type: ${field.type} with ID: ${field.id}`);
  
  // Render different editor based on field type
  const renderFieldEditor = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'textarea':
        return (
          <Card className="mb-4">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field-label" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'اسم الحقل' : 'Field Label'}
                </Label>
                <Input
                  id="field-label"
                  value={editedField.label || ''}
                  onChange={(e) => handleFieldChange({ ...editedField, label: e.target.value })}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="field-placeholder" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'تلميح' : 'Placeholder'}
                </Label>
                <Input
                  id="field-placeholder"
                  value={editedField.placeholder || ''}
                  onChange={(e) => handleFieldChange({ ...editedField, placeholder: e.target.value })}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>
        );
      
      case 'edit-form-title':
      case 'form-title':
        console.log('Rendering EditFormTitleEditor with field:', editedField);
        return (
          <EditFormTitleEditor
            key={`title-editor-${refreshKey}-${editedField.id}`}
            field={editedField}
            onChange={handleFieldChange}
          />
        );
      
      case 'select':
      case 'checkbox':
      case 'radio':
        return (
          <Card className="mb-4">
            <CardContent className="pt-6 space-y-4">
              <p>
                {language === 'ar'
                  ? 'خيارات التحديد غير قابلة للتحرير في هذا المثال'
                  : 'Select options are not editable in this example'}
              </p>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card className="mb-4">
            <CardContent className="pt-6 space-y-4">
              <p>
                {language === 'ar'
                  ? 'هذا الحقل غير قابل للتحرير'
                  : 'This field is not editable'}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center overflow-y-auto">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'تعديل الحقل' : 'Edit Field'}
          </CardTitle>
        </CardHeader>
        
        {renderFieldEditor()}
        
        <CardContent className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="button" onClick={handleSave}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldEditor;
