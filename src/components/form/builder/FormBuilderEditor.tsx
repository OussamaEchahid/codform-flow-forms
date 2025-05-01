import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormRenderer, FormBuilder as ReactFormBuilder, FormSubmitResponseData } from '@formio/react';
import { saveForm, fetchForm } from '@/pages/api/forms';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { FormBuilderComponent } from '@/components/form/builder/FormBuilderComponent';
import { FormBuilderPanel } from '@/components/form/builder/FormBuilderPanel';
import { FormBuilderAction } from '@/components/form/builder/FormBuilderAction';
import { FormBuilderSidebar } from '@/components/form/builder/FormBuilderSidebar';
import { FormBuilderSettings } from '@/components/form/builder/FormBuilderSettings';
import { FormBuilderPreview } from '@/components/form/builder/FormBuilderPreview';
import { FormBuilderPublish } from '@/components/form/builder/FormBuilderPublish';
import { FormBuilderShare } from '@/components/form/builder/FormBuilderShare';
import { FormBuilderLogic } from '@/components/form/builder/FormBuilderLogic';
import { FormBuilderTranslate } from '@/components/form/builder/FormBuilderTranslate';
import { FormBuilderIntegrate } from '@/components/form/builder/FormBuilderIntegrate';
import { FormBuilderEmbed } from '@/components/form/builder/FormBuilderEmbed';
import { FormBuilderTest } from '@/components/form/builder/FormBuilderTest';
import { FormBuilderTheme } from '@/components/form/builder/FormBuilderTheme';
import { FormBuilderOptions } from '@/components/form/builder/FormBuilderOptions';
import { FormBuilderWizard } from '@/components/form/builder/FormBuilderWizard';
import { FormBuilderLayout } from '@/components/form/builder/FormBuilderLayout';
import { FormBuilderDisplay } from '@/components/form/builder/FormBuilderDisplay';
import { FormBuilderValidate } from '@/components/form/builder/FormBuilderValidate';
import { FormBuilderConditional } from '@/components/form/builder/FormBuilderConditional';
import { FormBuilderApi } from '@/components/form/builder/FormBuilderApi';
import { FormBuilderEmail } from '@/components/form/builder/FormBuilderEmail';
import { FormBuilderPDF } from '@/components/form/builder/FormBuilderPDF';
import { FormBuilderAnalytics } from '@/components/form/builder/FormBuilderAnalytics';
import { FormBuilderSecurity } from '@/components/form/builder/FormBuilderSecurity';
import { FormBuilderStorage } from '@/components/form/builder/FormBuilderStorage';
import { FormBuilderPremium } from '@/components/form/builder/FormBuilderPremium';
import { FormBuilderAI } from '@/components/form/builder/FormBuilderAI';
import { FormBuilderHelp } from '@/components/form/builder/FormBuilderHelp';
import { FormBuilderAbout } from '@/components/form/builder/FormBuilderAbout';
import { FormBuilderChangelog } from '@/components/form/builder/FormBuilderChangelog';
import { FormBuilderFeedback } from '@/components/form/builder/FormBuilderFeedback';
import { FormBuilderKeyboard } from '@/components/form/builder/FormBuilderKeyboard';
import { FormBuilderDonate } from '@/components/form/builder/FormBuilderDonate';
import { FormBuilderAccount } from '@/components/form/builder/FormBuilderAccount';
import { FormBuilderLogout } from '@/components/form/builder/FormBuilderLogout';
import { FormBuilderUpgrade } from '@/components/form/builder/FormBuilderUpgrade';
import { FormBuilderStatus } from '@/components/form/builder/FormBuilderStatus';
import { FormBuilderSave } from '@/components/form/builder/FormBuilderSave';
import { FormBuilderLoad } from '@/components/form/builder/FormBuilderLoad';
import { FormBuilderClear } from '@/components/form/builder/FormBuilderClear';
import { FormBuilderReset } from '@/components/form/builder/FormBuilderReset';
import { FormBuilderCancel } from '@/components/form/builder/FormBuilderCancel';
import { FormBuilderSubmit } from '@/components/form/builder/FormBuilderSubmit';
import { FormBuilderPrint } from '@/components/form/builder/FormBuilderPrint';
import { FormBuilderPreviewPDF } from '@/components/form/builder/FormBuilderPreviewPDF';
import { FormBuilderPreviewHTML } from '@/components/form/builder/FormBuilderPreviewHTML';
import { FormBuilderPreviewText } from '@/components/form/builder/FormBuilderPreviewText';
import { FormBuilderPreviewJSON } from '@/components/form/builder/FormBuilderPreviewJSON';
import { FormBuilderPreviewData } from '@/components/form/builder/FormBuilderPreviewData';
import { FormBuilderPreviewSource } from '@/components/form/builder/FormBuilderPreviewSource';
import { FormBuilderPreviewCode } from '@/components/form/builder/FormBuilderPreviewCode';
import { FormBuilderPreviewDebug } from '@/components/form/builder/FormBuilderDebug';
import { FormBuilderPreviewConsole } from '@/components/form/builder/FormBuilderConsole';
import { FormBuilderPreviewTest } from '@/components/form/builder/FormBuilderTest';
import { FormBuilderPreviewTheme } from '@/components/form/builder/FormBuilderTheme';
import { FormBuilderPreviewOptions } from '@/components/form/builder/FormBuilderOptions';
import { FormBuilderPreviewWizard } from '@/components/form/builder/FormBuilderWizard';
import { FormBuilderPreviewLayout } from '@/components/form/builder/FormBuilderLayout';
import { FormBuilderPreviewDisplay } from '@/components/form/builder/FormBuilderDisplay';
import { FormBuilderPreviewValidate } from '@/components/form/builder/FormBuilderValidate';
import { FormBuilderPreviewConditional } from '@/components/form/builder/FormBuilderConditional';
import { FormBuilderPreviewApi } from '@/components/form/builder/FormBuilderApi';
import { FormBuilderPreviewEmail } from '@/components/form/builder/FormBuilderEmail';
import { FormBuilderPreviewPDF as FormBuilderPreviewPDF2 } from '@/components/form/builder/FormBuilderPreviewPDF';
import { FormBuilderPreviewAnalytics } from '@/components/form/builder/FormBuilderAnalytics';
import { FormBuilderPreviewSecurity } from '@/components/form/builder/FormBuilderSecurity';
import { FormBuilderPreviewStorage } from '@/components/form/builder/FormBuilderStorage';
import { FormBuilderPreviewPremium } from '@/components/form/builder/FormBuilderPremium';
import { FormBuilderPreviewAI } from '@/components/form/builder/FormBuilderPreviewAI';
import { FormBuilderPreviewHelp } from '@/components/form/builder/FormBuilderHelp';
import { FormBuilderPreviewAbout } from '@/components/form/builder/FormBuilderAbout';
import { FormBuilderPreviewChangelog } from '@/components/form/builder/FormBuilderChangelog';
import { FormBuilderPreviewFeedback } from '@/components/form/builder/FormBuilderFeedback';
import { FormBuilderPreviewKeyboard } from '@/components/form/builder/FormBuilderKeyboard';
import { FormBuilderPreviewDonate } from '@/components/form/builder/FormBuilderDonate';
import { FormBuilderPreviewAccount } from '@/components/form/builder/FormBuilderAccount';
import { FormBuilderPreviewLogout } from '@/components/form/builder/FormBuilderLogout';
import { FormBuilderPreviewUpgrade } from '@/components/form/builder/FormBuilderUpgrade';
import { FormBuilderPreviewStatus } from '@/components/form/builder/FormBuilderStatus';
import { FormBuilderShopify } from '@/components/form/builder/FormBuilderShopify';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';

const FormBuilderEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFormById, updateForm } = useFormTemplates();
  const { t } = useI18n();
  const [formData, setFormData] = useState<any>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formComponents, setFormComponents] = useState<any[]>([]);
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
          const components = typeof form.components === 'string' ? JSON.parse(form.components) : form.components;
          setFormComponents(components);
        } catch (error) {
          console.error('Error parsing form components:', error);
          setFormComponents([]);
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
    setFormComponents(form.components);
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
        components: JSON.stringify(formComponents),
        modified: new Date().toISOString(),
        modifiedBy: user.id,
      };
      await updateForm(formId, updatedForm);
      setFormData(updatedForm);
      toast.success(t('form.save_success'));
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(t('form.save_error'));
    } finally {
      setIsSaving(false);
    }
  }, [formId, user, formTitle, formComponents, formData, updateForm, t]);

  if (isLoading) {
    return <div className="text-center py-8">{t('form.loading')}</div>;
  }

  if (!formData) {
    return <div className="text-center py-8">{t('form.not_found')}</div>;
  }

  const formComponentsInitialized = formComponents.length > 0;

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
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 border-r p-4">
          <FormBuilderSidebar>
            <FormBuilderComponent />
            <FormBuilderPanel />
            <FormBuilderAction />
          </FormBuilderSidebar>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4">
          <DndProvider backend={HTML5Backend}>
            {formComponentsInitialized && (
              <ReactFormBuilder
                form={formComponents}
                onChange={handleFormChange}
              />
            )}
          </DndProvider>
        </div>

        {/* Settings */}
        <div className="w-80 bg-gray-100 border-l p-4">
          <FormBuilderSettings>
            <FormBuilderPreview />
            <FormBuilderPublish />
            <FormBuilderShare />
            <FormBuilderLogic />
            <FormBuilderTranslate />
            <FormBuilderIntegrate onShopifyIntegration={handleShopifyIntegration} isSyncing={isSyncing} />
            <FormBuilderEmbed />
            <FormBuilderTest />
            <FormBuilderTheme />
            <FormBuilderOptions />
            <FormBuilderWizard />
            <FormBuilderLayout />
            <FormBuilderDisplay />
            <FormBuilderValidate />
            <FormBuilderConditional />
            <FormBuilderApi />
            <FormBuilderEmail />
            <FormBuilderPDF />
            <FormBuilderAnalytics />
            <FormBuilderSecurity />
            <FormBuilderStorage />
            <FormBuilderPremium />
            <FormBuilderAI />
            <FormBuilderHelp />
            <FormBuilderAbout />
            <FormBuilderChangelog />
            <FormBuilderFeedback />
            <FormBuilderKeyboard />
            <FormBuilderDonate />
            <FormBuilderAccount />
            <FormBuilderLogout />
            <FormBuilderUpgrade />
            <FormBuilderStatus />
            <FormBuilderSave />
            <FormBuilderLoad />
            <FormBuilderClear />
            <FormBuilderReset />
            <FormBuilderCancel />
            <FormBuilderSubmit />
            <FormBuilderPrint />
            <FormBuilderPreviewPDF />
            <FormBuilderPreviewHTML />
            <FormBuilderPreviewText />
            <FormBuilderPreviewJSON />
            <FormBuilderPreviewData />
            <FormBuilderPreviewSource />
            <FormBuilderPreviewCode />
            <FormBuilderPreviewDebug />
            <FormBuilderPreviewConsole />
            <FormBuilderPreviewTest />
            <FormBuilderPreviewTheme />
            <FormBuilderPreviewOptions />
            <FormBuilderPreviewWizard />
            <FormBuilderPreviewLayout />
            <FormBuilderPreviewDisplay />
            <FormBuilderPreviewValidate />
            <FormBuilderPreviewConditional />
            <FormBuilderPreviewApi />
            <FormBuilderPreviewEmail />
            <FormBuilderPreviewPDF2 />
            <FormBuilderPreviewAnalytics />
            <FormBuilderPreviewSecurity />
            <FormBuilderPreviewStorage />
            <FormBuilderPreviewPremium />
            <FormBuilderPreviewAI />
            <FormBuilderPreviewHelp />
            <FormBuilderPreviewAbout />
            <FormBuilderPreviewChangelog />
            <FormBuilderPreviewFeedback />
            <FormBuilderPreviewKeyboard />
            <FormBuilderPreviewDonate />
            <FormBuilderPreviewAccount />
            <FormBuilderPreviewLogout />
            <FormBuilderPreviewUpgrade />
            <FormBuilderPreviewStatus />
            <FormBuilderShopify />
          </FormBuilderSettings>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
