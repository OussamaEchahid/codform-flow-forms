
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Target, DollarSign } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();

  const sampleData = Array.from({ length: 31 }, (_, i) => ({
    date: `${i + 1}/4`,
    orders: Math.floor(Math.random() * 10),
    revenue: Math.floor(Math.random() * 1000),
  }));

  if (!user) {
    return <div className="text-center py-8">
      {language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم' : 'Please login to access the dashboard'}
    </div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 pr-64 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8 text-right">
            <h1 className="text-3xl font-bold mb-2">CODFORM</h1>
            <p className="text-gray-600">The Best Performing Cash On Delivery Form in Shopify</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">Revenue</p>
                  <h3 className="text-3xl font-bold">5,520 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Target className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">AOV</p>
                  <h3 className="text-3xl font-bold">230 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <ShoppingCart className="w-6 h-6 text-[#9b87f5]" />
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">Orders</p>
                  <h3 className="text-3xl font-bold">24</h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4 text-right">Revenue</h3>
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
            
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4 text-right">Orders</h3>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
