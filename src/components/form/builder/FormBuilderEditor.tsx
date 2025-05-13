import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormStore } from '@/hooks/useFormStore';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { FormStep } from '@/lib/form-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import FormBuilder from '@/components/form/builder/FormBuilder';
import FormPreview from '@/components/form/preview/FormPreview';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import PublishForm from '@/components/form/builder/PublishForm';
import ShopifyIntegration from '@/components/form/builder/ShopifyIntegration';
import { toast } from 'sonner';

interface FormBuilderEditorProps {
  formId: string;
}

const FormBuilderEditor = ({ formId }: FormBuilderEditorProps) => {
  const navigate = useNavigate();
  const { formState, setFormState } = useFormStore();
  const { loadForm, saveForm } = useFormTemplates();
  const { t, language } = useI18n();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  useEffect(() => {
    if (formId && (!formState || formState.id !== formId)) {
      loadForm(formId);
    }
  }, [formId, formState, loadForm]);
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChanges]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormState({ title: newTitle });
    setUnsavedChanges(true);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setFormState({ description: newDescription });
    setUnsavedChanges(true);
  };
  
  const handleDataChange = (newData: FormStep[]) => {
    setFormState({ data: newData });
    setUnsavedChanges(true);
  };
  
  const handleStyleChange = (newStyle: any) => {
    setFormState({ style: newStyle });
    setUnsavedChanges(true);
  };
  
  const handlePublish = (isPublished: boolean) => {
    setFormState({ isPublished });
    setUnsavedChanges(true);
  };

  const tabs = [
    { value: 'builder', label: language === 'ar' ? 'إنشاء' : 'Builder' },
    { value: 'preview', label: language === 'ar' ? 'معاينة' : 'Preview' },
    { value: 'style', label: language === 'ar' ? 'التنسيق' : 'Style' },
    { value: 'publish', label: language === 'ar' ? 'النشر' : 'Publish' },
    { value: 'shopify', label: 'Shopify' }
  ];

  const handleSaveForm = async () => {
    try {
      setIsSaving(true);
      
      const updatedForm: Partial<FormData> = {
        title: formState.title,
        description: formState.description,
        data: formState.data,
        style: formState.style,
        productId: formState.productId // Include productId when saving form
      };
      
      const success = await saveForm(formId, updatedForm);
      
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
        setUnsavedChanges(false);
      } else {
        toast.error(language === 'ar' ? 'فشل في حفظ التغييرات' : 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving form', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublishForm = async (publish: boolean) => {
    setFormState({ isPublished: publish });
    setUnsavedChanges(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <div className="grid gap-2">
            <Label htmlFor="form-title">
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </Label>
            <Input
              id="form-title"
              placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
              value={formState?.title || ''}
              onChange={handleTitleChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="form-description">
              {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
            </Label>
            <Textarea
              id="form-description"
              placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
              value={formState?.description || ''}
              onChange={handleDescriptionChange}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/forms')}
          >
            {language === 'ar' ? 'الرجوع إلى النماذج' : 'Back to Forms'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="builder">
          <div className="mt-4">
            <FormBuilder
              data={formState?.data || []}
              onChange={handleDataChange}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="mt-4">
            <FormPreview />
          </div>
        </TabsContent>
        
        <TabsContent value="style">
          <div className="mt-4">
            <FormStyleEditor
              style={formState?.style}
              onChange={handleStyleChange}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="publish">
          <div className="mt-4">
            <PublishForm
              isPublished={formState?.isPublished || false}
              onPublish={handlePublishForm}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="shopify">
          <div>
            <h3 className={`text-xl font-semibold mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
            </h3>
            
            <ShopifyIntegration 
              formId={formId} 
              formStyle={formState.style}
              onSave={async (settings) => {
                setFormState({ ...settings });
                await handleSaveForm();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSaveForm}
          disabled={isSaving || !unsavedChanges}
          className="ml-2"
        >
          {isSaving ? (
            <>
              {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
            </>
          ) : (
            language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
