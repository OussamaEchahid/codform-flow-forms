
import { useState, useEffect, useCallback } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { supabase } from '@/integrations/supabase/client';
import { FormStep } from '@/lib/form-utils';
import { FormStyle } from '@/hooks/useFormStore';
import { getActiveShopId } from '@/utils/shop-utils';

export interface FormData {
  id: string;
  title: string;
  description?: string;
  data: FormStep[];
  style?: FormStyle;
  isPublished: boolean;
  shop_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  country?: string;
  currency?: string;
  phone_prefix?: string;
}

export const useFormTemplates = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { shop } = useShopify();

  // Get current active shop ID from utils
  const getCurrentShopId = () => {
    return shop || getActiveShopId();
  };

  // Track current shop to trigger refetch when it changes
  const [currentShop, setCurrentShop] = useState<string | null>(getCurrentShopId());

  const fetchForms = useCallback(async () => {
    const shopId = getCurrentShopId();
    
    if (!shopId) {
      console.error('❌ useFormTemplates: No active shop ID found');
      setError('لم يتم العثور على متجر نشط');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`🔍 useFormTemplates: Fetching forms for shop: ${shopId}`);
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ useFormTemplates: Error fetching forms:', fetchError);
        throw fetchError;
      }

      // Transform data to match FormData interface
      const formattedData: FormData[] = (data || []).map(form => ({
        ...form,
        data: Array.isArray(form.data) ? form.data as unknown as FormStep[] : [],
        style: (form.style as unknown as FormStyle) || undefined,
        isPublished: form.is_published
      }));

      console.log(`✅ useFormTemplates: Found ${formattedData.length} forms for shop: ${shopId}`);
      setForms(formattedData);
    } catch (err) {
      console.error('❌ useFormTemplates: Failed to fetch forms:', err);
      setError(err instanceof Error ? err.message : 'خطأ في جلب النماذج');
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  // Refetch when shop changes
  useEffect(() => {
    const newShopId = getCurrentShopId();
    if (newShopId !== currentShop) {
      console.log(`🔄 useFormTemplates: Shop changed from ${currentShop} to ${newShopId}`);
      setCurrentShop(newShopId);
      fetchForms();
    }
  }, [shop, currentShop, fetchForms]);

  // Initial fetch
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const addForm = (newForm: FormData) => {
    console.log(`➕ useFormTemplates: Adding form ${newForm.id} to local state`);
    setForms(prevForms => [newForm, ...prevForms]);
  };

  const updateForm = (updatedForm: FormData) => {
    console.log(`🔄 useFormTemplates: Updating form ${updatedForm.id} in local state`);
    setForms(prevForms => 
      prevForms.map(form => 
        form.id === updatedForm.id ? updatedForm : form
      )
    );
  };

  const removeForm = (formId: string) => {
    console.log(`🗑️ useFormTemplates: Removing form ${formId} from local state`);
    setForms(prevForms => prevForms.filter(form => form.id !== formId));
  };

  return {
    forms,
    isLoading,
    error,
    refetch: fetchForms,
    addForm,
    updateForm,
    removeForm
  };
};
