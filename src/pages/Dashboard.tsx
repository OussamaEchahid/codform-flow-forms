import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { UsageQuotaCard } from '@/components/dashboard/UsageQuotaCard';
import { useOrderStats } from '@/hooks/useOrderStats';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StoreInfoCard from '@/components/ui/StoreInfoCard';
import {
  Store as StoreIcon,
  FileText,
  ShoppingCart,
  Plus,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { getShopSubscription } from "@/lib/supabase-with-email";

interface DashboardStats {
  totalForms: number;
  totalOrders: number;
  totalStores: number;
  activeStore: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, shops, shop, shopifyConnected, isShopifyAuthenticated } = useAuth();
  const { language, t } = useI18n();
  const { stats: orderStats, loading: statsLoading } = useOrderStats();
  
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
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    // لا نحمّل بيانات لوحة التحكم إلا عند وجود اتصال Shopify فعّال
    if (isShopifyAuthenticated) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [isShopifyAuthenticated]);

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
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      // جلب بيانات الاشتراك للمتجر النشط
      try {
        const { data: subscriptionData } = await getShopSubscription(activeStore);
        console.log('💳 Dashboard - Subscription from getShopSubscription:', subscriptionData);
        setSubscription(subscriptionData);
        console.log('💳 Dashboard - Subscription data loaded:', subscriptionData);
      } catch (subscriptionError) {
        console.error('❌ Dashboard - Error loading subscription:', subscriptionError);
      }

      // التحقق من البريد الإلكتروني وجلبه إذا لم يكن موجوداً
      let userEmail = localStorage.getItem('shopify_user_email');
      console.log('📧 Dashboard - Current email in localStorage:', userEmail);
      console.log('📧 Dashboard - Current name in localStorage:', localStorage.getItem('shopify_user_name'));
      
      // إعادة تحميل بيانات المستخدم دائماً لضمان الحصول على البريد الإلكتروني
      if (activeStore) {
        console.log('🔄 Dashboard - Fetching email for store:', activeStore);
        try {
          const emailResponse = await supabase.functions.invoke('update-shop-email', {
            body: { shop: activeStore }
          });

          console.log('📧 Dashboard - Email fetch response:', emailResponse);

          if (emailResponse.data?.success) {
            userEmail = emailResponse.data.email;
            const userName = emailResponse.data.name;
            
            console.log('📧 Dashboard - Response data:', emailResponse.data);
            console.log('📧 Dashboard - Email from response:', userEmail);
            console.log('📧 Dashboard - Name from response:', userName);
            
            if (userEmail && userEmail !== 'مغربي• VIP') {
              // تحقق إذا كان البريد الإلكتروني صحيح أم لا
              const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
              if (emailRegex.test(userEmail)) {
                localStorage.setItem('shopify_user_email', userEmail);
                console.log('✅ Dashboard - Valid email saved to localStorage:', userEmail);
              } else {
                console.log('⚠️ Dashboard - Invalid email format, not saving:', userEmail);
                userEmail = null; // Reset to null so it shows fallback
              }
            } else {
              console.log('⚠️ Dashboard - Email is name or empty, not saving:', userEmail);
              userEmail = null; // Reset to null so it shows fallback
            }
            
            if (userName) {
              localStorage.setItem('shopify_user_name', userName);
              console.log('✅ Dashboard - Name saved to localStorage:', userName);
            }
          } else {
            console.error('❌ Dashboard - Email fetch failed:', emailResponse);
          }
        } catch (emailError) {
          console.error('❌ Dashboard - Error fetching email:', emailError);
        }
      }
      
      let formsCount = 0;
      let ordersCount = 0;
      
      // استخدام النظام الجديد لجلب البيانات بناءً على البريد الإلكتروني
      const currentUserEmail = localStorage.getItem('shopify_user_email') || `owner@${activeStore}`;
      console.log(`📊 Dashboard - Loading data for email: ${currentUserEmail} and store: ${activeStore}`);
      
      // جلب عدد النماذج للمتجر النشط
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id')
        .eq('shop_id', activeStore)
        .limit(200);
      
      if (!formsError && formsData) {
        formsCount = formsData.length;
        console.log('📋 Dashboard - Forms found:', formsCount);
      } else {
        console.error('❌ Dashboard - Error fetching forms:', formsError);
      }

      // جلب عدد الطلبات الفعلية من جدول orders بدلاً من form_submissions  
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('shop_id', activeStore)
        .limit(1000);
      
      if (!ordersError && ordersData) {
        ordersCount = ordersData.length;
        console.log('🛒 Dashboard - Orders found:', ordersCount);
      } else {
        console.error('❌ Dashboard - Error fetching orders:', ordersError);
      }
      
      // تحديث الإحصائيات
      setStats({
        totalStores: 1, // دائماً 1 للمتجر النشط
        totalForms: formsCount,
        totalOrders: ordersCount,
        activeStore: activeStore
      });

      console.log('✅ Dashboard - Stats updated with email-based system:', {
        userEmail,
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
          <p className="text-muted-foreground">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {t('welcomeToDashboard')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('manageYourStores')}
            </p>
          </div>

          {/* معلومات المتجر الأنيقة */}
          {(() => {
            const activeStore = UnifiedStoreManager.getActiveStore();
            const userEmail = localStorage.getItem('shopify_user_email');

            // التأكد من أن المتجر النشط صحيح وليس "en" أو "ar"
            const isValidStore = activeStore &&
                               activeStore !== 'en' &&
                               activeStore !== 'ar' &&
                               activeStore.includes('.myshopify.com');

            if (isShopifyAuthenticated && isValidStore) {
              return (
                <StoreInfoCard
                  storeName={activeStore}
                  storeUrl={activeStore}
                  userEmail={userEmail || undefined}
                  planType={subscription?.plan_type || 'free'}
                  planStatus="active"
                  isConnected={true}
                  className="mb-8"
                />
              );
            }
            return null;
          })()}

          {/* رسالة عدم الاتصال فقط */}
          {(() => {
            const storeFromManager = UnifiedStoreManager.getActiveStore();
            const connectedStore = shop || storeFromManager;

            // التأكد من أن المتجر المتصل ليس "en" أو أي قيمة غير صحيحة
            const isValidStore = connectedStore &&
                               connectedStore !== 'en' &&
                               connectedStore !== 'ar' &&
                               connectedStore.includes('.myshopify.com');

            // إظهار رسالة عدم الاتصال فقط عندما لا يوجد اتصال صحيح
            if (!isShopifyAuthenticated || !isValidStore) {
              // إظهار رسالة عدم الاتصال عندما لا يوجد اتصال Shopify
              return (
                <div className="mb-6">
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>❌ {t('noActiveStore')}.</strong> {t('pleaseConnectShopify')}.
                        </div>
                          <Button 
                            size="sm" 
                            onClick={() => navigate('/my-stores')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {t('linkStore')}
                          </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              );
            }
            
            // لا تظهر أي شيء إذا لم يكن هناك مستخدم مصادق عليه
            return null;
          })()}

          {/* إحصائيات الاستخدام الحالي */}
          {isShopifyAuthenticated && stats.activeStore && (
            <div className="mb-8">
              {!statsLoading && orderStats ? (
                <UsageQuotaCard 
                  ordersUsed={orderStats.ordersUsed}
                  ordersLimit={orderStats.ordersLimit}
                  abandonedUsed={orderStats.abandonedUsed}
                  abandonedLimit={orderStats.abandonedLimit}
                  planType={orderStats.planType}
                  onUpgrade={() => navigate('/settings/plans')}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {t('loadingUsageStats')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          

          {/* إحصائيات سريعة - تحديث فوري */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalStores')}</CardTitle>
                <StoreIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const storeFromManager = UnifiedStoreManager.getActiveStore();
                    const connectedStore = shop || storeFromManager;
                    // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
                    const isValidStore = connectedStore && 
                                       connectedStore !== 'en' && 
                                       connectedStore !== 'ar' && 
                                       connectedStore.includes('.myshopify.com');
                    return isValidStore ? 1 : 0;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const storeFromManager = UnifiedStoreManager.getActiveStore();
                    const connectedStore = shop || storeFromManager;
                    // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
                    const isValidStore = connectedStore && 
                                       connectedStore !== 'en' && 
                                       connectedStore !== 'ar' && 
                                       connectedStore.includes('.myshopify.com');
                    return isValidStore ? `${t('connectedTo')} ${connectedStore}` : t('noStoresConnected');
                  })()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalForms')}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalForms}</div>
                <p className="text-xs text-muted-foreground">
                  {t('formsCreated')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {t('ordersReceived')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('conversionRate')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalForms > 0 ? Math.round((stats.totalOrders / stats.totalForms) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('formConversionRate')}
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
                  {t('manageStores')}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'ربط وإدارة متاجر Shopify الخاصة بك' : 'Connect and manage your Shopify stores'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <StoreIcon className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض المتاجر' : 'View Stores'}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/forms')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  {language === 'ar' ? 'إنشاء نموذج' : 'Create Form'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'إنشاء نماذج جديدة لمنتجاتك' : 'Create new forms for your products'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newForm')}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  {language === 'ar' ? 'عرض الطلبات' : 'View Orders'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'متابعة وإدارة الطلبات الواردة' : 'Track and manage incoming orders'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Activity className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض الطلبات' : 'View Orders'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* رسالة ترحيب للمستخدمين الجدد */}
          {stats.totalStores === 0 && (
            <Card className="mt-8 border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{language === 'ar' ? 'مرحباً بك في CODMagnet!' : 'Welcome to CODMagnet!'}</CardTitle>
                <CardDescription className="text-base">
                  {language === 'ar' ? 'ابدأ رحلتك معنا بربط متجر Shopify الخاص بك' : 'Start your journey with us by connecting your Shopify store'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/shopify-stores')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {language === 'ar' ? 'ربط متجر Shopify' : 'Connect Shopify Store'}
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