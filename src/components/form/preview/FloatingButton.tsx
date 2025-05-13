
import React from 'react';
import { FloatingButtonConfig } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart, Package, Truck, Send } from 'lucide-react';
import '@/components/form/builder/floating-button.css'; // Import animations

interface FloatingButtonProps {
  config: FloatingButtonConfig;
  isPreview?: boolean;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ config, isPreview = false }) => {
  const { language } = useI18n();
  
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
        return <ShoppingCart size={16} />;
      case 'package':
        return <Package size={16} />;
      case 'truck':
        return <Truck size={16} />;
      case 'send':
        return <Send size={16} />;
      default:
        return <ShoppingCart size={16} />;
    }
  };
  
  // Scroll to form handler
  const handleClick = () => {
    // Only execute scroll if we're not in preview mode
    if (!isPreview) {
      const formElement = document.querySelector('.codform-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  // Set fixed minimum width for better appearance
  const minWidth = '250px'; // Increased minimum width to make it longer
  
  return (
    <div 
      className={`codform-floating-button-container ${config.enabled ? '' : 'hidden'}`}
      style={{
        position: 'fixed',
        bottom: config.marginBottom || '20px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 999,
      }}
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
          transition: 'transform 0.2s ease, opacity 0.3s ease',
          direction: language === 'ar' ? 'rtl' : 'ltr',
          width: 'auto',
          minWidth: minWidth,
          opacity: '1',
          visibility: 'visible',
        }}
        onClick={handleClick}
      >
        {(language === 'ar' || !config.showIcon) && (
          <span>{config.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}</span>
        )}
        
        {config.showIcon && getIcon()}
        
        {language !== 'ar' && config.showIcon && (
          <span>{config.text || 'Order Now'}</span>
        )}
      </button>
    </div>
  );
};

export default FloatingButton;
