import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';
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
  const { user, shops, shop, shopifyConnected } = useAuth();
  const { language } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    totalOrders: 0,
    totalStores: 0,
    activeStore: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    console.log('🔄 بدء تحميل بيانات لوحة التحكم للمستخدم:', user?.id);
    console.log('📋 المتاجر من AuthProvider:', shops);
    console.log('🎯 المتجر النشط من AuthProvider:', shop);
    console.log('✅ حالة الاتصال بـ Shopify:', shopifyConnected);
    
    if (!user?.id) {
      console.log('❌ لا يوجد معرف مستخدم');
      return;
    }
    
    let formsCount = 0;
    let ordersCount = 0;
    
    try {
      // جلب عدد النماذج
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id')
        .eq('user_id', user.id);
      
      console.log('📝 نتائج النماذج:', { formsData, formsError });
      
      if (!formsError && formsData) {
        formsCount = formsData.length;
      }
      
      // جلب عدد الطلبات من form_submissions
      const { data: ordersData, error: ordersError } = await supabase
        .from('form_submissions')
        .select('id')
        .eq('user_id', user.id);
      
      console.log('📋 نتائج الطلبات:', { ordersData, ordersError });
      
      if (!ordersError && ordersData) {
        ordersCount = ordersData.length;
      }
      
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
    }
    
    const storesCount = shops?.length || 0;
    
    // تحديث الإحصائيات
    setStats({
      totalStores: storesCount,
      totalForms: formsCount,
      totalOrders: ordersCount,
      activeStore: shop
    });
    
    console.log('✅ إحصائيات لوحة التحكم النهائية:', {
      stores: storesCount,
      forms: formsCount,
      orders: ordersCount,
      activeStore: shop,
      shopifyConnected
    });
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
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              مرحباً بك في لوحة التحكم
            </h1>
            <p className="text-muted-foreground">
              إدارة متاجرك ونماذجك وطلباتك من مكان واحد
            </p>
          </div>

          {/* حالة الاتصال بالمتجر */}
          <div className="mb-6">
            {stats.activeStore ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>متصل بالمتجر:</strong> {stats.activeStore}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 flex items-center justify-between">
                  <span>
                    <strong>لا يوجد متجر نشط.</strong> يرجى ربط متجر Shopify أولاً.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    إدارة المتاجر
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المتاجر</CardTitle>
                <StoreIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStores}</div>
                <p className="text-xs text-muted-foreground">
                  متاجر Shopify مرتبطة
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