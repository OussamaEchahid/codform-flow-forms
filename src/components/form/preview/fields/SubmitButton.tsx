
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';

interface SubmitButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};

  // عرض الزر بعرض كامل أو لا
  const fullWidth = fieldStyle.fullWidth !== false; // افتراضيًا يأخذ العرض الكامل
  
  // تنسيق الأيقونة والحركة
  const hasAnimation = fieldStyle.animation;
  const animationType = fieldStyle.animationType || 'pulse';

  // نص الزر
  const buttonText = field.label || (language === 'ar' ? 'إرسال' : 'Submit');
  
  // موضع الأيقونة - يمين أو يسار
  // إذا لم يتم تحديد موضع الأيقونة، استخدم القيمة الافتراضية بناءً على اللغة
  const iconPosition = fieldStyle.iconPosition || (language === 'ar' ? 'right' : 'left');
  
  // نمط العرض لزر الإرسال
  const buttonStyle = {
    backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: fieldStyle.color || '#ffffff',
    borderRadius: fieldStyle.borderRadius || formStyle.borderRadius || '8px',
    fontSize: fieldStyle.fontSize || '18px',
    fontWeight: fieldStyle.fontWeight || '600',
    padding: '14px 24px',
    width: fullWidth ? '100%' : 'auto',
    cursor: 'pointer',
    border: `${fieldStyle.borderWidth || '0px'} solid ${fieldStyle.borderColor || 'transparent'}`,
    fontFamily: fieldStyle.fontFamily || 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease-in-out',
    marginTop: '14px',
    position: 'relative',
    lineHeight: '1.2',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  // CSS class للحركة
  const animationClass = hasAnimation ? `${animationType}-animation` : '';
  
  // إنشاء معرف فريد لهذا الزر
  const buttonId = `submit-button-${field.id}-${Date.now()}`;
  
  return (
    <div 
      className={cn('w-full flex', fullWidth ? 'justify-stretch' : 'justify-center')}
      data-submit-button={true}
      data-field-id={field.id}
      data-animation={hasAnimation ? animationType : 'none'}
      data-button-width={fullWidth ? 'full' : 'auto'}
      data-button-id={buttonId}
      data-icon-position={iconPosition}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <button
        id={buttonId}
        type="submit"
        className={cn('codform-submit-btn', animationClass)}
        style={buttonStyle}
        data-submit-type="codform-submit"
        data-theme-color={formStyle.primaryColor}
        data-animation-type={animationType}
      >
        {/* عرض الأيقونة على اليسار إذا كان موضع الأيقونة يسار */}
        {iconPosition === 'left' && (
          <ArrowRight className="rtl:rotate-180 w-5 h-5" />
        )}
        
        {/* نص الزر */}
        <span>{buttonText}</span>
        
        {/* عرض الأيقونة على اليمين إذا كان موضع الأيقونة يمين */}
        {iconPosition === 'right' && (
          <ArrowRight className="rtl:rotate-180 w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default SubmitButton;
