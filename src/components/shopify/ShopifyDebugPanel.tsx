import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { parseShopifyParams } from '@/utils/shopify-helpers';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ShopifyDebugPanel = () => {
  const { shopifyConnected, shop, shops, setShop } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>({});
  const [isConsistent, setIsConsistent] = useState(true);

  // وظيفة لتجميع وعرض معلومات التصحيح
  const collectDebugInfo = async () => {
    setLoading(true);
    
    try {
      // جمع معلومات من localStorage
      const localStorageData = {
        shopify_store: localStorage.getItem('shopify_store'),
        shopify_connected: localStorage.getItem('shopify_connected'),
        shopify_temp_store: localStorage.getItem('shopify_temp_store'),
        shopify_emergency_mode: localStorage.getItem('shopify_emergency_mode')
      };
      
      // جمع معلومات من مدير الاتصال
      const allStores = shopifyConnectionManager.getAllStores();
      const activeStore = shopifyConnectionManager.getActiveStore();
      
      // جمع معلومات من عنوان URL
      const urlParams = parseShopifyParams();
      
      // جمع معلومات من قاعدة البيانات
      let dbData: any = { error: 'لم يتم جلب البيانات بعد' };
      if (shop) {
        const { data, error } = await shopifyStores()
          .select('*')
          .eq('shop', shop)
          .single();
        
        if (error) {
          dbData = { error: error.message };
        } else if (data) {
          const { shop, access_token, token_type, is_active, updated_at } = data;
          dbData = { 
            shop, 
            token_available: !!access_token,
            token_length: access_token ? access_token.length : 0,
            token_type,
            is_active,
            updated_at 
          };
        }
      }
      
      // جمع المعلومات للعرض
      const debugInfo = {
        currentURLParams: urlParams,
        localStorage: localStorageData,
        connectionManager: {
          allStores,
          activeStore,
          storesCount: allStores.length
        },
        authContext: {
          shopifyConnected,
          shops
        },
        database: {
          shopFromDB: dbData.shop,
          found: !!dbData.shop,
          storeDataError: dbData.error,
          allStores: []
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // تحديث المعلومات المعروضة
      setDebugData(debugInfo);
      
      // التحقق من اتساق البيانات بين المصادر المختلفة
      const localStorageConnected = localStorageData.shopify_connected === 'true';
      const activeStoreConsistent = 
        (!!activeStore === !!shop) && // either both have shop or both don't
        (!!activeStore === shopifyConnected) && // connection state matches
        (localStorageConnected === shopifyConnected); // local storage and auth context agree
      
      setIsConsistent(activeStoreConsistent);
      
      if (!activeStoreConsistent) {
        console.warn("Data inconsistency detected between connection sources:", debugInfo);
      }
    } catch (error) {
      console.error("Error collecting debug info:", error);
      toast.error("حدث خطأ أثناء جمع معلومات التصحيح");
    } finally {
      setLoading(false);
    }
  };
  
  // جمع معلومات التصحيح عند تحميل المكون
  useEffect(() => {
    collectDebugInfo();
  }, [shopifyConnected, shop, shops]);
  
  // وظيفة لإصلاح اختلافات البيانات
  const fixInconsistencies = () => {
    try {
      // إذا كان هناك متجر نشط في مدير الاتصال، استخدمه كمصدر للحقيقة
      const activeStore = shopifyConnectionManager.getActiveStore();
      
      if (activeStore) {
        localStorage.setItem('shopify_store', activeStore);
        localStorage.setItem('shopify_connected', 'true');
        
        // Update auth context if setShop is available
        if (setShop) {
          setShop(activeStore);
        }
        
        toast.success("تم إصلاح اختلافات البيانات المحلية");
        
        // إعادة تحميل الصفحة لتحديث حالة الاتصال في AuthProvider
        window.location.reload();
      } else if (debugData.database?.shopFromDB) {
        // إذا لم يكن هناك متجر نشط ولكن هناك متجر في قاعدة البيانات
        const dbShop = debugData.database.shopFromDB;
        shopifyConnectionManager.addOrUpdateStore(dbShop, true);
        localStorage.setItem('shopify_store', dbShop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Update auth context if setShop is available
        if (setShop) {
          setShop(dbShop);
        }
        
        toast.success("تم استعادة بيانات الاتصال من قاعدة البيانات");
        
        // إعادة تحميل الصفحة
        window.location.reload();
      } else if (shop) {
        // If we have a shop in auth context but it's not synced elsewhere
        shopifyConnectionManager.addOrUpdateStore(shop, true);
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        toast.success("تم استعادة بيانات الاتصال من auth context");
        
        // إعادة تحميل الصفحة
        window.location.reload();
      } else {
        toast.error("لا توجد بيانات كافية لإصلاح الاختلافات");
      }
    } catch (error) {
      console.error("Error fixing inconsistencies:", error);
      toast.error("حدث خطأ أثناء محاولة إصلاح اختلافات البيانات");
    }
  };
  
  // وظيفة لمسح جميع بيانات المتاجر المحلية
  const clearAllLocalData = () => {
    try {
      shopifyConnectionManager.clearAllStores();
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_emergency_mode');
      
      // Update auth context if setShop is available
      if (setShop) {
        setShop("");
      }
      
      toast.success("تم مسح جميع بيانات المتاجر المحلية");
      
      // إعادة تحميل المعلومات
      collectDebugInfo();
      
      // إعادة تحميل الصفحة للتأكد من تحديث الواجهة
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error clearing local data:", error);
      toast.error("حدث خطأ أثناء محاولة مسح البيانات المحلية");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">لوحة تصحيح Shopify</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={collectDebugInfo}
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="mr-2">تحديث</span>
        </Button>
      </div>
      
      {!isConsistent && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>تم اكتشاف اختلافات في البيانات</AlertTitle>
          <AlertDescription>
            هناك اختلافات بين مصادر بيانات الاتصال المختلفة. قد يؤدي هذا إلى مشاكل في عمل التطبيق.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fixInconsistencies}
              >
                إصلاح الاختلافات
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllLocalData}
          >
            مسح البيانات المؤقتة
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
              toast.success("تم نسخ بيانات التصحيح إلى الحافظة");
            }}
          >
            نسخ بيانات التصحيح
          </Button>
        </div>
        
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto h-96 mt-2 text-left dir-ltr">
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </div>
    </div>
  );
};
