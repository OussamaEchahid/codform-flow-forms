import React, { useState, useEffect, useCallback } from 'react';
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
import { toast } from 'sonner';

interface EditFormTitleEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
}

// Define type for text alignment to match FormField style expectations
type TextAlign = 'left' | 'center' | 'right';

const EditFormTitleEditor: React.FC<EditFormTitleEditorProps> = ({ field, onChange }) => {
  const { language } = useI18n();
  
  // Initialize state with field values
  const [title, setTitle] = useState(field.label || '');
  const [description, setDescription] = useState(field.helpText || '');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [titleColor, setTitleColor] = useState('');
  const [descriptionColor, setDescriptionColor] = useState('');
  const [titleFontSize, setTitleFontSize] = useState('');
  const [descriptionFontSize, setDescriptionFontSize] = useState('');
  const [showDescription, setShowDescription] = useState(true);
  // Update type to be TextAlign instead of string
  const [titleAlignment, setTitleAlignment] = useState<TextAlign>('center');
  const [descriptionAlignment, setDescriptionAlignment] = useState<TextAlign>('center');
  const [debounceTimerId, setDebounceTimerId] = useState<number | null>(null);

  // Effect to update local state when field prop changes
  useEffect(() => {
    if (field) {
      console.log("EditFormTitleEditor: Field updated", field.id);
      const fieldStyle = field.style || {};
      
      setTitle(field.label || '');
      setDescription(field.helpText || '');
      setBackgroundColor(fieldStyle.backgroundColor || '#9b87f5');
      setTitleColor(fieldStyle.color || '#ffffff');
      setDescriptionColor(fieldStyle.descriptionColor || '#ffffff');
      setTitleFontSize(fieldStyle.fontSize || '24px');
      setDescriptionFontSize(fieldStyle.descriptionFontSize || '14px');
      // Important: Ensure consistent logic with EditFormTitleField.tsx
      setShowDescription(fieldStyle.showDescription !== false);
      
      // Ensure values are one of the allowed options
      const titleAlign = fieldStyle.textAlign || 'center';
      setTitleAlignment(validateTextAlignment(titleAlign));
      
      const descAlign = fieldStyle.descriptionAlignment || fieldStyle.textAlign || 'center';
      setDescriptionAlignment(validateTextAlignment(descAlign));
    }
  }, [field]);
  
  // Helper function to validate text alignment values
  const validateTextAlignment = (value: any): TextAlign => {
    if (value === 'left' || value === 'center' || value === 'right') {
      return value;
    }
    return 'center'; // Default to center if invalid value
  };

  // Create a debounced update field function
  const debouncedUpdateField = useCallback((changes: any) => {
    if (debounceTimerId) {
      window.clearTimeout(debounceTimerId);
    }
    
    const timerId = window.setTimeout(() => {
      updateField(changes);
    }, 300);
    
    setDebounceTimerId(timerId);
  }, [debounceTimerId]);

  // Function to update field whenever a value changes
  const updateField = (additionalChanges: Partial<FormField> = {}) => {
    try {
      // Create a deep copy to avoid mutation issues
      const updatedField = {
        ...field,
        label: title,
        helpText: description,
        ...additionalChanges,
        style: {
          ...(field.style || {}),
          backgroundColor,
          color: titleColor,
          descriptionColor,
          fontSize: titleFontSize,
          descriptionFontSize,
          showDescription,
          textAlign: titleAlignment,
          descriptionAlignment, // Now correctly typed as TextAlign
          ...(additionalChanges.style || {})
        }
      };
      
      // Log the update for debugging
      console.log("Updating title field with:", {
        id: updatedField.id,
        textAlign: titleAlignment,
        showDescription,
        backgroundColor,
        descriptionAlignment
      });
      
      // Call the onChange callback immediately to update the preview
      onChange(updatedField);
      
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error(language === 'ar' ? "حدث خطأ أثناء تحديث الحقل" : "Error updating field");
    }
  };

  // Handle input changes and update the field
  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, fieldName?: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    
    if (fieldName) {
      debouncedUpdateField({ [fieldName]: e.target.value });
    }
  };
  
  // Handle alignment and toggle changes
  const handleAlignmentChange = (setter: React.Dispatch<React.SetStateAction<TextAlign>>, styleProperty: string) => (value: string) => {
    if (value && (value === 'left' || value === 'center' || value === 'right')) {
      setter(value as TextAlign);
      // Update immediately for better UX
      updateField({ 
        style: { [styleProperty]: value }
      });
    }
  };
  
  // Handle switch toggle for description visibility
  const handleShowDescriptionChange = (checked: boolean) => {
    setShowDescription(checked);
    // Update immediately
    updateField({ 
      style: { showDescription: checked }
    });
  };
  
  // Update field on blur events
  const handleBlur = () => {
    updateField();
  };

  // Handle color change with immediate update
  const handleColorChange = (setter: React.Dispatch<React.SetStateAction<string>>, styleProperty: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setter(newValue);
    updateField({
      style: { [styleProperty]: newValue }
    });
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
            onValueChange={handleAlignmentChange(setTitleAlignment, 'textAlign')}
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
              onChange={handleColorChange(setTitleColor, 'color')}
              className="w-12 p-1 h-10"
            />
            <Input
              type="text"
              value={titleColor}
              onChange={handleColorChange(setTitleColor, 'color')}
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
              onChange={handleColorChange(setBackgroundColor, 'backgroundColor')}
              className="w-12 p-1 h-10"
            />
            <Input
              type="text"
              value={backgroundColor}
              onChange={handleColorChange(setBackgroundColor, 'backgroundColor')}
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
                onValueChange={handleAlignmentChange(setDescriptionAlignment, 'descriptionAlignment')}
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
                  onChange={handleColorChange(setDescriptionColor, 'descriptionColor')}
                  className="w-12 p-1 h-10"
                />
                <Input
                  type="text"
                  value={descriptionColor}
                  onChange={handleColorChange(setDescriptionColor, 'descriptionColor')}
                  className="flex-1"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Apply Changes Button */}
        <Button 
          onClick={() => updateField()} 
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
