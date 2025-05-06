
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';

const Forms = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();

  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Fall back to localStorage if context is not updated
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const actualAccess = hasAccess || (localStorageConnected && localStorageShop);

  if (!actualAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'الوصول مقيد' : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم النماذج' 
                : 'Please login or connect a Shopify store to access forms'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => navigate('/shopify-connect')}
                className="w-full"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {!shopifyConnected && localStorageConnected && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-700 flex justify-between items-center">
              <span>
                {language === 'ar' 
                  ? 'يرجى التحقق من اتصال Shopify الخاص بك'
                  : 'Please verify your Shopify connection'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/shopify-connect')}
                className="ml-2"
              >
                {language === 'ar' ? 'التحقق من الاتصال' : 'Verify Connection'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <FormBuilderDashboard />
    </div>
  );
};

export default Forms;
