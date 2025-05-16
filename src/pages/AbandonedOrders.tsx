
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const AbandonedOrders = () => {
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
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم الطلبات المتروكة' 
            : 'Please login or connect a Shopify store to access abandoned orders'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'الطلبات المتروكة' : 'Abandoned Orders'}
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p>
            {language === 'ar'
              ? 'الطلبات التي تم بدؤها ولم تكتمل'
              : 'Orders that were started but not completed'}
          </p>
          
          {/* Abandoned Orders table will be implemented here */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">{language === 'ar' ? 'رقم المرجع' : 'Reference ID'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'آخر نشاط' : 'Last Activity'}</th>
                  <th className="border p-2 text-left">{language === 'ar' ? 'قيمة السلة' : 'Cart Value'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2" colSpan={4}>{language === 'ar' ? 'لا توجد طلبات متروكة حالياً' : 'No abandoned orders available yet'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedOrders;
