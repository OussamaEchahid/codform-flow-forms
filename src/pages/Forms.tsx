
import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

const Forms = () => {
  const { user, shopifyConnected, shop, setShop } = useAuth();
  const { tokenError, failSafeMode, toggleFailSafeMode } = useShopify();
  const { language } = useI18n();
  const [bypassEnabled, setBypassEnabled] = useState(false);

  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;

  // Handle connection issues automatically
  useEffect(() => {
    if (tokenError) {
      console.log("Token error detected in Forms page, enabling bypass");
      setBypassEnabled(true);
      
      if (!failSafeMode) {
        toggleFailSafeMode(true);
        console.log("Enabling fail-safe mode automatically");
      }
    }
  }, [tokenError, failSafeMode, toggleFailSafeMode]);

  // Always enable bypass in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setBypassEnabled(true);
    }
  }, []);
  
  useEffect(() => {
    // Try to validate connection state on page load
    const validateConnectionState = async () => {
      try {
        const connectionValid = shopifyConnectionManager.validateConnectionState();
        console.log("Connection state validation:", connectionValid);
        
        // If connection in localStorage but not in context, try to update context
        const storedShop = localStorage.getItem('shopify_store');
        const storedConnected = localStorage.getItem('shopify_connected') === 'true';
        
        if (storedShop && storedConnected && !shop && setShop) {
          console.log("Sync missing shop from localStorage to context:", storedShop);
          setShop(storedShop);
        }
      } catch (err) {
        console.error("Error validating connection state:", err);
      }
    };
    
    validateConnectionState();
  }, [shop, setShop]);
  
  console.log("Forms page access check:", { 
    user, 
    shopifyConnected, 
    shop,
    hasAccess,
    bypassEnabled,
    localStorageConnected: localStorage.getItem('shopify_connected'),
    localStorageShop: localStorage.getItem('shopify_store'),
    bypassAuth: localStorage.getItem('bypass_auth') === 'true'
  });

  // More comprehensive access check, accepting any credible source of connection
  const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  
  // Grant access if any credible sign of connection exists
  const actualAccess = hasAccess || bypassEnabled || bypassAuth || (localStorageConnected && localStorageShop);
  
  const enableBypass = () => {
    setBypassEnabled(true);
    localStorage.setItem('bypass_auth', 'true');
    toast.success(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  // This function forces the shop to be active in both local storage and database
  const forceActivateShop = async () => {
    try {
      const storedShop = localStorage.getItem('shopify_store');
      if (!storedShop) return;
      
      console.log("Forcing shop to be active:", storedShop);
      
      // Update local connection state
      localStorage.setItem('shopify_connected', 'true');
      
      // Update connection manager
      shopifyConnectionManager.addOrUpdateStore(storedShop, true, true);
      
      // Update context if available
      if (setShop && !shop) {
        setShop(storedShop);
      }
      
      // Force refresh the page to apply changes
      window.location.reload();
    } catch (err) {
      console.error("Error forcing shop activation:", err);
    }
  };

  if (!actualAccess) {
    // Show access options with bypass capability
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' 
                ? 'الوصول مقيد' 
                : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم النماذج' 
                : 'Please login or connect a Shopify store to access forms'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => window.location.href = '/shopify'}
                className="w-full"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
              </Button>
              
              <Button
                variant="outline"
                onClick={enableBypass}
                className="w-full"
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
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
      
      {/* Connection warning for fail-safe mode */}
      {(tokenError || failSafeMode) && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-700 flex justify-between items-center">
              <span>
                {language === 'ar' 
                  ? 'هناك مشكلة في اتصال Shopify، تم تفعيل وضع الدعم الاحتياطي. يمكنك الاستمرار في إدارة النماذج.'
                  : 'There is an issue with the Shopify connection. Fail-safe mode enabled. You can continue managing forms.'}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={forceActivateShop}
                className="ml-2"
              >
                {language === 'ar' ? 'إصلاح الاتصال' : 'Fix Connection'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <FormBuilderDashboard />
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-2 right-2 p-2 bg-gray-100 text-xs rounded opacity-70 hover:opacity-100">
          <div>User: {user?.id || 'None'}</div>
          <div>Shop: {shop || localStorage.getItem('shopify_store') || 'None'}</div>
          <div>AuthContext Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
          <div>localStorage Connected: {localStorageConnected ? 'Yes' : 'No'}</div>
          <div>Bypass Enabled: {bypassEnabled || bypassAuth ? 'Yes' : 'No'}</div>
          <div>Token Error: {tokenError ? 'Yes' : 'No'}</div>
          <div>Fail-Safe Mode: {failSafeMode ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default Forms;
