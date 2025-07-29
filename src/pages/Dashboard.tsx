import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Target, DollarSign, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { supabase } from '@/integrations/supabase/client';
import NoStoreConnected from '@/components/dashboard/NoStoreConnected';

const Dashboard = () => {
  const navigate = useNavigate();
  const { shopifyConnected, user } = useAuth();
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [authenticationChecked, setAuthenticationChecked] = useState(false);
  const [userHasStores, setUserHasStores] = useState<boolean | null>(null);
  
  // استخدام النظام المبسط
  const { activeStore, isConnected, switchToStore } = useSimpleShopify();
  
  // التحقق من المصادقة مطلوب للوصول إلى Dashboard
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔐 Checking Dashboard authentication...');
      
      // التحقق من المصادقة أولاً
      if (!user) {
        console.log('❌ No authenticated user - redirecting to auth');
        navigate('/auth');
        return;
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // التحقق من وجود متجر Shopify متصل
      const shopFromStorage = localStorage.getItem('shopify_store');
      const isConnectedFromStorage = localStorage.getItem('shopify_connected') === 'true';
      
      if (shopFromStorage && isConnectedFromStorage) {
        console.log('✅ Shopify store connected:', shopFromStorage);
        setUserHasStores(true);
      } else {
        console.log('⚠️ No active Shopify store found');
        setUserHasStores(false);
      }
      
      setAuthenticationChecked(true);
    };

    checkAuthentication();
  }, [user, navigate]);
  
  useEffect(() => {
    // التحقق من معلمات URL للتوجيه من شوبيفاي
    const connectedParam = searchParams.get("connected");
    const shopParam = searchParams.get("shop");
    
    if (connectedParam === "true" && shopParam) {
      console.log('🎉 New connection detected:', shopParam);
      
      // استخدام النظام المبسط
      const success = switchToStore(shopParam);
      
      if (success) {
        const message = language === 'ar' 
          ? `🎉 تم ربط متجرك بنجاح! أهلاً بك في CODmagnet` 
          : `🎉 Store connected successfully! Welcome to CODmagnet`;
        
        toast.success(message, {
          duration: 5000,
          position: 'top-center'
        });

        // إزالة معلمات URL من العنوان
        if (window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
        
        // تعيين علامة الزيارة الأولى
        const firstVisitKey = `first_visit_${shopParam}`;
        if (!localStorage.getItem(firstVisitKey)) {
          setIsFirstVisit(true);
          localStorage.setItem(firstVisitKey, 'false');
        }
      }
      
      return;
    }
  }, [searchParams, language, switchToStore]);

  // إنشاء بيانات فارغة للرسوم البيانية
  const sampleData = Array.from({
    length: 31
  }, (_, i) => ({
    date: `${i + 1}/4`,
    orders: 0,
    revenue: 0
  }));

  // التوجيه إلى صفحة Shopify
  const handleConnectShopify = () => {
    navigate('/shopify');
  };
  
  // Don't render dashboard until authentication is verified
  if (!authenticationChecked) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من المصادقة...</p>
        </div>
      </div>
    );
  }
  
  // Show no store connected page if user has no stores
  if (userHasStores === false) {
    return <NoStoreConnected />;
  }
  
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">CODMAGNET</h1>
            <p className="text-gray-600">The Best Performing Cash On Delivery Form in Shopify</p>
            {activeStore && <p className="text-sm text-purple-600 mt-1">
                {language === 'ar' ? `متصل بمتجر: ${activeStore}` : `Connected to store: ${activeStore}`}
              </p>}
          </div>

          {isFirstVisit && <Card className="p-6 mb-8 border-purple-300 border-2 bg-purple-50">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">مرحباً بك في CODFORM! 🎉</h3>
                  <p className="mb-4">لقد تم اتصال متجر Shopify الخاص بك بنجاح. الآن يمكنك البدء في إنشاء نماذج الدفع عند الاستلام.</p>
                  <Button onClick={() => navigate('/forms')} className="bg-purple-600">
                    ابدأ بإنشاء نموذج جديد
                  </Button>
                </div>
              </div>
            </Card>}

          {!isConnected && <Card className="p-6 mb-8 border-yellow-300 border-2 bg-yellow-50">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">اتصل بـ Shopify</h3>
                  <p className="mb-4">لم يتم اكتشاف اتصال بـ Shopify. يرجى توصيل متجرك للاستفادة من جميع الميزات.</p>
                  <Button onClick={handleConnectShopify} className="bg-yellow-600">
                    اتصل بـ Shopify الآن
                  </Button>
                </div>
              </div>
            </Card>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <ShoppingCart className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Orders</p>
                  <h3 className="text-3xl font-bold">0</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Target className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">AOV</p>
                  <h3 className="text-3xl font-bold">0 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Revenue</p>
                  <h3 className="text-3xl font-bold">0 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Orders</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#9b87f5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Revenue</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#9b87f5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
