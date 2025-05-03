
import { ShopifyStoreConnection, ShopifyConnectionManager, cleanShopifyDomain } from "./types";

// المفتاح الذي سيتم استخدامه لتخزين المتاجر في localStorage
const STORES_STORAGE_KEY = 'shopify_connected_stores';
const ACTIVE_STORE_KEY = 'shopify_active_store';
const EMERGENCY_MODE_KEY = 'shopify_emergency_mode';

// وظيفة لتحميل المتاجر من localStorage
const loadStores = (): ShopifyStoreConnection[] => {
  try {
    const storesJson = localStorage.getItem(STORES_STORAGE_KEY);
    if (storesJson) {
      const stores = JSON.parse(storesJson);
      // تأكد من أن كل متجر يحتوي على حقل shop (مرادف لـ domain)
      return stores.map((store: ShopifyStoreConnection) => ({
        ...store,
        shop: store.domain // إضافة حقل shop كمرادف لـ domain
      }));
    }
  } catch (e) {
    console.error("Error loading stores from localStorage:", e);
  }
  return [];
};

// وظيفة لحفظ المتاجر في localStorage
const saveStores = (stores: ShopifyStoreConnection[]): void => {
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
  } catch (e) {
    console.error("Error saving stores to localStorage:", e);
  }
};

// تنفيذ لمدير الاتصال بـ Shopify
export const shopifyConnectionManager: ShopifyConnectionManager = {
  // إضافة متجر جديد أو تحديث متجر موجود
  addOrUpdateStore: (shopDomain: string, isActive = false) => {
    if (!shopDomain) {
      console.error("Cannot add/update store: No shop domain provided");
      return false;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot add/update store: Invalid shop domain");
      return false;
    }
    
    console.log(`Adding/updating store: ${cleanedDomain}, isActive: ${isActive}`);
    const stores = loadStores();
    const existingStoreIndex = stores.findIndex(store => store.domain === cleanedDomain);
    
    if (existingStoreIndex >= 0) {
      // تحديث المتجر الموجود
      stores[existingStoreIndex] = {
        ...stores[existingStoreIndex],
        lastConnected: new Date().toISOString(),
        isActive: isActive,
        shop: cleanedDomain // تحديث حقل shop
      };
    } else {
      // إضافة متجر جديد
      stores.push({
        domain: cleanedDomain,
        shop: cleanedDomain, // إضافة حقل shop
        lastConnected: new Date().toISOString(),
        isActive: isActive
      });
    }
    
    // إذا تم تعيين المتجر الحالي كنشط، قم بتحديث جميع المتاجر الأخرى كغير نشطة
    if (isActive) {
      for (let i = 0; i < stores.length; i++) {
        if (i !== existingStoreIndex && existingStoreIndex >= 0) {
          stores[i].isActive = false;
        }
      }
    }
    
    // حفظ التغييرات
    saveStores(stores);
    
    // إذا كان المتجر نشطًا، قم بتعيينه كمتجر نشط
    if (isActive) {
      localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      console.log(`Set active store to ${cleanedDomain}`);
    }
    
    return true;
  },
  
  // الحصول على المتجر النشط
  getActiveStore: () => {
    try {
      // أولاً، تحقق من مفتاح المتجر النشط المخصص
      const activeStore = localStorage.getItem(ACTIVE_STORE_KEY);
      
      if (activeStore) {
        console.log("Retrieved active store from ACTIVE_STORE_KEY:", activeStore);
        return activeStore;
      }
      
      // ثانيًا، تحقق من المفتاح التقليدي
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        console.log("Retrieved active store from legacy key:", legacyStore);
        return legacyStore;
      }
      
      // ثالثًا، تحقق من قائمة المتاجر المخزنة
      const stores = loadStores();
      const activeFromList = stores.find(store => store.isActive);
      
      if (activeFromList) {
        console.log("Retrieved active store from stores list:", activeFromList.domain);
        return activeFromList.domain;
      }
      
      // إذا وجدنا أي متجر، استخدم الأول
      if (stores.length > 0) {
        console.log("No active store found, using first store:", stores[0].domain);
        return stores[0].domain;
      }
      
      console.log("No stores found");
      return null;
    } catch (error) {
      console.error("Error getting active store:", error);
      return null;
    }
  },
  
  // إعداد المتجر النشط
  setActiveStore: (shopDomain: string) => {
    if (!shopDomain) {
      console.error("Cannot set active store: No shop domain provided");
      return false;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot set active store: Invalid shop domain");
      return false;
    }
    
    console.log(`Setting active store to: ${cleanedDomain}`);
    const stores = loadStores();
    
    // التحقق من وجود المتجر في القائمة
    const storeExists = stores.some(store => store.domain === cleanedDomain);
    
    if (storeExists) {
      // تحديث المتجر النشط
      const updatedStores = stores.map(store => ({
        ...store,
        isActive: store.domain === cleanedDomain
      }));
      
      // حفظ التغييرات
      saveStores(updatedStores);
      localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      return true;
    } else {
      // إذا لم يكن المتجر موجودًا، أضفه وقم بتعيينه كنشط
      return shopifyConnectionManager.addOrUpdateStore(cleanedDomain, true);
    }
  },
  
  // الحصول على جميع المتاجر
  getAllStores: () => {
    return loadStores();
  },
  
  // حذف متجر
  removeStore: (shopDomain: string) => {
    if (!shopDomain) {
      console.error("Cannot remove store: No shop domain provided");
      return false;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot remove store: Invalid shop domain");
      return false;
    }
    
    console.log(`Removing store: ${cleanedDomain}`);
    const stores = loadStores();
    const updatedStores = stores.filter(store => store.domain !== cleanedDomain);
    
    // إذا كان المتجر المحذوف هو النشط، قم بإزالة المتجر النشط
    if (localStorage.getItem(ACTIVE_STORE_KEY) === cleanedDomain) {
      localStorage.removeItem(ACTIVE_STORE_KEY);
      
      // إذا كانت هناك متاجر متبقية، قم بتعيين أول متجر كنشط
      if (updatedStores.length > 0) {
        localStorage.setItem(ACTIVE_STORE_KEY, updatedStores[0].domain);
        localStorage.setItem('shopify_store', updatedStores[0].domain);
        // تحديث العلم النشط لأول متجر
        updatedStores[0].isActive = true;
      } else {
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
      }
    }
    
    // حفظ التغييرات
    saveStores(updatedStores);
    
    return updatedStores.length !== stores.length;
  },
  
  // مسح جميع المتاجر
  clearAllStores: () => {
    localStorage.removeItem(STORES_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_STORE_KEY);
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    
    return true;
  },
  
  // التحقق مما إذا كان وضع الطوارئ مفعلاً
  isEmergencyMode: () => {
    return localStorage.getItem(EMERGENCY_MODE_KEY) === 'true';
  },
  
  // تمكين وضع الطوارئ
  enableEmergencyMode: () => {
    localStorage.setItem(EMERGENCY_MODE_KEY, 'true');
    return true;
  },
  
  // تعطيل وضع الطوارئ
  disableEmergencyMode: () => {
    localStorage.removeItem(EMERGENCY_MODE_KEY);
    return true;
  }
};

// صادر مدير الاتصال افتراضياً
export default shopifyConnectionManager;
