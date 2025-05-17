
import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface EditFormTitleEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
}

const EditFormTitleEditor: React.FC<EditFormTitleEditorProps> = ({ field, onChange }) => {
  const { language } = useI18n();
  const style = field.style || {};
  
  // Initialize state with field values
  const [title, setTitle] = useState(field.label || '');
  const [description, setDescription] = useState(field.helpText || '');
  const [backgroundColor, setBackgroundColor] = useState(style.backgroundColor || '#9b87f5');
  const [titleColor, setTitleColor] = useState(style.color || '#ffffff');
  const [descriptionColor, setDescriptionColor] = useState(style.descriptionColor || '#ffffff');
  const [titleFontSize, setTitleFontSize] = useState(style.fontSize || '24px');
  const [descriptionFontSize, setDescriptionFontSize] = useState(style.descriptionFontSize || '14px');
  const [showDescription, setShowDescription] = useState(style.showDescription !== false);
  const [titleAlignment, setTitleAlignment] = useState(style.textAlign || 'center');
  const [descriptionAlignment, setDescriptionAlignment] = useState(style.descriptionAlignment || 'center');

  // Effect to update local state when field prop changes
  useEffect(() => {
    if (field && field.style) {
      setBackgroundColor(field.style.backgroundColor || '#9b87f5');
      setTitleColor(field.style.color || '#ffffff');
      setDescriptionColor(field.style.descriptionColor || '#ffffff');
      setTitleFontSize(field.style.fontSize || '24px');
      setDescriptionFontSize(field.style.descriptionFontSize || '14px');
      setShowDescription(field.style.showDescription !== false);
      setTitleAlignment(field.style.textAlign || 'center');
      setDescriptionAlignment(field.style.descriptionAlignment || 'center');
    }
    
    setTitle(field.label || '');
    setDescription(field.helpText || '');
  }, [field]);

  // Function to update field whenever a value changes
  const updateField = () => {
    // Create a deep copy to avoid mutation issues
    const updatedField = {
      ...field,
      label: title,
      helpText: description,
      style: {
        ...(field.style || {}),
        backgroundColor,
        color: titleColor,
        descriptionColor,
        fontSize: titleFontSize,
        descriptionFontSize,
        showDescription,
        textAlign: titleAlignment,
        descriptionAlignment
      }
    };
    
    // Log the update for debugging
    console.log("Updating title field with:", {
      textAlign: titleAlignment,
      showDescription,
      backgroundColor
    });
    
    onChange(updatedField);
  };

  // Handle input changes and update the field
  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
  };
  
  // Handle alignment and toggle changes
  const handleAlignmentChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (value: string) => {
    if (value) {
      setter(value);
      // Update immediately for better UX
      setTimeout(updateField, 100);
    }
  };
  
  // Handle switch toggle for description visibility
  const handleShowDescriptionChange = (checked: boolean) => {
    setShowDescription(checked);
    // Update immediately for better UX
    setTimeout(updateField, 100);
  };
  
  // Update field on blur events
  const handleBlur = () => {
    updateField();
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title-text" className={language === 'ar' ? 'text-right block' : ''}>
            {language === 'ar' ? 'نص العنوان' : 'Title Text'}
          </Label>
          <Input
            id="title-text"
            value={title}
            onChange={handleChange(setTitle)}
            onBlur={handleBlur}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        
        {/* Title Alignment */}
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : ''}>
            {language === 'ar' ? 'محاذاة العنوان' : 'Title Alignment'}
          </Label>
          <ToggleGroup 
            type="single" 
            value={titleAlignment}
            onValueChange={handleAlignmentChange(setTitleAlignment)}
            className="justify-start"
          >
            <ToggleGroupItem value="left" aria-label="Left align">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Center align">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Right align">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Title Font Size */}
        <div className="space-y-2">
          <Label htmlFor="title-font-size" className={language === 'ar' ? 'text-right block' : ''}>
            {language === 'ar' ? 'حجم خط العنوان' : 'Title Font Size'}
          </Label>
          <Input
            id="title-font-size"
            type="text"
            value={titleFontSize}
            onChange={handleChange(setTitleFontSize)}
            onBlur={handleBlur}
            placeholder="24px"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        
        {/* Title Color */}
        <div className="space-y-2">
          <Label htmlFor="title-color" className={language === 'ar' ? 'text-right block' : ''}>
            {language === 'ar' ? 'لون العنوان' : 'Title Color'}
          </Label>
          <div className="flex space-x-2">
            <Input
              id="title-color"
              type="color"
              value={titleColor}
              onChange={handleChange(setTitleColor)}
              onBlur={handleBlur}
              className="w-12 p-1 h-10"
            />
            <Input
              type="text"
              value={titleColor}
              onChange={handleChange(setTitleColor)}
              onBlur={handleBlur}
              className="flex-1"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
        
        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="background-color" className={language === 'ar' ? 'text-right block' : ''}>
            {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
          </Label>
          <div className="flex space-x-2">
            <Input
              id="background-color"
              type="color"
              value={backgroundColor}
              onChange={handleChange(setBackgroundColor)}
              onBlur={handleBlur}
              className="w-12 p-1 h-10"
            />
            <Input
              type="text"
              value={backgroundColor}
              onChange={handleChange(setBackgroundColor)}
              onBlur={handleBlur}
              className="flex-1"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
        
        {/* Description Visibility */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-description" className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'إظهار الوصف' : 'Show Description'}
          </Label>
          <Switch 
            id="show-description" 
            checked={showDescription} 
            onCheckedChange={handleShowDescriptionChange}
          />
        </div>
        
        {/* Description section - only shown if showDescription is true */}
        {showDescription && (
          <>
            {/* Description Text */}
            <div className="space-y-2">
              <Label htmlFor="description-text" className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'نص الوصف' : 'Description Text'}
              </Label>
              <Textarea
                id="description-text"
                value={description}
                onChange={handleChange(setDescription)}
                onBlur={handleBlur}
                rows={3}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            
            {/* Description Alignment */}
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'محاذاة الوصف' : 'Description Alignment'}
              </Label>
              <ToggleGroup 
                type="single" 
                value={descriptionAlignment}
                onValueChange={handleAlignmentChange(setDescriptionAlignment)}
                className="justify-start"
              >
                <ToggleGroupItem value="left" aria-label="Left align">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Center align">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Right align">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* Description Font Size */}
            <div className="space-y-2">
              <Label htmlFor="description-font-size" className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'حجم خط الوصف' : 'Description Font Size'}
              </Label>
              <Input
                id="description-font-size"
                type="text"
                value={descriptionFontSize}
                onChange={handleChange(setDescriptionFontSize)}
                onBlur={handleBlur}
                placeholder="14px"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            
            {/* Description Color */}
            <div className="space-y-2">
              <Label htmlFor="description-color" className={language === 'ar' ? 'text-right block' : ''}>
                {language === 'ar' ? 'لون الوصف' : 'Description Color'}
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="description-color"
                  type="color"
                  value={descriptionColor}
                  onChange={handleChange(setDescriptionColor)}
                  onBlur={handleBlur}
                  className="w-12 p-1 h-10"
                />
                <Input
                  type="text"
                  value={descriptionColor}
                  onChange={handleChange(setDescriptionColor)}
                  onBlur={handleBlur}
                  className="flex-1"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Apply Changes Button */}
        <Button 
          onClick={updateField} 
          className="w-full"
          style={{ backgroundColor }}
        >
          {language === 'ar' ? 'تطبيق التغييرات' : 'Apply Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EditFormTitleEditor;
