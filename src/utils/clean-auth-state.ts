// تنظيف شامل لحالة المصادقة وحل مشاكل المتاجر المختلطة

export const cleanupAuthState = () => {
  console.log('🧹 بدء تنظيف شامل لحالة المصادقة...');
  
  // قائمة بجميع المفاتيح المتعلقة بـ Shopify و Supabase
  const keysToRemove = [
    // Shopify keys
    'shopify_active_store',
    'shopify_connected_stores',
    'shopify_store',
    'shopify_connected',
    'shopify_temp_store',
    'shopify_last_url_shop',
    'shopify_last_error',
    'shopify_recovery_attempt',
    'shopify_connection_timestamp',
    
    // Supabase auth keys
    'supabase.auth.token',
    'sb-auth-token',
    'sb-refresh-token',
    'sb-access-token'
  ];
  
  // إزالة المفاتيح من localStorage
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // إزالة جميع المفاتيح التي تبدأ بـ supabase.auth أو sb-
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    }
  });
  
  // إزالة من sessionStorage أيضاً
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('shopify_')) {
      sessionStorage.removeItem(key);
      console.log(`Removed from session: ${key}`);
    }
  });
  
  console.log('✅ تم تنظيف حالة المصادقة بنجاح');
};

export const forceCleanShopifyState = () => {
  console.log('🔧 بدء إصلاح إجباري لحالة Shopify...');
  
  // تنظيف شامل أولاً
  cleanupAuthState();
  
  // إزالة بيانات المتاجر من قاعدة البيانات (إذا لزم الأمر)
  // هذا يتطلب استدعاء edge function لحذف البيانات القديمة
  
  console.log('🔄 إعادة توجيه للاتصال الجديد...');
  
  // توجيه لصفحة الاتصال
  window.location.href = '/shopify-connect';
};

export const resetToSpecificShop = (shop: string) => {
  console.log(`🎯 إعادة تعيين للمتجر المحدد: ${shop}`);
  
  // تنظيف الحالة الحالية
  cleanupAuthState();
  
  // تعيين المتجر المحدد
  localStorage.setItem('shopify_store', shop);
  localStorage.setItem('shopify_connected', 'true');
  localStorage.setItem('shopify_active_store', shop);
  
  // إعادة تحميل التطبيق
  window.location.reload();
};

// تصدير للاستخدام في وحدة التحكم
(window as any).cleanupAuthState = cleanupAuthState;
(window as any).forceCleanShopifyState = forceCleanShopifyState;
(window as any).resetToSpecificShop = resetToSpecificShop;