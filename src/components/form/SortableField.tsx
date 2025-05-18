
import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Grip, Edit, Copy, Trash2 } from 'lucide-react';
import { FormField, FormFieldType } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFieldUpdate?: (updatedField: FormField) => void;
  isSelected?: boolean;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete,
  onFieldUpdate,
  isSelected = false
}) => {
  const { language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fieldValue, setFieldValue] = useState(() => {
    if (field.type === 'form-title') {
      return field.label || '';
    }
    return '';
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // استخدام مخطط أنواع آمن للحصول على اسم نوع الحقل المقروء
  const getFieldTypeName = (type: string): string => {
    // إنشاء تخطيط آمن النوع لأنواع الحقول إلى أسماء العرض الخاصة بها
    const fieldTypeMap: Record<string, { en: string, ar: string }> = {
      'text': { en: 'Text Input', ar: 'حقل نص' },
      'textarea': { en: 'Text Area', ar: 'منطقة نصية' },
      'select': { en: 'Dropdown', ar: 'قائمة منسدلة' },
      'radio': { en: 'Radio Buttons', ar: 'أزرار اختيار' },
      'checkbox': { en: 'Checkbox', ar: 'مربع اختيار' },
      'title': { en: 'Title', ar: 'عنوان' },
      'form-title': { en: 'Form Title', ar: 'عنوان النموذج' },
      'submit': { en: 'Submit Button', ar: 'زر إرسال' },
      'shipping': { en: 'Shipping Options', ar: 'خيارات الشحن' },
      'image': { en: 'Image', ar: 'صورة' },
      'countdown': { en: 'Countdown Timer', ar: 'عداد تنازلي' },
      'whatsapp': { en: 'WhatsApp Button', ar: 'زر واتساب' },
      'cart-items': { en: 'Cart Items', ar: 'عناصر السلة' },
      'cart-summary': { en: 'Cart Summary', ar: 'ملخص السلة' },
      'email': { en: 'Email Input', ar: 'بريد إلكتروني' },
      'phone': { en: 'Phone Input', ar: 'رقم هاتف' },
      'text/html': { en: 'HTML Content', ar: 'محتوى HTML' },
    };
    
    return fieldTypeMap[type] ? fieldTypeMap[type][language === 'ar' ? 'ar' : 'en'] : type;
  };

  // الاستجابة لتغييرات الحقل
  useEffect(() => {
    if (field.type === 'form-title') {
      setFieldValue(field.label || '');
    }
  }, [field.label, field.type]);

  // تحديث عنوان الحقل إذا لزم الأمر
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.type === 'form-title' && onFieldUpdate) {
      const newValue = e.target.value;
      setFieldValue(newValue);
      
      const updatedField: FormField = {
        ...field,
        label: newValue
      };
      
      onFieldUpdate(updatedField);
    }
  };

  // تحديث وصف الحقل إذا لزم الأمر
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.type === 'form-title' && onFieldUpdate) {
      const newValue = e.target.value;
      
      const updatedField: FormField = {
        ...field,
        helpText: newValue
      };
      
      onFieldUpdate(updatedField);
    }
  };

  // عرض معاينات مختلفة للحقول المختلفة بناءً على النوع
  const renderFieldPreview = () => {
    if (field.type === 'form-title') {
      // معالجة خاصة لعنوان النموذج
      const backgroundColor = field.style?.backgroundColor || 'var(--form-primary-color, #9b87f5)';
      const textColor = field.style?.color || '#ffffff';
      
      return (
        <div className="mb-3">
          <input
            type="text"
            className="w-full border-0 bg-transparent text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            value={fieldValue}
            onChange={handleTitleChange}
            placeholder={language === 'ar' ? "عنوان النموذج" : "Form Title"}
            style={{ color: textColor }}
          />
          <input
            type="text"
            className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary mt-1"
            value={field.helpText || ''}
            onChange={handleDescriptionChange}
            placeholder={language === 'ar' ? "وصف النموذج" : "Form Description"}
            style={{ color: textColor }}
          />
          
          <div className="flex gap-2 mt-2">
            <Badge style={{ backgroundColor, color: textColor }}>
              {language === 'ar' ? 'معاينة اللون' : 'Color Preview'}
            </Badge>
          </div>
        </div>
      );
    }
    
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        {field.label || field.placeholder || getFieldTypeName(field.type)}
        {field.required && <span className="text-red-500 ms-1">*</span>}
        
        {field.icon && field.icon !== 'none' && (
          <span className="ms-2 inline-flex items-center">
            <Badge variant="outline">
              {language === 'ar' ? 'أيقونة' : 'Icon'}: {field.icon}
            </Badge>
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={cn(
        "border rounded-lg mb-3 overflow-hidden",
        isDragging ? "shadow-lg" : "",
        isSelected ? "ring-2 ring-[var(--form-primary-color,#9b87f5)]" : ""
      )}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-0">
          <div className="flex items-center px-4 py-2 bg-gray-50">
            <div
              className="mr-2 cursor-grab touch-none"
              {...listeners}
            >
              <Grip className="h-5 w-5 text-gray-400" />
            </div>
            
            <Badge className="mr-2" variant={field.type === 'form-title' ? 'destructive' : 'outline'}>
              {getFieldTypeName(field.type)}
            </Badge>
            
            <div className="flex-grow">
              {field.type === 'form-title' ? (
                <span className="font-medium">{field.label || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}</span>
              ) : (
                <span>{field.label || field.placeholder || getFieldTypeName(field.type)}</span>
              )}
            </div>
            
            <AccordionTrigger 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="flex h-8 w-8 p-0 data-[state=open]:text-primary"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </AccordionTrigger>
          </div>
          
          <AccordionContent>
            <div className="p-3 border-t">
              {renderFieldPreview()}
              
              <div className="flex justify-end gap-1 mt-2 space-x-1 rtl:space-x-reverse">
                <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
                  <Edit className="h-4 w-4" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                
                <Button size="sm" variant="outline" onClick={onDuplicate} className="gap-1">
                  <Copy className="h-4 w-4" />
                  {language === 'ar' ? 'نسخ' : 'Duplicate'}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onDelete} 
                  className="gap-1 text-destructive hover:text-destructive"
                  disabled={field.type === 'form-title'}
                >
                  <Trash2 className="h-4 w-4" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SortableField;
