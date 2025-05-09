
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Target, DollarSign, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const navigate = useNavigate();
  const { shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  useEffect(() => {
    const shopifyConnectedParam = searchParams.get("shopify_connected");
    const shopParam = searchParams.get("shop");
    const authSuccess = searchParams.get("auth_success");
    
    console.log("Dashboard params:", { shopifyConnectedParam, shopParam, authSuccess });
    
    if (shopifyConnectedParam === "true" && shopParam) {
      const message = language === 'ar'
        ? `تم الاتصال بمتجر ${shopParam} بنجاح`
        : `Successfully connected to store ${shopParam}`;
        
      toast.success(message);
      
      if (window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
      
      const firstVisitKey = `first_visit_${shopParam}`;
      if (!localStorage.getItem(firstVisitKey)) {
        setIsFirstVisit(true);
        localStorage.setItem(firstVisitKey, 'false');
      }
    }
  }, [searchParams, language]);

  // بيانات عشوائية للرسوم البيانية
  const sampleData = Array.from({ length: 31 }, (_, i) => ({
    date: `${i + 1}/4`,
    orders: Math.floor(Math.random() * 10),
    revenue: Math.floor(Math.random() * 1000),
  }));

  const handleConnectShopify = () => {
    navigate('/shopify');
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold mb-2">CODFORM</h1>
        <p className="text-gray-600">The Best Performing Cash On Delivery Form in Shopify</p>
        {shop && (
          <p className="text-sm text-purple-600 mt-1">
            {language === 'ar' ? `متصل بمتجر: ${shop}` : `Connected to store: ${shop}`}
          </p>
        )}
      </div>

      {isFirstVisit && (
        <Card className="p-6 mb-8 border-purple-300 border-2 bg-purple-50">
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
        </Card>
      )}

      {!shopifyConnected && (
        <Card className="p-6 mb-8 border-yellow-300 border-2 bg-yellow-50">
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
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <ShoppingCart className="w-6 h-6 text-[#9b87f5]" />
            </div>
            <div>
              <p className="text-gray-600 mb-1">Orders</p>
              <h3 className="text-3xl font-bold">24</h3>
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
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">230</span>
                <span className="text-sm text-gray-500 ml-1">MAD</span>
              </div>
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
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">5,520</span>
                <span className="text-sm text-gray-500 ml-1">MAD</span>
              </div>
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
  );
};

export default Dashboard;
