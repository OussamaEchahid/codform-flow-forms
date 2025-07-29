
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';
import AppSidebar from '@/components/layout/AppSidebar';

interface Store {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
}

const MyStores = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStore, setConnectingStore] = useState<string | null>(null);
  const { user, session, isShopifyAuthenticated } = useAuth();

  useEffect(() => {
    // أولوية للـ Shopify authentication، ثم للـ traditional authentication
    if (isShopifyAuthenticated || (user && session)) {
      fetchUserStores();
    } else {
      setLoading(false);
    }
  }, [user, session, isShopifyAuthenticated]);

  const fetchUserStores = async () => {
    try {
      setLoading(true);
      
      // الحصول على المتجر النشط من localStorage
      const activeStore = localStorage.getItem('current_shopify_store');
      const userEmail = localStorage.getItem('shopify_user_email');
      
      console.log('📦 المتجر النشط من localStorage:', activeStore);
      console.log('📧 إيميل المستخدم من localStorage:', userEmail);
      
      if (activeStore) {
        // إنشاء قائمة المتاجر بناءً على المتجر النشط
        const storesList = [{
          shop: activeStore,
          is_active: true,
          updated_at: new Date().toISOString(),
          access_token: 'active',
          user_id: userEmail || 'shopify_user'
        }];
        
        console.log('✅ تم تحديد المتاجر:', storesList);
        setStores(storesList);
      } else {
        console.log('⚠️ لم يتم العثور على متاجر');
        setStores([]);
      }
      
    } catch (err: any) {
      console.error('❌ خطأ في تحميل المتاجر:', err);
      toast({
        title: "خطأ في تحميل المتاجر",
        description: err.message || "فشل في تحميل المتاجر المرتبطة بحسابك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // قراءة مباشرة من localStorage للاتساق مع الصفحات الأخرى
  const getActiveStoreFromStorage = () => {
    return localStorage.getItem('current_shopify_store') || 
           localStorage.getItem('shopify_store') || 
           null;
  };
  
  const currentStore = getActiveStoreFromStorage() || simpleShopifyConnectionManager.getActiveStore();

  const handleConnectStore = async (shopDomain: string) => {
    setConnectingStore(shopDomain);
    
    try {
      console.log(`🔗 Connecting to store: ${shopDomain}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop: shopDomain,
          userId: user?.id 
        }
      });

      if (error) {
        throw new Error(`Auth error: ${error.message}`);
      }

      if (data?.redirect || data?.authUrl) {
        const authUrl = data.redirect || data.authUrl;
        console.log(`🔄 Redirecting to Shopify auth: ${authUrl}`);
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

  const handleSwitchStore = async (shopDomain: string) => {
    try {
      console.log(`🔄 تبديل إلى المتجر: ${shopDomain}`);
      
      // تحديث المتجر النشط في localStorage
      simpleShopifyConnectionManager.setActiveStore(shopDomain);
      
      // التأكد من أن المتجر تم تعيينه بنجاح
      const newActiveStore = simpleShopifyConnectionManager.getActiveStore();
      console.log(`✅ تم التبديل بنجاح إلى: ${newActiveStore}`);
      
      toast({
        title: "تم التبديل بنجاح",
        description: `تم التبديل إلى ${shopDomain}`,
      });
      
      // إعادة تحميل الصفحة لتحديث جميع المكونات
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error('❌ خطأ في التبديل:', error);
      toast({
        title: "خطأ في التبديل",
        description: "فشل في التبديل إلى المتجر",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectAll = () => {
    try {
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('simple_active_store');
      
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

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان والعودة */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى لوحة التحكم
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'متاجري' : 'My Stores'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إدارة متاجر Shopify المرتبطة بحسابك' 
                : 'Manage your connected Shopify stores'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل المتاجر...</p>
            </div>
          ) : (
            <>
              {/* الحالة الحالية - تحديث فوري */}
              <div className="mb-6">
                {(() => {
                  // التحقق من localStorage مباشرة
                  const activeStore = getActiveStoreFromStorage();
                  console.log('🔍 MyStores - Active store check:', {
                    activeStore,
                    currentStore,
                    localStorage: localStorage.getItem('current_shopify_store'),
                    stores: stores.map(s => s.shop)
                  });
                  
                  if (activeStore) {
                    return (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 flex items-center justify-between">
                          <span>
                            <strong>✅ متصل بـ:</strong> {activeStore}
                            <br />
                            <small className="text-green-600">الاتصال نشط ويعمل بشكل صحيح</small>
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
                    );
                  } else {
                    return (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>❌ لا يوجد اتصال نشط.</strong> يرجى اختيار متجر من القائمة أدناه.
                        </AlertDescription>
                      </Alert>
                    );
                  }
                })()}
              </div>

              {/* قائمة المتاجر */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => {
                  const hasToken = !!store.access_token && store.access_token !== 'null' && store.access_token !== 'placeholder_token';
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
                  <Button 
                    onClick={() => navigate('/shopify-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    إضافة متجر جديد
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStores;
