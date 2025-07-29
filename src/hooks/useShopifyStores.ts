import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  access_token: string;
  user_id: string;
  updated_at: string;
}

export const useShopifyStores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المتاجر من قاعدة البيانات
  const fetchStores = async () => {
    if (!user?.id) {
      setStores([]);
      setActiveStore(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // استخدام edge function للحصول على المتاجر
      const { data: response, error: fetchError } = await supabase.functions.invoke(
        'store-link-manager',
        {
          body: {
            action: 'get_stores',
            userId: user.id
          }
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const fetchedStores = response?.stores || [];
      setStores(fetchedStores);

      console.log(`🏪 تم جلب ${fetchedStores.length} متجر من قاعدة البيانات`);

      // التحقق من المتجر النشط وإصلاحه إذا لزم الأمر
      const currentActiveStore = simpleShopifyConnectionManager.getActiveStore();
      const storesList = fetchedStores.map((s: ShopifyStore) => s.shop);

      if (!currentActiveStore) {
        // فقط إذا لم يكن هناك متجر نشط على الإطلاق
        if (storesList.length > 0) {
          const firstStore = storesList[0];
          console.log(`🔄 لا يوجد متجر نشط - تعيين: ${firstStore}`);
          simpleShopifyConnectionManager.setActiveStore(firstStore);
          setActiveStore(firstStore);
        } else {
          simpleShopifyConnectionManager.disconnect();
          setActiveStore(null);
        }
      } else if (!storesList.includes(currentActiveStore)) {
        // إذا كان المتجر النشط غير موجود في القائمة، احتفظ به ولكن اعتبره غير متصل
        console.log(`⚠️ المتجر النشط ${currentActiveStore} غير موجود في قائمة المتاجر`);
        setActiveStore(currentActiveStore);
      } else {
        setActiveStore(currentActiveStore);
      }

    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err instanceof Error ? err.message : 'خطأ في جلب المتاجر');
      setStores([]);
      setActiveStore(null);
    } finally {
      setIsLoading(false);
    }
  };

  // تغيير المتجر النشط
  const switchStore = async (storeName: string): Promise<boolean> => {
    try {
      // التحقق من أن المتجر موجود في القائمة
      const store = stores.find(s => s.shop === storeName);
      if (!store) {
        console.error(`المتجر ${storeName} غير موجود في القائمة`);
        return false;
      }

      console.log(`🔄 تبديل إلى المتجر: ${storeName}`);
      
      // تعيين المتجر النشط
      simpleShopifyConnectionManager.setActiveStore(storeName);
      setActiveStore(storeName);

      console.log(`✅ تم تبديل المتجر النشط إلى: ${storeName}`);
      return true;

    } catch (error) {
      console.error('Error switching store:', error);
      return false;
    }
  };

  // تحديث المتاجر (إعادة جلب)
  const refreshStores = () => {
    fetchStores();
  };

  // جلب المتاجر عند تحميل المكون أو تغيير المستخدم
  useEffect(() => {
    fetchStores();
  }, [user?.id]);

  // مراقبة تغييرات localStorage للمتجر النشط (بدون فحص دوري)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStore = simpleShopifyConnectionManager.getActiveStore();
      if (currentStore !== activeStore) {
        setActiveStore(currentStore);
      }
    };

    // فقط مراقبة تغييرات التخزين، بدون فحص دوري
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeStore]);

  return {
    stores,
    activeStore,
    isLoading,
    error,
    fetchStores,
    switchStore,
    refreshStores,
    totalStores: stores.length,
    isConnected: !!activeStore && stores.length > 0
  };
};