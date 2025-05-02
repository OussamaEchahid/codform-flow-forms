import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Database } from '@/integrations/supabase/types';

// تعريف نوع FormData بشكل متوافق مع بيانات قاعدة البيانات
export interface FormData {
  id: string;
  title: string;
  description?: string | null;
  data: any; // استخدام any بدلاً من any[] لحل مشكلة التوافق مع Json من Supabase
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_published?: boolean;
  shop_id?: string | null;
}

export const useFormTemplates = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formCache, setFormCache] = useState<Record<string, FormData>>({});
  const { user } = useAuth();
  const { language } = useI18n();

  const clearFormCache = useCallback(() => {
    console.log("useFormTemplates: Clearing form cache");
    setFormCache({});
    return Promise.resolve();
  }, []);

  const createNewForm = useCallback(async (formData: Partial<FormData>) => {
    console.log("useFormTemplates: Creating new form", formData);
    setIsLoading(true);

    try {
      // تأكد من أن حقل data موجود وأن title موجود (لأنه مطلوب في قاعدة البيانات)
      const dataToInsert = {
        ...formData,
        data: formData.data || [], // استخدام مصفوفة فارغة كقيمة افتراضية
        title: formData.title || 'Untitled Form', // تعيين قيمة افتراضية للعنوان
        user_id: user?.id // إضافة user_id إذا كان المستخدم متاحًا
      };

      const { data, error } = await supabase
        .from('forms')
        .insert(dataToInsert)
        .select('*')
        .single();

      if (error) {
        console.error("useFormTemplates: Error creating form:", error);
        throw error;
      }

      console.log("useFormTemplates: Form created successfully:", data);
      
      // تحويل البيانات المستردة إلى FormData
      const newForm: FormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_published: data.is_published,
        shop_id: data.shop_id
      };
      
      // تحديث حالة النماذج المحلية
      setForms(prevForms => [...prevForms, newForm]);
      
      // تحديث ذاكرة التخزين المؤقت
      setFormCache(prev => ({ ...prev, [newForm.id]: newForm }));
      
      return newForm;
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language, user?.id]);

  const fetchForms = useCallback(async () => {
    console.log("useFormTemplates: Fetching forms");
    setIsLoading(true);

    try {
      // الحصول على النماذج التي أنشأها المستخدم الحالي أو النماذج العامة
      const userId = user?.id;
      
      let query = supabase.from('forms').select('*');
      
      if (userId) {
        // إذا كان المستخدم مسجل الدخول، احصل على النماذج التي أنشأها هذا المستخدم
        query = query.eq('user_id', userId);
      } else {
        // إذا لم يكن هناك مستخدم، احصل على النماذج العامة فقط
        query = query.eq('is_public', true);
      }

      // ترتيب حسب الأحدث
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error("useFormTemplates: Error fetching forms:", error);
        throw error;
      }

      console.log("useFormTemplates: Forms fetched successfully:", data?.length || 0, "forms");
      
      // تحويل البيانات المستردة إلى FormData[]
      const fetchedForms: FormData[] = data?.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        data: item.data,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        is_published: item.is_published,
        shop_id: item.shop_id
      })) || [];
      
      setForms(fetchedForms);
      
      // تحديث ذاكرة التخزين المؤقت مع النماذج المستردة
      const newCache = { ...formCache };
      fetchedForms.forEach((form) => {
        newCache[form.id] = form;
      });
      setFormCache(newCache);

      return fetchedForms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(language === 'ar' ? 'خطأ في جلب النماذج' : 'Error fetching forms');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, language, formCache]);

  const getFormById = useCallback(async (formId: string) => {
    console.log(`useFormTemplates: Getting form by ID: ${formId}`);
    
    try {
      // التحقق مما إذا كان لدينا هذا النموذج بالفعل في ذاكرة التخزين المؤقت
      if (formCache[formId]) {
        console.log(`useFormTemplates: Form ${formId} found in cache`);
        return formCache[formId];
      }
      
      // النموذج غير موجود في ذاكرة التخزين المؤقت، قم بجلبه من قاعدة البيانات
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error(`useFormTemplates: Error fetching form ${formId}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`useFormTemplates: Form ${formId} not found`);
        return null;
      }

      console.log(`useFormTemplates: Form ${formId} fetched successfully:`, data);
      
      // تحويل البيانات المستردة إلى FormData
      const fetchedForm: FormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_published: data.is_published,
        shop_id: data.shop_id
      };
      
      // تحديث ذاكرة التخزين المؤقت مع هذا النموذج
      setFormCache(prev => ({ ...prev, [formId]: fetchedForm }));
      
      return fetchedForm;
    } catch (error) {
      console.error(`Error fetching form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في جلب النموذج' : 'Error fetching form');
      return null;
    }
  }, [formCache, language]);

  const saveForm = useCallback(async (formId: string, formData: any) => {
    console.log(`useFormTemplates: Saving form ${formId}`, formData);
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .update(formData)
        .eq('id', formId)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`useFormTemplates: Error saving form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormTemplates: Form ${formId} saved successfully:`, data);
      
      // تحويل البيانات المستردة إلى FormData
      const savedForm: FormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_published: data.is_published,
        shop_id: data.shop_id
      };
      
      // تحديث ذاكرة التخزين المؤقت
      setFormCache(prev => ({ ...prev, [formId]: savedForm }));
      
      // أيضًا تحديث النموذج في حالة النماذج إذا كان موجودًا هناك
      setForms(prevForms => prevForms.map(form => 
        form.id === formId ? savedForm : form
      ));
      
      return savedForm;
    } catch (error) {
      console.error(`Error saving form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      return null;
    }
  }, [language]);

  // إضافة طريقة publishForm
  const publishForm = useCallback(async (formId: string, isPublished: boolean) => {
    console.log(`useFormTemplates: ${isPublished ? 'Publishing' : 'Unpublishing'} form ${formId}`);
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`useFormTemplates: Error ${isPublished ? 'publishing' : 'unpublishing'} form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormTemplates: Form ${formId} ${isPublished ? 'published' : 'unpublished'} successfully:`, data);
      
      // تحويل البيانات المستردة إلى FormData
      const updatedForm: FormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_published: data.is_published,
        shop_id: data.shop_id
      };
      
      // تحديث ذاكرة التخزين المؤقت
      setFormCache(prev => ({ ...prev, [formId]: updatedForm }));
      
      // أيضًا تحديث النموذج في حالة النماذج إذا كان موجودًا هناك
      setForms(prevForms => prevForms.map(form => 
        form.id === formId ? updatedForm : form
      ));
      
      toast.success(language === 'ar' 
        ? `تم ${isPublished ? 'نشر' : 'إلغاء نشر'} النموذج بنجاح` 
        : `Form ${isPublished ? 'published' : 'unpublished'} successfully`);
      
      return updatedForm;
    } catch (error) {
      console.error(`Error ${isPublished ? 'publishing' : 'unpublishing'} form ${formId}:`, error);
      toast.error(language === 'ar' 
        ? `خطأ في ${isPublished ? 'نشر' : 'إلغاء نشر'} النموذج` 
        : `Error ${isPublished ? 'publishing' : 'unpublishing'} form`);
      return null;
    }
  }, [language]);

  const deleteForm = useCallback(async (formId: string) => {
    console.log(`useFormTemplates: Deleting form ${formId}`);
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) {
        console.error(`useFormTemplates: Error deleting form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormTemplates: Form ${formId} deleted successfully`);
      
      // إزالة من ذاكرة التخزين المؤقت
      const newCache = { ...formCache };
      delete newCache[formId];
      setFormCache(newCache);
      
      // إزالة من حالة النماذج
      setForms(prevForms => prevForms.filter(form => form.id !== formId));
      
      return true;
    } catch (error) {
      console.error(`Error deleting form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حذف النموذج' : 'Error deleting form');
      return false;
    }
  }, [formCache, language]);

  return {
    forms,
    isLoading,
    fetchForms,
    getFormById,
    saveForm,
    createNewForm,
    deleteForm,
    clearFormCache,
    publishForm
  };
};
