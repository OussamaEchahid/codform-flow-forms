
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormStep, formTemplates } from '@/lib/form-utils';
import { useAuth } from '@/lib/auth';
import { Json } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';

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
      console.error("Error fetching forms:", error);
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
      
      // Check if user exists before proceeding
      if (!user) {
        toast.error('يجب تسجيل الدخول لإنشاء نموذج');
        console.error("No user found when creating form");
        return null;
      }
      
      // Generate a valid UUID for user_id if not available
      const userId = user?.id || uuidv4();
      
      console.log("Creating form with user ID:", userId);
      console.log("Current shop:", shop);
      
      const formData = {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        data: selectedTemplate.data as unknown as Json, // Cast to unknown first, then to Json
        is_published: false,
        shop_id: shop || null, // Use null instead of empty string if shop doesn't exist
        user_id: userId // Use the generated or actual user ID
      };
      
      console.log("Creating form with data:", JSON.stringify(formData));
      
      // Use upsert to avoid conflicts
      const { data, error } = await supabase
        .from('forms')
        .upsert([formData])
        .select();
      
      if (error) {
        console.error("Error creating form:", error);
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
      console.error("Error in createFormFromTemplate:", error);
      toast.error(`خطأ في إنشاء النموذج: ${error.message}`);
      return null;
    }
  }, [shop, user, fetchForms]);

  const createDefaultForm = useCallback(async () => {
    return createFormFromTemplate(1); // Use template ID 1 as default
  }, [createFormFromTemplate]);

  const saveForm = async (formId: string, formData: any) => {
    try {
      // Make sure we have a user
      if (!user?.id) {
        toast.error('يجب تسجيل الدخول لحفظ النموذج');
        return false;
      }
        
      const updateData = {
        title: formData.title,
        description: formData.description,
        data: formData.data as unknown as Json, // Safe type assertion with unknown as intermediary
        updated_at: new Date().toISOString(),
        shop_id: shop || null, // Use null instead of empty string if shop doesn't exist
        user_id: user.id // Use actual user ID
      };
      
      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId);
      
      if (error) {
        console.error("Error saving form:", error);
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
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId);
      
      if (error) {
        console.error("Error publishing form:", error);
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
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      
      if (error) {
        console.error("Error deleting form:", error);
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
        console.error("Error getting form by ID:", error);
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
    fetchForms();
  }, [fetchForms]);

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
