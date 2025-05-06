
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Forms = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasShopifyConnected, setHasShopifyConnected] = useState(false);
  const [forms, setForms] = useState([]);
  const [currentShop, setCurrentShop] = useState<string | null>(null);

  // Determine access based on various conditions
  const hasAccess = !!user || shopifyConnected || hasShopifyConnected;

  // Check Shopify connection and load forms
  useEffect(() => {
    const checkShopifyConnection = async () => {
      setIsLoading(true);
      try {
        // Try to get shop from localStorage first as fallback
        const shopFromLocalStorage = localStorage.getItem('shopify_store');
        const isConnectedFromLocalStorage = localStorage.getItem('shopify_connected') === 'true';
        
        // Set initial connection state
        setHasShopifyConnected(shopifyConnected || isConnectedFromLocalStorage);
        
        // Use shop from context or localStorage
        const activeShop = shop || shopFromLocalStorage;
        setCurrentShop(activeShop);
        
        if (activeShop) {
          console.log("Active shop found:", activeShop);
          
          // Try to fetch forms for this shop
          const { data: formsData, error: formsError } = await supabase
            .from('forms')
            .select('*')
            .eq('shop_id', activeShop)
            .order('created_at', { ascending: false });
          
          if (formsError) {
            console.error("Error fetching forms:", formsError);
            toast.error(language === 'ar' 
              ? 'خطأ في جلب النماذج' 
              : 'Error fetching forms');
          } else if (formsData) {
            console.log(`Found ${formsData.length} forms for shop ${activeShop}`);
            setForms(formsData);
            
            // If we found forms, we definitely have a connection
            if (formsData.length > 0) {
              setHasShopifyConnected(true);
              localStorage.setItem('shopify_connected', 'true');
            }
          }
        } else {
          console.log("No active shop found");
        }
      } catch (error) {
        console.error("Error in checkShopifyConnection:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkShopifyConnection();
  }, [shop, shopifyConnected]);

  // Handle bypass access for development or testing
  const enableBypass = () => {
    localStorage.setItem('bypass_auth', 'true');
    setHasShopifyConnected(true);
    toast.success(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  // Render loading state while checking connection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </span>
      </div>
    );
  }

  // Render access restriction if not connected
  if (!hasAccess) {
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

  // Show the forms dashboard
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Connection warning banner */}
      {!shopifyConnected && hasShopifyConnected && (
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
      
      <div className="flex-1">
        <FormBuilderDashboard key={`dashboard-${currentShop}`} initialForms={forms} forceRefresh={true} />
      </div>
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 right-2 p-2 bg-gray-100 text-xs rounded opacity-70 hover:opacity-100">
          <div>User: {user?.id || 'None'}</div>
          <div>Shop: {currentShop || 'None'}</div>
          <div>Auth Context Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
          <div>Local Storage Connected: {localStorage.getItem('shopify_connected') === 'true' ? 'Yes' : 'No'}</div>
          <div>Forms Count: {forms.length}</div>
        </div>
      )}
    </div>
  );
};

export default Forms;
