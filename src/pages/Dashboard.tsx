import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Target, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const sampleData = Array.from({ length: 31 }, (_, i) => ({
    date: `${i + 1}/4`,
    orders: 0,
    revenue: 0,
  }));

  if (!user) {
    return <div className="text-center py-8">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">CODFORM</h1>
            <p className="text-gray-600">The Best Performing Cash On Delivery Form in Shopify</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <ShoppingCart className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Orders</p>
                  <h3 className="text-3xl font-bold">0</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">AOV</p>
                  <h3 className="text-3xl font-bold">0 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Revenue</p>
                  <h3 className="text-3xl font-bold">0 <span className="text-sm text-gray-500">MAD</span></h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Orders</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#FF6B00" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" />
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
