
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const OrdersChannels = () => {
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
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قنوات الطلبات' 
            : 'Please login or connect a Shopify store to access order channels'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'قنوات الطلبات' : 'Order Channels'}
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p>
            {language === 'ar'
              ? 'إدارة قنوات استقبال الطلبات'
              : 'Manage order receiving channels'}
          </p>
          
          {/* Channels management UI will be implemented here */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</h3>
              <p className="text-gray-500 text-sm mt-2">{language === 'ar' ? 'الطلبات المستلمة من خلال الموقع الإلكتروني' : 'Orders received through website'}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-green-500">{language === 'ar' ? 'نشط' : 'Active'}</span>
                <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                  {language === 'ar' ? 'إعدادات' : 'Settings'}
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</h3>
              <p className="text-gray-500 text-sm mt-2">{language === 'ar' ? 'الطلبات المستلمة من خلال الواتساب' : 'Orders received through WhatsApp'}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-green-500">{language === 'ar' ? 'نشط' : 'Active'}</span>
                <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">
                  {language === 'ar' ? 'إعدادات' : 'Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersChannels;
