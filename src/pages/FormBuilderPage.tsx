
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
import { ArrowLeft, Save, Eye } from 'lucide-react';
import FormBuilderShopify from '@/components/form/builder/FormBuilderShopify';
import ShopifyConnectionBanner from '@/components/form/ShopifyConnectionBanner';

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

  // Handle form data loading
  useEffect(() => {
    const loadForm = async () => {
      if (formId && formId !== 'new') {
        setIsLoading(true);
        try {
          const form = await getFormById(formId);
          if (form) {
            setTitle(form.title);
            setDescription(form.description || '');
            setFormData(form.data || []);
          } else {
            toast.error(language === 'ar' ? 'النموذج غير موجود' : 'Form not found');
            navigate('/forms');
          }
        } catch (error) {
          console.error('Error loading form:', error);
          toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
        } finally {
          setIsLoading(false);
        }
      } else {
        // New form
        setTitle(language === 'ar' ? 'نموذج جديد' : 'New Form');
        setDescription('');
        setFormData([]);
        setIsLoading(false);
      }
    };
    
    loadForm();
  }, [formId, getFormById, language, navigate]);
  
  // Handle form saving
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان النموذج' : 'Please enter a form title');
      return;
    }
    
    setIsSaving(true);
    try {
      const formPayload = {
        title,
        description: description || null,
        data: formData,
        user_id: user?.id,
        shop_id: shopifyConnected ? shop : null,
        is_published: true
      };
      
      let response;
      
      if (formId && formId !== 'new') {
        // Update existing form
        response = await supabase
          .from('forms')
          .update(formPayload)
          .eq('id', formId)
          .select()
          .single();
      } else {
        // Create new form
        response = await supabase
          .from('forms')
          .insert(formPayload)
          .select()
          .single();
      }
      
      if (response.error) {
        throw response.error;
      }
      
      toast.success(
        language === 'ar' 
          ? 'تم حفظ النموذج بنجاح' 
          : 'Form saved successfully'
      );
      
      // If it's a new form, navigate to the form edit page with the new ID
      if (!formId || formId === 'new') {
        navigate(`/form-builder/${response.data.id}`);
      }
      
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(
        language === 'ar' 
          ? 'خطأ في حفظ النموذج' 
          : 'Error saving form'
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Preview form in Shopify
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
    // استخدم وظيفة إعادة الاتصال إذا كانت متوفرة
    if (forceReconnect) {
      forceReconnect();
    } else {
      // الطريقة البديلة - إعادة توجيه مع return_to
      const currentUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/shopify?force=true&return=${currentUrl}&ts=${Date.now()}`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* عرض شريط التحذير في حالة وجود مشكلة في الاتصال */}
        <ShopifyConnectionBanner onReconnect={handleReconnect} />
        
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
              
              {shopifyConnected && formId && formId !== 'new' && (
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
                onShopifyIntegration={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPage;
