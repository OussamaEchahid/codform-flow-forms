
import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { FormField as FormFieldType } from '@/lib/form-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FieldEditorProps {
  field: FormFieldType;
  onSave: (field: FormFieldType) => void;
  onClose: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onClose }) => {
  const [editedField, setEditedField] = useState<FormFieldType>({ ...field });
  const [optionInput, setOptionInput] = useState('');

  const handleInputChange = (key: string, value: any) => {
    setEditedField(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addOption = () => {
    if (optionInput.trim() && editedField.options) {
      setEditedField(prev => ({
        ...prev,
        options: [...(prev.options || []), optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (option: string) => {
    if (editedField.options) {
      setEditedField(prev => ({
        ...prev,
        options: prev.options?.filter(o => o !== option)
      }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-right">
          <DialogTitle>تحرير الحقل: {field.label}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
            <TabsTrigger value="options" disabled={!['select', 'checkbox', 'radio'].includes(editedField.type)}>
              الخيارات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 py-4 text-right">
            <div className="grid gap-4">
              <FormItem>
                <FormLabel>عنوان الحقل</FormLabel>
                <FormControl>
                  <Input
                    value={editedField.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                  />
                </FormControl>
              </FormItem>
              
              <FormItem>
                <FormLabel>نص المساعدة</FormLabel>
                <FormControl>
                  <Input
                    value={editedField.placeholder || ''}
                    onChange={(e) => handleInputChange('placeholder', e.target.value)}
                    placeholder="أدخل نصًا مساعدًا..."
                  />
                </FormControl>
              </FormItem>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={editedField.required || false}
                  onChange={(e) => handleInputChange('required', e.target.checked)}
                />
                <label htmlFor="required">حقل مطلوب</label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4 py-4 text-right">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={addOption}
                >
                  إضافة
                </Button>
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="أضف خيارًا جديدًا"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
              </div>
              
              <div className="border rounded-md p-3">
                <h4 className="font-medium mb-2">الخيارات الحالية:</h4>
                {editedField.options && editedField.options.length > 0 ? (
                  <ul className="space-y-2">
                    {editedField.options.map((option, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeOption(option)}
                        >
                          حذف
                        </Button>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">لا توجد خيارات بعد</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => onSave(editedField)}>حفظ التغييرات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FieldEditor;
