
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormStep, formTemplates, FormSectionConfig } from '@/lib/form-utils';
import { useAuth } from '@/lib/auth';
import { Json } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';

export interface FormData {
  id: string;
  title: string;
  description: string;
  data: FormStep[];
  sectionConfig?: FormSectionConfig;
  style?: {
    [key: string]: string | number;
  };
  is_published: boolean;
  created_at: string;
  user_id: string;
  shop_id?: string;
  updated_at?: string;
}

// Define a type that matches what's returned from the database
interface DbFormData {
  id: string;
  title: string;
  description: string;
  data: Json;
  is_published: boolean;
  created_at: string;
  user_id: string;
  shop_id?: string;
  updated_at?: string;
  sectionConfig?: Json;
  style?: Json;
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
      const formattedData: FormData[] = formsData?.map((form: DbFormData) => ({
        ...form,
        data: form.data as unknown as FormStep[] || [], // Safe type assertion with unknown as intermediary
        sectionConfig: form.sectionConfig as unknown as FormSectionConfig || { sections: [], layout: 'vertical' },
        style: form.style as { [key: string]: string | number } || {}
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
      
      // Generate a valid UUID for user_id if not available
      const userId = user?.id && user.id !== 'shopify-user' 
        ? user.id 
        : uuidv4();
      
      console.log("Creating form with user ID:", userId);
      
      const formData = {
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        data: selectedTemplate.data as unknown as Json, // Cast to unknown first, then to Json
        is_published: false,
        shop_id: shop || null, // Use null instead of empty string if shop doesn't exist
        user_id: userId // Use the generated or actual user ID
      };
      
      console.log("Creating form with data:", formData);
      
      const { data, error } = await supabase
        .from('forms')
        .insert(formData)
        .select();
      
      if (error) {
        console.error("Error creating form:", error);
        throw error;
      }
      
      toast.success(`تم إنشاء نموذج "${selectedTemplate.title}" بنجاح`);
      
      if (data && data.length > 0) {
        const newForm = {
          ...data[0],
          data: data[0].data as unknown as FormStep[], // Safe type assertion with unknown as intermediary
          sectionConfig: { sections: [], layout: 'vertical' },
          style: {}
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
      // Generate a valid UUID for user_id if not available
      const userId = user?.id && user.id !== 'shopify-user' 
        ? user.id 
        : uuidv4();
            
      const updateData = {
        title: formData.title,
        description: formData.description,
        data: formData.data as unknown as Json, // Safe type assertion with unknown as intermediary
        updated_at: new Date().toISOString(),
        shop_id: shop || null, // Use null instead of empty string if shop doesn't exist
        user_id: userId, // Use generated or actual user ID
        style: formData.style || {},
        sectionConfig: formData.sectionConfig || { sections: [], layout: 'vertical' }
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
    if (!formId) {
      console.error("Form ID is missing");
      return null;
    }
    
    try {
      console.log("Fetching form with ID:", formId);
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
        console.log("No form data returned from database");
        toast.error('النموذج غير موجود');
        return null;
      }
      
      console.log('Retrieved form data from database:', data);
      
      // Transform the returned data to match our expected FormData structure
      // Add default values for properties that might not exist in the database
      const formData: DbFormData = data as DbFormData;
      
      // Handle empty or null data arrays
      const safeData = formData.data || [];
      if (Array.isArray(safeData) && safeData.length === 0) {
        console.log("Data array is empty, providing default empty array");
      }
      
      // Create form with defaults for all required properties
      const safeForm = {
        ...formData,
        title: formData.title || "Untitled Form",
        description: formData.description || "",
        data: safeData as unknown as FormStep[],
        // Add default values for properties that might not exist in the database
        sectionConfig: formData.sectionConfig as unknown as FormSectionConfig || { sections: [], layout: 'vertical' },
        style: formData.style as { [key: string]: string | number } || {},
      } as FormData;
      
      console.log("Processed form data with defaults:", safeForm);
      return safeForm;
    } catch (error: any) {
      console.error("Error in getFormById:", error);
      toast.error(`خطأ في جلب النموذج: ${error.message}`);
      return null;
    }
  };

  const updateFormData = async (formId: string, updatedFormData: any) => {
    try {
      if (!formId) {
        console.error('Form ID is missing');
        return false;
      }

      console.log('Updating form data for ID:', formId);
      console.log('Update payload:', updatedFormData);
      
      // Directly update the form in Supabase instead of using API
      const { data, error } = await supabase
        .from('forms')
        .update(updatedFormData)
        .eq('id', formId)
        .select();
      
      if (error) {
        console.error('Error updating form directly in Supabase:', error);
        toast.error(`فشل في تحديث النموذج: ${error.message}`);
        return false;
      }
      
      console.log('Form updated successfully:', data);
      
      // Update the local state
      setForms(currentForms => 
        currentForms.map(form => 
          form.id === formId ? { 
            ...form, 
            ...updatedFormData,
            // Ensure these fields are properly typed
            data: updatedFormData.data as FormStep[],
            sectionConfig: updatedFormData.sectionConfig || { sections: [], layout: 'vertical' },
            style: updatedFormData.style || {}
          } : form
        )
      );
      
      toast.success('تم تحديث النموذج بنجاح');
      return true;
    } catch (error) {
      console.error('Error updating form data:', error);
      toast.error('حدث خطأ أثناء تحديث النموذج');
      return false;
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
    getFormById,
    updateFormData
  };
};
