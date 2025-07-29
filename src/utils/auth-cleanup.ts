export const cleanupAuthState = () => {
  console.log('🧹 تنظيف حالة المصادقة...');
  
  // حذف جميع مفاتيح Supabase من localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('🗑️ حذف مفتاح:', key);
      localStorage.removeItem(key);
    }
  });
  
  // حذف مفاتيح إضافية
  const keysToRemove = [
    'simple_active_store',
    'shopify_connection_status',
    'shopify_stores',
    'shopify_connected',
    'shopify_shop'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log('🗑️ حذف مفتاح تطبيق:', key);
      localStorage.removeItem(key);
    }
  });
  
  // حذف من sessionStorage أيضاً
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ تم تنظيف جميع بيانات المصادقة');
};

export const forceSignOut = async (supabase: any) => {
  try {
    console.log('🚪 إجبار تسجيل الخروج...');
    
    // تنظيف البيانات أولاً
    cleanupAuthState();
    
    // محاولة تسجيل خروج عالمي
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.log('⚠️ فشل تسجيل الخروج العالمي، المتابعة...');
    }
    
    // إعادة تحميل الصفحة للتأكد من التنظيف الكامل
    setTimeout(() => {
      window.location.href = '/auth';
    }, 500);
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    // حتى لو فشل، قم بإعادة التوجيه
    window.location.href = '/auth';
  }
};