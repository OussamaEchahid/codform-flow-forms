
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

interface EditFormTitleEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
}

const EditFormTitleEditor: React.FC<EditFormTitleEditorProps> = ({
  field,
  onChange
}) => {
  const { language } = useI18n();
  
  const [label, setLabel] = useState(field.label || '');
  const [helpText, setHelpText] = useState(field.helpText || '');
  const [backgroundColor, setBackgroundColor] = useState(field.style?.backgroundColor || '#9b87f5');
  const [textColor, setTextColor] = useState(field.style?.color || '#ffffff');
  const [descriptionColor, setDescriptionColor] = useState(field.style?.descriptionColor || '#ffffff');
  const [textAlign, setTextAlign] = useState<string>(field.style?.textAlign || 'center');
  const [showDescription, setShowDescription] = useState(field.style?.showDescription !== false);
  
  const handleUpdate = () => {
    const updatedField = {
      ...field,
      label,
      helpText,
      style: {
        ...field.style,
        backgroundColor,
        color: textColor,
        descriptionColor,
        textAlign,
        showDescription,
      }
    };
    onChange(updatedField);
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-4">
          {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'العنوان' : 'Title'}
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full"
              placeholder={language === 'ar' ? 'أدخل العنوان' : 'Enter title'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <Textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              className="w-full"
              placeholder={language === 'ar' ? 'أدخل الوصف' : 'Enter description'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
              </label>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-md mr-2" 
                  style={{ backgroundColor }}
                ></div>
                <Input 
                  type="color" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-8 p-0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'لون النص' : 'Text Color'}
              </label>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-md mr-2" 
                  style={{ backgroundColor: textColor }}
                ></div>
                <Input 
                  type="color" 
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-8 p-0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'لون الوصف' : 'Description Color'}
              </label>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-md mr-2" 
                  style={{ backgroundColor: descriptionColor }}
                ></div>
                <Input 
                  type="color" 
                  value={descriptionColor}
                  onChange={(e) => setDescriptionColor(e.target.value)}
                  className="w-16 h-8 p-0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
              </label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={textAlign === 'left' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTextAlign('left')}
                  className="p-2"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant={textAlign === 'center' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTextAlign('center')}
                  className="p-2"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button 
                  variant={textAlign === 'right' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTextAlign('right')}
                  className="p-2"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-description"
              checked={showDescription}
              onCheckedChange={setShowDescription}
            />
            <Label htmlFor="show-description">
              {language === 'ar' ? 'إظهار الوصف' : 'Show Description'}
            </Label>
          </div>
          
          <div className="mt-4 mb-2">
            <h4 className="text-sm font-medium mb-2">
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </h4>
            <div style={{ 
              backgroundColor, 
              padding: '0.75rem',
              borderRadius: '0.5rem',
            }}>
              <h2 style={{ 
                color: textColor,
                margin: 0,
                textAlign: textAlign as any,
              }}>
                {label || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}
              </h2>
              {showDescription && (
                <p style={{ 
                  color: descriptionColor,
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.875rem',
                  textAlign: textAlign as any,
                }}>
                  {helpText || (language === 'ar' ? 'وصف النموذج' : 'Form description')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleUpdate}>
          {language === 'ar' ? 'تحديث' : 'Update'}
        </Button>
      </div>
    </Card>
  );
};

export default EditFormTitleEditor;
