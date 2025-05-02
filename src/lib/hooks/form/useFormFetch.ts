
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { FormData } from './types';

/**
 * ملف محسّن للحصول على بيانات النماذج - تم تبسيطه لتجنب مشاكل العمق المفرط في الأنواع
 */
export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useI18n();
  const [formCache, setFormCache] = useState<Record<string, FormData>>({});

  /**
   * الحصول على نموذج بواسطة المعرف - تم تبسيط إنشاء الكائن لمنع مشاكل العمق المفرط
   */
  const getFormById = useCallback(async (formId: string) => {
    console.log(`useFormFetch: Getting form by ID: ${formId}`);
    
    try {
      // التحقق من وجود النموذج في ذاكرة التخزين المؤقت
      if (formCache[formId]) {
        console.log(`useFormFetch: Form ${formId} found in cache`);
        return formCache[formId];
      }
      
      // النموذج غير موجود في ذاكرة التخزين المؤقت، قم بجلبه من قاعدة البيانات
      const { data: rawData, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error(`useFormFetch: Error fetching form ${formId}:`, error);
        throw error;
      }

      if (!rawData) {
        console.log(`useFormFetch: Form ${formId} not found`);
        return null;
      }

      console.log(`useFormFetch: Form ${formId} fetched successfully:`, rawData);
      
      // إنشاء كائن جديد بطريقة آمنة من مشاكل أنواع TypeScript
      const formData: FormData = {
        id: rawData.id,
        title: rawData.title,
        description: rawData.description,
        // تحويل البيانات إلى نص ثم إعادة تحليلها لكسر أي ارتباطات مرجعية قد تؤدي إلى مشاكل عمق الأنواع
        data: JSON.parse(JSON.stringify(rawData.data || [])),
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        user_id: rawData.user_id,
        is_published: rawData.is_published,
        shop_id: rawData.shop_id
      };
      
      // تحديث ذاكرة التخزين المؤقت
      setFormCache(prev => ({...prev, [formId]: formData}));
      
      return formData;
    } catch (error) {
      console.error(`Error fetching form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في جلب النموذج' : 'Error fetching form');
      return null;
    }
  }, [language, formCache]);

  /**
   * جلب جميع النماذج للمستخدم الحالي - تم تبسيطه لمنع مشاكل أنواع TypeScript
   */
  const fetchForms = useCallback(async () => {
    console.log("useFormFetch: Fetching forms");
    setIsLoading(true);

    try {
      // الحصول على النماذج التي أنشأها المستخدم الحالي أو النماذج العامة
      const userId = user?.id;
      
      let query = supabase.from('forms').select('*');
      
      if (userId) {
        // إذا كان المستخدم مسجل الدخول، احصل على النماذج التي أنشأها هذا المستخدم
        query = query.eq('user_id', userId);
      } else {
        // إذا لم يكن هناك مستخدم، احصل فقط على النماذج العامة
        query = query.eq('is_published', true);
      }

      // ترتيب حسب الأحدث أولاً
      query = query.order('created_at', { ascending: false });
      
      const { data: rawData, error } = await query;

      if (error) {
        console.error("useFormFetch: Error fetching forms:", error);
        throw error;
      }

      console.log("useFormFetch: Forms fetched successfully:", rawData?.length || 0, "forms");
      
      const formsData: FormData[] = [];
      
      if (rawData && Array.isArray(rawData)) {
        // معالجة كل نموذج بشكل فردي بطريقة آمنة من مشاكل أنواع TypeScript
        rawData.forEach(item => {
          if (item) {
            const formData: FormData = {
              id: item.id,
              title: item.title,
              description: item.description,
              // تحويل البيانات إلى نص ثم إعادة تحليلها لكسر أي ارتباطات مرجعية
              data: JSON.parse(JSON.stringify(item.data || [])),
              created_at: item.created_at,
              updated_at: item.updated_at,
              user_id: item.user_id,
              is_published: item.is_published,
              shop_id: item.shop_id
            };
            
            formsData.push(formData);
            
            // تحديث ذاكرة التخزين المؤقت
            setFormCache(prev => ({...prev, [item.id]: formData}));
          }
        });
      }
      
      setForms(formsData);
      return formsData;
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(language === 'ar' ? 'خطأ في جلب النماذج' : 'Error fetching forms');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, language]);

  /**
   * تحديث حالة النماذج
   */
  const updateFormsState = useCallback((newForms: FormData[]) => {
    setForms(newForms);
  }, []);

  return {
    forms,
    isLoading,
    fetchForms,
    getFormById,
    updateFormsState
  };
};
