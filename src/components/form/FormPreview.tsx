
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
}) => {
  const { language } = useI18n();
  
  // تحسين معالجة الحقول وإعدادها بشكل صحيح
  const sanitizedFields = React.useMemo(() => {
    // ضمان أن حقول عناصر السلة وملخص السلة لها تسميات فارغة افتراضيًا
    const updatedFields = fields.map(field => {
      // نسخ الحقل لتجنب مشاكل التغيير المباشر
      const updatedField = { ...field };
      
      // تعيين تسمية فارغة افتراضية لعناصر السلة والملخص
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // تحويل الأيقونة الفارغة إلى 'none' لمعالجة متسقة
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // التأكد من تعريف style.showIcon إذا كانت الأيقونة موجودة
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تعيين showIcon إلى true افتراضيًا إذا كانت الأيقونة موجودة ولم يتم تعيينها صراحة إلى false
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // ضمان وجود خصائص النمط الأساسية
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // تأكد من تحديد حجم الخط بشكل صريح بالبكسل
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        // تحويل rem إلى px إذا لزم الأمر
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          // إذا كان رقمًا بدون وحدة، نفترض أنه بكسل
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
    
    // إذا كان هناك بالفعل عنوان للنموذج، استخدمه
    if (updatedFields.some(field => field.type === 'form-title')) {
      return updatedFields;
    }
    
    // إذا لم يكن هناك عنوان للنموذج، أضف واحدًا في البداية بأحجام بكسل محددة
    const formTitleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '24px', // استخدام بكسل ثابت 
        descriptionColor: 'rgba(255, 255, 255, 0.9)',
        descriptionFontSize: '14px', // استخدام بكسل ثابت
        backgroundColor: formStyle.primaryColor || '#9b87f5', // لون خلفية أساسي
      }
    };
    
    // التحقق مما إذا كان هناك زر إرسال بالفعل
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...updatedFields.filter(f => f.type !== 'form-title')];
    
    // إذا لم يكن هناك زر إرسال، أضف واحدًا
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px', // استخدام بكسل ثابت
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle.primaryColor]);
  
  // إنشاء معرف فريد لهذا النموذج لضمان التحديث الصحيح
  const formId = React.useMemo(() => `form-preview-${Date.now()}`, []);
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: '#ffffff', // تثبيت لون خلفية
      } as React.CSSProperties}
      data-form-preview-id={formId}
      data-primary-color={formStyle.primaryColor}
      data-border-radius={formStyle.borderRadius}
      data-font-size={formStyle.fontSize}
      data-button-style={formStyle.buttonStyle}
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
        className="p-3" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
          backgroundColor: '#ffffff', // تثبيت لون خلفية
        }}
        data-direction={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-2">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* عرض الزر العائم إذا كان ممكّنًا وغير مخفي لأغراض المعاينة */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default FormPreview;
