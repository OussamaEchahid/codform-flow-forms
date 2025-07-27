import React from 'react';

interface PopupButtonProps {
  config: {
    enabled: boolean;
    text: string;
    position: string;
    fontSize: string;
    fontWeight: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    borderRadius: string;
    paddingY: string;
    animation: string;
    showIcon: boolean;
  };
  onScroll: () => void;
}

const PopupButton: React.FC<PopupButtonProps> = ({ config, onScroll }) => {
  if (!config.enabled) return null;

  const getPositionStyle = (position: string) => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'center':
        return { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'shake':
        return 'animate-pulse'; // Use pulse as a substitute for shake
      case 'wiggle':
        return 'animate-pulse'; // Use pulse as a substitute for wiggle
      default:
        return '';
    }
  };

  const buttonText = config.showIcon ? `🛒 ${config.text}` : config.text;

  return (
    <button
      onClick={onScroll}
      className={`fixed z-50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${getAnimationClass(config.animation)}`}
      style={{
        ...getPositionStyle(config.position),
        backgroundColor: config.backgroundColor || '#9b87f5',
        color: config.textColor || '#ffffff',
        borderColor: config.borderColor || '#9b87f5',
        borderWidth: config.borderWidth || '2px',
        borderRadius: config.borderRadius || '8px',
        fontSize: config.fontSize || '16px',
        fontWeight: config.fontWeight || '600',
        padding: `${config.paddingY || '12px'} 24px`,
        border: 'solid',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        whiteSpace: 'nowrap'
      }}
    >
      {buttonText}
    </button>
  );
};

export default PopupButton;