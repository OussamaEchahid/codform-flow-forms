
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Store, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { cleanShopDomain } from '@/utils/shopify-helpers';

export const ShopifyStoresManager: React.FC = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { setShop } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newShopDomain, setNewShopDomain] = useState('');
  const [stores, setStores] = useState(shopifyConnectionManager.getAllStores());
  const [activeStore, setActiveStore] = useState(shopifyConnectionManager.activeStore);

  // تحديث القائمة عند تغيير المتجر النشط
  const handleSetActiveStore = (shop: string) => {
    try {
      shopifyConnectionManager.setActiveStore(shop);
      setActiveStore(shop);
      setStores(shopifyConnectionManager.getAllStores());
      
      // تحديث حالة المصادقة
      if (setShop) {
        setShop(shop);
      }
      
      toast.success(language === 'ar' 
        ? `تم تفعيل متجر ${shop} بنجاح`
        : `Store ${shop} activated successfully`);
    } catch (error) {
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء تغيير المتجر النشط'
        : 'Error changing active store');
      console.error('Error setting active store:', error);
    }
  };

  // إزالة متجر
  const handleRemoveStore = (shop: string) => {
    try {
      shopifyConnectionManager.removeStore(shop);
      setStores(shopifyConnectionManager.getAllStores());
      setActiveStore(shopifyConnectionManager.activeStore);
      
      // تحديث حالة المصادقة
      if (setShop && activeStore === shop) {
        setShop(shopifyConnectionManager.activeStore);
      }
      
      toast.success(language === 'ar'
        ? `تم إزالة متجر ${shop} بنجاح`
        : `Store ${shop} removed successfully`);
    } catch (error) {
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء إزالة المتجر'
        : 'Error removing store');
      console.error('Error removing store:', error);
    }
  };

  // إضافة متجر جديد
  const handleAddNewStore = () => {
    if (!newShopDomain || newShopDomain.trim() === '') {
      toast.error(language === 'ar'
        ? 'يرجى إدخال عنوان متجر صحيح'
        : 'Please enter a valid shop domain');
      return;
    }

    const cleanedDomain = cleanShopDomain(newShopDomain);
    
    // التوجه إلى صفحة الاتصال بالمتجر الجديد
    navigate(`/shopify-redirect?shop=${encodeURIComponent(cleanedDomain)}`);
  };

  // بدء الاتصال بمتجر جديد
  const startNewConnection = () => {
    navigate('/shopify');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'إدارة متاجر Shopify' : 'Shopify Stores Management'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'إدارة اتصالات متاجر Shopify الخاصة بك'
            : 'Manage your Shopify store connections'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Store className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {language === 'ar' 
                ? 'لا يوجد لديك أي متاجر متصلة حالياً'
                : 'You don\'t have any connected stores yet'}
            </p>
            <Button onClick={startNewConnection}>
              {language === 'ar' ? 'اتصل بمتجر جديد' : 'Connect a store'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* قائمة المتاجر المتصلة */}
            <div className="rounded-md border">
              <div className="bg-gray-50 p-3 font-medium">
                {language === 'ar' ? 'المتاجر المتصلة' : 'Connected Stores'}
              </div>
              <div className="divide-y">
                {stores.map((store) => (
                  <div key={store.shop} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{store.shop}</p>
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'متصل منذ: ' : 'Connected since: '}
                          {new Date(store.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeStore === store.shop ? (
                        <Button variant="outline" size="sm" className="bg-green-50 text-green-600" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSetActiveStore(store.shop)}
                        >
                          {language === 'ar' ? 'تفعيل' : 'Activate'}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveStore(store.shop)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* إضافة متجر جديد */}
            {isAdding ? (
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">
                  {language === 'ar' ? 'إضافة متجر جديد' : 'Add New Store'}
                </h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={language === 'ar' ? 'اسم-المتجر.myshopify.com' : 'store-name.myshopify.com'}
                    value={newShopDomain}
                    onChange={(e) => setNewShopDomain(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleAddNewStore}>
                    {language === 'ar' ? 'اتصال' : 'Connect'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'إضافة متجر جديد' : 'Add New Store'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-gray-500 w-full text-center">
          {language === 'ar'
            ? 'يتم تخزين معلومات الاتصال بشكل آمن. يمكنك إدارة متاجرك في أي وقت.'
            : 'Connection information is stored securely. You can manage your stores anytime.'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default ShopifyStoresManager;
