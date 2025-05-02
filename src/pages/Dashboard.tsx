
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShopifyConnectionManager } from '@/components/shopify/ShopifyConnectionManager';
import { toast } from 'sonner';

// Sample data for the charts (replace with actual data later)
const ordersData = [
  { date: '1/4', orders: 6 },
  { date: '3/4', orders: 3 },
  { date: '5/4', orders: 4 },
  { date: '7/4', orders: 0 },
  { date: '9/4', orders: 2 },
  { date: '12/4', orders: 0 },
  { date: '15/4', orders: 6 },
  { date: '18/4', orders: 4 },
  { date: '21/4', orders: 5 },
  { date: '24/4', orders: 3 },
  { date: '27/4', orders: 3 },
  { date: '31/4', orders: 5 },
];

const revenueData = [
  { date: '1/4', revenue: 800 },
  { date: '3/4', revenue: 500 },
  { date: '5/4', revenue: 750 },
  { date: '7/4', revenue: 700 },
  { date: '9/4', revenue: 600 },
  { date: '12/4', revenue: 720 },
  { date: '15/4', revenue: 850 },
  { date: '18/4', revenue: 950 },
  { date: '21/4', revenue: 800 },
  { date: '24/4', revenue: 600 },
  { date: '27/4', revenue: 450 },
  { date: '31/4', revenue: 700 },
];

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  currency?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, currency }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-stretch">
    <div className="flex-shrink-0 bg-purple-50 h-12 w-12 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div className="ml-4 flex-grow">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">
        {currency && <span className="text-lg font-normal">{currency}</span>} {value}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, shopifyConnected, shop } = useAuth();
  const { language, t } = useI18n();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    // Small delay to ensure auth context has loaded
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle successful connection (if redirected from Shopify OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get('auth_success');
    const shopParam = params.get('shop');
    
    if (authSuccess === 'true' && shopParam) {
      toast.success(
        language === 'ar'
          ? `تم الاتصال بمتجر ${shopParam} بنجاح`
          : `Successfully connected to ${shopParam}`
      );
      
      // Clean up URL params
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [language]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
        </div>
        
        {/* Shopify Connection Alert */}
        {!isCheckingConnection && !shopifyConnected && (
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495a.75.75 0 011.03 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.44 10l-5.965-5.965a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {language === 'ar' 
                      ? 'لم يتم اكتشاف اتصال Shopify. يرجى توصيل متجرك للاستفادة من جميع الميزات.'
                      : 'No Shopify connection detected. Please connect your store to access all features.'}
                  </p>
                </div>
              </div>
            </div>
            <ShopifyConnectionManager />
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            icon={<span className="text-purple-600 text-2xl">🛍️</span>} 
            title={language === 'ar' ? 'الطلبات' : 'Orders'} 
            value={24} 
          />
          <MetricCard 
            icon={<span className="text-purple-600 text-2xl">⚡</span>}
            title={language === 'ar' ? 'AOV' : 'AOV'} 
            value={230} 
            currency="MAD" 
          />
          <MetricCard 
            icon={<span className="text-purple-600 text-2xl">💰</span>} 
            title={language === 'ar' ? 'الإيرادات' : 'Revenue'} 
            value="5,520"
            currency="MAD" 
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'الطلبات' : 'Orders'}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'الإيرادات' : 'Revenue'}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
