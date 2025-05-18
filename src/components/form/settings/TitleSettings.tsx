
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  AlignLeft, AlignCenter, AlignRight, Bold, Type, 
  FileText, AlignJustify
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

interface TitleSettingsProps {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
  isRTL: boolean;
}

const TitleSettings: React.FC<TitleSettingsProps> = ({ field, onChange, isRTL }) => {
  // Default field style to empty object if not present
  const fieldStyle = field.style || {};
  
  // Handling boolean props safely
  const showTitle = fieldStyle.showTitle !== false;
  const showDescription = fieldStyle.showDescription !== false;
  
  // Get alignment with proper defaults
  const alignment = fieldStyle.textAlign || (isRTL ? 'right' : 'left');
  
  // Font weight with defaults
  const fontWeight = fieldStyle.fontWeight || 'bold';
  
  // Function to update field style
  const updateStyle = (updates: Record<string, any>) => {
    onChange({
      style: {
        ...fieldStyle,
        ...updates
      }
    });
  };
  
  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      <div>
        <h3 className="text-lg font-medium mb-2">
          {isRTL ? 'عنوان النموذج' : 'Form Title'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isRTL 
            ? 'قم بتخصيص عنوان النموذج وكيفية ظهوره للزوار' 
            : 'Customize the form title and how it appears to visitors'}
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title-text" className="mb-2 block">
            {isRTL ? 'نص العنوان' : 'Title Text'}
          </Label>
          <Input
            id="title-text"
            value={field.label || ''}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={isRTL ? 'أدخل عنوان النموذج' : 'Enter form title'}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="description-text">
              {isRTL ? 'نص الوصف' : 'Description Text'}
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="show-description"
                checked={showDescription}
                onCheckedChange={(checked) => 
                  updateStyle({ showDescription: checked })
                }
              />
              <Label htmlFor="show-description" className="text-sm">
                {isRTL ? 'إظهار الوصف' : 'Show Description'}
              </Label>
            </div>
          </div>
          <Textarea
            id="description-text"
            value={field.helpText || ''}
            onChange={(e) => onChange({ helpText: e.target.value })}
            placeholder={isRTL ? 'أدخل وصف النموذج (اختياري)' : 'Enter form description (optional)'}
            className="w-full"
            disabled={!showDescription}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'لون خلفية العنوان' : 'Title Background Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={fieldStyle.backgroundColor || '#9b87f5'}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="h-8 w-8 rounded"
                />
                <Input
                  type="text"
                  value={fieldStyle.backgroundColor || '#9b87f5'}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'لون نص العنوان' : 'Title Text Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={fieldStyle.color || '#ffffff'}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="h-8 w-8 rounded"
                />
                <Input
                  type="text"
                  value={fieldStyle.color || '#ffffff'}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'لون نص الوصف' : 'Description Text Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
                  onChange={(e) => updateStyle({ descriptionColor: e.target.value })}
                  className="h-8 w-8 rounded"
                  disabled={!showDescription}
                />
                <Input
                  type="text"
                  value={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
                  onChange={(e) => updateStyle({ descriptionColor: e.target.value })}
                  className="flex-1"
                  disabled={!showDescription}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'حجم خط العنوان' : 'Title Font Size'}
              </Label>
              <select
                className="w-full form-select"
                value={fieldStyle.fontSize || '24px'}
                onChange={(e) => updateStyle({ fontSize: e.target.value })}
              >
                <option value="16px">{isRTL ? 'صغير' : 'Small'} (16px)</option>
                <option value="20px">{isRTL ? 'متوسط' : 'Medium'} (20px)</option>
                <option value="24px">{isRTL ? 'كبير' : 'Large'} (24px)</option>
                <option value="32px">{isRTL ? 'كبير جداً' : 'Extra Large'} (32px)</option>
              </select>
            </div>
            
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'حجم خط الوصف' : 'Description Font Size'}
              </Label>
              <select
                className="w-full form-select"
                value={fieldStyle.descriptionFontSize || '14px'}
                onChange={(e) => updateStyle({ descriptionFontSize: e.target.value })}
                disabled={!showDescription}
              >
                <option value="12px">{isRTL ? 'صغير' : 'Small'} (12px)</option>
                <option value="14px">{isRTL ? 'متوسط' : 'Medium'} (14px)</option>
                <option value="16px">{isRTL ? 'كبير' : 'Large'} (16px)</option>
                <option value="18px">{isRTL ? 'كبير جداً' : 'Extra Large'} (18px)</option>
              </select>
            </div>
            
            <div>
              <Label className="mb-2 block">
                {isRTL ? 'وزن الخط' : 'Font Weight'}
              </Label>
              <div className="flex border rounded-md overflow-hidden">
                <Toggle
                  pressed={fontWeight === 'normal'}
                  onPressedChange={() => updateStyle({ fontWeight: 'normal' })}
                  className="flex-1 data-[state=on]:bg-muted rounded-none"
                  size="sm"
                >
                  {isRTL ? 'عادي' : 'Normal'}
                </Toggle>
                <Toggle
                  pressed={fontWeight === 'medium'}
                  onPressedChange={() => updateStyle({ fontWeight: 'medium' })}
                  className="flex-1 data-[state=on]:bg-muted rounded-none"
                  size="sm"
                >
                  {isRTL ? 'متوسط' : 'Medium'}
                </Toggle>
                <Toggle
                  pressed={fontWeight === 'bold'}
                  onPressedChange={() => updateStyle({ fontWeight: 'bold' })}
                  className="flex-1 data-[state=on]:bg-muted rounded-none"
                  size="sm"
                >
                  <Bold size={14} className="mr-1" />
                  {isRTL ? 'عريض' : 'Bold'}
                </Toggle>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <Label className="mb-2 block">
            {isRTL ? 'محاذاة النص' : 'Text Alignment'}
          </Label>
          <div className="flex border rounded-md overflow-hidden">
            <Toggle
              pressed={alignment === 'left'}
              onPressedChange={() => updateStyle({ textAlign: 'left' })}
              className="flex-1 data-[state=on]:bg-muted rounded-none"
            >
              <AlignLeft size={16} />
              <span className="ml-2">{isRTL ? 'يسار' : 'Left'}</span>
            </Toggle>
            <Toggle
              pressed={alignment === 'center'}
              onPressedChange={() => updateStyle({ textAlign: 'center' })}
              className="flex-1 data-[state=on]:bg-muted rounded-none"
            >
              <AlignCenter size={16} />
              <span className="ml-2">{isRTL ? 'وسط' : 'Center'}</span>
            </Toggle>
            <Toggle
              pressed={alignment === 'right'}
              onPressedChange={() => updateStyle({ textAlign: 'right' })}
              className="flex-1 data-[state=on]:bg-muted rounded-none"
            >
              <AlignRight size={16} />
              <span className="ml-2">{isRTL ? 'يمين' : 'Right'}</span>
            </Toggle>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleSettings;
