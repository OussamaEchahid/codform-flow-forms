import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormStep, formTemplates } from '@/lib/form-utils';
import { useAuth } from '@/lib/auth';

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
  const { user } = useAuth();
  
  const fetchForms = async () => {
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
        data: form.data as FormStep[]
      })) || [];
      
      setForms(formattedData);
    } catch (error: any) {
      toast.error(`خطأ في جلب النماذج: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultForm = async () => {
    if (!user) return null;
    
    try {
      const defaultTemplate = formTemplates[0];
      
      const { data, error } = await supabase
        .from('forms')
        .insert([{
          user_id: user.id,
          title: 'نموذج طلب منتج',
          description: 'يرجى تعبئة النموذج التالي لطلب المنتج والدفع عند الاستلام',
          data: defaultTemplate.data as unknown as any, // Cast to any to avoid type issues with JSON
          is_published: false
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success('تم إنشاء نموذج افتراضي بنجاح');
      
      // Transform the returned data to ensure proper typing
      if (data && data.length > 0) {
        return {
          ...data[0],
          data: data[0].data as unknown as FormStep[]
        } as FormData;
      }
      return null;
    } catch (error: any) {
      toast.error(`خطأ في إنشاء النموذج: ${error.message}`);
      return null;
    }
  };

  const saveForm = async (formId: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          title: formData.title,
          description: formData.description,
          data: formData.data as unknown as any, // Cast to any to avoid type issues with JSON
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

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  return {
    forms,
    isLoading,
    fetchForms,
    createDefaultForm,
    saveForm,
    publishForm,
    deleteForm
  };
};
