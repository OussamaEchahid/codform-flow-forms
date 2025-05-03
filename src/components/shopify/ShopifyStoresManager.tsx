
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Store, Check, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShopifyStoreConnection } from '@/lib/shopify/types';

interface StoreDisplay {
  shop: string;
  isActive: boolean;
  connectedAt: string;
  lastUsed?: string;
}

export const ShopifyStoresManager: React.FC = () => {
  const { shop: activeShop, setShop } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreDisplay[]>([]);

  // Load stores on component mount
  useEffect(() => {
    const loadStores = () => {
      const allStores = shopifyConnectionManager.getAllStores();
      const displayStores: StoreDisplay[] = allStores.map(store => ({
        shop: store.domain,
        isActive: store.isActive,
        connectedAt: store.lastConnected,
        lastUsed: undefined // Could be filled from another source if needed
      }));
      setStores(displayStores);
    };
    
    loadStores();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopify_connected_stores' || e.key === 'shopify_active_store') {
        loadStores();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Set a store as active
  const setActiveStore = (storeUrl: string) => {
    try {
      shopifyConnectionManager.setActiveStore(storeUrl);
      if (setShop) {
        setShop(storeUrl);
      }
      const allStores = shopifyConnectionManager.getAllStores();
      const displayStores: StoreDisplay[] = allStores.map(store => ({
        shop: store.domain,
        isActive: store.isActive,
        connectedAt: store.lastConnected,
        lastUsed: undefined
      }));
      setStores(displayStores);
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
        const displayStores: StoreDisplay[] = allStores.map(store => ({
          shop: store.domain,
          isActive: store.isActive,
          connectedAt: store.lastConnected,
          lastUsed: undefined
        }));
        setStores(displayStores);
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
          <Badge variant="outline" className="ml-2">
            {stores.length} متجر
          </Badge>
        </CardTitle>
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
                    <th className="text-right py-3 px-4 font-medium text-gray-700">آخر استخدام</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store, index) => (
                    <tr key={store.shop} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${store.isActive ? 'bg-green-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {store.isActive && <Check className="h-4 w-4 text-green-500 mr-2" />}
                          <span className={store.isActive ? 'font-medium' : ''}>{store.shop}</span>
                          {store.isActive && <Badge className="mr-2 bg-green-100 text-green-800 border-green-200 ml-2">نشط</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(store.connectedAt)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(store.lastUsed)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          {!store.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveStore(store.shop)}
                              title="تعيين كمتجر نشط"
                            >
                              تفعيل
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStoreAdmin(store.shop)}
                            title="فتح إدارة المتجر"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeStore(store.shop)}
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
            <div className="p-4 border-t">
              <Button onClick={addNewStore} className="w-full">إضافة متجر جديد</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
