
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';
import FormBuilderShopify from './FormBuilderShopify';

const FormBuilderEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFormById, fetchForms, saveForm } = useFormTemplates();
  const { t } = useI18n();
  const [formData, setFormData] = useState<any>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { syncFormWithShopify, isSyncing } = useShopify();

  const fetchFormData = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    try {
      const form = await getFormById(formId);
      if (form) {
        setFormData(form);
        setFormTitle(form.title || '');
        try {
          // Parse form data from the "data" field instead of "components"
          const formDataFields = typeof form.data === 'string' 
            ? JSON.parse(form.data) 
            : form.data || [];
          setFormFields(formDataFields);
        } catch (error) {
          console.error('Error parsing form data:', error);
          setFormFields([]);
        }
      } else {
        toast.error(t('form.not_found'));
        navigate('/forms');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error(t('form.fetch_error'));
    } finally {
      setIsLoading(false);
    }
  }, [formId, getFormById, navigate, t]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const handleFormChange = useCallback((form: any) => {
    setFormFields(form.fields || []);
  }, []);

  const handleShopifyIntegration = async (settings: ShopifyFormData) => {
    try {
      setIsSaving(true);
      
      // If we have a syncFormWithShopify function available
      if (typeof syncFormWithShopify === 'function') {
        await syncFormWithShopify(settings);
      }
      
      toast.success(t('shopify.integration_success'));
      
      // Update form data with Shopify settings
      setFormData(prevData => ({
        ...prevData,
        shopify: settings.settings
      }));
      
    } catch (error) {
      console.error('Error saving Shopify integration:', error);
      toast.error(t('shopify.integration_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForm = useCallback(async () => {
    if (!formId || !user) return;
    setIsSaving(true);
    try {
      const updatedForm = {
        ...formData,
        title: formTitle,
        data: JSON.stringify(formFields),
        updated_at: new Date().toISOString(),
        user_id: user.id,
      };
      
      // Use saveForm instead of updateForm
      await saveForm(formId, updatedForm);
      setFormData(updatedForm);
      toast.success(t('form.save_success'));
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(t('form.save_error'));
    } finally {
      setIsSaving(false);
    }
  }, [formId, user, formTitle, formFields, formData, saveForm, t]);

  if (isLoading) {
    return <div className="text-center py-8">{t('form.loading')}</div>;
  }

  if (!formData) {
    return <div className="text-center py-8">{t('form.not_found')}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white shadow py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/forms')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('form.back_to_forms')}
          </Button>
          <h1 className="text-2xl font-bold">{t('form.edit_form')}</h1>
        </div>
        <div className="flex items-center">
          <Button
            onClick={handleSaveForm}
            disabled={isSaving}
            className="bg-[#9b87f5] hover:bg-[#8a74e8] text-white"
          >
            {isSaving ? t('form.saving') : t('form.save')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 bg-[#F8F9FB]">
        {/* Main editor area */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('form.builder_placeholder')}</h2>
            <p className="text-gray-600 mb-4">
              {t('form.builder_coming_soon') || 
              "The form builder is currently in development. Basic functionality is available but full features are coming soon."}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">{t('form.title')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            
            {/* Form components will be rendered here in the future */}
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
              <p className="text-gray-500">{t('form.drag_components_here') || "Drag form components here"}</p>
            </div>
            
            {/* Shopify Integration */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">{t('shopify.integration') || 'Shopify Integration'}</h3>
              <FormBuilderShopify 
                onShopifyIntegration={handleShopifyIntegration}
                isSyncing={isSyncing}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveForm}
                disabled={isSaving}
                className="bg-[#9b87f5] hover:bg-[#8a74e8] text-white"
              >
                {isSaving ? t('form.saving') : t('form.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
