
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormStore, FormStyle } from '@/hooks/useFormStore';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import FormBuilder from '@/components/form/FormBuilder'; 
import FormPreview from '@/components/form/FormPreview';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import PublishForm from '@/components/form/builder/PublishForm';
import ShopifyIntegration from '@/components/form/builder/ShopifyIntegration';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';

// Ensure FormState includes product_id
interface FormState {
  id?: string;
  title: string;
  description: string;
  data: any[];
  style: FormStyle;
  isPublished?: boolean;
  product_id?: string;
}

const FormBuilderEditor = ({ formId }) => {
  const navigate = useNavigate();
  const { formState, setFormState } = useFormStore();
  const { loadForm, saveForm } = useFormTemplates();
  const { t, language } = useI18n();
  const { products } = useShopify();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Only load form once, when component mounts
  useEffect(() => {
    if (formId && (!formState || formState.id !== formId) && !isLoaded) {
      loadForm(formId).then(() => {
        setIsLoaded(true);
      });
    }
  }, [formId, formState, loadForm, isLoaded]);
  
  useEffect(() => {
    const handleBeforeUnload = (event) => {
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
  
  const handleTitleChange = (e) => {
    setFormState({
      title: e.target.value
    });
    setUnsavedChanges(true);
  };
  
  const handleDescriptionChange = (e) => {
    setFormState({
      description: e.target.value
    });
    setUnsavedChanges(true);
  };
  
  const handleDataChange = (newData) => {
    // Prevent unnecessary state updates
    if (JSON.stringify(formState?.data) !== JSON.stringify(newData)) {
      setFormState({
        data: newData
      });
      setUnsavedChanges(true);
    }
  };
  
  const handleStyleChange = (newStyle) => {
    setFormState({
      style: newStyle
    });
    setUnsavedChanges(true);
  };
  
  const handlePublish = (isPublished) => {
    setFormState({
      isPublished
    });
    setUnsavedChanges(true);
  };

  // Find product by ID
  const getProductInfo = () => {
    if (!formState?.product_id || !products) return null;
    
    return products.find(product => 
      product.id === formState.product_id || 
      product.id.endsWith(`/${formState.product_id}`)
    );
  };
  
  const productInfo = getProductInfo();
  
  const tabs = [
    {
      value: 'builder',
      label: language === 'ar' ? 'إنشاء' : 'Builder'
    },
    {
      value: 'preview',
      label: language === 'ar' ? 'معاينة' : 'Preview'
    },
    {
      value: 'style',
      label: language === 'ar' ? 'التنسيق' : 'Style'
    },
    {
      value: 'publish',
      label: language === 'ar' ? 'النشر' : 'Publish'
    },
    {
      value: 'shopify',
      label: 'Shopify'
    }
  ];
  
  const handleSaveForm = async () => {
    try {
      setIsSaving(true);
      const updatedForm = {
        title: formState.title,
        description: formState.description,
        data: formState.data,
        style: formState.style,
        product_id: formState.product_id // Include productId when saving form
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
  
  const handlePublishForm = async (publish) => {
    setFormState({
      isPublished: publish
    });
    setUnsavedChanges(true);
  };
  
  // Make sure we have a valid FormStyle object
  const getDefaultStyle = (): FormStyle => {
    return {
      primaryColor: '#9b87f5',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      buttonStyle: 'rounded',
    };
  };
  
  // Ensure formStyle is a valid FormStyle object
  const formStyle: FormStyle = formState?.style || getDefaultStyle();
  
  // Get the first step of form fields or empty array if none
  const currentFields = formState?.data?.length > 0 ? formState.data[0].fields || [] : [];
  
  // Only render once formState is properly loaded
  if (formId && !isLoaded && !formState) {
    return <div className="p-6 text-center">Loading form data...</div>;
  }
  
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
          
          {/* Product information */}
          {productInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">
                  {language === 'ar' ? 'المنتج:' : 'Product:'}
                </div>
                <div className="text-sm text-gray-600">
                  {productInfo.title}
                </div>
              </div>
            </div>
          )}
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
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="builder">
          <div className="mt-4">
            {isLoaded && (
              <FormBuilder
                data={formState?.data || []}
                onChange={handleDataChange}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="mt-4">
            <FormPreview 
              formTitle={formState?.title || ''}
              formDescription={formState?.description || ''}
              currentStep={1}
              totalSteps={formState?.data?.length || 1}
              style={formStyle}
              fields={currentFields}
              floatingButton={useFormStore.getState().floatingButton}
              hideFloatingButtonPreview={false}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="style">
          <div className="mt-4">
            <FormStyleEditor
              formStyle={formStyle}
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
              formStyle={formStyle}
              productId={formState?.product_id}
              onSave={async (settings) => {
                setFormState({
                  ...settings
                });
                await handleSaveForm();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button
          variant="default"
          onClick={handleSaveForm}
          disabled={isSaving || !unsavedChanges}
          className="ml-2"
        >
          {isSaving ? (
            language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
          ) : (
            language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
