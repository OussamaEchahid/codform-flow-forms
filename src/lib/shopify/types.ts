
// نوع لتمثيل اتصال متجر Shopify
export type ShopifyStoreConnection = {
  domain: string;          // نطاق المتجر مثل store.myshopify.com
  lastConnected: string;   // آخر وقت تم فيه الاتصال بالمتجر (بتنسيق ISO string)
  isActive: boolean;       // ما إذا كان هذا هو المتجر النشط حالياً
  shop: string;           // اسم المتجر (مرادف لـ domain للتوافق مع الواجهات الأخرى)
};

// واجهة لمدير اتصال Shopify
export interface ShopifyConnectionManager {
  // إضافة متجر جديد أو تحديث متجر موجود
  addOrUpdateStore(shopDomain: string, isActive?: boolean, forceUpdate?: boolean): boolean;
  
  // الحصول على المتجر النشط
  getActiveStore(): string | null;
  
  // تعيين المتجر النشط
  setActiveStore(shopDomain: string, forceUpdate?: boolean): boolean;
  
  // الحصول على جميع المتاجر
  getAllStores(): ShopifyStoreConnection[];
  
  // حذف متجر
  removeStore(shopDomain: string): boolean;
  
  // مسح جميع المتاجر
  clearAllStores(): boolean;
  
  // مسح جميع المتاجر ماعدا متجر محدد
  clearAllStoresExcept(shopDomain: string | null): boolean;
  
  // التحقق مما إذا كان وضع الطوارئ مفعلاً
  isEmergencyMode(): boolean;
  
  // تمكين وضع الطوارئ
  enableEmergencyMode(): boolean;
  
  // تعطيل وضع الطوارئ
  disableEmergencyMode(): boolean;
  
  // الحصول على آخر متجر من URL
  getLastUrlShop(): string | null;
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

// واجهة الطلب إعدادات المنتج
export interface ProductSettingsRequest {
  productId: string;
  formId: string;
  blockId?: string;
  enabled?: boolean;
}

// واجهة الاستجابة إعدادات المنتج
export interface ProductSettingsResponse {
  success?: boolean;
  error?: string;
  productId?: string;
  formId?: string;
  blockId?: string;
}

// واجهة منتج Shopify
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  images: string[];
  variants: Array<{
    id: string;
    title: string;
    price: string;
    available: boolean;
  }>;
}

// واجهة طلب Shopify
export interface ShopifyOrder {
  id: string;
  orderNumber: string;
  totalPrice: string;
  createdAt: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  lineItems: Array<{
    title: string;
    quantity: number;
    price: string;
  }>;
}

// واجهة بيانات نموذج Shopify
export interface ShopifyFormData {
  formId: string;
  shopDomain?: string;
  settings: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    style?: {
      primaryColor?: string;
      fontSize?: string;
      borderRadius?: string;
    };
    products?: string[];
    blockId?: string;
  };
}
