
// نوع لتمثيل اتصال متجر Shopify
export type ShopifyStoreConnection = {
  domain: string;          // نطاق المتجر مثل store.myshopify.com
  lastConnected: string;   // آخر وقت تم فيه الاتصال بالمتجر (بتنسيق ISO string)
  isActive: boolean;       // ما إذا كان هذا هو المتجر النشط حالياً
};

// واجهة لمدير اتصال Shopify
export interface ShopifyConnectionManager {
  // إضافة متجر جديد أو تحديث متجر موجود
  addOrUpdateStore(shopDomain: string, isActive?: boolean): boolean;
  
  // الحصول على المتجر النشط
  getActiveStore(): string | null;
  
  // تعيين المتجر النشط
  setActiveStore(shopDomain: string): boolean;
  
  // الحصول على جميع المتاجر
  getAllStores(): ShopifyStoreConnection[];
  
  // حذف متجر
  removeStore(shopDomain: string): boolean;
  
  // مسح جميع المتاجر
  clearAllStores(): boolean;
  
  // التحقق مما إذا كان وضع الطوارئ مفعلاً
  isEmergencyMode(): boolean;
  
  // تمكين وضع الطوارئ
  enableEmergencyMode(): boolean;
  
  // تعطيل وضع الطوارئ
  disableEmergencyMode(): boolean;
}

// دالة مساعدة لتنظيف اسم نطاق المتجر
export const cleanShopifyDomain = (domain: string): string => {
  if (!domain) return "";
  
  let cleanedDomain = domain.trim();
  
  // إزالة البروتوكول إذا كان موجوداً
  if (cleanedDomain.startsWith('http')) {
    try {
      const url = new URL(cleanedDomain);
      cleanedDomain = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // التأكد من الانتهاء بـ myshopify.com
  if (!cleanedDomain.endsWith('myshopify.com')) {
    if (!cleanedDomain.includes('.')) {
      cleanedDomain = `${cleanedDomain}.myshopify.com`;
    }
  }
  
  return cleanedDomain;
};
