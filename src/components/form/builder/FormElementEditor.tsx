
import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface FormElementEditorProps {
  elements: FormField[];
  selectedIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
  onReorderElements?: (newOrder: FormField[]) => void;
  onUpdateElement?: (index: number, updatedElement: FormField) => void;
}

const FormElementEditor: React.FC<FormElementEditorProps> = ({
  elements,
  selectedIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
  onUpdateElement
}) => {
  const { language } = useI18n();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ضبط السحب والإفلات ليكون أكثر استجابة
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 3 // أكثر حساسية للسحب
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // إعادة تحميل سياق DndContext عندما تتغير العناصر
  useEffect(() => {
    console.log("FormElementEditor: Elements updated, refreshing DndContext");
    setRefreshKey(prev => prev + 1);
  }, [elements.length]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    console.log("Drag ended. Moving from", active.id, "to", over.id);
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      const newElements = arrayMove(elements, oldIndex, newIndex);
      onReorderElements(newElements);
      toast.success(language === 'ar' ? "تم إعادة ترتيب العناصر بنجاح" : "Elements reordered successfully");
    }
  };
  
  // معالجة تحديث العناصر عند تعديلها مباشرة من SortableField
  const handleElementUpdate = (index: number, field: FormField) => {
    try {
      console.log("Updating element", field.id, "at index", index);
      
      // نسخ عميق للحقل لتجنب مشاكل المراجع
      const updatedField = JSON.parse(JSON.stringify(field));
      
      // تطبيع قيمة الأيقونة (تحويل السلسلة الفارغة إلى 'none')
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // تأكد من إعدادات الأيقونة الصحيحة
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تعيين showIcon بناءً على القيمة الموجودة أو الافتراضية إلى صحيح إذا كانت الأيقونة موجودة
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // معالجة تنسيق عنوان النموذج المحدد
      if (updatedField.type === 'form-title' || updatedField.type === 'edit-form-title' || updatedField.type === 'title') {
        // تأكد من وجود كائن النمط
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تأكد من أن لدينا محاذاة نص محددة
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = 'center';
        }
        
        // تأكد من أن حالة إظهار الوصف متاحة
        if (updatedField.style.showTitle === undefined) {
          updatedField.style.showTitle = true;
        }
        
        // وضع القيمة الافتراضية لإظهار الوصف إلى صحيح إذا لم تكن محددة صراحةً
        if (updatedField.style.showDescription === undefined) {
          updatedField.style.showDescription = true;
        }
        
        // ضبط أحجام الخطوط إذا لم تكن محددة
        if (!updatedField.style.titleFontSize) {
          updatedField.style.titleFontSize = '24px';
        }
        
        if (!updatedField.style.descriptionFontSize) {
          updatedField.style.descriptionFontSize = '14px';
        }
        
        console.log("Updated form title field:", JSON.stringify(updatedField.style, null, 2));
      }
      
      // إخطار المكون الأصلي حول التحديث
      if (onUpdateElement) {
        onUpdateElement(index, updatedField);
        console.log(`Element ${updatedField.id} at index ${index} updated with:`, updatedField);
      }
      
      // إجبار تحديث المعاينة عن طريق تحديد العنصر مرة أخرى
      onSelectElement(index);
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error(language === 'ar' ? "حدث خطأ أثناء تحديث الحقل" : "Error updating field");
    }
  };
  
  // التحقق مما إذا كانت هناك عناصر للعرض
  const hasElements = elements.length > 0;

  return (
    <div className="space-y-4">
      {!hasElements && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            {language === 'ar' 
              ? 'لا توجد عناصر في النموذج. أضف بعض العناصر من القائمة الجانبية.' 
              : 'No elements in the form. Add some elements from the sidebar.'}
          </p>
        </div>
      )}
      
      <DndContext 
        key={`dnd-context-${refreshKey}`}
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={elements.map(element => element.id)} strategy={verticalListSortingStrategy}>
          {elements.map((element, index) => (
            <SortableField 
              key={`${element.id}-${refreshKey}`}
              field={element} 
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)}
              onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
              selected={selectedIndex === index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FormElementEditor;
