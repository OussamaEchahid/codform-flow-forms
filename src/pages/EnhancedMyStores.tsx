/**
 * مكون إدارة المتاجر المحسن - يحل جميع مشاكل إدارة المتاجر المتعددة
 */

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
  ArrowLeft,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';
import { validateCurrentStore, fixStoreConnection } from '@/utils/store-validation';
import AppSidebar from '@/components/layout/AppSidebar';

interface Store {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
}

const EnhancedMyStores = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStore, setConnectingStore] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user, session } = useAuth();

  useEffect(() => {
    if (user && session) {
      loadAndValidateStores();
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const loadAndValidateStores = async () => {
    try {
      setLoading(true);
      console.log('🔄 تحميل والتحقق من صحة المتاجر...');

      // 1. التحقق من صحة المتجر النشط أولاً
      const validation = await validateCurrentStore(user?.id!);
      console.log('🔍 حالة التحقق:', validation);

      // 2. إصلاح المشاكل إذا وجدت
      if (!validation.isValid && validation.recommendedStore) {
        console.log('🔧 إصلاح حالة المتجر...');
        await fixStoreConnection(user?.id!);
      }

      // 3. جلب جميع المتاجر
      await fetchAllStores();

    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل بيانات المتاجر",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStores = async () => {
    const response = await supabase.functions.invoke('store-link-manager', {
      body: {
        action: 'get_stores',
        userId: user?.id
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const storesList = response.data?.stores || [];
    console.log('📋 المتاجر المحملة:', storesList);
    setStores(storesList);

    // التأكد من وجود متجر نشط
    const currentStore = simpleShopifyConnectionManager.getActiveStore();
    if (!currentStore && storesList.length > 0) {
      const firstStore = storesList[0].shop;
      console.log(`🔄 تعيين المتجر النشط: ${firstStore}`);
      simpleShopifyConnectionManager.setActiveStore(firstStore);
    }
  };

  const handleRefreshStores = async () => {
    setRefreshing(true);
    try {
      await loadAndValidateStores();
      toast({
        title: "تم التحديث",
        description: "تم تحديث قائمة المتاجر بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث قائمة المتاجر",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectNewStore = async () => {
    try {
      // توجيه المستخدم لصفحة ربط متجر جديد
      navigate('/shopify-stores');
    } catch (error) {
      console.error('❌ خطأ في التوجيه:', error);
    }
  };

  const handleSwitchStore = async (shopDomain: string) => {
    try {
      console.log(`🔄 تبديل إلى المتجر: ${shopDomain}`);
      
      // تحديث المتجر النشط
      simpleShopifyConnectionManager.setActiveStore(shopDomain);
      
      // التحقق من نجاح التبديل
      const newActiveStore = simpleShopifyConnectionManager.getActiveStore();
      console.log(`✅ تم التبديل إلى: ${newActiveStore}`);
      
      toast({
        title: "تم التبديل بنجاح",
        description: `تم التبديل إلى ${shopDomain}`,
      });
      
      // إعادة تحميل البيانات وتوجيه للصفحة الرئيسية
      setTimeout(() => {
        window.location.href = '/';
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
      simpleShopifyConnectionManager.disconnect();
      
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

  const currentStore = simpleShopifyConnectionManager.getActiveStore();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل المتاجر...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان والأدوات */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى لوحة التحكم
            </Button>
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">متاجري</h1>
                <p className="text-muted-foreground">
                  إدارة متاجر Shopify المرتبطة بحسابك
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefreshStores}
                  disabled={refreshing}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                <Button 
                  onClick={handleConnectNewStore}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ربط متجر جديد
                </Button>
              </div>
            </div>
          </div>

          {/* حالة الاتصال الحالية */}
          <div className="mb-6">
            {currentStore ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 flex items-center justify-between">
                  <span>
                    <strong>متصل بـ:</strong> {currentStore}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDisconnectAll}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Power className="h-3 w-3 mr-1" />
                    قطع الاتصال
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>لا يوجد اتصال نشط.</strong> يرجى اختيار متجر من القائمة أدناه أو ربط متجر جديد.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* قائمة المتاجر */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const hasToken = !!store.access_token && store.access_token !== 'null' && store.access_token !== 'placeholder_token';
              const isCurrentStore = store.shop === currentStore;
              
              return (
                <Card key={store.shop} className={`transition-all hover:shadow-lg ${isCurrentStore ? 'border-green-500 bg-green-50' : ''}`}>
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
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            يحتاج إعادة ربط
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
                          onClick={() => handleConnectNewStore()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          إعادة ربط
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* رسالة عدم وجود متاجر */}
          {stores.length === 0 && (
            <div className="text-center py-12">
              <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد متاجر مضافة</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ بربط أول متجر Shopify لحسابك
              </p>
              <Button 
                onClick={handleConnectNewStore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                ربط متجر جديد
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMyStores;