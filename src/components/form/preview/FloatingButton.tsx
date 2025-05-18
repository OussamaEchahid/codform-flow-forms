
import React from 'react';
import { FloatingButtonConfig } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart, Package, Truck, Send } from 'lucide-react';
import '@/components/form/builder/floating-button.css'; // استيراد الرسوم المتحركة

interface FloatingButtonProps {
  config: FloatingButtonConfig;
  isPreview?: boolean;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ config, isPreview = false }) => {
  const { language } = useI18n();
  
  // تسجيل معلومات عن تهيئة الزر للتصحيح
  React.useEffect(() => {
    console.log('FloatingButton config:', config);
  }, [config]);
  
  const getAnimationClass = () => {
    if (!config.animation || config.animation === 'none') return '';
    
    switch (config.animation) {
      case 'pulse':
        return 'pulse-animation';
      case 'shake':
        return 'shake-animation';
      case 'bounce':
        return 'bounce-animation';
      case 'wiggle':
        return 'wiggle-animation';
      case 'flash':
        return 'flash-animation';
      default:
        return '';
    }
  };
  
  const getIcon = () => {
    if (!config.showIcon) return null;
    
    switch (config.icon) {
      case 'shopping-cart':
        return <ShoppingCart className="floating-button-icon" size={16} />;
      case 'package':
        return <Package className="floating-button-icon" size={16} />;
      case 'truck':
        return <Truck className="floating-button-icon" size={16} />;
      case 'send':
        return <Send className="floating-button-icon" size={16} />;
      default:
        return <ShoppingCart className="floating-button-icon" size={16} />;
    }
  };
  
  // معالج التمرير إلى النموذج
  const handleClick = () => {
    // تنفيذ التمرير فقط إذا لم نكن في وضع المعاينة
    if (!isPreview) {
      const formElement = document.querySelector('.codform-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  // حساب العرض بناءً على المحتوى
  const minWidth = '180px'; // تعيين الحد الأدنى للعرض لجعله أطول
  
  return (
    <div 
      className="codform-floating-button-container"
      style={{
        position: 'fixed',
        bottom: config.marginBottom || '20px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 999,
      }}
      data-button-dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-button-animation={config.animation || 'none'}
    >
      <button
        className={`codform-floating-button ${getAnimationClass()}`}
        style={{
          backgroundColor: config.backgroundColor || '#000000',
          color: config.textColor || '#ffffff',
          borderRadius: config.borderRadius || '4px',
          borderWidth: config.borderWidth || '0px',
          borderStyle: config.borderWidth ? 'solid' : 'none',
          borderColor: config.borderColor || '#000000',
          padding: `${config.paddingY || '12px'} 24px`,
          fontSize: config.fontSize || '16px',
          fontWeight: config.fontWeight || '500',
          fontFamily: config.fontFamily || 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease',
          direction: language === 'ar' ? 'rtl' : 'ltr',
          width: 'auto',
          minWidth: minWidth,
        }}
        onClick={handleClick}
      >
        {(language === 'ar' || !config.showIcon) && (
          <span className="floating-button-text">
            {config.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
          </span>
        )}
        
        {config.showIcon && getIcon()}
        
        {language !== 'ar' && config.showIcon && (
          <span className="floating-button-text">
            {config.text || 'Order Now'}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingButton;
