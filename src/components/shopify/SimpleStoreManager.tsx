import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Store as StoreIcon, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Power,
  Settings 
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';

interface Store {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
}

const SimpleStoreManager = () => {
  const { language } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStore, setConnectingStore] = useState<string | null>(null);
  const { user, session } = useAuth();

  useEffect(() => {
    // التحقق من المصادقة قبل جلب البيانات
    if (user && session) {
      fetchUserStores();
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const fetchUserStores = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.error('لا يوجد مستخدم مصادق');
        return;
      }

      // جلب المتاجر الخاصة بالمستخدم المصادق فقط
      const response = await fetch(
        `https://trlklwixfeaexhydzaue.supabase.co/rest/v1/shopify_stores?user_id=eq.${user.id}&is_active=eq.true&select=*&order=updated_at.desc`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStores(data || []);
      
    } catch (err: any) {
      console.error('Error fetching user stores:', err);
      toast({
        title: "خطأ في تحميل المتاجر",
        description: "فشل في تحميل المتاجر المرتبطة بحسابك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStore = simpleShopifyConnectionManager.getActiveStore();


  // ربط متجر جديد
  const handleConnectStore = async (shopDomain: string) => {
    setConnectingStore(shopDomain);
    
    try {
      console.log(`🔗 Connecting to store: ${shopDomain}`);
      
      // الحصول على user_id الحالي
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      console.log(`🔗 Connecting store with user ID: ${userId}`);
      
      // بدء عملية المصادقة مع تمرير user_id
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop: shopDomain,
          userId: userId 
        }
      });

      if (error) {
        throw new Error(`Auth error: ${error.message}`);
      }

      if (data?.redirect || data?.authUrl) {
        const authUrl = data.redirect || data.authUrl;
        console.log(`🔄 Redirecting to Shopify auth: ${authUrl}`);
        
        // إعادة توجيه للمصادقة
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

  // تبديل إلى متجر
  const handleSwitchStore = async (shopDomain: string) => {
    try {
      simpleShopifyConnectionManager.setActiveStore(shopDomain);
      console.log(`✅ Successfully switched to store: ${shopDomain}`);
      
      toast({
        title: "تم التبديل بنجاح",
        description: `تم التبديل إلى ${shopDomain}`,
      });
      
      // إعادة تحميل لتحديث الواجهة
      window.location.reload();
    } catch (error) {
      console.error('Error switching store:', error);
      toast({
        title: "خطأ في التبديل",
        description: "فشل في التبديل إلى المتجر",
        variant: "destructive"
      });
    }
  };

  // قطع الاتصال من جميع المتاجر
  const handleDisconnectAll = () => {
    try {
      // تنظيف localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('simple_active_store');
      
      // إعادة تحميل الصفحة
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال من جميع المتاجر",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // عرض معلومات التصحيح
  const showDebugInfo = () => {
    const activeStore = simpleShopifyConnectionManager.getActiveStore();
    console.log('🐛 Debug Info:', { 
      currentStore, 
      activeStore,
      storesCount: stores.length,
      localStorage: {
        shopify_store: localStorage.getItem('shopify_store'),
        simple_active_store: localStorage.getItem('simple_active_store'),
        shopify_connected: localStorage.getItem('shopify_connected')
      }
    });
    
    toast({
      title: "معلومات التصحيح",
      description: `تم طباعة المعلومات في وحدة التحكم. المتجر النشط: ${activeStore || 'لا يوجد'}`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل المتاجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* العنوان */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'ar' ? 'إدارة المتاجر المبسطة' : 'Simple Store Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'نظام مبسط لإدارة متاجر Shopify بدون تعقيدات' 
            : 'Simplified Shopify store management without complications'}
        </p>
      </div>

      {/* الحالة الحالية */}
      <div className="mb-6">
        {currentStore ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 flex items-center justify-between">
              <span>
                <strong>متصل بـ:</strong> {currentStore}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={showDebugInfo}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  تصحيح
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisconnectAll}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Power className="h-3 w-3 mr-1" />
                  قطع الاتصال
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>لا يوجد اتصال نشط.</strong> يرجى اختيار متجر من القائمة أدناه.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* قائمة المتاجر */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => {
          const hasToken = !!store.access_token && store.access_token !== 'null';
          const isCurrentStore = store.shop === currentStore;
          const isConnecting = connectingStore === store.shop;
          
          return (
            <Card key={store.shop} className={`transition-all ${isCurrentStore ? 'border-green-500 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <StoreIcon className="h-5 w-5 text-blue-600" />
                  <div className="flex gap-2">
                    {isCurrentStore && (
                      <Badge variant="default" className="bg-green-600">
                        نشط
                      </Badge>
                    )}
                    {hasToken ? (
                      <Badge variant="default" className="bg-blue-600">
                        متاح
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        يحتاج ربط
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
                  {hasToken ? (
                    isCurrentStore ? (
                      <Button variant="outline" disabled className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        متصل حالياً
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
                          ربط المتجر
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* رسالة إذا لم توجد متاجر */}
      {stores.length === 0 && (
        <div className="text-center py-12">
          <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">لا توجد متاجر مضافة بعد</p>
          <p className="text-sm text-muted-foreground">
            يمكنك إضافة متجر عن طريق الذهاب إلى صفحة ربط Shopify
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleStoreManager;