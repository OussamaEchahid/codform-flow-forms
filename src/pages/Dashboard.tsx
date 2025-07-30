import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, forceSignOut } from '@/utils/auth-cleanup';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store as StoreIcon, 
  FileText, 
  ShoppingCart, 
  Plus,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalForms: number;
  totalOrders: number;
  totalStores: number;
  activeStore: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, shops, shop, shopifyConnected, isShopifyAuthenticated } = useAuth();
  const { language } = useI18n();
  
  // إظهار حالة الاتصال بوضوح باستخدام UnifiedStoreManager
  const activeStoreFromManager = UnifiedStoreManager.getActiveStore();
  console.log('🎯 Dashboard - Auth State:', {
    user: !!user,
    shops,
    shop,
    shopifyConnected,
    isShopifyAuthenticated,
    activeStoreFromManager,
    unified: UnifiedStoreManager.getDiagnosticInfo()
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    totalOrders: 0,
    totalStores: 0,
    activeStore: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // تحميل البيانات إذا كان المستخدم مصادق عليه (تقليدي أو Shopify)
    if (user || isShopifyAuthenticated) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, isShopifyAuthenticated]); // Depend on both auth types

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // استخدام UnifiedStoreManager للحصول على المتجر النشط
      const activeStore = UnifiedStoreManager.getActiveStore();
      
      console.log('📊 Dashboard - Loading data for store:', activeStore);
      
      if (!activeStore) {
        console.log('⚠️ Dashboard - No active store found');
        setStats({
          totalStores: 0,
          totalForms: 0,
          totalOrders: 0,
          activeStore: null
        });
        setIsLoading(false);
        return;
      }

      // التحقق من البريد الإلكتروني وجلبه إذا لم يكن موجوداً
      let userEmail = localStorage.getItem('shopify_user_email');
      console.log('📧 Dashboard - Current email in localStorage:', userEmail);
      
      if (!userEmail && activeStore) {
        console.log('🔄 Dashboard - Fetching email for store:', activeStore);
        try {
          const emailResponse = await supabase.functions.invoke('update-shop-email', {
            body: { shop: activeStore }
          });

          console.log('📧 Dashboard - Email fetch response:', emailResponse);

          if (emailResponse.data?.success) {
            userEmail = emailResponse.data.email;
            localStorage.setItem('shopify_user_email', userEmail);
            console.log('✅ Dashboard - Email fetched and saved:', userEmail);
          }
        } catch (emailError) {
          console.error('❌ Dashboard - Error fetching email:', emailError);
        }
      }
      
      let formsCount = 0;
      let ordersCount = 0;
      
      // جلب عدد النماذج للمتجر النشط
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id, shop_id')
        .eq('shop_id', activeStore);
      
      if (!formsError && formsData) {
        formsCount = formsData.length;
        console.log('📋 Dashboard - Forms found:', formsCount);
      } else {
        console.error('❌ Dashboard - Error fetching forms:', formsError);
      }
      
      // جلب عدد الطلبات (الإرسالات) للمتجر النشط
      if (formsData && formsData.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('form_submissions')
          .select('id, form_id')
          .in('form_id', formsData.map(f => f.id.toString()));
        
        if (!submissionsError && submissionsData) {
          ordersCount = submissionsData.length;
          console.log('🛒 Dashboard - Submissions found:', ordersCount);
        } else {
          console.error('❌ Dashboard - Error fetching submissions:', submissionsError);
        }
      }
      
      // تحديث الإحصائيات
      setStats({
        totalStores: 1, // دائماً 1 للمتجر النشط
        totalForms: formsCount,
        totalOrders: ordersCount,
        activeStore: activeStore
      });

      console.log('✅ Dashboard - Stats updated:', {
        totalStores: 1,
        totalForms: formsCount,
        totalOrders: ordersCount,
        activeStore: activeStore
      });
      
    } catch (error) {
      console.error('❌ Dashboard - Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي مع البروفايل */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  مرحباً بك في لوحة التحكم
                </h1>
                <p className="text-muted-foreground">
                  إدارة متاجرك ونماذجك وطلباتك من مكان واحد
                </p>
              </div>
              
              {/* أيقونة البروفايل */}
              {(() => {
                const activeStore = UnifiedStoreManager.getActiveStore();
                const userEmail = localStorage.getItem('shopify_user_email');
                
                console.log('👤 Dashboard - Profile info:', { activeStore, userEmail, user: !!user });
                
                // إظهار البروفايل إذا كان هناك متجر نشط أو مستخدم مصادق تقليدياً
                if (activeStore || user) {
                  return (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {userEmail ? (
                          <>
                            <p className="font-medium text-sm">{userEmail}</p>
                            <p className="text-xs text-muted-foreground">{activeStore || 'متجر غير محدد'}</p>
                          </>
                        ) : user ? (
                          <>
                            <p className="font-medium text-sm">{user.email}</p>
                            <p className="text-xs text-muted-foreground">Traditional Auth</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-sm">{activeStore}</p>
                            <p className="text-xs text-muted-foreground">لا يوجد بريد إلكتروني</p>
                          </>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {userEmail ? userEmail.charAt(0).toUpperCase() : 
                           user?.email ? user.email.charAt(0).toUpperCase() : 
                           activeStore ? activeStore.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* حالة الاتصال بالمتجر - إظهار واضح */}
          {(user || isShopifyAuthenticated || UnifiedStoreManager.getActiveStore()) && (
            <div className="mb-6">
              {/* التحقق من UnifiedStoreManager للتأكد */}
              {(() => {
                const storeFromManager = UnifiedStoreManager.getActiveStore();
                const connectedStore = shop || storeFromManager;
                
                if (connectedStore) {
                  return (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>✅ متصل بالمتجر:</strong> {connectedStore}
                            <br />
                            <small className="text-green-600">الاتصال نشط ويعمل بشكل صحيح</small>
                          </div>
                          <div className="bg-green-100 px-3 py-1 rounded-full">
                            <span className="text-green-800 font-medium">نشط</span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                } else {
                  return (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>❌ لا يوجد متجر نشط.</strong> يرجى ربط متجر Shopify أولاً.
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => navigate('/my-stores')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            ربط متجر
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                }
              })()}
            </div>
          )}

          {/* إحصائيات سريعة - تحديث فوري */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المتاجر</CardTitle>
                <StoreIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const storeFromManager = UnifiedStoreManager.getActiveStore();
                    return (shop || storeFromManager) ? 1 : 0;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const storeFromManager = UnifiedStoreManager.getActiveStore();
                    const connectedStore = shop || storeFromManager;
                    return connectedStore ? `متصل بـ ${connectedStore}` : 'متاجر Shopify مرتبطة';
                  })()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي النماذج</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalForms}</div>
                <p className="text-xs text-muted-foreground">
                  نماذج تم إنشاؤها
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  طلبات مستلمة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalForms > 0 ? Math.round((stats.totalOrders / stats.totalForms) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  نسبة تحويل النماذج
                </p>
              </CardContent>
            </Card>
          </div>

          {/* الإجراءات السريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-stores')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="h-5 w-5 text-blue-600" />
                  إدارة المتاجر
                </CardTitle>
                <CardDescription>
                  ربط وإدارة متاجر Shopify الخاصة بك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <StoreIcon className="h-4 w-4 mr-2" />
                  عرض المتاجر
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/forms')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  إنشاء نموذج
                </CardTitle>
                <CardDescription>
                  إنشاء نماذج جديدة لمنتجاتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  نموذج جديد
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  عرض الطلبات
                </CardTitle>
                <CardDescription>
                  متابعة وإدارة الطلبات الواردة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Activity className="h-4 w-4 mr-2" />
                  عرض الطلبات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* رسالة ترحيب للمستخدمين الجدد */}
          {stats.totalStores === 0 && (
            <Card className="mt-8 border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">مرحباً بك في CODMagnet!</CardTitle>
                <CardDescription className="text-base">
                  ابدأ رحلتك معنا بربط متجر Shopify الخاص بك
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/shopify-stores')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  ربط متجر Shopify
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;