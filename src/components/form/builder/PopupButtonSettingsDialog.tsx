import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useFormStore } from '@/hooks/useFormStore';
import { MousePointer, Settings } from 'lucide-react';

interface PopupButtonSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PopupButtonSettingsDialog: React.FC<PopupButtonSettingsDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { language } = useI18n();
  const { formState, setFormState } = useFormStore();

  // Popup Button Helpers
  const popupButton = formState?.style?.popupButton || { enabled: false };
  const isPopupEnabled = (popupButton as any).enabled || false;

  const updatePopupButton = (updates: any) => {
    setFormState({
      ...formState,
      style: {
        ...formState.style,
        popupButton: {
          enabled: false,
          text: language === 'ar' ? 'اطلب الآن' : 'Order Now',
          position: 'bottom-right',
          backgroundColor: formState.style?.primaryColor || '#9b87f5',
          textColor: '#ffffff',
          borderColor: formState.style?.primaryColor || '#9b87f5',
          borderWidth: '2px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          paddingY: '12px',
          showIcon: true,
          animation: 'none',
          ...formState.style?.popupButton,
          ...updates
        }
      }
    });
  };

  const positionOptions = [
    { value: 'bottom-right', label: language === 'ar' ? 'أسفل يمين' : 'Bottom Right' },
    { value: 'bottom-left', label: language === 'ar' ? 'أسفل يسار' : 'Bottom Left' },
    { value: 'top-right', label: language === 'ar' ? 'أعلى يمين' : 'Top Right' },
    { value: 'top-left', label: language === 'ar' ? 'أعلى يسار' : 'Top Left' },
    { value: 'center', label: language === 'ar' ? 'وسط الشاشة' : 'Center' }
  ];

  const animationOptions = [
    { value: 'none', label: language === 'ar' ? 'بدون حركة' : 'None' },
    { value: 'pulse', label: language === 'ar' ? 'نبضة' : 'Pulse' },
    { value: 'bounce', label: language === 'ar' ? 'قفز' : 'Bounce' },
    { value: 'shake', label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: 'wiggle', label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: 'flash', label: language === 'ar' ? 'وميض' : 'Flash' }
  ];

  // Get position styles for preview
  const getPositionPreviewStyle = (position: string) => {
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
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'pulse': return 'animate-pulse';
      case 'bounce': return 'animate-bounce';
      case 'shake': return 'animate-[shake_0.8s_infinite]';
      case 'wiggle': return 'animate-[wiggle_2s_ease-in-out_infinite]';
      case 'flash': return 'animate-[flash_2s_infinite]';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            {language === 'ar' ? 'إعدادات النافذة المنبثقة' : 'Popup Button Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel - Left Side */}
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">
                    {language === 'ar' ? 'تفعيل النافذة المنبثقة' : 'Enable Popup Button'}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' 
                      ? 'إظهار زر عائم في المتجر للتمرير إلى النموذج'
                      : 'Show floating button in store to scroll to form'
                    }
                  </p>
                </div>
                <Switch 
                  checked={isPopupEnabled}
                  onCheckedChange={(enabled) => updatePopupButton({ enabled })}
                />
              </div>

              {isPopupEnabled && (
                <>
                  {/* Button Text */}
                  <div>
                    <Label htmlFor="popup-text">
                      {language === 'ar' ? 'نص الزر' : 'Button Text'}
                    </Label>
                    <Input
                      id="popup-text"
                      value={(popupButton as any).text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
                      onChange={(e) => updatePopupButton({ text: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل نص الزر' : 'Enter button text'}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <Label htmlFor="popup-position">
                      {language === 'ar' ? 'موضع الزر' : 'Button Position'}
                    </Label>
                    <Select 
                      value={(popupButton as any).position || 'bottom-right'} 
                      onValueChange={(position) => updatePopupButton({ position })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="popup-bg-color">
                        {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                      </Label>
                      <Input
                        id="popup-bg-color"
                        type="color"
                        value={(popupButton as any).backgroundColor || '#9b87f5'}
                        onChange={(e) => updatePopupButton({ backgroundColor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-text-color">
                        {language === 'ar' ? 'لون النص' : 'Text Color'}
                      </Label>
                      <Input
                        id="popup-text-color"
                        type="color"
                        value={(popupButton as any).textColor || '#ffffff'}
                        onChange={(e) => updatePopupButton({ textColor: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Font Size and Border Radius */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="popup-font-size">
                        {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                      </Label>
                      <Input
                        id="popup-font-size"
                        value={(popupButton as any).fontSize || '16px'}
                        onChange={(e) => updatePopupButton({ fontSize: e.target.value })}
                        placeholder="16px"
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-border-radius">
                        {language === 'ar' ? 'انحناء الحواف' : 'Border Radius'}
                      </Label>
                      <Input
                        id="popup-border-radius"
                        value={(popupButton as any).borderRadius || '8px'}
                        onChange={(e) => updatePopupButton({ borderRadius: e.target.value })}
                        placeholder="8px"
                      />
                    </div>
                  </div>

                  {/* Animation */}
                  <div>
                    <Label htmlFor="popup-animation">
                      {language === 'ar' ? 'الحركة' : 'Animation'}
                    </Label>
                    <Select 
                      value={(popupButton as any).animation || 'none'} 
                      onValueChange={(animation) => updatePopupButton({ animation })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show Icon Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-base">
                      {language === 'ar' ? 'إظهار الأيقونة' : 'Show Icon'}
                    </Label>
                    <Switch 
                      checked={(popupButton as any).showIcon !== false}
                      onCheckedChange={(showIcon) => updatePopupButton({ showIcon })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Live Preview Panel - Right Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MousePointer size={18} />
              <Label className="text-lg font-semibold">
                {language === 'ar' ? 'المعاينة المباشرة' : 'Live Preview'}
              </Label>
            </div>

            {!isPopupEnabled ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <MousePointer size={48} className="mx-auto mb-2 opacity-50" />
                  <p>{language === 'ar' ? 'فعل الزر لرؤية المعاينة' : 'Enable button to see preview'}</p>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 rounded-lg p-4 min-h-64 border">
                <div className="text-center mb-4 text-sm text-gray-600">
                  {language === 'ar' ? 'محاكاة صفحة المتجر' : 'Store Page Simulation'}
                </div>
                
                {/* Simulated button in preview */}
                <div
                  className={`absolute ${getAnimationClass((popupButton as any).animation || 'none')}`}
                  style={{
                    ...getPositionPreviewStyle((popupButton as any).position || 'bottom-right'),
                    zIndex: 10
                  }}
                >
                  <Button
                    className="inline-flex items-center gap-2 shadow-lg"
                    style={{
                      backgroundColor: (popupButton as any).backgroundColor || '#9b87f5',
                      color: (popupButton as any).textColor || '#ffffff',
                      borderRadius: (popupButton as any).borderRadius || '8px',
                      fontSize: (popupButton as any).fontSize || '16px',
                      padding: '12px 24px'
                    }}
                  >
                    {(popupButton as any).showIcon !== false && '🛒'}
                    {(popupButton as any).text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
                  </Button>
                </div>

                {/* Position indicator */}
                <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {language === 'ar' ? 'الموضع:' : 'Position:'} {
                    positionOptions.find(p => p.value === ((popupButton as any).position || 'bottom-right'))?.label
                  }
                </div>
              </div>
            )}

            {/* Button Preview Card */}
            {isPopupEnabled && (
              <div className="p-4 bg-white rounded-lg border">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  {language === 'ar' ? 'مثال الزر' : 'Button Example'}
                </Label>
                <Button
                  className={`inline-flex items-center gap-2 ${getAnimationClass((popupButton as any).animation || 'none')}`}
                  style={{
                    backgroundColor: (popupButton as any).backgroundColor || '#9b87f5',
                    color: (popupButton as any).textColor || '#ffffff',
                    borderRadius: (popupButton as any).borderRadius || '8px',
                    fontSize: (popupButton as any).fontSize || '16px'
                  }}
                >
                  {(popupButton as any).showIcon !== false && '🛒'}
                  {(popupButton as any).text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupButtonSettingsDialog;