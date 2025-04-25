
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
  updated_at?: string;
}

export const useFormTemplates = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FormData | null>(null);
  const { user } = useAuth();
  
  const fetchForms = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data: formsData, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
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
  }, [user]);

  const createFormFromTemplate = useCallback(async (templateId: number) => {
    if (!user) return null;
    
    try {
      const selectedTemplate = formTemplates.find(t => t.id === templateId);
      
      if (!selectedTemplate) {
        toast.error('لم يتم العثور على القالب المحدد');
        return null;
      }
      
      toast.success(`تم اختيار قالب ${selectedTemplate.title}`);
      
      const { data, error } = await supabase
        .from('forms')
        .insert([{
          user_id: user.id,
          title: selectedTemplate.title,
          description: selectedTemplate.description,
          data: selectedTemplate.data as unknown as Json, // Cast to unknown first, then to Json
          is_published: false
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success(`تم إنشاء نموذج "${selectedTemplate.title}" بنجاح`);
      
      // Transform the returned data to ensure proper typing
      if (data && data.length > 0) {
        const newForm = {
          ...data[0],
          data: data[0].data as unknown as FormStep[] // Safe type assertion with unknown as intermediary
        } as FormData;
        
        setSelectedTemplate(newForm);
        // Refresh forms list
        await fetchForms();
        return newForm;
      }
      return null;
    } catch (error: any) {
      toast.error(`خطأ في إنشاء النموذج: ${error.message}`);
      return null;
    }
  }, [user, fetchForms]);

  const createDefaultForm = useCallback(async () => {
    return createFormFromTemplate(1); // Use template ID 1 as default
  }, [createFormFromTemplate]);

  const saveForm = async (formId: string, formData: any) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لحفظ النموذج');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          title: formData.title,
          description: formData.description,
          data: formData.data as unknown as Json, // Safe type assertion with unknown as intermediary
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .eq('user_id', user?.id);
      
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
    if (!user) {
      toast.error('يجب تسجيل الدخول لنشر النموذج');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId)
        .eq('user_id', user?.id);
      
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
    if (!user) {
      toast.error('يجب تسجيل الدخول لحذف النموذج');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user?.id);
      
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
    if (!user || !formId) return null;
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Transform the data to ensure proper typing
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
    if (user) {
      fetchForms();
    }
  }, [user, fetchForms]);

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
