
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
  
  // Enable fallback to localStorage if shop is not available from context
  const actualShop = shop || localStorage.getItem('shopify_store');
  
  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Filter forms by shop if we have a shop reference from any source
      if (actualShop) {
        console.log(`Filtering forms by shop: ${actualShop}`);
        query = query.eq('shop_id', actualShop);
      }
      
      const { data: formsData, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log(`Retrieved ${formsData?.length || 0} forms`);
      
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
  }, [actualShop]);

  const createFormFromTemplate = useCallback(async (templateId: number) => {
    try {
      const selectedTemplate = formTemplates.find(t => t.id === templateId);
      
      if (!selectedTemplate) {
        toast.error('لم يتم العثور على القالب المحدد');
        return null;
      }
      
      // Generate a valid uuid for user_id when connected via Shopify
      const userId = user?.id || uuidv4();
      
      console.log("Creating form with user ID:", userId);
      console.log("Current shop:", actualShop);
      
      if (!actualShop) {
        console.error("No shop available when creating form");
        toast.error('يجب تحديد متجر Shopify لإنشاء نموذج');
        return null;
      }
      
      // Check that user ID is a valid UUID
      if (typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("Invalid UUID format for user_id:", userId);
        toast.error('معرف المستخدم غير صالح. يرجى إعادة الاتصال بالمتجر');
        return null;
      }
      
      const formData = {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        data: selectedTemplate.data as unknown as Json, // Cast to unknown first, then to Json
        is_published: false,
        shop_id: actualShop, // Use the actual shop from any source
        user_id: userId // Use UUID
      };
      
      console.log("Creating form with data:", formData);
      
      // Use insert instead of upsert to ensure RLS policies are respected
      const { data, error } = await supabase
        .from('forms')
        .insert([formData])
        .select();
      
      if (error) {
        console.error("Error creating form:", error);
        if (error.message.includes('row-level security policy')) {
          toast.error('خطأ في الصلاحيات: لا يمكن إنشاء نموذج. يرجى التأكد من تسجيل الدخول بشكل صحيح.');
        } else {
          toast.error(`خطأ في إنشاء النموذج: ${error.message}`);
        }
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
  }, [actualShop, user, fetchForms]);

  const createDefaultForm = useCallback(async () => {
    return createFormFromTemplate(1); // Use template ID 1 as default
  }, [createFormFromTemplate]);

  const saveForm = async (formId: string, formData: any) => {
    try {
      // Use clean UUID
      const userId = user?.id || uuidv4();
        
      // Check that user ID is a valid UUID
      if (typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("Invalid UUID format for user_id when saving:", userId);
        toast.error('معرف المستخدم غير صالح. يرجى إعادة الاتصال بالمتجر');
        return false;
      }
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        data: formData.data as unknown as Json, // Safe type assertion with unknown as intermediary
        updated_at: new Date().toISOString(),
        shop_id: actualShop || null, // Use null instead of empty string if shop doesn't exist
        user_id: userId // Use clean UUID
      };
      
      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId);
      
      if (error) {
        console.error("Error saving form:", error);
        if (error.message.includes('row-level security policy')) {
          toast.error('خطأ في الصلاحيات: لا يمكن حفظ النموذج. يرجى التأكد من تسجيل الدخول بشكل صحيح.');
        } else {
          toast.error(`خطأ في حفظ النموذج: ${error.message}`);
        }
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
        if (error.message.includes('row-level security policy')) {
          toast.error('خطأ في الصلاحيات: لا يمكن نشر النموذج. يرجى التأكد من تسجيل الدخول بشكل صحيح.');
        } else {
          toast.error(`خطأ: ${error.message}`);
        }
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
        if (error.message.includes('row-level security policy')) {
          toast.error('خطأ في الصلاحيات: لا يمكن حذف النموذج. يرجى التأكد من تسجيل الدخول بشكل صحيح.');
        } else {
          toast.error(`خطأ: ${error.message}`);
        }
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
        if (error.message.includes('row-level security policy')) {
          toast.error('خطأ في الصلاحيات: لا يمكن عرض النموذج. يرجى التأكد من تسجيل الدخول بشكل صحيح.');
        } else {
          toast.error(`خطأ في جلب النموذج: ${error.message}`);
        }
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
