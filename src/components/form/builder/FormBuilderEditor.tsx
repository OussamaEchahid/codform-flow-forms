
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import FormBuilder from '@/components/form/FormBuilder';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopifyIntegration from './ShopifyIntegration';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ShopifyConnectionStatus from './ShopifyConnectionStatus';
import { Button } from '@/components/ui/button';

interface FormBuilderEditorProps {
  formId?: string;
}

const MAX_RETRIES = 3;

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { getFormById, clearFormCache } = useFormTemplates();
  const [activeTab, setActiveTab] = useState('builder');
  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { syncFormWithShopify, isSyncing } = useShopify();
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();

  // Create a memoized load form function that we can recall as needed
  const loadForm = useCallback(async (shouldClearCache = false) => {
    if (!formId) {
      setIsLoading(false);
      setLoadError(language === 'ar' ? 'معرف النموذج غير موجود' : 'Form ID is missing');
      return;
    }

    try {
      console.log(`Loading form with ID: ${formId} (retry: ${retryCount}, clearCache: ${shouldClearCache})`);
      setIsLoading(true);
      setLoadError(null);
      
      // Clear cache if requested
      if (shouldClearCache) {
        await clearFormCache();
        console.log('Form cache cleared');
      }
      
      const fetchedForm = await getFormById(formId);
      console.log('Fetched form data:', fetchedForm);
      
      if (fetchedForm) {
        console.log('Form loaded successfully:', fetchedForm);
        // Ensure the form has all required properties
        const formWithDefaults = {
          ...fetchedForm,
          id: fetchedForm.id || formId,
          title: fetchedForm.title || 'Untitled Form',
          data: fetchedForm.data || [],
          sectionConfig: fetchedForm.sectionConfig || { sections: [], layout: 'vertical' },
          style: fetchedForm.style || {}
        };
        console.log('Form with defaults:', formWithDefaults);
        setForm(formWithDefaults);
        setLoadError(null);
        // Reset retry count on success
        setRetryCount(0);
      } else {
        throw new Error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      setLoadError(language === 'ar' 
        ? 'حدث خطأ أثناء تحميل النموذج' 
        : 'An error occurred while loading the form');
        
      // Fall back to dummy data if we've tried too many times
      if (retryCount >= MAX_RETRIES) {
        console.log('Maximum retries reached, using fallback data');
        const fallbackForm = {
          id: formId,
          title: 'Form Editor (Offline Mode)',
          description: language === 'ar' ? 'وضع عدم الاتصال - تم استخدام بيانات احتياطية' : 'Offline Mode - Using fallback data',
          data: [],
          sectionConfig: { sections: [], layout: 'vertical' },
          style: {}
        };
        setForm(fallbackForm);
        
        toast.error(language === 'ar'
          ? 'تعذر تحميل النموذج. تم التبديل إلى وضع عدم الاتصال.'
          : 'Could not load form. Switched to offline mode.');
      } else {
        // Only show toast on first error
        if (retryCount === 0) {
          toast.error(language === 'ar'
            ? 'حدث خطأ أثناء تحميل النموذج. جاري إعادة المحاولة...'
            : 'Error loading form. Retrying...');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [formId, getFormById, language, retryCount, clearFormCache]);

  // Initial load and retry logic
  useEffect(() => {
    loadForm(false);
    
    // Set up automatic retry with exponential backoff
    if (retryCount > 0 && retryCount < MAX_RETRIES) {
      const retryDelay = Math.min(1000 * (2 ** retryCount), 8000);
      console.log(`Scheduling retry ${retryCount} after ${retryDelay}ms`);
      
      const retryTimer = setTimeout(() => {
        console.log(`Executing retry ${retryCount}`);
        loadForm(retryCount > 1); // Clear cache on second retry and beyond
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [loadForm, retryCount]);

  // Auto increment retry counter when errors occur
  useEffect(() => {
    if (loadError && retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
    }
  }, [loadError]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setLoadError(null);
    loadForm(true); // Force cache clearing on manual retry
    toast.info(language === 'ar' ? 'جاري إعادة تحميل النموذج...' : 'Reloading form...');
  };

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
          <p className="text-gray-500 mb-6">
            {language === 'ar' ? 'يرجى الانتظار للحظة' : 'Please wait a moment'}
          </p>
          
          {retryCount > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
              {language === 'ar' 
                ? `محاولة التحميل رقم ${retryCount} من ${MAX_RETRIES}...` 
                : `Load attempt ${retryCount} of ${MAX_RETRIES}...`}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state with retry button
  if (loadError && !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#F8F9FB]">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-medium mb-2 text-red-600">
            {language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error Loading Form'}
          </h3>
          <p className="text-gray-700 mb-6">
            {loadError || (language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found')}
          </p>
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={handleManualRetry}
              className="w-full bg-[#9b87f5] hover:bg-[#8a74e8]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
            
            <Button 
              onClick={() => navigate('/forms')}
              variant="outline"
              className="w-full"
            >
              {language === 'ar' ? 'العودة إلى النماذج' : 'Return to Forms'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F8F9FB] min-h-screen">
      {/* إضافة مكون حالة الاتصال بـ Shopify مع تحسين الظهور */}
      <ShopifyConnectionStatus />
      
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{form?.title || 'Form Editor'}</h1>
          {form?.description && <p className="text-gray-600">{form.description}</p>}
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
              formId={form?.id || formId || ''} 
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
