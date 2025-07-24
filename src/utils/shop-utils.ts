
/**
 * دالة مركزية موحدة لجلب معرف المتجر النشط
 * تتبع ترتيب أولوية واضح مع التحقق من صحة المتاجر
 */
export const getActiveShopId = (): string | null => {
  // الترتيب الموحد للبحث عن shop_id
  const shopIdKeys = ['simple_active_store', 'shopify_store', 'active_shop'];
  
  for (const key of shopIdKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      const trimmedValue = value.trim();
      
      // التحقق من صحة المتجر قبل إرجاعه
      if (validateShopId(trimmedValue)) {
        console.log(`🏪 استخدام shop_id صحيح من ${key}: ${trimmedValue}`);
        return trimmedValue;
      } else {
        console.warn(`❌ تم تجاهل shop_id غير صحيح من ${key}: ${trimmedValue}`);
        // إزالة المعرف غير الصحيح
        localStorage.removeItem(key);
      }
    }
  }
  
  console.warn('⚠️ لم يتم العثور على shop_id صحيح في localStorage');
  return null;
};

/**
 * تنظيف معرف المتجر من البادئات أو المسارات الإضافية
 * يرفض أي نطاق ليس متجر Shopify صحيح
 */
export const cleanShopId = (shopId: string): string => {
  if (!shopId) return shopId;
  
  // إزالة البروتوكول والمسارات
  let cleaned = shopId
    .replace(/^https?:\/\//, '')
    .replace(/^admin\./, '')
    .split('/')[0];
  
  // إذا كان النطاق لا يحتوي على .myshopify.com، لا نضيفه تلقائياً
  // هذا يمنع تحويل النطاقات العادية إلى متاجر Shopify
  if (!cleaned.includes('.myshopify.com')) {
    // إذا كان نطاق عادي مثل codmagnet.com، ارجع كما هو لكن مع تسجيل تحذير
    console.warn('⚠️ النطاق المدخل ليس متجر Shopify:', cleaned);
    return cleaned; // نرجع النطاق كما هو بدون تعديل
  }
  
  return cleaned;
};

/**
 * التحقق من صحة معرف المتجر - يجب أن يكون متجر Shopify صحيح
 */
export const validateShopId = (shopId: string): boolean => {
  if (!shopId) return false;
  
  // التحقق الصارم: يجب أن ينتهي بـ .myshopify.com
  if (!shopId.endsWith('.myshopify.com')) {
    console.warn('❌ معرف المتجر غير صحيح - ليس متجر Shopify:', shopId);
    return false;
  }
  
  // يجب أن يحتوي على نص قبل .myshopify.com
  const storeName = shopId.replace('.myshopify.com', '');
  if (!storeName || storeName.length < 3) {
    console.warn('❌ اسم المتجر قصير جداً:', storeName);
    return false;
  }
  
  // التحقق من عدم وجود نطاقات عادية مثل .com، .net، إلخ
  if (storeName.includes('.') && !storeName.endsWith('myshopify')) {
    console.warn('❌ النطاق يبدو كنطاق عادي وليس متجر Shopify:', shopId);
    return false;
  }
  
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
