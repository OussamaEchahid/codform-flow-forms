
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormData } from './types';
import { toast } from 'sonner';

export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // إضافة وظيفة تسجيل سجلات للتصحيح
  const logDebug = (message: string, data?: any) => {
    console.log(`[FormFetch] ${message}`, data || '');
  };

  const fetchForms = async () => {
    // تجنب إعادة التحميل المتكرر
    const now = Date.now();
    if (now - lastFetchTime < 2000 && forms.length > 0) {
      logDebug('Skipping fetch, last fetch was recent');
      return forms;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      logDebug('Attempting to fetch forms from Supabase...');
      
      // محاولة جلب البيانات من قاعدة البيانات
      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      // التعامل مع حالة الخطأ
      if (fetchError) {
        throw fetchError;
      }

      // تحديث الحالة بالبيانات المسترجعة
      logDebug('Forms fetched successfully:', data);
      setForms(Array.isArray(data) ? data : []);
      setLastFetchTime(now);
      
      // إعادة البيانات مباشرة للاستخدام الفوري
      return data || [];
    } catch (err) {
      // معالجة الخطأ
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النماذج';
      logDebug('Error fetching forms:', err);
      setError(errorMessage);
      
      // استرجاع البيانات المخزنة محليا إذا كانت متاحة
      try {
        const cachedForms = localStorage.getItem('cached_forms');
        if (cachedForms) {
          const parsedForms = JSON.parse(cachedForms);
          logDebug('Using cached forms:', parsedForms);
          setForms(parsedForms);
          return parsedForms;
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached forms:', cacheError);
      }
      
      // في حالة عدم وجود بيانات مخزنة، إرجاع مصفوفة فارغة
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFormById = async (formId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      logDebug(`Attempting to fetch form with ID: ${formId}`);
      
      // التعامل مع حالة النموذج الجديد
      if (formId === 'new') {
        logDebug('Creating new form template');
        setIsLoading(false);
        return {
          id: 'new',
          title: 'نموذج جديد',
          description: '',
          data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '',
          is_published: false
        };
      }
      
      // جلب النموذج من قاعدة البيانات
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (formError) {
        logDebug('Error fetching form by ID:', formError);
        throw formError;
      }
      
      logDebug('Form fetched successfully:', formData);
      return formData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النموذج';
      logDebug('Error fetching form by ID:', err);
      setError(errorMessage);
      
      // في حالة الخطأ، نحاول استرجاع البيانات المخزنة محليا
      try {
        const cachedForm = localStorage.getItem(`form_${formId}`);
        if (cachedForm) {
          const parsedForm = JSON.parse(cachedForm);
          logDebug('Using cached form:', parsedForm);
          return parsedForm;
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached form:', cacheError);
      }
      
      // إرجاع نموذج فارغ إذا لم يتم العثور على البيانات
      return {
        id: formId || 'new',
        title: 'نموذج جديد',
        description: '',
        data: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        is_published: false
      };
    } finally {
      setIsLoading(false);
    }
  };

  // احتفظ بالنماذج في التخزين المحلي عند تحديثها
  useEffect(() => {
    if (forms.length > 0) {
      try {
        localStorage.setItem('cached_forms', JSON.stringify(forms));
      } catch (e) {
        logDebug('Error caching forms:', e);
      }
    }
  }, [forms]);
  
  return {
    forms,
    isLoading,
    error,
    fetchForms,
    getFormById
  };
};
