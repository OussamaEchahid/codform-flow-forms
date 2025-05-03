
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';

const Forms = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();

  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;

  console.log("Forms page access check:", { 
    user, 
    shopifyConnected, 
    shop,
    hasAccess,
    localStorageConnected: localStorage.getItem('shopify_connected'),
    localStorageShop: localStorage.getItem('shopify_store')
  });

  if (!hasAccess) {
    // Double-check local storage as a fallback
    const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
    const localStorageShop = localStorage.getItem('shopify_store');
    
    // If localStorage indicates a connection but context doesn't, override
    if (localStorageConnected && localStorageShop) {
      console.log("Using localStorage fallback for authentication");
      return <FormBuilderDashboard />;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar' 
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم النماذج' 
            : 'Please login or connect a Shopify store to access forms'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <FormBuilderDashboard />
    </div>
  );
};

export default Forms;
