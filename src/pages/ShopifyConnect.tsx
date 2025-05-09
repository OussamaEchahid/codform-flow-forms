
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import ShopifySettings from '@/components/shopify/ShopifySettings'; // أضفناه هنا
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCcw, Store, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const ShopifyConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, syncState } = useShopifyConnection();
  const [isResetting, setIsResetting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check for URL parameters
  useEffect(() => {
    const checkUrlParams = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        
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
  }, [location.search, syncState]);
  
  // Reset connection
  const handleReset = async () => {
    try {
      setIsResetting(true);
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      
      // Reload page to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast.error('Failed to reset connection state');
      setIsResetting(false);
    }
  };

  const handleExternalOpen = () => {
    window.open("https://codform-flow-forms.lovable.app/shopify-connect", "_blank");
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
      <div className="w-full max-w-md px-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    إعادة تعيين حالة الاتصال
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <Store className="h-5 w-5 text-blue-500 ml-2" />
            <p className="text-blue-700 font-medium">صفحة الاتصال بمتجر Shopify</p>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            أنت الآن على صفحة الاتصال بمتجر Shopify. إذا كنت تواجه مشكلة في الاتصال، جرب إعادة تعيين حالة الاتصال أدناه.
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 hover:bg-blue-100"
              onClick={handleExternalOpen}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              فتح في نافذة جديدة
            </Button>
          </div>
        </div>
        
        {/* إضافة مكون الإعدادات هنا */}
        <ShopifySettings />
        
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
