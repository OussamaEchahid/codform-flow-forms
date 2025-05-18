
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ColorSelector from './ColorSelector';
import TextAlignmentSelector from './TextAlignmentSelector';
import TitlePreview from './TitlePreview';

interface TitleEditorFormProps {
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  textAlign: string;
  showDescription?: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onDescriptionColorChange: (color: string) => void;
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
  onShowDescriptionChange?: (show: boolean) => void;
  onSave: () => void;
  onCancel?: () => void;
  language: string;
}

const TitleEditorForm: React.FC<TitleEditorFormProps> = ({
  title,
  description,
  backgroundColor,
  textColor,
  descriptionColor,
  textAlign,
  showDescription = true,
  onTitleChange,
  onDescriptionChange,
  onBackgroundColorChange,
  onTextColorChange,
  onDescriptionColorChange,
  onTextAlignChange,
  onShowDescriptionChange,
  onSave,
  onCancel,
  language
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full"
          placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
        </label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full"
          placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <ColorSelector
          label={language === 'ar' ? 'لون الخلفية' : 'Background Color'}
          color={backgroundColor}
          onChange={onBackgroundColorChange}
          language={language}
        />
        
        <ColorSelector
          label={language === 'ar' ? 'لون النص' : 'Text Color'}
          color={textColor}
          onChange={onTextColorChange}
          language={language}
        />
        
        <ColorSelector
          label={language === 'ar' ? 'لون الوصف' : 'Description Color'}
          color={descriptionColor}
          onChange={onDescriptionColorChange}
          language={language}
        />
        
        <TextAlignmentSelector
          textAlign={textAlign}
          onChange={onTextAlignChange}
          language={language}
        />
      </div>
      
      {onShowDescriptionChange && (
        <div className="flex items-center space-x-2">
          <Switch
            id="show-description"
            checked={showDescription}
            onCheckedChange={onShowDescriptionChange}
          />
          <Label htmlFor="show-description">
            {language === 'ar' ? 'إظهار الوصف' : 'Show Description'}
          </Label>
        </div>
      )}
      
      <div className="mt-4 mb-2">
        <h4 className="text-sm font-medium mb-2">
          {language === 'ar' ? 'معاينة' : 'Preview'}
        </h4>
        <TitlePreview
          backgroundColor={backgroundColor}
          textColor={textColor}
          descriptionColor={descriptionColor}
          textAlign={textAlign}
          title={title || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}
          description={description || (language === 'ar' ? 'وصف النموذج' : 'Form description')}
          showDescription={showDescription}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        )}
        <Button onClick={onSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default TitleEditorForm;
