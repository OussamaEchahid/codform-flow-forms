
/**
 * دالة مركزية موحدة لجلب معرف المتجر النشط
 * تتبع ترتيب أولوية واضح لضمان عدم خلط البيانات بين المتاجر
 */
export const getActiveShopId = (): string | null => {
  // الترتيب الموحد للبحث عن shop_id
  const shopIdKeys = ['simple_active_store', 'shopify_store', 'active_shop'];
  
  for (const key of shopIdKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      const cleanedValue = cleanShopId(value.trim());
      console.log(`🏪 استخدام shop_id من ${key}: ${cleanedValue}`);
      return cleanedValue;
    }
  }
  
  console.warn('⚠️ لم يتم العثور على shop_id في localStorage');
  return null;
};

/**
 * تنظيف معرف المتجر من البادئات أو المسارات الإضافية
 */
export const cleanShopId = (shopId: string): string => {
  if (!shopId) return shopId;
  
  // إزالة البروتوكول والمسارات
  let cleaned = shopId
    .replace(/^https?:\/\//, '')
    .replace(/^admin\./, '')
    .split('/')[0];
  
  // التأكد من إنهاء .myshopify.com
  if (!cleaned.includes('.myshopify.com')) {
    cleaned = cleaned.replace(/\.myshopify\.com.*$/, '') + '.myshopify.com';
  }
  
  return cleaned;
};

/**
 * التحقق من صحة معرف المتجر
 */
export const validateShopId = (shopId: string): boolean => {
  if (!shopId) return false;
  
  const cleanedId = cleanShopId(shopId);
  
  // يجب أن ينتهي بـ .myshopify.com
  if (!cleanedId.endsWith('.myshopify.com')) return false;
  
  // يجب أن يحتوي على نص قبل .myshopify.com
  const storeName = cleanedId.replace('.myshopify.com', '');
  if (!storeName || storeName.length < 3) return false;
  
  return true;
};

/**
 * تحديد المتجر النشط مع التحقق من الصحة
 */
export const setActiveShopId = (shopId: string): boolean => {
  if (!validateShopId(shopId)) {
    console.error('❌ Invalid shop ID:', shopId);
    return false;
  }
  
  const cleanedId = cleanShopId(shopId);
  
  try {
    localStorage.setItem('simple_active_store', cleanedId);
    localStorage.setItem('shopify_store', cleanedId);
    localStorage.setItem('shopify_connected', 'true');
    
    console.log('✅ Active shop set successfully:', cleanedId);
    return true;
  } catch (error) {
    console.error('❌ Error setting active shop:', error);
    return false;
  }
};

/**
 * مسح معرف المتجر النشط
 */
export const clearActiveShopId = (): void => {
  try {
    const keys = ['simple_active_store', 'shopify_store', 'shopify_connected'];
    keys.forEach(key => localStorage.removeItem(key));
    console.log('✅ Active shop cleared');
  } catch (error) {
    console.error('❌ Error clearing active shop:', error);
  }
};
