
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FormBuilder from '@/components/form/FormBuilder';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopifyIntegration from './ShopifyIntegration';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';
import { Loader2 } from 'lucide-react';

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { getFormById } = useFormTemplates();
  const [activeTab, setActiveTab] = useState('builder');
  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { syncFormWithShopify, isSyncing } = useShopify();

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) {
        setIsLoading(false);
        setLoadError(language === 'ar' ? 'معرف النموذج غير موجود' : 'Form ID is missing');
        return;
      }

      try {
        console.log('Loading form with ID:', formId);
        setIsLoading(true);
        setLoadError(null);
        
        const fetchedForm = await getFormById(formId);
        
        if (fetchedForm) {
          console.log('Form loaded successfully:', fetchedForm);
          // Ensure the form has all required properties
          const formWithDefaults = {
            ...fetchedForm,
            data: fetchedForm.data || [],
            sectionConfig: fetchedForm.sectionConfig || { sections: [], layout: 'vertical' },
            style: fetchedForm.style || {}
          };
          setForm(formWithDefaults);
        } else {
          console.error('Form not found or error loading form');
          setLoadError(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
          toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
          setTimeout(() => navigate('/forms'), 2000);
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setLoadError(language === 'ar' 
          ? 'حدث خطأ أثناء تحميل النموذج' 
          : 'An error occurred while loading the form');
        toast.error(language === 'ar' 
          ? 'حدث خطأ أثناء تحميل النموذج' 
          : 'An error occurred while loading the form');
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [formId, getFormById, navigate, language]);

  const handleShopifyIntegrationSave = async (shopifyFormData: ShopifyFormData) => {
    try {
      await syncFormWithShopify(shopifyFormData);
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات شوبيفاي بنجاح' 
        : 'Shopify settings saved successfully');
      setActiveTab('builder');
    } catch (error) {
      console.error('Error saving Shopify integration:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي' 
        : 'An error occurred while saving Shopify settings');
    }
  };

  // Show loading state with better error handling
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#F8F9FB]">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#9b87f5] mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'يرجى الانتظار للحظة' : 'Please wait a moment'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#F8F9FB]">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium mb-2 text-red-600">
            {language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error Loading Form'}
          </h3>
          <p className="text-gray-700 mb-4">
            {loadError || (language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found')}
          </p>
          <button 
            onClick={() => navigate('/forms')}
            className="px-4 py-2 bg-[#9b87f5] text-white rounded-md hover:bg-[#8a74e8] transition-colors"
          >
            {language === 'ar' ? 'العودة إلى النماذج' : 'Return to Forms'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{form.title}</h1>
          {form.description && <p className="text-gray-600">{form.description}</p>}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="builder">
              {language === 'ar' ? 'محرر النموذج' : 'Form Builder'}
            </TabsTrigger>
            <TabsTrigger value="shopify">
              {language === 'ar' ? 'تكامل شوبيفاي' : 'Shopify Integration'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="mt-2">
            {form && <FormBuilder initialFormData={form} />}
          </TabsContent>
          
          <TabsContent value="shopify" className="mt-2">
            <ShopifyIntegration 
              formId={form.id} 
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
