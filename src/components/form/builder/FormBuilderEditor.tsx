
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';
import FormBuilderShopify from './FormBuilderShopify';

const FormBuilderEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFormById, saveForm } = useFormTemplates();
  const { t, language } = useI18n();
  const [formData, setFormData] = useState<any>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { syncFormWithShopify, isSyncing } = useShopify();

  const fetchFormData = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    try {
      console.log("FormBuilderEditor: Fetching form data for ID:", formId);
      const form = await getFormById(formId);
      
      if (form) {
        console.log("FormBuilderEditor: Form data received:", form);
        setFormData(form);
        setFormTitle(form.title || '');
        setFormDescription(form.description || '');
        
        try {
          // Parse form data from the "data" field 
          let formDataFields;
          if (typeof form.data === 'string') {
            formDataFields = JSON.parse(form.data);
          } else if (Array.isArray(form.data)) {
            formDataFields = form.data;
          } else {
            formDataFields = [];
            console.warn("FormBuilderEditor: Form data is not in expected format");
          }
          
          console.log("FormBuilderEditor: Parsed form fields:", formDataFields);
          setFormFields(formDataFields);
        } catch (error) {
          console.error('FormBuilderEditor: Error parsing form data:', error);
          setFormFields([]);
          toast.error("خطأ في تحميل بيانات النموذج");
        }
      } else {
        console.error("FormBuilderEditor: Form not found");
        toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
        navigate('/forms');
      }
    } catch (error) {
      console.error('FormBuilderEditor: Error fetching form:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
    } finally {
      setIsLoading(false);
    }
  }, [formId, getFormById, navigate, language]);

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
        console.log("FormBuilderEditor: Syncing form with Shopify", settings);
        await syncFormWithShopify(settings);
      }
      
      toast.success(language === 'ar' ? 'تم حفظ إعدادات Shopify بنجاح' : 'Shopify settings saved successfully');
      
      // Update form data with Shopify settings
      setFormData(prevData => ({
        ...prevData,
        shopify: settings.settings
      }));
      
    } catch (error) {
      console.error('FormBuilderEditor: Error saving Shopify integration:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ إعدادات Shopify' : 'Error saving Shopify settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForm = useCallback(async () => {
    if (!formId || !user) {
      console.error("FormBuilderEditor: Missing formId or user");
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      return;
    }
    
    setIsSaving(true);
    console.log("FormBuilderEditor: Saving form with title:", formTitle);
    console.log("FormBuilderEditor: Form fields to save:", formFields);
    
    try {
      const updatedForm = {
        ...formData,
        title: formTitle,
        description: formDescription,
        data: formFields,
        updated_at: new Date().toISOString(),
        user_id: user.id,
      };
      
      console.log("FormBuilderEditor: Saving form data:", updatedForm);
      
      // Use saveForm
      const success = await saveForm(formId, updatedForm);
      
      if (success) {
        console.log("FormBuilderEditor: Form saved successfully");
        setFormData(updatedForm);
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
      } else {
        console.error("FormBuilderEditor: Error saving form");
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      }
    } catch (error) {
      console.error('FormBuilderEditor: Error saving form:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
    } finally {
      setIsSaving(false);
    }
  }, [formId, user, formTitle, formDescription, formFields, formData, saveForm, language]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#9b87f5]"></div>
        <span className="ml-3">{language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...'}</span>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-8 bg-red-50 text-red-800 p-4 rounded-lg">
        <p className="text-lg font-medium">{language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found'}</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/forms')}
          className="mt-4"
        >
          {language === 'ar' ? 'العودة إلى النماذج' : 'Back to forms'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white shadow py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/forms')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'العودة إلى النماذج' : 'Back to forms'}
          </Button>
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'تعديل النموذج' : 'Edit Form'}</h1>
        </div>
        <div className="flex items-center">
          <Button
            onClick={handleSaveForm}
            disabled={isSaving}
            className="bg-[#9b87f5] hover:bg-[#8a74e8] text-white"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'حفظ النموذج' : 'Save form'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 bg-[#F8F9FB] overflow-auto">
        {/* Main editor area */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'محرر النموذج' : 'Form Editor'}
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل وصفًا للنموذج' : 'Enter form description'}
                rows={3}
              />
            </div>
            
            {/* Form components will be rendered here in the future */}
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center mb-6">
              <p className="text-gray-500">
                {language === 'ar' ? 'سحب مكونات النموذج هنا' : 'Drag form components here'}
              </p>
            </div>
            
            {/* Shopify Integration */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">
                {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
              </h3>
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
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'حفظ النموذج' : 'Save form'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
