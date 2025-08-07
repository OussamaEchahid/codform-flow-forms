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
      
      // جلب البريد الإلكتروني المحفوظ والمتجر النشط
      let userEmail = localStorage.getItem('shopify_user_email');
      const activeStore = getActiveStore();
      
      console.log('📧 البريد الإلكتروني:', userEmail);
      console.log('🏪 المتجر النشط:', activeStore);

      // إذا لم يكن هناك بريد إلكتروني ولكن يوجد متجر نشط، جلب البريد الإلكتروني تلقائياً
      if (!userEmail && activeStore) {
        console.log('🔄 محاولة جلب البريد الإلكتروني تلقائياً للمتجر:', activeStore);
        console.log('🔍 شروط الجلب: userEmail =', userEmail, ', activeStore =', activeStore);
        
        try {
          console.log('📞 استدعاء edge function update-shop-email...');
          const emailResponse = await supabase.functions.invoke('update-shop-email', {
            body: { shop: activeStore }
          });

          console.log('📧 نتيجة استدعاء edge function:', emailResponse);

          if (emailResponse.data?.success) {
            userEmail = emailResponse.data.email;
            localStorage.setItem('shopify_user_email', userEmail);
            console.log('✅ تم جلب وحفظ البريد الإلكتروني:', userEmail);
          } else {
            console.error('❌ فشل في جلب البريد الإلكتروني:', emailResponse);
          }
        } catch (emailError) {
          console.error('❌ خطأ في جلب البريد الإلكتروني:', emailError);
        }
      } else {
        console.log('🔍 لن يتم جلب البريد الإلكتروني - userEmail:', userEmail, ', activeStore:', activeStore);
      }

      let storesList: any[] = [];
      
      // أولاً: إذا كان لدينا بريد إلكتروني، جلب المتاجر بناء عليه
      if (userEmail) {
        console.log('📧 جلب المتاجر بناء على البريد الإلكتروني:', userEmail);
        try {
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/rest/v1/shopify_stores?email=eq.${encodeURIComponent(userEmail)}&is_active=eq.true&select=shop,is_active,updated_at,access_token,email`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
            }
          });
          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            storesList = data;
            console.log(`✅ تم العثور على ${data.length} متجر للبريد الإلكتروني`);
          }
        } catch (fetchError) {
          console.error('❌ خطأ في جلب المتاجر بالبريد الإلكتروني:', fetchError);
        }
      }
      
      // ثانياً: إذا لم نجد متاجر والمتجر النشط موجود، جلب المتجر النشط ومحاولة الحصول على البريد الإلكتروني
      if (storesList.length === 0 && activeStore) {
        console.log('🏪 جلب المتجر النشط والبحث عن البريد الإلكتروني:', activeStore);
        try {
          const response = await supabase
            .from('shopify_stores')
            .select('*')
            .eq('shop', activeStore)
            .eq('is_active', true)
            .maybeSingle();

          if (response.error) {
            console.error('❌ خطأ في جلب المتجر النشط:', response.error);
          } else if (response.data) {
            // إذا لم يكن لديه بريد إلكتروني، حاول جلبه من Shopify
            if (!(response.data as any).email) {
              console.log('📧 محاولة جلب البريد الإلكتروني من Shopify...');
              try {
                const emailResponse = await supabase.functions.invoke('update-shop-email', {
                  body: { shop: activeStore }
                });

                if (emailResponse.data?.success) {
                  (response.data as any).email = emailResponse.data.email;
                  console.log('✅ تم جلب البريد الإلكتروني:', emailResponse.data.email);
                  // حفظ البريد الإلكتروني في localStorage
                  localStorage.setItem('shopify_user_email', emailResponse.data.email);
                }
              } catch (emailError) {
                console.error('❌ خطأ في جلب البريد الإلكتروني:', emailError);
              }
            }

            storesList = [response.data];
            console.log('✅ تم العثور على المتجر النشط');
            
            // حفظ البريد الإلكتروني إذا كان موجود  
            if ((response.data as any).email && (response.data as any).email !== userEmail) {
              localStorage.setItem('shopify_user_email', (response.data as any).email);
              console.log('📧 تم حفظ البريد الإلكتروني من قاعدة البيانات:', (response.data as any).email);
            }
          }
        } catch (dbError) {
          console.error('❌ خطأ في الاتصال بقاعدة البيانات:', dbError);
        }
      }
      
      console.log('📋 بيانات المتاجر المستلمة:', storesList);
      
      // التحقق من البريد الإلكتروني لجميع المتاجر وجلبه إذا كان مفقوداً
      for (let store of storesList) {
        if (!(store as any).email && store.shop) {
          console.log('📧 محاولة جلب البريد الإلكتروني للمتجر:', store.shop);
          try {
            const emailResponse = await supabase.functions.invoke('update-shop-email', {
              body: { shop: store.shop }
            });

            if (emailResponse.data?.success) {
              (store as any).email = emailResponse.data.email;
              console.log('✅ تم جلب البريد الإلكتروني:', emailResponse.data.email);
              // حفظ البريد الإلكتروني في localStorage
              localStorage.setItem('shopify_user_email', emailResponse.data.email);
            } else {
              console.error('❌ فشل في جلب البريد الإلكتروني:', emailResponse.error);
            }
          } catch (emailError) {
            console.error('❌ خطأ في جلب البريد الإلكتروني:', emailError);
          }
        }
      }
      
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

  // Switch to a different store with automatic page reload
  const switchToStore = async (shopDomain: string) => {
    try {
      console.log(`🔄 Switching to store: ${shopDomain}`);
      
      // Update localStorage keys
      localStorage.setItem('active_shopify_store', shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('simple_active_store', shopDomain);
      localStorage.setItem('active_shop', shopDomain);
      localStorage.setItem('current_shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update current store state immediately
      setCurrentStore(shopDomain);
      
      console.log(`✅ Store switched to: ${shopDomain}`);
      toast.success(`جاري التبديل إلى متجر: ${shopDomain}`);
      
      // Return success to allow caller to handle page reload
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