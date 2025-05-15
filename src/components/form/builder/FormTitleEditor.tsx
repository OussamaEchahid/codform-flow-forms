
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp } from 'lucide-react';
import { FormField } from '@/lib/form-utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FormTitleEditorProps {
  formTitle: string;
  formDescription: string;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onAddTitleField: () => void;
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  formTitle,
  formDescription,
  onFormTitleChange,
  onFormDescriptionChange,
  onAddTitleField,
  formTitleField,
  onUpdateTitleField
}) => {
  const { language } = useI18n();
  const [titleColor, setTitleColor] = useState(formTitleField?.style?.color || '#ffffff');
  const [titleAlignment, setTitleAlignment] = useState(
    formTitleField?.style?.textAlign || (language === 'ar' ? 'right' : 'left')
  );
  const [titleSize, setTitleSize] = useState(formTitleField?.style?.fontSize || '1.5rem');
  const [titleWeight, setTitleWeight] = useState(formTitleField?.style?.fontWeight || 'bold');
  const [descColor, setDescColor] = useState(formTitleField?.style?.descriptionColor || '#ffffff');
  const [descSize, setDescSize] = useState(formTitleField?.style?.descriptionFontSize || '0.875rem');
  const [descWeight, setDescWeight] = useState(formTitleField?.style?.descriptionFontWeight || 'normal');
  const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');
  const [isOpen, setIsOpen] = useState(true);

  // Update local state when formTitleField changes
  useEffect(() => {
    if (formTitleField) {
      setTitleColor(formTitleField.style?.color || '#ffffff');
      setTitleAlignment(formTitleField.style?.textAlign || (language === 'ar' ? 'right' : 'left'));
      setTitleSize(formTitleField.style?.fontSize || '1.5rem');
      setTitleWeight(formTitleField.style?.fontWeight || 'bold');
      setDescColor(formTitleField.style?.descriptionColor || '#ffffff');
      setDescSize(formTitleField.style?.descriptionFontSize || '0.875rem');
      setDescWeight(formTitleField.style?.descriptionFontWeight || 'normal');
      setBackgroundColor(formTitleField.style?.backgroundColor || '#9b87f5');
    }
  }, [formTitleField, language]);

  const handleUpdateStyle = (property: string, value: string) => {
    if (!formTitleField) return;
    
    const updatedField = {
      ...formTitleField,
      style: {
        ...formTitleField.style,
        [property]: value
      }
    };
    
    if (property === 'color') setTitleColor(value);
    if (property === 'textAlign') setTitleAlignment(value);
    if (property === 'fontSize') setTitleSize(value);
    if (property === 'fontWeight') setTitleWeight(value);
    if (property === 'descriptionColor') setDescColor(value);
    if (property === 'descriptionFontSize') setDescSize(value);
    if (property === 'descriptionFontWeight') setDescWeight(value);
    if (property === 'backgroundColor') setBackgroundColor(value);
    
    onUpdateTitleField(updatedField);
  };

  const handleUpdateLabel = (value: string) => {
    if (!formTitleField) {
      onFormTitleChange(value);
      return;
    }
    
    const updatedField = {
      ...formTitleField,
      label: value
    };
    
    onUpdateTitleField(updatedField);
    onFormTitleChange(value);
  };

  const handleUpdateDescription = (value: string) => {
    if (!formTitleField) {
      onFormDescriptionChange(value);
      return;
    }
    
    const updatedField = {
      ...formTitleField,
      helpText: value
    };
    
    onUpdateTitleField(updatedField);
    onFormDescriptionChange(value);
  };

  return (
    <div className="mb-4 border p-3 rounded-md bg-white">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="form-title" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                </Label>
                <Input
                  id="form-title"
                  value={formTitleField ? formTitleField.label || '' : formTitle || ''}
                  onChange={(e) => handleUpdateLabel(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              <div>
                <Label htmlFor="form-desc" className={language === 'ar' ? 'text-right block' : ''}>
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </Label>
                <Textarea
                  id="form-desc"
                  value={formTitleField ? formTitleField.helpText || '' : formDescription || ''}
                  onChange={(e) => handleUpdateDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  className={`${language === 'ar' ? 'text-right' : ''} h-20`}
                />
              </div>
            </div>

            {!formTitleField ? (
              <Button 
                onClick={onAddTitleField}
                className="w-full mt-2"
              >
                {language === 'ar' ? 'تحويل العنوان إلى قابل للتعديل' : 'Convert to Editable Title'}
              </Button>
            ) : (
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label htmlFor="title-color" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                    </Label>
                    <div className="flex mt-1">
                      <Input
                        id="title-color"
                        type="color"
                        value={titleColor || '#ffffff'}
                        onChange={(e) => handleUpdateStyle('color', e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={titleColor || '#ffffff'}
                        onChange={(e) => handleUpdateStyle('color', e.target.value)}
                        className="ml-2 flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bg-color" className={language === 'ar' ? 'text-right block' : ''}>
                      {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
                    </Label>
                    <div className="flex mt-1">
                      <Input
                        id="bg-color"
                        type="color"
                        value={backgroundColor || '#9b87f5'}
                        onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={backgroundColor || '#9b87f5'}
                        onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
                        className="ml-2 flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'خصائص العنوان' : 'Title Properties'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="title-size" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'حجم العنوان' : 'Title Size'}
                      </Label>
                      <select
                        id="title-size"
                        value={titleSize || '1.5rem'}
                        onChange={(e) => handleUpdateStyle('fontSize', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="1rem">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="1.25rem">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="1.5rem">{language === 'ar' ? 'كبير' : 'Large'}</option>
                        <option value="2rem">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="title-weight" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'سمك العنوان' : 'Title Weight'}
                      </Label>
                      <select
                        id="title-weight"
                        value={titleWeight || 'bold'}
                        onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
                        <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="bold">{language === 'ar' ? 'سميك' : 'Bold'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className={language === 'ar' ? 'text-right block' : ''}>
                    {language === 'ar' ? 'محاذاة العنوان' : 'Title Alignment'}
                  </Label>
                  <div className="flex space-x-2 mt-1">
                    <Button
                      type="button"
                      variant={titleAlignment === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateStyle('textAlign', 'left')}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={titleAlignment === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateStyle('textAlign', 'center')}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={titleAlignment === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateStyle('textAlign', 'right')}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'خصائص الوصف' : 'Description Properties'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="desc-color" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'لون الوصف' : 'Description Color'}
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="desc-color"
                          type="color"
                          value={descColor || '#ffffff'}
                          onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={descColor || '#ffffff'}
                          onChange={(e) => handleUpdateStyle('descriptionColor', e.target.value)}
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="desc-size" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'حجم الوصف' : 'Description Size'}
                      </Label>
                      <select
                        id="desc-size"
                        value={descSize || '0.875rem'}
                        onChange={(e) => handleUpdateStyle('descriptionFontSize', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="0.75rem">{language === 'ar' ? 'صغير جداً' : 'Extra Small'}</option>
                        <option value="0.875rem">{language === 'ar' ? 'صغير' : 'Small'}</option>
                        <option value="1rem">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="1.125rem">{language === 'ar' ? 'كبير' : 'Large'}</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="desc-weight" className={language === 'ar' ? 'text-right block' : ''}>
                        {language === 'ar' ? 'سمك الوصف' : 'Description Weight'}
                      </Label>
                      <select
                        id="desc-weight"
                        value={descWeight || 'normal'}
                        onChange={(e) => handleUpdateStyle('descriptionFontWeight', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</option>
                        <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                        <option value="bold">{language === 'ar' ? 'سميك' : 'Bold'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FormTitleEditor;
