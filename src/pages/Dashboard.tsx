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
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    shopifyConnected,
    shop
  } = useAuth();
  const {
    t,
    language
  } = useI18n();
  const [searchParams] = useSearchParams();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  useEffect(() => {
    // التحقق من localStorage للاتصال الناجح
    const connectionSuccess = localStorage.getItem('shopify_connection_success');
    
    if (connectionSuccess === 'true') {
      const connectedShop = localStorage.getItem('shopify_store');
      if (connectedShop) {
        const message = language === 'ar' 
          ? `🎉 تم ربط متجرك بنجاح! أهلاً بك في CODmagnet` 
          : `🎉 Store connected successfully! Welcome to CODmagnet`;
        
        toast.success(message, {
          duration: 5000,
          position: 'top-center'
        });
        
        // إزالة العلامة حتى لا تظهر مرة أخرى
        localStorage.removeItem('shopify_connection_success');
        
        // تعيين علامة الزيارة الأولى
        const firstVisitKey = `first_visit_${connectedShop}`;
        if (!localStorage.getItem(firstVisitKey)) {
          setIsFirstVisit(true);
          localStorage.setItem(firstVisitKey, 'false');
        }
      }
    }
    
    // التحقق من معلمات URL للتوجيه من شوبيفاي (الكود القديم للتوافق)
    const shopifyConnectedParam = searchParams.get("shopify_connected");
    const shopParam = searchParams.get("shop");
    
    if (shopifyConnectedParam === "true" && shopParam) {
      // حفظ المتجر في localStorage للتأكد من الاتساق
      localStorage.setItem('shopify_store', shopParam);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_active_store', shopParam);
      
      // تحديث معلومات المتجر في connection manager أيضاً
      import('@/lib/shopify/connection-manager').then(({ shopifyConnectionManager }) => {
        shopifyConnectionManager.addOrUpdateStore(shopParam, true, true);
      });

      // إزالة معلمات URL من العنوان
      if (window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [searchParams, language]);

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
  return <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">CODMAGNET</h1>
            <p className="text-gray-600">The Best Performing Cash On Delivery Form in Shopify</p>
            {shop && <p className="text-sm text-purple-600 mt-1">
                {language === 'ar' ? `متصل بمتجر: ${shop}` : `Connected to store: ${shop}`}
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

          {!shopifyConnected && <Card className="p-6 mb-8 border-yellow-300 border-2 bg-yellow-50">
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
    </div>;
};
export default Dashboard;