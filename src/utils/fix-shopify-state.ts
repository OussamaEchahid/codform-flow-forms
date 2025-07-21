// إصلاح حالة الاتصال مع Shopify
export const fixShopifyConnectionState = () => {
  console.log('🔧 Starting Shopify connection state fix...');
  
  // مسح جميع البيانات المتضاربة من localStorage
  const keysToRemove = [
    'shopify_active_store',
    'shopify_connected_stores', 
    'shopify_store',
    'shopify_connected',
    'shopify_temp_store',
    'shopify_last_url_shop',
    'shopify_last_error',
    'shopify_recovery_attempt',
    'shopify_connection_timestamp'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  });
  
  // إعادة تعيين حالة التطبيق
  console.log('✅ Shopify connection state has been reset');
  console.log('🔄 Please reconnect your Shopify store');
  
  // إعادة تحميل الصفحة لبدء نظيف
  window.location.href = '/shopify-connect';
};

// تصدير للاستخدام في وحدة التحكم
(window as any).fixShopifyState = fixShopifyConnectionState;