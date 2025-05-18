
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Check, Send, Phone } from 'lucide-react';

interface SubmitButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const style = field.style || {};
  
  // تحديد الاتجاه بناءً على خاصية formDirection أو اللغة
  const textDir = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // الحصول على فئة الرسوم المتحركة إذا تم تعيينها
  const getAnimationClass = () => {
    if (style.animation !== true) return '';
    
    const animationType = style.animationType || 'pulse';
    switch (animationType) {
      case 'pulse': return 'pulse-animation';
      case 'shake': return 'shake-animation';
      case 'bounce': return 'bounce-animation';
      case 'wiggle': return 'wiggle-animation';
      case 'flash': return 'flash-animation';
      default: return '';
    }
  };

  const animationClass = getAnimationClass();
  
  // نمط الزر الافتراضي مع قيم بكسل دقيقة مطابقة للمعاينة
  const buttonStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: style.color || '#ffffff',
    fontSize: style.fontSize || '18px',
    fontWeight: style.fontWeight || '600',
    borderRadius: style.borderRadius || formStyle.borderRadius || '8px',
    borderColor: style.borderColor || 'transparent',
    borderWidth: style.borderWidth || '0px',
    borderStyle: 'solid',
    padding: '14px 24px',
    paddingTop: style.paddingY || '14px',
    paddingBottom: style.paddingY || '14px',
    paddingLeft: style.paddingX || '24px',
    paddingRight: style.paddingX || '24px',
    width: style.fullWidth === false ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: style.fontFamily || 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'center'
  };
  
  // تقديم الأيقونة بحجم وموضع متناسقين
  const renderIcon = () => {
    if (!style.showIcon) return null;
    
    // إضافة نمط محدد للأيقونة لمطابقة المعاينة بالضبط
    const iconStyle = {
      width: '18px',
      height: '18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    // إرجاع مكونات أيقونة Lucide React بناءً على اسم الأيقونة
    switch (style.icon?.toLowerCase()) {
      case 'shopping-cart':
        return <ShoppingCart size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'arrow-right':
        return textDir === 'rtl' ? 
          <ArrowRight size={18} color={style.color || '#ffffff'} style={{ ...iconStyle, transform: 'scaleX(-1)' }} /> : 
          <ArrowRight size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'check':
        return <Check size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'send':
        return <Send size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'cart':
      case 'shopping-bag':
        return <ShoppingCart size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'phone':
        return <Phone size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      default:
        return <ShoppingCart size={18} color={style.color || '#ffffff'} style={iconStyle} />;
    }
  };

  // تحديد المحتوى والترتيب بناءً على موضع الأيقونة
  const iconPosition = style.iconPosition || (textDir === 'rtl' ? 'left' : 'right');
  const icon = renderIcon();
  
  console.log(`Rendering SubmitButton with styles:`, { 
    backgroundColor: style.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: style.color || '#ffffff',
    fontSize: style.fontSize || '18px',
    fontWeight: style.fontWeight || '600',
    borderRadius: style.borderRadius || formStyle.borderRadius || '8px',
    animation: style.animation ? style.animationType : 'none',
    iconPosition,
    hasIcon: style.showIcon,
    direction: textDir
  });

  return (
    <button
      type="button"
      disabled={false}
      className={cn(
        "codform-submit-btn", 
        animationClass,
      )}
      style={buttonStyle}
      dir={textDir}
      data-animation-type={style.animationType || 'none'}
      data-button-style={formStyle.buttonStyle || 'rounded'}
      data-has-animation={style.animation ? 'true' : 'false'}
      data-icon-position={iconPosition}
      data-has-icon={style.showIcon ? 'true' : 'false'}
      data-direction={textDir}
      data-button-id={field.id}
      data-button-color={style.color || '#ffffff'}
      data-button-bg-color={style.backgroundColor || formStyle.primaryColor || '#9b87f5'}
      data-button-font-size={style.fontSize || '18px'}
      data-button-font-weight={style.fontWeight || '600'}
      data-button-border-radius={style.borderRadius || formStyle.borderRadius || '8px'}
      data-button-padding-y={style.paddingY || '14px'}
      data-button-padding-x={style.paddingX || '24px'}
      data-button-icon={style.icon || 'shopping-cart'}
    >
      {iconPosition === 'left' && icon}
      <span className="btn-text">{field.label || (language === 'ar' ? 'إرسال الطلب' : 'Submit Order')}</span>
      {iconPosition === 'right' && icon}
    </button>
  );
};

export default SubmitButton;
