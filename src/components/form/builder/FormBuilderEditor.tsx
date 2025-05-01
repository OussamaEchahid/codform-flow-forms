import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormData, FormElement, FormSectionConfig } from '@/lib/form-utils';
import FormElementEditor from './FormElementEditor';
import FormElementList from './FormElementList';
import FormPreviewPanel from './FormPreviewPanel';
import FormHeader from './FormHeader';
import FormStyleEditor from './FormStyleEditor';
import ShopifyIntegration from './ShopifyIntegration';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import ShopifyConnectionStatus from './ShopifyConnectionStatus';
import { useShopify } from '@/hooks/useShopify';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';

interface FormBuilderProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderProps> = ({ formId }) => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { updateForm, fetchFormById } = useFormTemplates();
  const [activeTab, setActiveTab] = useState<'elements' | 'styling' | 'preview' | 'shopify'>('elements');
  const [form, setForm] = useState<FormData | null>(null);
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [sectionConfig, setSectionConfig] = useState<FormSectionConfig>({
    sections: [],
    layout: 'vertical',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Add shopify connection hooks
  const { shopifyConnected, shop } = useAuth();
  const { isSyncing, syncFormWithShopify } = useShopify();

  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        setIsLoading(true);
        try {
          const fetchedForm = await fetchFormById(formId);
          if (fetchedForm) {
            setForm(fetchedForm);
            setSectionConfig(fetchedForm.sectionConfig || { sections: [], layout: 'vertical' });
          } else {
            toast.error(t('formNotFound'));
            navigate('/forms');
          }
        } catch (error) {
          console.error('Error fetching form:', error);
          toast.error(t('formFetchError'));
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [formId, navigate, t, fetchFormById]);

  const handleElementSelect = (element: FormElement) => {
    setSelectedElement(element);
  };

  const handleFormUpdate = async (updatedForm: FormData) => {
    if (!updatedForm.id) {
      toast.error(t('formIdMissing'));
      return;
    }

    try {
      await updateForm(updatedForm.id, updatedForm);
      setForm(updatedForm);
      toast.success(t('formUpdated'));
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error(t('formUpdateError'));
    }
  };

  const handleSectionConfigUpdate = async (newSectionConfig: FormSectionConfig) => {
    if (!form?.id) {
      toast.error(t('formIdMissing'));
      return;
    }

    try {
      const updatedForm = { ...form, sectionConfig: newSectionConfig };
      await updateForm(form.id, updatedForm);
      setForm(updatedForm);
      setSectionConfig(newSectionConfig);
      toast.success(t('formUpdated'));
    } catch (error) {
      console.error('Error updating section config:', error);
      toast.error(t('formUpdateError'));
    }
  };

  // Handle Shopify integration save
  const handleShopifyIntegrationSave = async (shopifyFormData: ShopifyFormData) => {
    try {
      await syncFormWithShopify(shopifyFormData);
      setActiveTab('elements');
      toast.success(t('shopifyIntegrationSaved'));
    } catch (error) {
      console.error('Error saving Shopify integration:', error);
      const errorMessage = error instanceof Error ? error.message : t('shopifyIntegrationError');
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}...</div>;
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F8F9FB]">
      {/* Always show connection status at the top for better visibility */}
      <ShopifyConnectionStatus />
      
      <FormHeader 
        form={form} 
        onFormUpdate={handleFormUpdate} 
      />
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="elements">{t('elements')}</TabsTrigger>
            <TabsTrigger value="styling">{t('styling')}</TabsTrigger>
            <TabsTrigger value="preview">{t('preview')}</TabsTrigger>
            <TabsTrigger value="shopify">{t('shopifyIntegration')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <FormElementList
                  formId={form?.id || ''}
                  selectedElement={selectedElement}
                  onElementSelect={handleElementSelect}
                  sectionConfig={sectionConfig}
                  onSectionConfigUpdate={handleSectionConfigUpdate}
                />
              </div>
              <div className="md:col-span-2">
                <FormElementEditor
                  formId={form?.id || ''}
                  selectedElement={selectedElement}
                  onFormUpdate={handleFormUpdate}
                  sectionConfig={sectionConfig}
                  onSectionConfigUpdate={handleSectionConfigUpdate}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="styling" className="space-y-4">
            <FormStyleEditor
              form={form}
              onFormUpdate={handleFormUpdate}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <FormPreviewPanel
              form={form}
              sectionConfig={sectionConfig}
            />
          </TabsContent>
          
          <TabsContent value="shopify" className="space-y-4">
            <ShopifyIntegration
              formId={form?.id || ''}
              onSave={handleShopifyIntegrationSave}
              isSyncing={isSyncing}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
