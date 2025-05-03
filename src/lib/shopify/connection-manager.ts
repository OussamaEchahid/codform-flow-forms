
import { ShopifyStoreConnection, ShopifyConnectionManager, cleanShopifyDomain } from "./types";

// المفتاح الذي سيتم استخدامه لتخزين المتاجر في localStorage
const STORES_STORAGE_KEY = 'shopify_connected_stores';
const ACTIVE_STORE_KEY = 'shopify_active_store';
const EMERGENCY_MODE_KEY = 'shopify_emergency_mode';
const LAST_URL_SHOP_KEY = 'shopify_last_url_shop';

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

// معرفة نطاق المتجر من URL
const getShopFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const shopParam = urlParams.get("shop");
  
  if (shopParam) {
    try {
      const cleanedShop = cleanShopifyDomain(shopParam);
      console.log("Retrieved shop from URL parameters:", cleanedShop);
      // حفظ آخر متجر من URL كنقطة مرجعية
      localStorage.setItem(LAST_URL_SHOP_KEY, cleanedShop);
      return cleanedShop;
    } catch (e) {
      console.error("Error cleaning shop from URL:", e);
    }
  }
  return null;
};

// تنفيذ لمدير الاتصال بـ Shopify
export const shopifyConnectionManager: ShopifyConnectionManager = {
  // إضافة متجر جديد أو تحديث متجر موجود
  addOrUpdateStore: (shopDomain: string, isActive = false, forceUpdate = false) => {
    if (!shopDomain) {
      console.error("Cannot add/update store: No shop domain provided");
      return false;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot add/update store: Invalid shop domain");
      return false;
    }
    
    console.log(`Adding/updating store: ${cleanedDomain}, isActive: ${isActive}, forceUpdate: ${forceUpdate}`);
    const stores = loadStores();
    const existingStoreIndex = stores.findIndex(store => store.domain === cleanedDomain);
    
    if (existingStoreIndex >= 0) {
      // تحديث المتجر الموجود
      stores[existingStoreIndex] = {
        ...stores[existingStoreIndex],
        lastConnected: new Date().toISOString(),
        isActive: isActive || forceUpdate, // إجبار التنشيط إذا كان forceUpdate صحيحًا
        shop: cleanedDomain // تحديث حقل shop
      };
    } else {
      // إضافة متجر جديد
      stores.push({
        domain: cleanedDomain,
        shop: cleanedDomain, // إضافة حقل shop
        lastConnected: new Date().toISOString(),
        isActive: isActive || forceUpdate // إجبار التنشيط إذا كان forceUpdate صحيحًا
      });
    }
    
    // إذا تم تعيين المتجر الحالي كنشط أو forceUpdate، قم بتحديث جميع المتاجر الأخرى كغير نشطة
    if (isActive || forceUpdate) {
      for (let i = 0; i < stores.length; i++) {
        if (stores[i].domain !== cleanedDomain) {
          stores[i].isActive = false;
        }
      }
      
      // حفظ المتجر النشط في التخزين المحلي
      localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
    }
    
    // حفظ التغييرات
    saveStores(stores);
    
    return true;
  },
  
  // الحصول على المتجر النشط مع تفضيل نطاق URL
  getActiveStore: () => {
    try {
      // تحقق من URL الحالي للمتجر (أعلى أولوية)
      const shopFromUrl = getShopFromUrl();
      
      if (shopFromUrl) {
        // إذا وجد متجر في URL، يتم تحديثه كمتجر نشط
        shopifyConnectionManager.addOrUpdateStore(shopFromUrl, true, true);
        return shopFromUrl;
      }
      
      // تحقق من آخر متجر تم تحميله من URL
      const lastUrlShop = localStorage.getItem(LAST_URL_SHOP_KEY);
      if (lastUrlShop) {
        console.log("Retrieved shop from last URL reference:", lastUrlShop);
        return lastUrlShop;
      }
      
      // تحقق من مفتاح المتجر النشط المخصص
      const activeStore = localStorage.getItem(ACTIVE_STORE_KEY);
      
      if (activeStore) {
        console.log("Retrieved active store from ACTIVE_STORE_KEY:", activeStore);
        return activeStore;
      }
      
      // تحقق من المفتاح التقليدي
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        console.log("Retrieved active store from legacy key:", legacyStore);
        return legacyStore;
      }
      
      // تحقق من قائمة المتاجر المخزنة
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
  setActiveStore: (shopDomain: string, forceUpdate = false) => {
    if (!shopDomain) {
      console.error("Cannot set active store: No shop domain provided");
      return false;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot set active store: Invalid shop domain");
      return false;
    }
    
    console.log(`Setting active store to: ${cleanedDomain}, forceUpdate: ${forceUpdate}`);
    
    // تحديث قاعدة البيانات المحلية أولاً
    const stores = loadStores();
    
    // ضبط جميع المتاجر كغير نشطة
    const updatedStores = stores.map(store => ({
      ...store,
      isActive: store.domain === cleanedDomain
    }));
    
    // إضافة المتجر إذا لم يكن موجودًا
    if (!stores.some(store => store.domain === cleanedDomain)) {
      updatedStores.push({
        domain: cleanedDomain,
        shop: cleanedDomain,
        lastConnected: new Date().toISOString(),
        isActive: true
      });
    }
    
    // حفظ التغييرات
    saveStores(updatedStores);
    
    // تحديث التخزين المحلي
    localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
    localStorage.setItem('shopify_store', cleanedDomain);
    localStorage.setItem('shopify_connected', 'true');
    
    return true;
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
  
  // مسح جميع المتاجر ماعدا متجر محدد
  clearAllStoresExcept: (shopDomain: string | null) => {
    console.log(`Clearing all stores except: ${shopDomain || 'none'}`);
    
    if (!shopDomain) {
      // مسح كل المتاجر
      localStorage.removeItem(STORES_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_STORE_KEY);
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem(LAST_URL_SHOP_KEY);
      return true;
    }
    
    const cleanedDomain = cleanShopifyDomain(shopDomain);
    if (!cleanedDomain) {
      console.error("Cannot clear stores: Invalid shop domain provided");
      return false;
    }
    
    const stores = loadStores();
    const storeToKeep = stores.find(store => store.domain === cleanedDomain);
    
    if (storeToKeep) {
      // حفظ المتجر المحدد فقط وتعيينه كنشط
      const updatedStore = {
        ...storeToKeep,
        isActive: true,
        lastConnected: new Date().toISOString()
      };
      
      saveStores([updatedStore]);
      localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem(LAST_URL_SHOP_KEY, cleanedDomain);
      
      return true;
    } else {
      // إنشاء سجل جديد للمتجر إذا لم يكن موجودًا
      const newStore = {
        domain: cleanedDomain,
        shop: cleanedDomain,
        lastConnected: new Date().toISOString(),
        isActive: true
      };
      
      saveStores([newStore]);
      localStorage.setItem(ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem(LAST_URL_SHOP_KEY, cleanedDomain);
      
      return true;
    }
  },
  
  // مسح جميع المتاجر
  clearAllStores: () => {
    localStorage.removeItem(STORES_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_STORE_KEY);
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem(LAST_URL_SHOP_KEY);
    
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
  },
  
  // الحصول على آخر متجر من URL
  getLastUrlShop: () => {
    return localStorage.getItem(LAST_URL_SHOP_KEY);
  }
};

// صادر مدير الاتصال افتراضياً
export default shopifyConnectionManager;
