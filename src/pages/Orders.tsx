
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const Orders = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;

  if (!hasAccess) {
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
          {language === 'ar' ? 'الطلبات' : 'Orders'}
        </h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p>
            {language === 'ar'
              ? 'قريبا: ستتمكن من إدارة طلبات الدفع عند الاستلام هنا'
              : 'Coming soon: Manage your Cash On Delivery orders here'}
          </p>
        </div>
        
        {/* Debug Info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-2 bg-gray-100 text-xs rounded">
            <div>User ID: {user?.id || 'Not logged in'}</div>
            <div>Shop: {shop || 'No shop connected'}</div>
            <div>Shopify Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
            <div>Has Access: {hasAccess ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
