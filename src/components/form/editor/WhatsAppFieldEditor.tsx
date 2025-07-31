import React, { useState } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useI18n } from '@/lib/i18n';
import { MessageSquare, Facebook, Instagram, Twitter, Youtube, Linkedin, Phone, Mail } from 'lucide-react';

interface WhatsAppFieldEditorProps {
  field: any;
  onSave: (field: any) => void;
  onClose: () => void;
}

const WhatsAppFieldEditor: React.FC<WhatsAppFieldEditorProps> = ({ field, onSave, onClose }) => {
  console.log('🔧 WhatsAppFieldEditor loaded with NEW settings interface!');
  const { t, language } = useI18n();
  const [buttonText, setButtonText] = useState(field.label || (language === 'ar' ? 'طلب عبر واتساب' : 'Order by WhatsApp'));
  const [whatsappNumber, setWhatsappNumber] = useState(field.whatsappNumber || '');
  const [message, setMessage] = useState(field.message || (language === 'ar' ? 'مرحباً، أنا مهتم بـ {product}. هل يمكنك تقديم مزيد من المعلومات؟' : 'Hello, I\'m interested in {product}. Can you provide more information?'));
  const [fontFamily, setFontFamily] = useState(field.style?.fontFamily || 'Tajawal');
  const [fontSize, setFontSize] = useState(field.style?.fontSize ? parseFloat(field.style.fontSize.replace('px', '').replace('rem', '')) : 16);
  const [fontWeight, setFontWeight] = useState(field.style?.fontWeight ? parseInt(field.style.fontWeight) : 400);
  const [textColor, setTextColor] = useState(field.style?.color || '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(field.style?.backgroundColor || '#25d366');
  const [paddingY, setPaddingY] = useState(field.style?.paddingY ? parseInt(field.style.paddingY) : 10);
  const [borderColor, setBorderColor] = useState(field.style?.borderColor || '#000000');
  const [borderRadius, setBorderRadius] = useState(field.style?.borderRadius ? parseInt(field.style.borderRadius) : 0);
  const [borderWidth, setBorderWidth] = useState(field.style?.borderWidth ? parseInt(field.style.borderWidth) : 0);
  const [animation, setAnimation] = useState(field.style?.animation || 'none');
  const [showIcon, setShowIcon] = useState(field.style?.showIcon !== false);
  const [iconColor, setIconColor] = useState(field.style?.iconColor || '#ffffff');
  const [selectedIcon, setSelectedIcon] = useState(field.style?.icon || 'whatsapp');
  const [isRequired, setIsRequired] = useState(field.required || false);

  const iconOptions = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
  ];

  const animationOptions = [
    { value: 'none', label: language === 'ar' ? 'بدون' : 'None' },
    { value: 'bounce', label: language === 'ar' ? 'نط' : 'Bounce' },
    { value: 'pulse', label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: 'shake', label: language === 'ar' ? 'اهتزاز' : 'Shake' },
  ];

  const handleSave = () => {
    const updatedField = {
      ...field,
      label: buttonText,
      whatsappNumber: whatsappNumber,
      message: message,
      required: isRequired,
      style: {
        ...field.style,
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight.toString(),
        color: textColor,
        backgroundColor: backgroundColor,
        paddingY: `${paddingY}px`,
        borderColor: borderColor,
        borderRadius: `${borderRadius}px`,
        borderWidth: `${borderWidth}px`,
        animation: animation,
        showIcon: showIcon,
        iconColor: iconColor,
        icon: selectedIcon,
      }
    };

    onSave(updatedField);
    onClose();
  };

  const IconComponent = iconOptions.find(icon => icon.value === selectedIcon)?.icon || MessageSquare;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="buttonText">{language === 'ar' ? 'النص' : 'Text'}</Label>
        <Input
          id="buttonText"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          placeholder={language === 'ar' ? 'طلب عبر واتساب' : 'Order by WhatsApp'}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">{language === 'ar' ? 'رقم الواتساب' : 'WhatsApp phone number'}</Label>
        <Input
          id="whatsappNumber"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="123456789"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fontFamily">{language === 'ar' ? 'نوع الخط' : 'Font family'}</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tajawal">Tajawal</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
              <SelectItem value="Cairo">Cairo</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'حجم الخط' : 'Font size'} ({fontSize}px)</Label>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={10}
            max={32}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'وزن النص' : 'Text weight'} ({fontWeight})</Label>
          <Slider
            value={[fontWeight]}
            onValueChange={([value]) => setFontWeight(value)}
            min={100}
            max={900}
            step={100}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="textColor">{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="textColor"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-12 h-10 p-1 border rounded"
            />
            <Input
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="backgroundColor">{language === 'ar' ? 'لون الخلفية' : 'Background color'}</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="backgroundColor"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-12 h-10 p-1 border rounded"
          />
          <Input
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            placeholder="#25d366"
            className="flex-1"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={language === 'ar' ? 'مرحباً، أنا مهتم بـ {product}. هل يمكنك تقديم مزيد من المعلومات؟' : 'Hello, I\'m interested in {product}. Can you provide more information?'}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'استخدم {product} لإظهار اسم المنتج' : 'Use {product} to show product name'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'المسافة العمودية' : 'Padding-Y'} ({paddingY})</Label>
          <Slider
            value={[paddingY]}
            onValueChange={([value]) => setPaddingY(value)}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="borderColor">{language === 'ar' ? 'لون الحدود' : 'Border color'}</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="borderColor"
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="w-12 h-10 p-1 border rounded"
            />
            <Input
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'انحناء الحدود' : 'Border radius'} ({borderRadius})</Label>
          <Slider
            value={[borderRadius]}
            onValueChange={([value]) => setBorderRadius(value)}
            min={0}
            max={30}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'عرض الحدود' : 'Border width'} ({borderWidth})</Label>
          <Slider
            value={[borderWidth]}
            onValueChange={([value]) => setBorderWidth(value)}
            min={0}
            max={30}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="animation">{language === 'ar' ? 'الحركة' : 'Animation'}</Label>
          <Select value={animation} onValueChange={setAnimation}>
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

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="showIcon" checked={showIcon} onCheckedChange={setShowIcon} />
            <Label htmlFor="showIcon">{language === 'ar' ? 'إظهار الأيقونة' : 'Show icon'}</Label>
          </div>
        </div>
      </div>

      {showIcon && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iconColor">{language === 'ar' ? 'لون الأيقونة' : 'Icon color'}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="iconColor"
                type="color"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">{language === 'ar' ? 'الأيقونة' : 'Icon'}</Label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <IconComponent size={16} />
                    <span>{iconOptions.find(icon => icon.value === selectedIcon)?.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon size={16} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Switch id="required" checked={isRequired} onCheckedChange={setIsRequired} />
        <Label htmlFor="required">{language === 'ar' ? 'مطلوب' : 'Required'}</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppFieldEditor;