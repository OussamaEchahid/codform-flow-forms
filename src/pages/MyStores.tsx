
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Settings, Zap, AlertCircle, CheckCircle, Store } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

interface Store {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
}

const MyStores = () => {
  const { language } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [connectingStore, setConnectingStore] = useState<string | null>(null);

  // جلب المتاجر من قاعدة البيانات
  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data, error } = await shopifyStores()
          .select('shop, is_active, updated_at, access_token')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading stores:', error);
          return;
        }

        setStores(data || []);
        
        // تحديد المتجر النشط الحالي من connection manager
        const activeStore = shopifyConnectionManager.getActiveStore();
        setCurrentStore(activeStore);
        
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  // اتصال بمتجر معين
  const handleConnectStore = async (shopDomain: string) => {
    setConnectingStore(shopDomain);
    
    try {
      console.log('🔗 Connecting to store:', shopDomain);
      
      // بدء عملية المصادقة
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { shop: shopDomain }
      });

      if (error) {
        throw new Error(`Auth error: ${error.message}`);
      }

      if (data?.redirect || data?.authUrl) {
        const authUrl = data.redirect || data.authUrl;
        console.log('🔄 Redirecting to Shopify auth:', authUrl);
        
        // تحديد المتجر كنشط قبل إعادة التوجيه
        shopifyConnectionManager.setActiveStore(shopDomain);
        
        // إعادة توجيه
        window.location.href = authUrl;
      } else {
        throw new Error('No auth URL received');
      }
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      toast({
        title: "فشل الاتصال",
        description: `لم يتم الاتصال بـ ${shopDomain}`,
        variant: "destructive"
      });
    } finally {
      setConnectingStore(null);
    }
  };

  // تبديل المتجر النشط (للمتاجر المتصلة بالفعل)
  const handleSwitchStore = (shopDomain: string) => {
    try {
      console.log(`🔄 Switching to store: ${shopDomain}`);
      
      // استخدام setActiveStore المحسن لتبديل المتجر
      shopifyConnectionManager.setActiveStore(shopDomain);
      
      // تحديث الحالة المحلية
      setCurrentStore(shopDomain);
      
      toast({
        title: "تم التبديل",
        description: `تم التبديل إلى متجر ${shopDomain}`,
      });
      
      console.log(`✅ Successfully switched to store: ${shopDomain}`);
      
      // إعادة تحميل الصفحة بعد فترة قصيرة للتأكد من التحديث
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error switching store:', error);
      toast({
        title: "خطأ في التبديل",
        description: `فشل في التبديل إلى متجر ${shopDomain}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'ar' ? 'متاجري' : 'My Stores'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'إدارة متاجرك المتصلة' 
            : 'Manage your connected stores'}
        </p>
      </div>

      {/* عرض المتجر النشط الحالي */}
      {currentStore && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>المتجر النشط حالياً:</strong> {currentStore}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => {
            const isConnected = !!store.access_token;
            const isCurrentStore = store.shop === currentStore;
            const isConnecting = connectingStore === store.shop;
            
            return (
              <Card key={store.shop} className={`${isCurrentStore ? 'border-green-500 bg-green-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Store className="h-5 w-5 text-blue-600" />
                    <div className="flex gap-2">
                      {isCurrentStore && (
                        <Badge variant="default" className="bg-green-600">
                          نشط
                        </Badge>
                      )}
                      {isConnected ? (
                        <Badge variant="default" className="bg-blue-600">
                          متصل
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          غير متصل
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{store.shop}</CardTitle>
                  <CardDescription>
                    آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar-EG')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    {isConnected ? (
                      isCurrentStore ? (
                        <Button variant="outline" disabled className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          المتجر النشط
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleSwitchStore(store.shop)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          تبديل إليه
                        </Button>
                      )
                    ) : (
                      <Button 
                        onClick={() => handleConnectStore(store.shop)}
                        disabled={isConnecting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isConnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            جاري الاتصال...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            اتصال
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyStores;
