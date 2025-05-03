
import { ShopifyStoreConnection, ShopifyConnectionManager } from "./types";

// المفتاح الذي سيتم استخدامه لتخزين المتاجر في localStorage
const STORES_STORAGE_KEY = 'shopify_connected_stores';
const ACTIVE_STORE_KEY = 'shopify_active_store';

// وظيفة لتحميل المتاجر من localStorage
const loadStores = (): ShopifyStoreConnection[] => {
  try {
    const storesJson = localStorage.getItem(STORES_STORAGE_KEY);
    return storesJson ? JSON.parse(storesJson) : [];
  } catch (error) {
    console.error('Error loading Shopify stores from localStorage:', error);
    return [];
  }
};

// وظيفة لحفظ المتاجر في localStorage
const saveStores = (stores: ShopifyStoreConnection[]): void => {
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
  } catch (error) {
    console.error('Error saving Shopify stores to localStorage:', error);
  }
};

// وظيفة لحفظ المتجر النشط في localStorage
const saveActiveStore = (shop: string | undefined): void => {
  try {
    if (shop) {
      localStorage.setItem(ACTIVE_STORE_KEY, shop);
    } else {
      localStorage.removeItem(ACTIVE_STORE_KEY);
    }
  } catch (error) {
    console.error('Error saving active Shopify store to localStorage:', error);
  }
};

// وظيفة لتحميل المتجر النشط من localStorage
const loadActiveStore = (): string | undefined => {
  try {
    return localStorage.getItem(ACTIVE_STORE_KEY) || undefined;
  } catch (error) {
    console.error('Error loading active Shopify store from localStorage:', error);
    return undefined;
  }
};

// إنشاء مدير الاتصال بمتاجر Shopify
export const createConnectionManager = (): ShopifyConnectionManager => {
  // تحميل المتاجر والمتجر النشط من localStorage
  const stores = loadStores();
  let activeStore = loadActiveStore();

  // التأكد من أن المتجر النشط موجود في قائمة المتاجر
  if (activeStore && !stores.some(store => store.shop === activeStore)) {
    activeStore = stores.length > 0 ? stores[0].shop : undefined;
    saveActiveStore(activeStore);
  }

  const connectionManager: ShopifyConnectionManager = {
    stores,
    activeStore,

    // إضافة متجر جديد
    addStore: (shop: string) => {
      // التحقق إذا كان المتجر موجود بالفعل
      const existingStoreIndex = connectionManager.stores.findIndex(
        store => store.shop === shop
      );

      if (existingStoreIndex >= 0) {
        // تحديث المتجر الموجود
        connectionManager.stores[existingStoreIndex] = {
          ...connectionManager.stores[existingStoreIndex],
          lastUsed: new Date().toISOString(),
        };
      } else {
        // إضافة متجر جديد
        connectionManager.stores.push({
          shop,
          isActive: true,
          connectedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        });
      }

      // إذا لم يكن هناك متجر نشط، قم بتعيين المتجر الجديد كنشط
      if (!connectionManager.activeStore) {
        connectionManager.activeStore = shop;
        saveActiveStore(shop);
      }

      // حفظ المتاجر
      saveStores(connectionManager.stores);
    },

    // تعيين متجر كنشط
    setActiveStore: (shop: string) => {
      // التأكد من أن المتجر موجود
      const storeExists = connectionManager.stores.some(store => store.shop === shop);
      if (!storeExists) {
        throw new Error(`Cannot set active store: Store ${shop} does not exist`);
      }

      // تحديث المتجر النشط
      connectionManager.activeStore = shop;
      saveActiveStore(shop);

      // تحديث وقت آخر استخدام
      const storeIndex = connectionManager.stores.findIndex(store => store.shop === shop);
      connectionManager.stores[storeIndex].lastUsed = new Date().toISOString();
      saveStores(connectionManager.stores);
    },

    // إزالة متجر
    removeStore: (shop: string) => {
      // حذف المتجر من القائمة
      connectionManager.stores = connectionManager.stores.filter(store => store.shop !== shop);
      saveStores(connectionManager.stores);

      // إذا كان المتجر المحذوف هو النشط، قم بتعيين متجر آخر كنشط
      if (connectionManager.activeStore === shop) {
        connectionManager.activeStore = connectionManager.stores.length > 0 
          ? connectionManager.stores[0].shop 
          : undefined;
        saveActiveStore(connectionManager.activeStore);
      }
    },

    // الحصول على المتجر النشط
    getActiveStore: () => {
      if (!connectionManager.activeStore) return undefined;
      return connectionManager.stores.find(store => store.shop === connectionManager.activeStore);
    },

    // الحصول على جميع المتاجر
    getAllStores: () => {
      return [...connectionManager.stores];
    }
  };

  return connectionManager;
};

// تصدير مدير الاتصال لاستخدامه في أي مكان في التطبيق
export const shopifyConnectionManager = createConnectionManager();

// التوافق مع النظام القديم - للتسهيل أثناء الانتقال
export const setupLegacyCompatibility = () => {
  // إعداد التوافق مع النظام القديم
  const activeStore = shopifyConnectionManager.getActiveStore();
  
  if (activeStore) {
    // حفظ المتجر النشط في المفاتيح القديمة للحفاظ على التوافق
    localStorage.setItem('shopify_store', activeStore.shop);
    localStorage.setItem('shopify_connected', 'true');
  } else {
    // استعادة المعلومات من المفاتيح القديمة إذا كانت موجودة
    const legacyShop = localStorage.getItem('shopify_store');
    const legacyConnected = localStorage.getItem('shopify_connected');
    
    if (legacyShop && legacyConnected === 'true') {
      shopifyConnectionManager.addStore(legacyShop);
    }
  }
};

// إعداد التوافق مع النظام القديم عند تحميل الملف
setupLegacyCompatibility();
