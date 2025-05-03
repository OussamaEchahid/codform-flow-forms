
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';
import { AlertCircle, Bug, RefreshCw, Database, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { parseShopifyParams } from '@/utils/shopify-helpers';

export const ShopifyDebugPanel: React.FC = () => {
  const { shop, shopifyConnected, shops } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadDebugInfo = async () => {
    setIsLoading(true);
    
    try {
      // جمع معلومات من localStorage
      const localStorageShop = localStorage.getItem('shopify_store');
      const localStorageConnected = localStorage.getItem('shopify_connected');
      const localStorageTempStore = localStorage.getItem('shopify_temp_store');
      
      // جمع معلومات من مدير الاتصال
      const allStores = shopifyConnectionManager.getAllStores();
      const activeStore = shopifyConnectionManager.getActiveStore();
      
      // Parse current URL parameters
      const urlParams = parseShopifyParams();
      
      // محاولة جلب المتجر من قاعدة البيانات
      let dbInfo = null;
      
      try {
        const { data: shopFromDB, error: dbError } = await supabase
          .rpc('get_user_shop')
          .single();
          
        if (shopFromDB) {
          dbInfo = {
            shopFromDB,
            found: true
          };
        } else {
          dbInfo = {
            found: false,
            error: dbError ? dbError.message : 'No shop found in database'
          };
        }
        
        // جلب معلومات المتجر المفصلة
        const { data: storeData, error: storeError } = await supabase
          .rpc('get_shopify_store_data');
          
        if (storeData && storeData.length > 0) {
          // Fix: Access the first item in the array since storeData is now recognized as an array
          const storeItem = storeData[0];
          dbInfo.storeData = {
            store: storeItem,
            hasToken: !!storeItem.access_token,
            tokenLength: storeItem.access_token ? storeItem.access_token.length : 0,
            tokenFirstChars: storeItem.access_token ? `${storeItem.access_token.substring(0, 4)}...` : 'none'
          };
        } else {
          dbInfo.storeDataError = storeError ? storeError.message : 'No store data found';
        }
        
        // Get all shop records from database
        const { data: allShopData, error: allShopsError } = await supabase
          .from('shopify_stores')
          .select('*');
        
        if (allShopData && allShopData.length > 0) {
          dbInfo.allStores = allShopData.map(store => ({
            shop: store.shop,
            hasToken: !!store.access_token,
            tokenLength: store.access_token ? store.access_token.length : 0,
            updatedAt: store.updated_at
          }));
        } else {
          dbInfo.allStoresError = allShopsError ? allShopsError.message : 'No stores found';
        }
      } catch (dbFetchError) {
        console.error('Error fetching DB info:', dbFetchError);
        dbInfo = {
          found: false,
          error: dbFetchError instanceof Error ? dbFetchError.message : 'Unknown error fetching from DB'
        };
      }
      
      // جمع كل المعلومات
      const info = {
        currentURLParams: urlParams,
        localStorage: {
          shopify_store: localStorageShop,
          shopify_connected: localStorageConnected,
          shopify_temp_store: localStorageTempStore,
          shopify_emergency_mode: localStorage.getItem('shopify_emergency_mode')
        },
        connectionManager: {
          allStores,
          activeStore,
          storesCount: allStores.length
        },
        authContext: {
          shopifyConnected,
          shop,
          shops
        },
        database: dbInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
      toast.error('حدث خطأ أثناء تحميل معلومات التصحيح');
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة لمسح البيانات المؤقتة
  const clearTempData = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح البيانات المؤقتة؟ قد يؤدي هذا إلى فقدان اتصال المتجر الحالي.')) {
      localStorage.removeItem('shopify_temp_store');
      toast.success('تم مسح البيانات المؤقتة');
      loadDebugInfo();
    }
  };

  // وظيفة لمسح بيانات localStorage
  const clearAllLocalStorage = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع بيانات التخزين المحلي؟ سيتم إعادة تعيين جميع الاتصالات.')) {
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_connected_stores');
      localStorage.removeItem('shopify_active_store');
      toast.success('تم مسح جميع بيانات التخزين المحلي');
      window.location.reload();
    }
  };

  // وظيفة للدخول في وضع الطوارئ
  const enterEmergencyMode = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في الدخول في وضع الطوارئ؟ سيتم تعطيل الاتصال التلقائي بـ Shopify.')) {
      localStorage.setItem('shopify_emergency_mode', 'true');
      toast.success('تم تفعيل وضع الطوارئ');
      loadDebugInfo();
    }
  };

  // وظيفة للخروج من وضع الطوارئ
  const exitEmergencyMode = () => {
    localStorage.removeItem('shopify_emergency_mode');
    toast.success('تم إلغاء تفعيل وضع الطوارئ');
    loadDebugInfo();
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Bug className="h-4 w-4 mr-2 text-amber-600" />
          لوحة تصحيح Shopify
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-amber-700 mb-2">
          هذه اللوحة مخصصة للمطورين ومهندسي الدعم. تحتوي على معلومات فنية قد تساعد في تشخيص مشاكل الاتصال.
        </p>
        
        {!isExpanded ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-white border-amber-200"
            onClick={() => {
              setIsExpanded(true);
              loadDebugInfo();
            }}
          >
            عرض معلومات التصحيح
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-amber-200"
                onClick={loadDebugInfo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                تحديث
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-amber-200"
                onClick={() => setIsExpanded(false)}
              >
                إغلاق
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                className="bg-white border-amber-200 flex items-center"
              >
                <Store className="h-4 w-4 mr-1" />
                المتاجر: {shops ? shops.length : 0}
              </Button>
            </div>
            
            {/* معلومات المتجر الحالي */}
            <div className="p-2 bg-white border rounded-md">
              <p className="font-bold mb-2">المتجر الحالي</p>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p><strong>متجر نشط:</strong> {shop || 'غير متصل'}</p>
                <p><strong>حالة الاتصال:</strong> {shopifyConnected ? 'متصل' : 'غير متصل'}</p>
                <p><strong>عدد المتاجر:</strong> {shops?.length || 0}</p>
              </div>
            </div>
            
            {/* حالة وضع الطوارئ */}
            {localStorage.getItem('shopify_emergency_mode') === 'true' ? (
              <div className="p-2 bg-red-100 border border-red-300 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-600 h-4 w-4" />
                  <p className="font-bold text-red-700">وضع الطوارئ مفعل</p>
                </div>
                <p className="text-xs text-red-700 mb-2">
                  في وضع الطوارئ، يتم تعطيل الاتصال التلقائي بـ Shopify. استخدم هذا الوضع فقط عند مواجهة مشاكل خطيرة في الاتصال.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white w-full border-red-300 text-red-700"
                  onClick={exitEmergencyMode}
                >
                  إلغاء تفعيل وضع الطوارئ
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white border-red-200 text-red-700"
                onClick={enterEmergencyMode}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                تفعيل وضع الطوارئ
              </Button>
            )}
            
            <div className="p-2 bg-white border rounded-md">
              <p className="font-bold mb-2 flex items-center">
                <Database className="h-4 w-4 mr-1" /> 
                معلومات التصحيح
              </p>
              
              {debugInfo ? (
                <pre className="text-xs overflow-auto max-h-60 p-2 bg-gray-50 rounded-md">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">جاري تحميل المعلومات...</p>
              )}
            </div>
            
            {/* أدوات إضافية */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white border-amber-200"
                onClick={clearTempData}
              >
                مسح البيانات المؤقتة
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white border-amber-200"
                onClick={clearAllLocalStorage}
              >
                إعادة تعيين جميع بيانات الاتصال
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <p className="text-xs text-amber-700 w-full text-center">
          إصدار نظام إدارة المتاجر: v1.1.0
        </p>
      </CardFooter>
    </Card>
  );
};

export default ShopifyDebugPanel;
