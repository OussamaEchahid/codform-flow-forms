
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Store, Check, Trash2, ExternalLink, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShopifyStoreConnection } from '@/lib/shopify/types';
import { parseShopifyParams } from '@/utils/shopify-helpers'; 

export const ShopifyStoresManager: React.FC = () => {
  const { shop: activeShop, setShop } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<ShopifyStoreConnection[]>([]);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Load stores on component mount
  useEffect(() => {
    const loadStores = () => {
      const allStores = shopifyConnectionManager.getAllStores();
      setStores(allStores);
      
      // Update diagnostic information
      const { shopDomain } = parseShopifyParams();
      // Use localStorage directly instead of connection manager method
      const lastUrlShop = localStorage.getItem('shopify_last_url_shop');
      
      setDiagnosticInfo({
        activeShopFromContext: activeShop,
        activeStoreFromManager: shopifyConnectionManager.getActiveStore(),
        shopFromCurrentUrl: shopDomain,
        lastUrlShop: lastUrlShop,
        localStorageData: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected'),
          shopify_temp_store: localStorage.getItem('shopify_temp_store'),
          shopify_emergency_mode: localStorage.getItem('shopify_emergency_mode'),
          shopify_active_store: localStorage.getItem('shopify_active_store'),
          shopify_last_url_shop: localStorage.getItem('shopify_last_url_shop'),
          shopify_connected_stores: localStorage.getItem('shopify_connected_stores')
        },
        window: {
          location: window.location.href,
          searchParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
        }
      });
    };
    
    loadStores();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopify_connected_stores' || 
          e.key === 'shopify_active_store' ||
          e.key === 'shopify_store' ||
          e.key === 'shopify_connected' ||
          e.key === 'shopify_last_url_shop') {
        loadStores();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeShop]);

  // Set a store as active
  const setActiveStore = (storeUrl: string) => {
    try {
      shopifyConnectionManager.setActiveStore(storeUrl);
      if (setShop) {
        setShop(storeUrl);
      }
      const allStores = shopifyConnectionManager.getAllStores();
      setStores(allStores);
      toast.success(`تم تعيين ${storeUrl} كمتجر نشط`);
    } catch (error) {
      toast.error(`فشل في تعيين المتجر النشط: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  // Remove a store
  const removeStore = (storeUrl: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في إزالة متجر ${storeUrl}؟`)) {
      try {
        shopifyConnectionManager.removeStore(storeUrl);
        const allStores = shopifyConnectionManager.getAllStores();
        setStores(allStores);
        toast.success(`تم إزالة متجر ${storeUrl} بنجاح`);
      } catch (error) {
        toast.error(`فشل في إزالة المتجر: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
    }
  };

  // Navigate to Shopify page to add a new store
  const addNewStore = () => {
    navigate('/shopify');
  };

  // Open store in a new tab
  const openStoreAdmin = (storeUrl: string) => {
    window.open(`https://${storeUrl}/admin`, '_blank');
  };
  
  // Refresh store list
  const refreshStores = () => {
    const allStores = shopifyConnectionManager.getAllStores();
    setStores(allStores);
    toast.success('تم تحديث قائمة المتاجر');
  };
  
  // Clear all stores except active one
  const clearAllExceptActive = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع المتاجر غير النشطة؟')) {
      try {
        if (activeShop) {
          // Keep the active store and remove all others
          const activeStoreObj = stores.find(s => s.domain === activeShop);
          if (activeStoreObj) {
            shopifyConnectionManager.clearAllStores();
            shopifyConnectionManager.addOrUpdateStore(activeShop, true, true);
            refreshStores();
            toast.success('تم مسح جميع المتاجر غير النشطة');
          }
        }
      } catch (error) {
        toast.error(`فشل في مسح المتاجر: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
    }
  };
  
  // Clear all stores
  const clearAllStores = () => {
    if (window.confirm('تحذير: سيؤدي هذا الإجراء إلى مسح جميع المتاجر المتصلة. هل أنت متأكد؟')) {
      try {
        shopifyConnectionManager.clearAllStores();
        refreshStores();
        toast.success('تم مسح جميع المتاجر');
        navigate('/shopify');
      } catch (error) {
        toast.error(`فشل في مسح المتاجر: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
    }
  };

  // Format date to human-readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير معروف';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="border rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center">
            <Store className="h-5 w-5 mr-2" />
            متاجر Shopify المتصلة
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="ml-2">
              {stores.length} متجر
            </Badge>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              title="عرض معلومات التشخيص"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        
        {/* عرض معلومات التشخيص */}
        {showDiagnostics && diagnosticInfo && (
          <div className="mt-2 p-3 bg-slate-100 text-xs rounded-md">
            <h4 className="font-bold mb-2">معلومات التشخيص:</h4>
            <div className="overflow-auto max-h-40">
              <pre className="text-xs whitespace-pre-wrap" dir="ltr">
                {JSON.stringify(diagnosticInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {stores.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">لا توجد متاجر متصلة حاليًا</p>
            <Button onClick={addNewStore}>إضافة متجر جديد</Button>
          </div>
        ) : (
          <div>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">المتجر</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">تاريخ الاتصال</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store, index) => (
                    <tr key={store.domain} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${store.isActive ? 'bg-green-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {store.isActive && <Check className="h-4 w-4 text-green-500 mr-2" />}
                          <span className={store.isActive ? 'font-medium' : ''}>{store.domain}</span>
                          {store.isActive && <Badge className="mr-2 bg-green-100 text-green-800 border-green-200 ml-2">نشط</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(store.lastConnected)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          {!store.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveStore(store.domain)}
                              title="تعيين كمتجر نشط"
                            >
                              تفعيل
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStoreAdmin(store.domain)}
                            title="فتح إدارة المتجر"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeStore(store.domain)}
                            title="إزالة المتجر"
                            disabled={stores.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex flex-col gap-2">
              <Button onClick={addNewStore} className="w-full">إضافة متجر جديد</Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshStores}
                  className="flex items-center justify-center"
                  title="تحديث قائمة المتاجر"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" /> تحديث
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={clearAllExceptActive}
                  className="text-orange-600 hover:bg-orange-50"
                  title="مسح جميع المتاجر غير النشطة"
                >
                  مسح غير النشطة
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                onClick={clearAllStores}
                className="text-red-600 hover:bg-red-50 mt-2"
                title="مسح جميع المتاجر"
              >
                مسح جميع المتاجر
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
