import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormStep, formTemplates } from '@/lib/form-utils';
import { useAuth } from '@/lib/auth';
import { Json } from '@/integrations/supabase/types';

export interface FormData {
  id: string;
  title: string;
  description: string;
  data: FormStep[];
  is_published: boolean;
  created_at: string;
  user_id: string;
  shop_id?: string;
  updated_at?: string;
}

export const useFormTemplates = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FormData | null>(null);
  const { user, shop } = useAuth();
  
  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
        
      // إذا كان لدينا معرف متجر Shopify، نقوم بتصفية النماذج حسب المتجر
      if (shop) {
        query = query.eq('shop_id', shop);
      }
      
      const { data: formsData, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Transform the data to ensure proper typing
      const formattedData: FormData[] = formsData?.map(form => ({
        ...form,
        data: form.data as unknown as FormStep[] // Safe type assertion with unknown as intermediary
      })) || [];
      
      setForms(formattedData);
    } catch (error: any) {
      toast.error(`خطأ في جلب النماذج: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  const createFormFromTemplate = useCallback(async (templateId: number) => {
    try {
      const selectedTemplate = formTemplates.find(t => t.id === templateId);
      
      if (!selectedTemplate) {
        toast.error('لم يتم العثور على القالب المحدد');
        return null;
      }
      
      toast.success(`تم اختيار قالب ${selectedTemplate.title}`);
      
      const formData = {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        data: selectedTemplate.data as unknown as Json, // Cast to unknown first, then to Json
        is_published: false,
        shop_id: shop || '',
        user_id: user?.id || '' // Ensure user_id is always included
      };
      
      const { data, error } = await supabase
        .from('forms')
        .insert(formData) // Don't wrap in array for a single row
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success(`تم إنشاء نموذج "${selectedTemplate.title}" بنجاح`);
      
      if (data && data.length > 0) {
        const newForm = {
          ...data[0],
          data: data[0].data as unknown as FormStep[] // Safe type assertion with unknown as intermediary
        } as FormData;
        
        setSelectedTemplate(newForm);
        await fetchForms();
        return newForm;
      }
      return null;
    } catch (error: any) {
      toast.error(`خطأ في إنشاء النموذج: ${error.message}`);
      return null;
    }
  }, [shop, user, fetchForms]);

  const createDefaultForm = useCallback(async () => {
    return createFormFromTemplate(1); // Use template ID 1 as default
  }, [createFormFromTemplate]);

  const saveForm = async (formId: string, formData: any) => {
    if (!shop) {
      toast.error('يجب توصيل متجر Shopify لحفظ النموذج');
      return false;
    }
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        data: formData.data as unknown as Json, // Safe type assertion with unknown as intermediary
        updated_at: new Date().toISOString(),
        shop_id: shop,
        user_id: user?.id || '' // Ensure user_id is included in updates
      };
      
      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId);
      
      if (error) {
        throw error;
      }
      
      toast.success('تم حفظ النموذج بنجاح');
      await fetchForms();
      return true;
    } catch (error: any) {
      toast.error(`خطأ في حفظ النموذج: ${error.message}`);
      return false;
    }
  };

  const publishForm = async (formId: string, isPublished: boolean) => {
    if (!shop) {
      toast.error('يجب توصيل متجر Shopify لنشر النموذج');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId);
      
      if (error) {
        throw error;
      }
      
      toast.success(isPublished ? 'تم نشر النموذج بنجاح' : 'تم إلغاء نشر النموذج');
      await fetchForms();
      return true;
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
      return false;
    }
  };

  const deleteForm = async (formId: string) => {
    if (!shop) {
      toast.error('يجب توصيل متجر Shopify لحذف النموذج');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      
      if (error) {
        throw error;
      }
      
      toast.success('تم حذف النموذج بنجاح');
      await fetchForms();
      return true;
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
      return false;
    }
  };

  const getFormById = async (formId: string) => {
    if (!formId) return null;
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        toast.error('النموذج غير موجود');
        return null;
      }
      
      return {
        ...data,
        data: data.data as unknown as FormStep[] // Safe type assertion with unknown as intermediary
      } as FormData;
    } catch (error: any) {
      toast.error(`خطأ في جلب النموذج: ${error.message}`);
      return null;
    }
  };

  useEffect(() => {
    if (shop || user) {
      fetchForms();
    }
  }, [shop, user, fetchForms]);

  return {
    forms,
    isLoading,
    selectedTemplate,
    fetchForms,
    createDefaultForm,
    createFormFromTemplate,
    saveForm,
    publishForm,
    deleteForm,
    getFormById
  };
};
