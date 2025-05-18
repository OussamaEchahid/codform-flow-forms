
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, LayoutGrid, FileCheck } from 'lucide-react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface FieldTypeProps {
  onAddField: (type: FormField['type']) => void;
}

const FieldTypeList: React.FC<FieldTypeProps> = ({ onAddField }) => {
  const { language } = useI18n();
  
  const availableFieldTypes: Array<{
    type: FormField['type'];
    label: string;
    icon: React.ReactNode;
  }> = [
    { type: 'text', label: language === 'ar' ? 'حقل نص' : 'Text Input', icon: <FileText size={16} /> },
    { type: 'email', label: language === 'ar' ? 'بريد إلكتروني' : 'Email Input', icon: <FileText size={16} /> },
    { type: 'phone', label: language === 'ar' ? 'رقم هاتف' : 'Phone Number', icon: <FileText size={16} /> },
    { type: 'textarea', label: language === 'ar' ? 'نص متعدد الأسطر' : 'Text Area', icon: <FileText size={16} /> },
    { type: 'select', label: language === 'ar' ? 'قائمة منسدلة' : 'Dropdown', icon: <LayoutGrid size={16} /> },
    { type: 'checkbox', label: language === 'ar' ? 'خانة اختيار' : 'Checkbox', icon: <LayoutGrid size={16} /> },
    { type: 'radio', label: language === 'ar' ? 'زر راديو' : 'Radio Button', icon: <LayoutGrid size={16} /> },
    { type: 'cart-items', label: language === 'ar' ? 'المنتج المختار' : 'Selected Product', icon: <FileText size={16} /> },
    { type: 'cart-summary', label: language === 'ar' ? 'ملخص الطلب' : 'Order Summary', icon: <LayoutGrid size={16} /> },
    { type: 'submit', label: language === 'ar' ? 'زر إرسال الطلب' : 'Submit Button', icon: <FileCheck size={16} /> },
    { type: 'text/html', label: language === 'ar' ? 'نص/HTML' : 'Text/HTML', icon: <FileText size={16} /> },
    { type: 'title', label: language === 'ar' ? 'عنوان قسم' : 'Section Title', icon: <FileText size={16} /> },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-right">
        {language === 'ar' ? 'إضافة حقول' : 'Add Fields'}
      </h3>
      
      {availableFieldTypes.map((fieldType) => (
        <div 
          key={fieldType.type} 
          className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onAddField(fieldType.type)}
        >
          <Button variant="ghost" size="sm" className="p-0">
            <Plus size={16} />
          </Button>
          
          <div className="flex items-center gap-2 text-right">
            <span>{fieldType.label}</span>
            {fieldType.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FieldTypeList;
