
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FormDesigner from '@/components/form/designer/FormDesigner';
import { FormDesignData } from '@/components/form/designer/FormDesigner';
import { v4 as uuidv4 } from 'uuid';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';

const FormsPage = () => {
  const navigate = useNavigate();
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const { forms, isLoading: isLoadingTemplates, fetchForms } = useFormTemplates();
  
  const [formData, setFormData] = useState<FormDesignData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formsCount, setFormsCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const shopId = shop || localStorage.getItem('shopify_store');
  
  useEffect(() => {
    const loadForms = async () => {
      setIsLoading(true);
      try {
        if (!shopId) {
          toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
          setIsLoading(false);
          return;
        }
        
        // Get count of forms for this shop
        const { count, error: countError } = await supabase
          .from('forms')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId);
        
        if (countError) {
          console.error('Error counting forms:', countError);
          toast.error(language === 'ar' ? 'خطأ في عد النماذج' : 'Error counting forms');
        } else {
          setFormsCount(count || 0);
          
          // If there are forms, load the first one
          if (count && count > 0) {
            const { data, error } = await supabase
              .from('forms')
              .select('*')
              .eq('shop_id', shopId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (error) {
              console.error('Error loading form:', error);
              toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
            } else if (data) {
              console.log("Loaded form data:", data);
              // Transform database data to FormDesignData format
              const formDesignData: FormDesignData = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                steps: data.data || [{ id: 'step-1', title: 'الخطوة الأولى', fields: [] }],
                style: {
                  primaryColor: data.primaryColor || '#9b87f5',
                  borderRadius: data.borderRadius || '0.5rem',
                  fontSize: data.fontSize || '1rem',
                  buttonStyle: data.buttonStyle || 'rounded'
                },
                submitButtonText: data.submitButtonText || 'إرسال الطلب',
                isPublished: data.is_published || false
              };
              
              setFormData(formDesignData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading forms:', error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النماذج' : 'Error loading forms');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load templates too for reference
    if (!isLoadingTemplates) {
      fetchForms();
    }
    
    if (shopId) {
      loadForms();
    } else {
      setIsLoading(false);
    }
  }, [shopId, language]);
  
  const createNewForm = async () => {
    if (!shopId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a new form with default data
      const newFormId = uuidv4();
      const defaultFormData: FormDesignData = {
        id: newFormId,
        title: language === 'ar' ? 'نموذج جديد' : 'New Form',
        description: '',
        steps: [
          {
            id: 'step-1',
            title: language === 'ar' ? 'الخطوة الأولى' : 'Step 1',
            fields: []
          }
        ],
        style: {
          primaryColor: '#9b87f5',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          buttonStyle: 'rounded'
        },
        submitButtonText: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        isPublished: false
      };
      
      console.log("Creating new form with data:", {
        id: newFormId,
        shop_id: shopId,
        user_id: user?.id
      });
      
      // Save to database
      const { error } = await supabase
        .from('forms')
        .insert({
          id: newFormId,
          title: defaultFormData.title,
          description: defaultFormData.description,
          data: defaultFormData.steps,
          primaryColor: defaultFormData.style.primaryColor,
          borderRadius: defaultFormData.style.borderRadius,
          fontSize: defaultFormData.style.fontSize,
          buttonStyle: defaultFormData.style.buttonStyle,
          submitButtonText: defaultFormData.submitButtonText,
          is_published: defaultFormData.isPublished,
          shop_id: shopId,
          user_id: user?.id
        });
      
      if (error) {
        console.error('Error creating form:', error);
        toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
        setIsLoading(false);
        return;
      }
      
      setFormData(defaultFormData);
      setFormsCount(prev => prev + 1);
      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد' : 'New form created');
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveForm = async (data: FormDesignData): Promise<boolean> => {
    if (!shopId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
      return false;
    }
    
    try {
      setIsSaving(true);
      console.log("Saving form with data:", data);
      
      // Update the form in the database
      const { error } = await supabase
        .from('forms')
        .update({
          title: data.title,
          description: data.description,
          data: data.steps,
          primaryColor: data.style.primaryColor,
          borderRadius: data.style.borderRadius,
          fontSize: data.style.fontSize,
          buttonStyle: data.style.buttonStyle,
          submitButtonText: data.submitButtonText,
          updated_at: new Date().toISOString() // Force update timestamp
        })
        .eq('id', data.id);
      
      if (error) {
        console.error('Error saving form:', error);
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
        return false;
      }
      
      // Update local state
      setFormData(data);
      return true;
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublishForm = async (id: string, publish: boolean): Promise<boolean> => {
    try {
      // Update the publish status in the database
      const { error } = await supabase
        .from('forms')
        .update({ 
          is_published: publish,
          updated_at: new Date().toISOString() // Force update timestamp
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error publishing form:', error);
        toast.error(publish 
          ? (language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form')
          : (language === 'ar' ? 'خطأ في إلغاء نشر النموذج' : 'Error unpublishing form'));
        return false;
      }
      
      // Update local state if the form data exists
      if (formData && formData.id === id) {
        setFormData(prev => prev ? { ...prev, isPublished: publish } : null);
      }
      
      return true;
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error(language === 'ar' ? 'خطأ في تغيير حالة النشر' : 'Error changing publish status');
      return false;
    }
  };
  
  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' 
                ? 'الوصول مقيد' 
                : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى الاتصال بمتجر Shopify للوصول إلى النماذج' 
                : 'Please connect to a Shopify store to access forms'}
            </p>
            
            <Button 
              onClick={() => navigate('/shopify')}
              className="w-full"
            >
              {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'نماذج الدفع عند الاستلام' : 'Cash On Delivery Forms'}
            </h1>
            <p className="text-gray-500">
              {language === 'ar' 
                ? 'إنشاء وإدارة نماذج دفع مخصصة لمتجرك' 
                : 'Create and manage custom payment forms for your store'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {formsCount === 0 && (
              <Button onClick={createNewForm} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-4">
            <ShopifyConnectionStatus />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : formData ? (
          <FormDesigner
            formData={formData}
            onSave={handleSaveForm}
            onPublish={handlePublishForm}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white">
            <p className="mb-4 text-gray-500">
              {language === 'ar' 
                ? 'لا يوجد نماذج بعد' 
                : 'No forms yet'}
            </p>
            <Button onClick={createNewForm}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsPage;
