
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const OrdersList = () => {
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

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'قائمة الطلبات' : 'Orders List'}
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p>
            {language === 'ar'
              ? 'قائمة جميع الطلبات الواردة'
              : 'List of all incoming orders'}
          </p>
          
          {/* Orders table will be implemented here */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2" colSpan={5}>{language === 'ar' ? 'لا توجد طلبات حالياً' : 'No orders available yet'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
