import { supabase } from '@/integrations/supabase/client';

// دالة مساعدة للحصول على البريد الإلكتروني الحالي
export const getCurrentUserEmail = (): string => {
  const email = localStorage.getItem('shopify_user_email');
  const activeStore = localStorage.getItem('active_store');
  
  if (email && email !== 'مغربي• VIP' && email.includes('@')) {
    return email;
  }
  
  // استخدام البريد الافتراضي
  return `owner@${activeStore || 'unknown.myshopify.com'}`;
};

// دالة للاستعلام مع تمرير البريد الإلكتروني  
export const queryWithEmail = () => {
  const userEmail = getCurrentUserEmail();
  console.log(`🔍 Querying with email: ${userEmail}`);
  
  return {
    userEmail,
    supabase
  };
};

// دالة خاصة للحصول على بيانات المتجر
export const getStoreData = async (shopId: string) => {
  const userEmail = getCurrentUserEmail();
  console.log(`🏪 Getting store data for: ${shopId} with email: ${userEmail}`);
  
  return supabase
    .from('shopify_stores')
    .select('*')
    .eq('shop', shopId)
    .or(`email.eq.${userEmail},email.eq.owner@${shopId}`)
    .single();
};

// دالة للحصول على النماذج الخاصة بالمستخدم
export const getUserForms = async (shopId?: string) => {
  const userEmail = getCurrentUserEmail();
  const activeStore = shopId || localStorage.getItem('active_store');
  
  if (!activeStore) {
    console.log('❌ No active store found');
    return { data: [], error: null };
  }
  
  console.log(`📋 Getting forms for store: ${activeStore} with email: ${userEmail}`);
  
  return supabase
    .from('forms')
    .select('*')
    .eq('shop_id', activeStore);
};

// دالة للحصول على submissions مباشرة (بدلاً من orders)
export const getFormSubmissions = async (formIds: string[]) => {
  if (formIds.length === 0) {
    return { data: [], error: null };
  }
  
  console.log(`📤 Getting submissions for forms: ${formIds.join(', ')}`);
  
  return supabase
    .from('form_submissions')
    .select('*')
    .in('form_id', formIds);
};

export { supabase };