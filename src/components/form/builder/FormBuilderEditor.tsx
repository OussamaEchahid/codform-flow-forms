
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormBuilderDashboard from './FormBuilderDashboard';
import FormPreviewPanel from './FormPreviewPanel';
import ShopifyIntegration from './ShopifyIntegration';
import FormSettingsTab from './FormSettingsTab';
import { useFormStore, FormStep } from '@/hooks/useFormStore';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Loader2, Save, Eye, Settings, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveShopId } from '@/utils/shop-utils';

const FormBuilderEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { addForm, updateForm } = useFormTemplates();
  
  const {
    title,
    description,
    steps,
    style,
    isPublished,
    setTitle,
    setDescription,
    setSteps,
    setStyle,
    setIsPublished,
    resetForm,
    country,
    currency,
    phonePrefix,
    setCountry,
    setCurrency,
    setPhonePrefix
  } = useFormStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  const isNewForm = id === 'new';

  // Load existing form data
  useEffect(() => {
    const loadForm = async () => {
      if (isNewForm) {
        resetForm();
        return;
      }

      if (!id) return;

      const shopId = getActiveShopId();
      if (!shopId) {
        console.error('❌ FormBuilderEditor: No active shop found');
        toast.error('لم يتم العثور على متجر نشط');
        navigate('/forms');
        return;
      }

      setIsLoading(true);
      try {
        console.log(`📖 FormBuilderEditor: Loading form ${id} for shop ${shopId}`);
        
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .eq('shop_id', shopId) // Filter by shop_id
          .single();

        if (error) {
          console.error('❌ FormBuilderEditor: Error loading form:', error);
          toast.error('فشل في تحميل النموذج');
          navigate('/forms');
          return;
        }

        if (!data) {
          console.error('❌ FormBuilderEditor: Form not found');
          toast.error('النموذج غير موجود');
          navigate('/forms');
          return;
        }

        console.log(`✅ FormBuilderEditor: Loaded form ${id} successfully`);

        // Load form data into store
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSteps(Array.isArray(data.data) ? data.data as FormStep[] : []);
        setStyle(data.style || {});
        setIsPublished(data.is_published || false);
        setCountry(data.country || 'SA');
        setCurrency(data.currency || 'SAR');
        setPhonePrefix(data.phone_prefix || '+966');
      } catch (error) {
        console.error('❌ FormBuilderEditor: Error loading form:', error);
        toast.error('خطأ في تحميل النموذج');
        navigate('/forms');
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [id, isNewForm, resetForm, setTitle, setDescription, setSteps, setStyle, setIsPublished, setCountry, setCurrency, setPhonePrefix, navigate]);

  const handleSave = useCallback(async () => {
    const shopId = getActiveShopId();
    if (!shopId) {
      console.error('❌ FormBuilderEditor: No active shop found when saving');
      toast.error('لم يتم العثور على متجر نشط');
      return;
    }

    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان النموذج');
      return;
    }

    setIsSaving(true);
    try {
      const formData = {
        title: title.trim(),
        description: description.trim(),
        data: steps,
        style,
        is_published: isPublished,
        shop_id: shopId,
        country,
        currency,
        phone_prefix: phonePrefix
      };

      console.log(`💾 FormBuilderEditor: Saving form for shop ${shopId}`, { 
        isNewForm, 
        formId: id,
        title: title.trim()
      });

      if (isNewForm) {
        // Create new form
        const { data, error } = await supabase
          .from('forms')
          .insert([formData])
          .select()
          .single();

        if (error) {
          console.error('❌ FormBuilderEditor: Error creating form:', error);
          throw error;
        }

        console.log(`✅ FormBuilderEditor: Created new form ${data.id} for shop ${shopId}`);
        
        // Add to local state
        addForm({
          ...data,
          data: data.data as FormStep[],
          isPublished: data.is_published
        });

        toast.success('تم إنشاء النموذج بنجاح');
        navigate(`/forms/${data.id}`);
      } else {
        // Update existing form
        const { data, error } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', id)
          .eq('shop_id', shopId) // Filter by shop_id for safety
          .select()
          .single();

        if (error) {
          console.error('❌ FormBuilderEditor: Error updating form:', error);
          throw error;
        }

        console.log(`✅ FormBuilderEditor: Updated form ${id} for shop ${shopId}`);

        // Update local state
        updateForm({
          ...data,
          data: data.data as FormStep[],
          isPublished: data.is_published
        });

        toast.success('تم حفظ النموذج بنجاح');
      }
    } catch (error) {
      console.error('❌ FormBuilderEditor: Save error:', error);
      toast.error('فشل في حفظ النموذج');
    } finally {
      setIsSaving(false);
    }
  }, [
    title, description, steps, style, isPublished, country, currency, phonePrefix,
    isNewForm, id, addForm, updateForm, navigate
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل النموذج...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isNewForm ? 'إنشاء نموذج جديد' : 'تحرير النموذج'}
          </h1>
          {!isNewForm && (
            <p className="text-gray-600 mt-1">
              تحرير النموذج: {title || 'بدون عنوان'}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات النموذج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="builder" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    البناء
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    الإعدادات
                  </TabsTrigger>
                  <TabsTrigger value="shopify" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Shopify
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="mt-6">
                  <FormBuilderDashboard />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <FormSettingsTab />
                </TabsContent>

                <TabsContent value="shopify" className="mt-6">
                  <ShopifyIntegration 
                    formId={id || 'new'}
                    formTitle={title}
                    formDescription={description}
                    formStyle={style}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                معاينة النموذج
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FormPreviewPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
