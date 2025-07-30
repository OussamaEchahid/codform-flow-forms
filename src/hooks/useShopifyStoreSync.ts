import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import { toast } from 'sonner';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
  email?: string;
}

export const useShopifyStoreSync = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<string | null>(null);

  // Get current active store from localStorage
  const getActiveStore = () => {
    const sources = [
      'active_shopify_store',
      'shopify_store', 
      'simple_active_store', 
      'active_shop'
    ];
    
    for (const source of sources) {
      const store = localStorage.getItem(source);
      if (store && store !== 'null' && store.includes('.myshopify.com')) {
        console.log(`✅ Found active store from ${source}:`, store);
        return store;
      }
    }
    console.log('⚠️ No active store found in localStorage');
    return null;
  };

  // Load stores based on email from localStorage
  const loadStores = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 جاري تحميل المتاجر...');
      
      // جلب البريد الإلكتروني المحفوظ
      const userEmail = localStorage.getItem('shopify_user_email');
      const activeStore = getActiveStore();
      
      console.log('📧 البريد الإلكتروني:', userEmail);
      console.log('🏪 المتجر النشط:', activeStore);

      if (!userEmail && !activeStore) {
        console.log('⚠️ لا يوجد بريد إلكتروني أو متجر نشط');
        setStores([]);
        setCurrentStore(null);
        setLoading(false);
        return;
      }

      // جلب المتاجر بناء على البريد الإلكتروني
      let storesList: any[] = [];
      
      if (userEmail) {
        console.log('📧 جلب المتاجر بناء على البريد الإلكتروني:', userEmail);
        const { data, error }: any = await supabase
          .from('shopify_stores')
          .select('shop, is_active, updated_at, access_token, email')
          .eq('email', userEmail)
          .eq('is_active', true);
        
        if (error) {
          console.error('❌ خطأ في جلب المتاجر بالبريد الإلكتروني:', error);
        } else if (data && data.length > 0) {
          storesList = data;
          console.log(`✅ تم العثور على ${data.length} متجر للبريد الإلكتروني`);
        }
      }
      
      // إذا لم نجد متاجر بالبريد الإلكتروني، جرب المتجر النشط
      if (storesList.length === 0 && activeStore) {
        console.log('🏪 جلب المتجر النشط:', activeStore);
        const response = await supabase
          .from('shopify_stores')
          .select('*')
          .eq('shop', activeStore)
          .eq('is_active', true)
          .single();

        if (response.error && response.error.code !== 'PGRST116') {
          console.error('❌ خطأ في جلب المتجر النشط:', response.error);
        } else if (response.data) {
          storesList = [response.data];
          console.log('✅ تم العثور على المتجر النشط');
          
          // حفظ البريد الإلكتروني إذا كان موجود  
          if ((response.data as any).email) {
            localStorage.setItem('shopify_user_email', (response.data as any).email);
            console.log('📧 تم حفظ البريد الإلكتروني:', (response.data as any).email);
          }
        }
      }

      console.log('📋 بيانات المتاجر المستلمة:', storesList);
      
      // تحديث حالة المتاجر
      if (storesList.length === 0) {
        // إذا لم نجد متاجر، عرض المتجر النشط من localStorage
        if (activeStore) {
          setStores([{
            shop: activeStore,
            is_active: true,
            updated_at: new Date().toISOString(),
            access_token: 'session_based'
          }]);
          setCurrentStore(activeStore);
        } else {
          setStores([]);
          setCurrentStore(null);
        }
      } else {
        setStores(storesList);
        // تعيين المتجر النشط إذا كان موجود في القائمة
        if (activeStore && storesList.some(store => store.shop === activeStore)) {
          setCurrentStore(activeStore);
        } else if (storesList.length > 0) {
          setCurrentStore(storesList[0].shop);
          // تحديث المتجر النشط في localStorage
          localStorage.setItem('active_shopify_store', storesList[0].shop);
        }
      }
      
      console.log(`✅ تم تحميل ${storesList.length} متجر`);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
      toast.error('فشل في تحميل المتاجر');
      
      // fallback: عرض المتجر النشط من localStorage
      const activeStore = getActiveStore();
      if (activeStore) {
        setStores([{
          shop: activeStore,
          is_active: true,
          updated_at: new Date().toISOString(),
          access_token: 'fallback'
        }]);
        setCurrentStore(activeStore);
      } else {
        setStores([]);
        setCurrentStore(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch to a different store
  const switchToStore = (shopDomain: string) => {
    try {
      // Update localStorage keys
      localStorage.setItem('active_shopify_store', shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('simple_active_store', shopDomain);
      localStorage.setItem('active_shop', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update current store state immediately
      setCurrentStore(shopDomain);
      
      // Force reload stores
      loadStores();
      
      console.log(`🔄 Switched to store: ${shopDomain}`);
      toast.success(`تم التبديل إلى متجر: ${shopDomain}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      toast.error('فشل في تبديل المتجر');
      return false;
    }
  };

  // Disconnect from all stores
  const disconnectAll = () => {
    try {
      // Clear localStorage
      const keysToRemove = [
        'active_shopify_store',
        'shopify_store',
        'simple_active_store', 
        'active_shop',
        'shopify_connected',
        'shopify_user_email',
        'cached_forms'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Update state
      setStores([]);
      setCurrentStore(null);
      
      console.log('🔌 Disconnected from all stores');
      toast.success('تم قطع الاتصال من جميع المتاجر');
      
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast.error('فشل في قطع الاتصال');
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    loadStores();
  }, []);

  return {
    stores,
    loading,
    currentStore,
    loadStores,
    switchToStore,
    disconnectAll,
    getActiveStore
  };
};