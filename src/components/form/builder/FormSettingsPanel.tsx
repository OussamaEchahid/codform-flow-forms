import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Palette, Save, RotateCcw, Eye, ArrowLeft, ArrowRight,
  Type, FileText, PanelLeft, Layout
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/lib/form-utils';
import { useFormStore, FormStyle } from '@/hooks/useFormStore';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import TitleSettings from '@/components/form/settings/TitleSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FormSettingsPanelProps {
  formId: string;
  initialTitle: string;
  initialDescription: string;
  initialStyle: FormStyle;
  initialFields: FormField[];
  onSave: (data: {
    title: string;
    description: string;
    style: FormStyle;
    fields: FormField[];
  }) => Promise<boolean>;
  onPreviewRefresh: () => void;
}

const FormSettingsPanel: React.FC<FormSettingsPanelProps> = ({
  formId,
  initialTitle,
  initialDescription,
  initialStyle,
  initialFields,
  onSave,
  onPreviewRefresh
}) => {
  const { language } = useI18n();
  const isRTL = language === 'ar';
  
  // Local state for form data
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || '');
  const [style, setStyle] = useState<FormStyle>(initialStyle);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  
  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('title'); // title, fields, design
  
  // Get the title field from the fields array
  const titleField = fields.find(field => field.type === 'form-title');
  const titleFieldIndex = fields.findIndex(field => field.type === 'form-title');
  
  // Function to update a field
  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
    setHasChanges(true);
    onPreviewRefresh();
  };
  
  // Specific function to update the title field
  const updateTitleField = (updates: Partial<FormField>) => {
    if (titleField && titleFieldIndex !== -1) {
      const updatedField = { 
        ...titleField, 
        ...updates,
        style: { 
          ...titleField.style,
          ...updates.style 
        } 
      };
      updateField(titleFieldIndex, updatedField);
    }
  };
  
  // Update form style
  const updateFormStyle = (updates: Partial<FormStyle>) => {
    const newStyle = { ...style, ...updates };
    setStyle(newStyle);
    setHasChanges(true);
    onPreviewRefresh();
  };
  
  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave({
        title,
        description,
        style,
        fields
      });
      
      if (success) {
        toast.success(isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
        setHasChanges(false);
      } else {
        toast.error(isRTL ? 'فشل حفظ التغييرات' : 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset changes
  const handleReset = () => {
    setTitle(initialTitle);
    setDescription(initialDescription || '');
    setStyle(initialStyle);
    setFields(initialFields);
    setHasChanges(false);
    onPreviewRefresh();
    toast.info(isRTL ? 'تم إعادة ضبط التغييرات' : 'Changes reset');
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {isRTL ? 'إعدادات النموذج' : 'Form Settings'}
        </CardTitle>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            title={isRTL ? 'إعادة الضبط' : 'Reset'}
            className="flex items-center gap-1"
          >
            <RotateCcw size={16} />
            <span>{isRTL ? 'إعادة الضبط' : 'Reset'}</span>
          </Button>
          
          <Button
            onClick={handleSave}
            size="sm"
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isRTL ? 'حفظ' : 'Save'}</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="title" className="flex items-center gap-2">
              <FileText size={16} />
              <span>{isRTL ? 'العنوان والوصف' : 'Title & Description'}</span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Layout size={16} />
              <span>{isRTL ? 'حقول النموذج' : 'Form Fields'}</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette size={16} />
              <span>{isRTL ? 'التصميم العام' : 'Design'}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="title" className="space-y-4">
            {titleField && (
              <TitleSettings 
                field={titleField}
                onChange={updateTitleField}
                isRTL={isRTL}
              />
            )}
          </TabsContent>
          
          <TabsContent value="fields" className="space-y-4">
            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-lg font-medium mb-2">
                {isRTL ? 'حقول النموذج' : 'Form Fields'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL 
                  ? 'قم بتخصيص إعدادات الحقول الموجودة في النموذج' 
                  : 'Customize the fields in your form'}
              </p>
              
              {fields.filter(f => f.type !== 'form-title').length === 0 ? (
                <div className="text-center p-8 border-dashed border-2 rounded-lg mt-4">
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'لا توجد حقول في النموذج. أضف بعض الحقول أولًا.' 
                      : 'No fields in the form. Add some fields first.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {fields.filter(f => f.type !== 'form-title').map((field, index) => (
                    <div 
                      key={field.id} 
                      className="p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <strong>{field.label || field.type}</strong>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // TODO: Open field editor modal
                            toast.info('Field editor will be implemented');
                          }}
                        >
                          {isRTL ? 'تحرير' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="design" className="space-y-4">
            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-lg font-medium mb-2">
                {isRTL ? 'التصميم العام' : 'General Design'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL 
                  ? 'قم بتخصيص مظهر النموذج بالكامل' 
                  : 'Customize the appearance of the entire form'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">{isRTL ? 'اللون الرئيسي' : 'Primary Color'}</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={style.primaryColor}
                        onChange={(e) => updateFormStyle({ primaryColor: e.target.value })}
                        className="h-8 w-8 rounded border"
                      />
                      <input
                        type="text"
                        value={style.primaryColor}
                        onChange={(e) => updateFormStyle({ primaryColor: e.target.value })}
                        className="flex-1 form-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="borderRadius">{isRTL ? 'استدارة الحواف' : 'Border Radius'}</Label>
                    <select
                      id="borderRadius"
                      className="form-select w-full mt-2"
                      value={style.borderRadius}
                      onChange={(e) => updateFormStyle({ borderRadius: e.target.value })}
                    >
                      <option value="0">{isRTL ? 'بدون استدارة' : 'No radius'}</option>
                      <option value="0.25rem">{isRTL ? 'استدارة خفيفة' : 'Slight radius'}</option>
                      <option value="0.5rem">{isRTL ? 'استدارة متوسطة' : 'Medium radius'}</option>
                      <option value="1rem">{isRTL ? 'استدارة كبيرة' : 'Large radius'}</option>
                      <option value="9999px">{isRTL ? 'دائري' : 'Round'}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fontSize">{isRTL ? 'حجم الخط' : 'Font Size'}</Label>
                    <select
                      id="fontSize"
                      className="form-select w-full mt-2"
                      value={style.fontSize}
                      onChange={(e) => updateFormStyle({ fontSize: e.target.value })}
                    >
                      <option value="0.875rem">{isRTL ? 'صغير' : 'Small'}</option>
                      <option value="1rem">{isRTL ? 'متوسط' : 'Medium'}</option>
                      <option value="1.125rem">{isRTL ? 'كبير' : 'Large'}</option>
                      <option value="1.25rem">{isRTL ? 'كبير جداً' : 'Extra Large'}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonStyle">{isRTL ? 'نمط الأزرار' : 'Button Style'}</Label>
                    <select
                      id="buttonStyle"
                      className="form-select w-full mt-2"
                      value={style.buttonStyle}
                      onChange={(e) => updateFormStyle({ buttonStyle: e.target.value })}
                    >
                      <option value="rounded">{isRTL ? 'مستدير' : 'Rounded'}</option>
                      <option value="square">{isRTL ? 'مربع' : 'Square'}</option>
                      <option value="pill">{isRTL ? 'كبسولي' : 'Pill'}</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">{isRTL ? 'ألوان سريعة' : 'Quick Colors'}</h4>
                <div className="grid grid-cols-5 gap-2">
                  {['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                    <div
                      key={color}
                      className={`h-8 rounded cursor-pointer transition-all ${
                        style.primaryColor === color ? "ring-2 ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateFormStyle({ primaryColor: color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FormSettingsPanel;
