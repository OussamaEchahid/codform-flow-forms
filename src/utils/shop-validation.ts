/**
 * 🔧 دوال التحقق من صحة المتاجر ومنع استخدام المتاجر الوهمية
 * Shop validation utilities to prevent fake shop usage
 */

import { UnifiedStoreManager } from './unified-store-manager';

// قائمة المتاجر الوهمية المحظورة
const FORBIDDEN_SHOPS = [
  'default.myshopify.com',
  'default-shop.myshopify.com',
  'test.myshopify.com',
  'demo.myshopify.com',
  'example.myshopify.com'
];

// المتجر الحقيقي الافتراضي
const REAL_SHOP_FALLBACK = 'astrem.myshopify.com';

/**
 * التحقق من أن المتجر ليس وهمياً
 */
export function isValidRealShop(shopId: string | null | undefined): boolean {
  if (!shopId) return false;
  
  // التحقق من أنه ليس في قائمة المحظورات
  if (FORBIDDEN_SHOPS.includes(shopId.toLowerCase())) {
    console.error('🚨 Forbidden fake shop detected:', shopId);
    return false;
  }
  
  // التحقق من أنه متجر Shopify صحيح
  if (!shopId.includes('.myshopify.com') && !shopId.includes('.')) {
    console.warn('⚠️ Invalid shop format:', shopId);
    return false;
  }
  
  return true;
}

/**
 * الحصول على متجر صحيح أو استخدام fallback
 */
export function getValidShopOrFallback(shopId?: string | null): string {
  // محاولة استخدام المتجر المرسل
  if (shopId && isValidRealShop(shopId)) {
    return shopId;
  }
  
  // محاولة الحصول من UnifiedStoreManager
  const activeShop = UnifiedStoreManager.getActiveStore();
  if (activeShop && isValidRealShop(activeShop)) {
    console.log('✅ Using active shop from UnifiedStoreManager:', activeShop);
    return activeShop;
  }
  
  // استخدام المتجر الحقيقي كـ fallback
  console.warn('⚠️ Using fallback shop:', REAL_SHOP_FALLBACK);
  return REAL_SHOP_FALLBACK;
}

/**
 * التحقق والتنظيف من المتجر قبل الحفظ
 */
export function validateAndCleanShop(shopId: string | null | undefined): string {
  const validShop = getValidShopOrFallback(shopId);
  
  if (FORBIDDEN_SHOPS.includes(validShop)) {
    throw new Error(`🚨 Cannot use forbidden shop: ${validShop}`);
  }
  
  return validShop;
}

/**
 * تسجيل تحذير عند محاولة استخدام متجر وهمي
 */
export function logFakeShopAttempt(shopId: string, context: string): void {
  console.error('🚨 FAKE SHOP ATTEMPT BLOCKED:', {
    shop: shopId,
    context,
    timestamp: new Date().toISOString(),
    stack: new Error().stack
  });
  
  // يمكن إضافة تسجيل في قاعدة البيانات هنا إذا لزم الأمر
}

/**
 * Hook للتحقق من المتجر في React components
 */
export function useValidShop(shopId?: string | null): string {
  const validShop = getValidShopOrFallback(shopId);
  
  // تسجيل تحذير إذا تم استبدال متجر وهمي
  if (shopId && shopId !== validShop) {
    logFakeShopAttempt(shopId, 'React component');
  }
  
  return validShop;
}

export default {
  isValidRealShop,
  getValidShopOrFallback,
  validateAndCleanShop,
  logFakeShopAttempt,
  useValidShop,
  FORBIDDEN_SHOPS,
  REAL_SHOP_FALLBACK
};
