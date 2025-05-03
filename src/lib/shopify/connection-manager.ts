
import { ShopifyStoreConnection, ShopifyConnectionManager } from "./types";

// المفتاح الذي سيتم استخدامه لتخزين المتاجر في localStorage
const STORES_STORAGE_KEY = 'shopify_connected_stores';
const ACTIVE_STORE_KEY = 'shopify_active_store';
const EMERGENCY_MODE_KEY = 'shopify_emergency_mode';

// وظيفة لتحميل المتاجر من localStorage
const loadStores = (): ShopifyStoreConnection[] => {
  try {
    const storesJson = localStorage.getItem(STORES_STORAGE_KEY);
    if (storesJson) {
      return JSON.parse(storesJson);
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
    const stores = loadStores();
    const existingStoreIndex = stores.findIndex(store => store.domain === shopDomain);
    
    if (existingStoreIndex >= 0) {
      // تحديث المتجر الموجود
      stores[existingStoreIndex] = {
        ...stores[existingStoreIndex],
        lastConnected: new Date().toISOString(),
        isActive: isActive
      };
    } else {
      // إضافة متجر جديد
      stores.push({
        domain: shopDomain,
        lastConnected: new Date().toISOString(),
        isActive: isActive
      });
    }
    
    // حفظ التغييرات
    saveStores(stores);
    
    // إذا كان المتجر نشطًا، قم بتعيينه كمتجر نشط
    if (isActive) {
      localStorage.setItem(ACTIVE_STORE_KEY, shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
    }
    
    return true;
  },
  
  // الحصول على المتجر النشط
  getActiveStore: () => {
    const activeStore = localStorage.getItem(ACTIVE_STORE_KEY) || localStorage.getItem('shopify_store');
    return activeStore || null;
  },
  
  // إعداد المتجر النشط
  setActiveStore: (shopDomain: string) => {
    const stores = loadStores();
    
    // التحقق من وجود المتجر في القائمة
    const storeExists = stores.some(store => store.domain === shopDomain);
    
    if (storeExists) {
      // تحديث المتجر النشط
      const updatedStores = stores.map(store => ({
        ...store,
        isActive: store.domain === shopDomain
      }));
      
      // حفظ التغييرات
      saveStores(updatedStores);
      localStorage.setItem(ACTIVE_STORE_KEY, shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      return true;
    }
    
    return false;
  },
  
  // الحصول على جميع المتاجر
  getAllStores: () => {
    return loadStores();
  },
  
  // حذف متجر
  removeStore: (shopDomain: string) => {
    const stores = loadStores();
    const updatedStores = stores.filter(store => store.domain !== shopDomain);
    
    // إذا كان المتجر المحذوف هو النشط، قم بإزالة المتجر النشط
    if (localStorage.getItem(ACTIVE_STORE_KEY) === shopDomain) {
      localStorage.removeItem(ACTIVE_STORE_KEY);
      
      // إذا كانت هناك متاجر متبقية، قم بتعيين أول متجر كنشط
      if (updatedStores.length > 0) {
        localStorage.setItem(ACTIVE_STORE_KEY, updatedStores[0].domain);
        localStorage.setItem('shopify_store', updatedStores[0].domain);
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
