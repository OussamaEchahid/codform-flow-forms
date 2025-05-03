
/**
 * تنظيف نطاق المتجر
 * يقوم بإزالة البروتوكولات وتأكيد تنسيق myshopify.com
 */
export function cleanShopDomain(shop: string): string {
  let cleanedShop = shop.trim();
  
  // إزالة البروتوكول إذا كان موجودًا
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // التأكد من أنه ينتهي بـ myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

/**
 * التحقق مما إذا كان الدومين صالحًا لـ Shopify
 */
export function isValidShopifyDomain(domain: string): boolean {
  // التأكد من أن النطاق ينتهي بـ myshopify.com
  if (!domain.endsWith('myshopify.com')) {
    return false;
  }
  
  // التأكد من أن النطاق يحتوي على اسم متجر قبل myshopify.com
  const storeName = domain.replace('.myshopify.com', '');
  if (!storeName || storeName.length === 0) {
    return false;
  }
  
  // التأكد من أن اسم المتجر لا يحتوي على أحرف غير صالحة
  const validCharsRegex = /^[a-z0-9-]+$/;
  if (!validCharsRegex.test(storeName)) {
    return false;
  }
  
  return true;
}
