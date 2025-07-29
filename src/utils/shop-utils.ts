
/**
 * دالة مركزية موحدة لجلب معرف المتجر النشط
 * تتبع ترتيب أولوية واضح مع التحقق من صحة المتاجر
 */
export const getActiveShopId = (): string | null => {
  console.log('🔍 getActiveShopId: بدء البحث عن المتجر النشط...');
  
  // الترتيب الموحد للبحث عن shop_id - إضافة جميع المفاتيح المحتملة
  const shopIdKeys = [
    'simple_active_store', 
    'shopify_store', 
    'active_shop',
    'current_shopify_store',
    'shopify_shop_domain',
    'selected_store'
  ];
  
  // طباعة جميع القيم المحفوظة أولاً
  console.log('🔍 جميع القيم في localStorage:');
  shopIdKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}: ${value}`);
  });
  
  // تجميع جميع القيم للمقارنة
  const allValues = [];
  for (const key of shopIdKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      const trimmedValue = value.trim();
      allValues.push({ key, value: trimmedValue });
      console.log(`📋 Retrieved store from cache: ${trimmedValue} (from ${key})`);
    }
  }
  
  console.log(`🔍 عدد القيم الموجودة: ${allValues.length}`);
  
  // البحث عن أول متجر صحيح
  for (const item of allValues) {
    console.log(`🔍 التحقق من صحة المتجر: ${item.value}`);
    if (validateShopId(item.value)) {
      console.log(`✅ Found active store: ${item.value}`);
      
      // تنظيف وتوحيد localStorage
      cleanupAndSetActiveStore(item.value);
      return item.value;
    } else {
      console.warn(`❌ تم تجاهل shop_id غير صحيح من ${item.key}: ${item.value}`);
    }
  }
  
  console.error('❌ No shop ID found');
  return null;
};

/**
 * تنظيف وتوحيد localStorage بالمتجر الصحيح
 */
const cleanupAndSetActiveStore = (correctShopId: string): void => {
  try {
    // تنظيف جميع المفاتيح أولاً
    const keys = [
      'simple_active_store', 
      'shopify_store', 
      'active_shop',
      'current_shopify_store',
      'shopify_shop_domain',
      'selected_store'
    ];
    
    // تعيين المتجر الصحيح في جميع المفاتيح
    keys.forEach(key => {
      localStorage.setItem(key, correctShopId);
    });
    
    localStorage.setItem('shopify_connected', 'true');
    console.log(`🧹 تم تنظيف وتوحيد localStorage مع المتجر: ${correctShopId}`);
  } catch (error) {
    console.error('❌ Error cleaning localStorage:', error);
  }
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
  
  // قبول أي متجر يحتوي على .myshopify.com أو اسم متجر بسيط
  const cleaned = cleanShopId(shopId);
  
  // إذا كان النطاق ينتهي بـ .myshopify.com، فهو صحيح
  if (cleaned.endsWith('.myshopify.com')) {
    const storeName = cleaned.replace('.myshopify.com', '');
    if (storeName && storeName.length >= 3) {
      return true;
    }
  }
  
  // إذا كان مجرد اسم متجر بدون النطاق الكامل، قبله أيضاً
  if (cleaned && cleaned.length >= 3 && !cleaned.includes('.')) {
    return true;
  }
  
  console.warn('❌ معرف المتجر غير صحيح:', shopId);
  return false;
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
