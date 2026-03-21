
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { ListOrdered, AlertTriangle, Layers } from 'lucide-react';

const Orders = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar' 
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم الطلبات' 
            : 'Please login or connect a Shopify store to access orders'}
        </div>
      </div>
    );
  }

  // Order categories
  const orderCategories = [
    {
      id: 'list',
      title: language === 'ar' ? 'قائمة الطلبات' : 'Orders List',
      description: language === 'ar' ? 'عرض وإدارة جميع الطلبات' : 'View and manage all orders',
      icon: ListOrdered,
      path: '/orders/list',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'abandoned',
      title: language === 'ar' ? 'الطلبات المتروكة' : 'Abandoned Orders',
      description: language === 'ar' ? 'استعادة الطلبات غير المكتملة' : 'Recover incomplete orders',
      icon: AlertTriangle,
      path: '/orders/abandoned',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      id: 'channels',
      title: language === 'ar' ? 'قنوات الطلبات' : 'Order Channels',
      description: language === 'ar' ? 'إدارة قنوات استقبال الطلبات' : 'Manage order receiving channels',
      icon: Layers,
      path: '/orders/channels',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'الطلبات' : 'Orders'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {orderCategories.map((category) => (
            <Link 
              key={category.id}
              to={category.path}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${category.color}`}>
                  <category.icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            {language === 'ar' ? 'نظرة عامة على الطلبات' : 'Orders Overview'}
          </h2>
          
          <p className="mb-4">
            {language === 'ar'
              ? 'قريبا: ستتمكن من إدارة طلبات الدفع عند الاستلام هنا'
              : 'Coming soon: Manage your Cash On Delivery orders here'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-1">{language === 'ar' ? 'الطلبات الجديدة' : 'New Orders'}</h4>
              <div className="text-2xl font-bold text-green-600">0</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-1">{language === 'ar' ? 'قيد التوصيل' : 'In Delivery'}</h4>
              <div className="text-2xl font-bold text-blue-600">0</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-1">{language === 'ar' ? 'طلبات مكتملة' : 'Completed'}</h4>
              <div className="text-2xl font-bold text-purple-600">0</div>
            </div>
          </div>
        </div>
        
        {/* Debug Info */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-gray-100 text-xs rounded">
            <div>User ID: {user?.id || 'Not logged in'}</div>
            <div>Shop: {actualShop || 'No shop connected'}</div>
            <div>AuthContext Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
            <div>localStorage Connected: {localStorageConnected ? 'Yes' : 'No'}</div>
            <div>Has Access: {actualHasAccess ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
