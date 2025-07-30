import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin, 
  Phone, 
  Mail,
  GripVertical,
  Edit3,
  Copy,
  Trash2,
  Type,
  FileText,
  CheckSquare,
  Circle,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Zap,
  Globe,
  Hash,
  AtSign,
  Smartphone,
  Star,
  Image,
  AlignCenter,
  Send,
  Timer,
  ShoppingCart,
  DollarSign,
  Truck,
  Gift
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface SortableFieldProps {
  field: FormField;
  onEdit: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onFieldUpdate: (field: FormField) => void;
  disabled?: boolean;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete,
  onFieldUpdate,
  disabled = false
}) => {
  const { language } = useI18n();
  const { toast } = useToast();
  const [editedField, setEditedField] = useState<FormField>(field);
  const [isOpen, setIsOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFieldChange = (property: string, value: any) => {
    const updatedField = {
      ...editedField,
      [property]: value
    };
    setEditedField(updatedField);
    onFieldUpdate(updatedField);
    toast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description: language === 'ar' ? 'تم تحديث الحقل بنجاح' : 'Field updated successfully',
    });
  };

  const handleStyleChange = (property: string, value: any) => {
    const updatedStyle = {
      ...editedField.style,
      [property]: value
    };
    const updatedField = {
      ...editedField,
      style: updatedStyle
    };
    setEditedField(updatedField);
    onFieldUpdate(updatedField);
    toast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description: language === 'ar' ? 'تم تحديث نمط الحقل بنجاح' : 'Field style updated successfully',
    });
  };

  const shouldShowWhatsAppSpecificSettings = field.type === 'whatsapp';
  const shouldShowSubmitSpecificSettings = field.type === 'submit';

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className={`mb-2 transition-all duration-200 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div {...attributes} {...listeners}>
                    <GripVertical className="mr-2 h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-sm font-medium">{field.label || field.type}</div>
                </div>
                <Edit3 className="h-4 w-4 text-gray-500" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* WhatsApp specific settings */}
              {shouldShowWhatsAppSpecificSettings && (
                <div className="space-y-4">
                  {/* Text Label */}
                  <div className="space-y-1">
                    <Label htmlFor={`field-label-${field.id}`}>
                      {language === 'ar' ? 'النص' : 'Text'}
                    </Label>
                    <Input
                      id={`field-label-${field.id}`}
                      value={editedField.label || ''}
                      onChange={(e) => handleFieldChange('label', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل النص' : 'Enter text'}
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1">
                    <Label htmlFor={`field-whatsapp-${field.id}`}>
                      {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
                    </Label>
                    <Input
                      id={`field-whatsapp-${field.id}`}
                      value={editedField.whatsappNumber || ''}
                      onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: 966501234567' : 'Example: 966501234567'}
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'نوع الخط' : 'Font Family'}</Label>
                    <Select 
                      value={editedField.style?.fontFamily || 'Cairo'} 
                      onValueChange={(value) => handleStyleChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cairo">Cairo</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times">Times</SelectItem>
                        <SelectItem value="Courier">Courier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Size & Text Weight Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Slider
                          value={[parseInt(editedField.style?.fontSize?.replace('px', '') || '18')] || [18]}
                          onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}px`)}
                          max={32}
                          min={12}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-center">
                          {editedField.style?.fontSize || '18px'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'وزن النص' : 'Text Weight'}</Label>
                      <Select 
                        value={editedField.style?.fontWeight || '600'} 
                        onValueChange={(value) => handleStyleChange('fontWeight', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">{language === 'ar' ? 'خفيف' : 'Light'}</SelectItem>
                          <SelectItem value="400">{language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                          <SelectItem value="600">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                          <SelectItem value="700">{language === 'ar' ? 'عريض' : 'Bold'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Text Color & Background Color Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="color"
                          value={editedField.style?.color || '#ffffff'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="w-8 h-8 rounded border"
                        />
                        <span className="text-sm">
                          {editedField.style?.color || '#ffffff'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="color"
                          value={editedField.style?.backgroundColor || '#25D366'}
                          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                          className="w-8 h-8 rounded border"
                        />
                        <span className="text-sm">
                          {editedField.style?.backgroundColor || '#25D366'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <Label htmlFor={`field-message-${field.id}`}>
                      {language === 'ar' ? 'الرسالة' : 'Message'}
                    </Label>
                    <Input
                      id={`field-message-${field.id}`}
                      value={editedField.message || ''}
                      onChange={(e) => handleFieldChange('message', e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل الرسالة الافتراضية' : 'Enter default message'}
                    />
                  </div>

                  {/* Padding Y & Border Radius Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'المسافة الداخلية' : 'Padding Y'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Slider
                          value={[parseInt(editedField.style?.paddingY?.replace('px', '') || '14')] || [14]}
                          onValueChange={(value) => handleStyleChange('paddingY', `${value[0]}px`)}
                          max={30}
                          min={8}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-center">
                          {editedField.style?.paddingY || '14px'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Slider
                          value={[parseInt(editedField.style?.borderRadius?.replace('px', '') || '8')] || [8]}
                          onValueChange={(value) => handleStyleChange('borderRadius', `${value[0]}px`)}
                          max={50}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-center">
                          {editedField.style?.borderRadius || '8px'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Border Width & Border Color Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'عرض الحدود' : 'Border Width'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Slider
                          value={[parseInt(editedField.style?.borderWidth?.replace('px', '') || '0')] || [0]}
                          onValueChange={(value) => handleStyleChange('borderWidth', `${value[0]}px`)}
                          max={10}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-center">
                          {editedField.style?.borderWidth || '0px'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الحدود' : 'Border Color'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="color"
                          value={editedField.style?.borderColor || '#000000'}
                          onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                          className="w-8 h-8 rounded border"
                        />
                        <span className="text-sm">
                          {editedField.style?.borderColor || '#000000'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Animation */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'الحركة' : 'Animation'}</Label>
                    <Select 
                      value={editedField.style?.animation || 'none'} 
                      onValueChange={(value) => handleStyleChange('animation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === 'ar' ? 'بدون حركة' : 'No Animation'}</SelectItem>
                        <SelectItem value="pulse">{language === 'ar' ? 'نبضة' : 'Pulse'}</SelectItem>
                        <SelectItem value="bounce">{language === 'ar' ? 'ارتداد' : 'Bounce'}</SelectItem>
                        <SelectItem value="shake">{language === 'ar' ? 'اهتزاز' : 'Shake'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show Icon */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      id={`show-icon-${field.id}`}
                      checked={editedField.style?.showIcon !== false}
                      onChange={(e) => handleStyleChange('showIcon', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`show-icon-${field.id}`}>
                      {language === 'ar' ? 'إظهار الأيقونة' : 'Show Icon'}
                    </Label>
                  </div>

                  {/* Icon Color */}
                  {editedField.style?.showIcon !== false && (
                    <div className="space-y-1">
                      <Label>{language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="color"
                          value={editedField.style?.iconColor || editedField.style?.color || '#ffffff'}
                          onChange={(e) => handleStyleChange('iconColor', e.target.value)}
                          className="w-8 h-8 rounded border"
                        />
                        <span className="text-sm">
                          {editedField.style?.iconColor || editedField.style?.color || '#ffffff'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Icon Selection */}
                  <div className="space-y-1">
                    <Label>{language === 'ar' ? 'اختر الأيقونة' : 'Select Icon'}</Label>
                    <Select 
                      value={editedField.style?.icon || 'whatsapp'} 
                      onValueChange={(value) => handleStyleChange('icon', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            {language === 'ar' ? 'فيسبوك' : 'Facebook'}
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            {language === 'ar' ? 'إنستقرام' : 'Instagram'}
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            {language === 'ar' ? 'تويتر' : 'Twitter'}
                          </div>
                        </SelectItem>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="w-4 h-4" />
                            {language === 'ar' ? 'يوتيوب' : 'Youtube'}
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            {language === 'ar' ? 'لينكد إن' : 'LinkedIn'}
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {language === 'ar' ? 'هاتف' : 'Phone'}
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {language === 'ar' ? 'بريد إلكتروني' : 'Email'}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4 border-t mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDuplicate}
                  className="flex items-center gap-1"
                  disabled={disabled}
                >
                  <Copy className="w-3 h-3" />
                  {language === 'ar' ? 'نسخ' : 'Duplicate'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(field.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  disabled={disabled}
                >
                  <Trash2 className="w-3 h-3" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default SortableField;
