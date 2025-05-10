
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { 
  TextIcon, 
  Mail, 
  Phone, 
  AlignLeft, 
  Image, 
  MessageSquare,
  CheckSquare,
  RadioIcon,
  Calendar,
  MenuSquare
} from 'lucide-react';

export interface ElementPanelProps {
  onAddField: (fieldType: string) => void;
}

const ElementPanel: React.FC<ElementPanelProps> = ({ onAddField }) => {
  const { language } = useI18n();
  
  const fieldTypes = [
    {
      type: 'text',
      label: language === 'ar' ? 'حقل نص' : 'Text Field',
      icon: <TextIcon className="w-4 h-4" />
    },
    {
      type: 'email',
      label: language === 'ar' ? 'بريد إلكتروني' : 'Email',
      icon: <Mail className="w-4 h-4" />
    },
    {
      type: 'phone',
      label: language === 'ar' ? 'هاتف' : 'Phone',
      icon: <Phone className="w-4 h-4" />
    },
    {
      type: 'textarea',
      label: language === 'ar' ? 'نص متعدد الأسطر' : 'Text Area',
      icon: <AlignLeft className="w-4 h-4" />
    },
    {
      type: 'checkbox',
      label: language === 'ar' ? 'خانة اختيار' : 'Checkbox',
      icon: <CheckSquare className="w-4 h-4" />
    },
    {
      type: 'radio',
      label: language === 'ar' ? 'زر راديو' : 'Radio Button',
      icon: <RadioIcon className="w-4 h-4" />
    },
    {
      type: 'select',
      label: language === 'ar' ? 'قائمة منسدلة' : 'Dropdown',
      icon: <MenuSquare className="w-4 h-4" />
    },
    {
      type: 'date',
      label: language === 'ar' ? 'تاريخ' : 'Date',
      icon: <Calendar className="w-4 h-4" />
    },
    {
      type: 'image',
      label: language === 'ar' ? 'صورة' : 'Image',
      icon: <Image className="w-4 h-4" />
    },
    {
      type: 'whatsapp',
      label: language === 'ar' ? 'واتساب' : 'WhatsApp',
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];
  
  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'عناصر النموذج' : 'Form Elements'}
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {fieldTypes.map((field) => (
          <Button
            key={field.type}
            variant="outline"
            size="sm"
            className="flex flex-col h-20 items-center justify-center gap-1 text-center"
            onClick={() => onAddField(field.type)}
          >
            <div>{field.icon}</div>
            <span className="text-xs">{field.label}</span>
          </Button>
        ))}
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">
          {language === 'ar' ? 'كيفية الاستخدام' : 'How to use'}
        </h4>
        <p className="text-xs text-gray-500">
          {language === 'ar' 
            ? 'انقر على عنصر لإضافته إلى النموذج. يمكنك بعد ذلك تخصيصه من خلال النقر عليه في المحرر.' 
            : 'Click on an element to add it to your form. You can then customize it by clicking on it in the editor.'}
        </p>
      </div>
    </div>
  );
};

export default ElementPanel;
