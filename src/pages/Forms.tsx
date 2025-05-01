
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';

const Forms = () => {
  const { shopifyConnected, shop, isTokenVerified } = useAuth();
  const { language } = useI18n();
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Simple loading state without automatic redirects
  useEffect(() => {
    console.log('Forms page mounted with auth state:', { shopifyConnected, shop, isTokenVerified });
    
    // Just set the page as ready after a short delay
    const timeoutId = setTimeout(() => {
      setIsPageReady(true);
      console.log('Forms page ready');
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [language, shopifyConnected, shop, isTokenVerified]);

  if (!isPageReady) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  // Check if user is connected to Shopify
  if (!shopifyConnected) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
            <ShopifyConnectionStatus />
            <div className="mt-8 text-xl font-medium">
              {language === 'ar' 
                ? 'يرجى الاتصال بمتجر Shopify للوصول إلى قسم النماذج' 
                : 'Please connect to Shopify to access forms'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1">
        {/* Show Shopify connection status component if needed */}
        {!isTokenVerified && <ShopifyConnectionStatus />}
        
        {/* Always show the form builder dashboard */}
        <FormBuilderDashboard />
      </div>
    </div>
  );
};

export default Forms;
