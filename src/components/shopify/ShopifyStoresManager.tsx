
import React, { useState, useEffect, useCallback } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { ShopifyStore } from '@/lib/shopify/types';
import { AlertCircle, CheckCircle, Loader2, Package, Play, RefreshCw, Store, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ShopifyStoresManager = () => {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{[key: string]: 'verifying' | 'verified' | 'failed'}>({});

  // Load stores from database
  const loadStores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading stores from database...');
      
      const { data, error } = await shopifySupabase
        .from('shopify_stores')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading stores:', error);
        throw error;
      }

      const storesWithConnectionStatus = await Promise.all(
        (data || []).map(async (store) => {
          const hasValidToken = store.access_token && store.access_token !== 'null' && store.access_token !== 'placeholder_token';
          let connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
          
          if (hasValidToken) {
            try {
              // Quick connection test
              const testResponse = await fetch(`https://${store.shop}/admin/api/2025-04/shop.json`, {
                headers: {
                  'X-Shopify-Access-Token': store.access_token,
                  'Content-Type': 'application/json'
                }
              });
              
              connectionStatus = testResponse.ok ? 'connected' : 'error';
            } catch (e) {
              connectionStatus = 'error';
            }
          }
          
          return {
            ...store,
            connectionStatus,
            hasValidToken
          };
        })
      );

      setStores(storesWithConnectionStatus);
      console.log(`✅ Loaded ${storesWithConnectionStatus.length} stores`);
    } catch (error) {
      console.error('❌ Error in loadStores:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify store in database with retries
  const verifyStoreWithRetries = async (shop: string, maxRetries = 5): Promise<boolean> => {
    console.log(`🔍 Starting verification for ${shop}`);
    setVerificationStatus(prev => ({ ...prev, [shop]: 'verifying' }));
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Verification attempt ${attempt}/${maxRetries} for ${shop}`);
        
        const { data, error } = await shopifySupabase
          .from('shopify_stores')
          .select('*')
          .eq('shop', shop)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error(`❌ Verification error for ${shop}:`, error);
          if (attempt === maxRetries) {
            setVerificationStatus(prev => ({ ...prev, [shop]: 'failed' }));
            return false;
          }
          continue;
        }

        if (data && data.access_token && data.access_token !== 'null' && data.access_token !== 'placeholder_token') {
          console.log(`✅ Store ${shop} verified successfully`);
          setVerificationStatus(prev => ({ ...prev, [shop]: 'verified' }));
          return true;
        }

        console.log(`⏳ Store ${shop} not yet verified, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Verification attempt ${attempt} failed for ${shop}:`, error);
        if (attempt === maxRetries) {
          setVerificationStatus(prev => ({ ...prev, [shop]: 'failed' }));
          return false;
        }
      }
    }
    
    setVerificationStatus(prev => ({ ...prev, [shop]: 'failed' }));
    return false;
  };

  // Activate store
  const activateStore = async (shop: string) => {
    try {
      setIsActivating(shop);
      console.log(`🔄 Activating store: ${shop}`);
      
      // First, verify the store exists in database
      const isVerified = await verifyStoreWithRetries(shop);
      
      if (!isVerified) {
        throw new Error(`المتجر ${shop} غير موجود في قاعدة البيانات أو لا يحتوي على رمز صالح`);
      }
      
      // Update localStorage
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_active_store', shop);
      
      // Deactivate other stores in database
      await shopifySupabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shop);
      
      // Activate the selected store
      await shopifySupabase
        .from('shopify_stores')
        .update({ is_active: true })
        .eq('shop', shop);
      
      console.log(`✅ Store ${shop} activated successfully`);
      
      // Reload stores to update UI
      await loadStores();
      
      toast.success(`تم تفعيل المتجر ${shop} بنجاح`);
    } catch (error) {
      console.error(`❌ Error activating store ${shop}:`, error);
      toast.error(error instanceof Error ? error.message : 'فشل في تفعيل المتجر');
    } finally {
      setIsActivating(null);
      setVerificationStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[shop];
        return newStatus;
      });
    }
  };

  // Delete store
  const deleteStore = async (shop: string) => {
    try {
      if (!window.confirm(`هل أنت متأكد أنك تريد حذف المتجر ${shop}؟`)) {
        return;
      }

      setIsLoading(true);
      console.log(`🗑️ Deleting store: ${shop}`);

      // Delete the store from the database
      const { error } = await shopifySupabase
        .from('shopify_stores')
        .delete()
        .eq('shop', shop);

      if (error) {
        console.error(`❌ Error deleting store ${shop}:`, error);
        throw error;
      }

      // If this was the active store, clear localStorage
      const activeStore = localStorage.getItem('shopify_store');
      if (activeStore === shop) {
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
        localStorage.removeItem('shopify_active_store');
      }

      console.log(`✅ Store ${shop} deleted successfully`);
      await loadStores();
      toast.success(`تم حذف المتجر ${shop} بنجاح`);
    } catch (error) {
      console.error(`❌ Error in deleteStore:`, error);
      toast.error(error instanceof Error ? error.message : 'فشل في حذف المتجر');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">جاري تحميل المتاجر...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>خطأ في تحميل المتاجر: {error}</span>
        </div>
        <Button 
          onClick={loadStores} 
          variant="outline" 
          className="mt-2"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة المتاجر</h2>
        <Button onClick={loadStores} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد متاجر مرتبطة</p>
          <Button 
            onClick={() => window.location.href = '/shopify-connect'} 
            className="mt-4"
          >
            ربط متجر جديد
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Store className="h-8 w-8 text-blue-500" />
                    {store.is_active && (
                      <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{store.shop}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>الحالة:</span>
                      <Badge 
                        variant={store.is_active ? "default" : "secondary"}
                        className={`${
                          store.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {store.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${
                          store.connectionStatus === 'connected' ? "border-green-500 text-green-700" :
                          store.connectionStatus === 'error' ? "border-red-500 text-red-700" :
                          "border-gray-500 text-gray-700"
                        }`}
                      >
                        {store.connectionStatus === 'connected' ? "متصل" :
                         store.connectionStatus === 'error' ? "خطأ في الاتصال" :
                         "غير متصل"}
                      </Badge>
                      
                      {verificationStatus[store.shop] && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          {verificationStatus[store.shop] === 'verifying' ? 'جاري التحقق...' :
                           verificationStatus[store.shop] === 'verified' ? 'تم التحقق' :
                           'فشل التحقق'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!store.is_active && (
                    <Button
                      onClick={() => activateStore(store.shop)}
                      disabled={isActivating === store.shop}
                      size="sm"
                    >
                      {isActivating === store.shop ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      تفعيل
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => window.location.href = `/shopify-products?shop=${store.shop}`}
                    variant="outline"
                    size="sm"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    المنتجات
                  </Button>
                  
                  <Button
                    onClick={() => deleteStore(store.shop)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>تاريخ الإنشاء: {new Date(store.created_at).toLocaleDateString('ar-SA')}</span>
                  <span>آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopifyStoresManager;
