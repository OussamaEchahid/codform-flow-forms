
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const ShopifyRedirect = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { forceSetConnected, syncState } = useShopifyConnection();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsProcessing(true);
        
        // Parse query parameters
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        
        console.log('Redirect parameters:', { shop: shopParam });
        
        if (!shopParam) {
          throw new Error('Shop parameter is missing from URL');
        }
        
        setShop(shopParam);
        
        // Force connection to use this shop
        forceSetConnected(shopParam);
        
        // Sync the connection state
        await syncState();
        
        // Update state
        setSuccess(true);
        
        // Redirect user to dashboard after successful connection
        setTimeout(() => {
          const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard';
          localStorage.removeItem('auth_redirect');
          navigate(redirectPath, { replace: true });
        }, 1500);
      } catch (error) {
        console.error('Error in redirect handler:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setSuccess(false);
        toast.error('Failed to complete Shopify connection');
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [location, navigate, forceSetConnected, syncState]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isProcessing ? 'جاري معالجة الاتصال' : 
             success ? 'تم الاتصال بنجاح' : 
             'خطأ في الاتصال'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p>يرجى الانتظار بينما نقوم بمعالجة اتصال Shopify...</p>
                {shop && <p className="text-sm text-gray-500">المتجر: {shop}</p>}
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p>تم الاتصال بنجاح بمتجر {shop}</p>
                <p className="text-sm text-gray-500">سيتم توجيهك إلى لوحة التحكم خلال لحظات...</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-red-600 font-medium">حدث خطأ أثناء محاولة الاتصال:</p>
                <p className="text-sm text-gray-700">{error}</p>
              </>
            )}
          </div>
        </CardContent>
        {!isProcessing && !success && (
          <CardFooter className="justify-center">
            <Button onClick={() => navigate('/shopify')}>
              إعادة المحاولة
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ShopifyRedirect;
