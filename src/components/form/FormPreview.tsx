
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import FloatingButton from './preview/FloatingButton';

interface FormPreviewProps {
  formTitle: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  fields?: FormField[];
  hideHeader?: boolean;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
  formDirection?: 'ltr' | 'rtl';
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '16px',
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
  formDirection,
}) => {
  const { language } = useI18n();
  
  // استخدام خاصية formDirection إذا تم توفيرها، وإلا فالرجوع إلى الاتجاه المعتمد على اللغة
  const direction = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // تحسين معالجة الحقول للعرض المتناسق
  const sanitizedFields = React.useMemo(() => {
    // ضمان أن حقول عناصر السلة وملخص السلة لها تسميات فارغة افتراضيًا
    const updatedFields = fields.map(field => {
      // نسخ الحقل لتجنب مشاكل التعديل المباشر
      const updatedField = { ...field };
      
      // تعيين تسمية افتراضية فارغة لعناصر السلة والملخص
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // تحويل الأيقونة الفارغة إلى 'none' للتعامل المتسق
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // التأكد من تعريف style.showIcon إذا كانت الأيقونة موجودة
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // ضمان وجود خصائص النمط الأساسية
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // التأكد من تحديد حجم الخط بشكل صريح مع وحدة px
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // بالنسبة لحقول العنوان، ضمان محاذاة النص إلى الوسط
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        updatedField.style.textAlign = 'center';
      }
      
      return updatedField;
    });
    
    // إذا كان هناك بالفعل حقل عنوان للنموذج، استخدمه
    if (updatedFields.some(field => field.type === 'form-title')) {
      return updatedFields;
    }
    
    // إذا لم يكن هناك حقل عنوان للنموذج موجود، أضف واحدًا في البداية مع أحجام بكسل محددة
    const formTitleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '24px',
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px',
        backgroundColor: formStyle.primaryColor || '#9b87f5',
      }
    };
    
    // التحقق مما إذا كان هناك بالفعل زر إرسال
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...updatedFields.filter(f => f.type !== 'form-title')];
    
    // إذا لم يكن هناك زر إرسال موجود، أضف واحدًا
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle.primaryColor]);
  
  // إنشاء معرّف فريد لهذا النموذج
  const formId = React.useMemo(() => `form-preview-${Date.now()}`, []);
  
  // استخدام لون خلفية متسق للنموذج
  const formBackgroundColor = "#F9FAFB";
  
  // فئة الاتجاه للنموذج
  const dirClass = direction === 'rtl' ? 'rtl' : 'ltr';
  
  // تسجيل اتجاه النموذج الحالي
  console.log(`تم رسم FormPreview مع الاتجاه: ${direction}`);
  
  return (
    <div 
      className={`rounded-lg border shadow-sm overflow-hidden codform-form ${dirClass}`}
      style={{
        fontSize: formStyle.fontSize,
        backgroundColor: formBackgroundColor,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
      data-form-preview-id={formId}
      data-direction={direction}
      dir={direction}
    >
      {totalSteps > 1 && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-1 flex">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div 
                    className={cn(
                      "h-2 flex-1",
                      i < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                    )}
                  ></div>
                  <div 
                    className={cn(
                      "rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium",
                      i + 1 === currentStep 
                        ? "bg-[var(--form-primary-color)] text-white" 
                        : i < currentStep 
                          ? "bg-[var(--form-primary-color)] text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div 
                      className={cn(
                        "h-2 flex-1",
                        i + 1 < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                      )}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div 
        className={`p-3 ${dirClass}`} 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: direction,
          backgroundColor: formBackgroundColor
        }}
        dir={direction}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-2" style={{backgroundColor: 'transparent'}}>
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
                formDirection={direction}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* عرض الزر العائم إذا كان ممكّنًا ولم يتم إخفاؤه للمعاينة */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
      
      {/* معلومات تصحيح الأخطاء (مخفية عن المستخدم ولكنها مفيدة للتطوير) */}
      <div style={{ display: 'none' }} data-debug-info>
        الاتجاه: {direction}
        معرّف النموذج: {formId}
        عدد الحقول: {sanitizedFields.length}
      </div>
    </div>
  );
};

export default FormPreview;
