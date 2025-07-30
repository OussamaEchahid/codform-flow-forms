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

// دالة للحصول على جميع المتاجر الخاصة بالبريد الإلكتروني
export const getUserStores = async () => {
  const userEmail = getCurrentUserEmail();
  console.log(`🏪 Getting all stores for email: ${userEmail}`);
  
  // البحث عن المتاجر بالبريد الإلكتروني أو البريد الافتراضي
  const { data, error } = await supabase
    .from('shopify_stores')
    .select('*')
    .eq('is_active', true);
    
  if (error) {
    console.error('❌ Error getting user stores:', error);
    return { data: [], error };
  }
  
  // فلترة النتائج للبريد الإلكتروني المطابق (من localStorage)
  // حالياً، نعتمد على المتجر النشط في localStorage
  const activeStore = localStorage.getItem('active_store');
  const filteredStores = data?.filter(store => 
    store.shop === activeStore ||
    userEmail.includes(store.shop.replace('.myshopify.com', ''))
  ) || [];
  
  console.log(`✅ Found ${filteredStores.length} stores for user:`, filteredStores.map(s => s.shop));
  
  return { data: filteredStores, error: null };
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