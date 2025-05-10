import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCcw, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Shopify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isLoading, 
    error, 
    syncState, 
    isConnected, 
    shopDomain,
    reload,
    disconnect 
  } = useShopifyConnection();
  
  const [isResetting, setIsResetting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check for URL parameters that indicate a Shopify connection request
  useEffect(() => {
    const checkUrlParams = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        const isCallback = urlParams.has('code') && urlParams.has('hmac');
        
        if (isCallback) {
          // This is a callback from Shopify OAuth, process it
          navigate('/shopify-callback' + location.search, { replace: true });
          return;
        }
        
        if (shopParam) {
          console.log('Shop parameter detected in URL:', shopParam);
          localStorage.setItem('shopify_last_url_shop', shopParam);
          
          // Force sync state with the new shop
          await syncState();
        }
      } catch (error) {
        console.error('Error checking URL params:', error);
        setLocalError('Error checking URL parameters');
      }
    };
    
    checkUrlParams();
  }, [location.search, syncState, navigate]);
  
  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && shopDomain && !isLoading) {
      const redirectTimer = setTimeout(() => {
        toast.success(`تم الاتصال بمتجر ${shopDomain}، جاري التوجيه إلى لوحة التحكم`);
        const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard';
        localStorage.removeItem('auth_redirect');
        navigate(redirectPath, { replace: true });
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isConnected, shopDomain, isLoading, navigate]);
  
  // Reset connection
  const handleReset = async () => {
    try {
      setIsResetting(true);
      
      // Disconnect using the provider method
      await disconnect();
      
      // Reload page to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast.error('Failed to reset connection state');
      setIsResetting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">جاري التحميل...</h2>
            <p className="text-gray-600">يرجى الانتظار بينما نجهز صفحة الاتصال</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-xl">
            <Store className="h-6 w-6 text-blue-500 ml-2" />
            اتصال متجر Shopify
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {(error || localError) && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
                <p className="text-red-700">{error || localError}</p>
              </div>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-300 hover:bg-red-100"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إعادة التعيين...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="ml-2 h-4 w-4" />
                      إعادة تعيين حالة الاتصال
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-4">
              قم بربط متجر Shopify الخاص بك لتتمكن من استخدام المنصة. أدخل عنوان المتجر في الحقل أدناه للبدء.
            </p>
          </div>
          
          <ShopifyConnection />
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')} 
            size="sm"
          >
            العودة إلى لوحة التحكم
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Shopify;
