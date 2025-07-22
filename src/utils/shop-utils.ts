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
      console.log(`🏪 استخدام shop_id من ${key}: ${value}`);
      return value.trim();
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