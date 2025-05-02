
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FormBuilder from '@/components/form/FormBuilder';
import { ArrowLeft, Save, Eye, AlertCircle, RefreshCcw } from 'lucide-react';
import FormBuilderShopify from '@/components/form/builder/FormBuilderShopify';
import ShopifyConnectionBanner from '@/components/form/ShopifyConnectionBanner';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { user, shopifyConnected, shop, forceReconnect } = useAuth();
  const { getFormById } = useFormFetch();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [hasInitialFormData, setHasInitialFormData] = useState<boolean>(false);

  // معالجة تحميل بيانات النموذج
  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`FormBuilderPage: Loading form with ID: ${formId}`);
        let form;
        
        // إضافة تأخير قصير لتجنب التحميل المستمر
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          form = await getFormById(formId || 'new');
          
          // تأكد من وجود بيانات صالحة
          if (!form || (!form.id && formId !== 'new')) {
            throw new Error('No valid form data received');
          }
          
        } catch (fetchError) {
          console.error('Error fetching form:', fetchError);
          setConnectionError(true);
          
          // محاولة استرجاع البيانات المخزنة محليًا
          try {
            const cachedForm = localStorage.getItem(`form_${formId}`);
            if (cachedForm) {
              form = JSON.parse(cachedForm);
              console.log('Using cached form data:', form);
            }
          } catch (cacheError) {
            console.error('Error retrieving cached form:', cacheError);
          }
          
          // إنشاء نموذج افتراضي في حالة وجود مشكلة في الاتصال
          if (!form) {
            form = {
              id: formId || 'new',
              title: formId === 'new' ? 'نموذج جديد' : 'نموذج موجود',
              description: '',
              data: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: user?.id || '',
              is_published: false
            };
          }
        }
        
        if (form) {
          console.log('Form loaded successfully:', form);
          setTitle(form.title || '');
          setDescription(form.description || '');
          // التأكد من أن البيانات دائمًا مصفوفة
          const formDataArray = Array.isArray(form.data) ? form.data : [];
          setFormData(formDataArray);
          setHasInitialFormData(true);
        } else {
          console.error('Form not found');
          toast.error(language === 'ar' ? 'النموذج غير موجود' : 'Form not found');
          navigate('/forms');
        }
      } catch (error) {
        console.error('Error loading form:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل النموذج';
        setLoadError(errorMessage);
        toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadForm();
  }, [formId, getFormById, language, navigate, user?.id]);
  
  // حفظ النموذج مع معالجة الخطأ
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان النموذج' : 'Please enter a form title');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Saving form...');
      const formPayload = {
        title,
        description: description || null,
        data: formData,
        user_id: user?.id,
        shop_id: shopifyConnected ? shop : null,
        is_published: true
      };
      
      if (connectionError) {
        console.log('Saving form in offline mode (mock)');
        // عرض إشعار للمستخدم أن النموذج سيتم حفظه عند استعادة الاتصال
        toast.warning(
          language === 'ar' 
            ? 'الاتصال غير متاح حاليًا. سيتم حفظ النموذج عند استعادة الاتصال.' 
            : 'Connection unavailable. Form will be saved when connection is restored.'
        );
        
        // تخزين النموذج محليًا للحفظ لاحقًا
        const offlineForms = JSON.parse(localStorage.getItem('offline_forms') || '[]');
        offlineForms.push({
          id: formId === 'new' ? `new-${Date.now()}` : formId,
          ...formPayload,
          pendingSave: true,
          lastModified: new Date().toISOString()
        });
        localStorage.setItem('offline_forms', JSON.stringify(offlineForms));
        
        // حفظ النموذج الحالي أيضًا
        localStorage.setItem(`form_${formId || 'new'}`, JSON.stringify({
          id: formId || 'new',
          ...formPayload
        }));
        
        // توجيه المستخدم إلى صفحة النماذج
        toast.success(
          language === 'ar' 
            ? 'تم حفظ النموذج مؤقتًا. سيتم مزامنته عند استعادة الاتصال.' 
            : 'Form saved temporarily. It will be synced when connection is restored.'
        );
        
        if (formId === 'new') {
          navigate('/forms');
        }
        return;
      }
      
      let response;
      
      if (formId && formId !== 'new') {
        // تحديث نموذج موجود
        console.log('Updating existing form:', formId);
        response = await supabase
          .from('forms')
          .update(formPayload)
          .eq('id', formId)
          .select()
          .single();
      } else {
        // إنشاء نموذج جديد
        console.log('Creating new form');
        response = await supabase
          .from('forms')
          .insert(formPayload)
          .select()
          .single();
      }
      
      if (response.error) {
        console.error('Supabase error:', response.error);
        throw response.error;
      }
      
      console.log('Form saved successfully:', response.data);
      toast.success(
        language === 'ar' 
          ? 'تم حفظ النموذج بنجاح' 
          : 'Form saved successfully'
      );
      
      // إذا كان نموذجًا جديدًا، انتقل إلى صفحة تحرير النموذج باستخدام المعرف الجديد
      if (!formId || formId === 'new') {
        navigate(`/form-builder/${response.data.id}`);
      }
      
    } catch (error) {
      console.error('Error saving form:', error);
      
      // التخزين المؤقت في حالة فشل الاتصال
      if (error instanceof Error && error.message.includes('fetch')) {
        setConnectionError(true);
        toast.warning(
          language === 'ar' 
            ? 'فشل الاتصال. سيتم حفظ النموذج مؤقتًا.' 
            : 'Connection failed. Form will be saved temporarily.'
        );
        
        // تخزين النموذج محليًا
        localStorage.setItem(`form_${formId || 'new'}`, JSON.stringify({
          title, 
          description, 
          data: formData
        }));
      } else {
        toast.error(
          language === 'ar' 
            ? 'خطأ في حفظ النموذج' 
            : 'Error saving form'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // معاينة النموذج في Shopify
  const handlePreviewInShopify = () => {
    if (shopifyConnected && shop && formId && formId !== 'new') {
      const shopifyUrl = `https://${shop}/apps/codform/?form=${formId}`;
      window.open(shopifyUrl, '_blank');
    } else {
      toast.error(
        language === 'ar' 
          ? 'يجب حفظ النموذج أولاً والاتصال بـ Shopify' 
          : 'Save the form first and connect to Shopify'
      );
    }
  };
  
  // معالج إعادة الاتصال المخصص
  const handleReconnect = () => {
    // استخدام وظيفة إعادة الاتصال إذا كانت متوفرة
    if (forceReconnect) {
      forceReconnect();
    } else {
      // الطريقة البديلة - إعادة توجيه مع return_to
      const currentUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/shopify?force=true&return=${currentUrl}&ts=${Date.now()}`;
    }
  };

  // معالجة تكامل Shopify
  const handleShopifyIntegration = async (settings: ShopifyFormData): Promise<void> => {
    try {
      setIsSyncing(true);
      
      if (!formId || formId === 'new') {
        toast.error(language === 'ar' 
          ? 'يجب حفظ النموذج أولاً قبل تكوين تكامل Shopify'
          : 'Please save the form first before configuring Shopify integration');
        return;
      }
      
      // تنفيذ بسيط لحفظ إعدادات النموذج في Shopify
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          form_id: formId,
          product_id: settings.product_id || 'all',
          shop_id: shop || '',
          block_id: settings.settings?.blockId || 'codform-default',
          enabled: settings.settings?.enabled || true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات التكامل مع Shopify بنجاح'
        : 'Shopify integration settings saved successfully');
        
    } catch (error) {
      console.error('Error saving Shopify integration:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء حفظ إعدادات التكامل'
        : 'Error saving integration settings');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // إعادة محاولة تحميل النموذج
  const handleRetry = () => {
    setLoadError(null);
    setConnectionError(false);
    setIsLoading(true);
    // إعادة تحميل الصفحة لمحاولة جديدة
    window.location.reload();
  };
  
  // عرض حالة التحميل
  if (isLoading && !hasInitialFormData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* عرض شريط التحذير في حالة وجود مشكلة في الاتصال */}
        <ShopifyConnectionBanner onReconnect={handleReconnect} />
        
        {/* عرض تحذير عند وجود خطأ في التحميل */}
        {(loadError || connectionError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === 'ar' 
                ? 'حدث خطأ في الاتصال. يمكنك متابعة العمل والمحاولة مرة أخرى لاحقًا.' 
                : 'Connection error occurred. You can continue working and try again later.'}
              <Button 
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={handleRetry}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/forms')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'عودة إلى النماذج' : 'Back to Forms'}
          </Button>
          
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'منشئ النماذج' : 'Form Builder'}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* معلومات النموذج */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-medium mb-4">
                {language === 'ar' ? 'معلومات النموذج' : 'Form Information'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'العنوان' : 'Title'}
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل وصف النموذج (اختياري)' : 'Enter form description (optional)'}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            {/* منشئ النماذج */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-medium mb-4">
                {language === 'ar' ? 'حقول النموذج' : 'Form Fields'}
              </h2>
              
              <FormBuilder
                formData={formData}
                onChange={setFormData}
              />
            </div>
            
            {/* أزرار الإجراءات */}
            <div className="flex justify-between">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-current rounded-full"></div>
                    {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'حفظ النموذج' : 'Save Form'}
                  </>
                )}
              </Button>
              
              {shopifyConnected && formId && formId !== 'new' && !connectionError && (
                <Button
                  variant="outline"
                  onClick={handlePreviewInShopify}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'معاينة في Shopify' : 'Preview in Shopify'}
                </Button>
              )}
            </div>
          </div>
          
          {/* الإعدادات والتكامل */}
          <div className="space-y-6">
            {/* تكامل Shopify */}
            <div className="bg-white p-6 rounded-lg shadow">
              <FormBuilderShopify 
                isSyncing={isSyncing}
                formId={formId !== 'new' ? formId : null}
                onShopifyIntegration={handleShopifyIntegration}
              />
            </div>
            
            {/* معلومات الوضع غير المتصل */}
            {connectionError && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-100">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription>
                  {language === 'ar' 
                    ? 'أنت تعمل في الوضع غير المتصل. سيتم حفظ التغييرات محليًا حتى يتم استعادة الاتصال.' 
                    : 'You are working in offline mode. Changes will be saved locally until connection is restored.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPage;
