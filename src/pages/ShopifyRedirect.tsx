
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ShopifyRedirect = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsProcessing(true);
        
        // Parse query parameters
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const timestamp = params.get('timestamp');
        const state = params.get('state');
        
        console.log('Redirect parameters:', { shop: shopParam, code, hmac, timestamp, state });
        
        if (!shopParam) {
          throw new Error('معلمة المتجر غير موجودة في URL');
        }
        
        // Save shop parameter for recovery if needed
        shopifyConnectionManager.saveLastUrlShop(shopParam);
        setShop(shopParam);
        
        // If we have a code, we're in an OAuth callback
        if (code && hmac) {
          console.log('Processing OAuth callback');
          
          // We need to call our backend to exchange the code for an access token
          const callbackUrl = `/api/shopify-callback?shop=${encodeURIComponent(shopParam)}&code=${encodeURIComponent(code)}&hmac=${encodeURIComponent(hmac)}&timestamp=${encodeURIComponent(timestamp || '')}&state=${encodeURIComponent(state || '')}`;
          
          console.log('Redirecting to callback handler:', callbackUrl);
          
          // Redirect to our callback handler
          navigate('/shopify-callback' + location.search, { replace: true });
          return;
        }
        
        // If we don't have a code, we should redirect to the Shopify page to start the flow
        console.log('No OAuth code present, redirecting to connection page');
        
        // Redirect to the Shopify connect page with the shop parameter
        navigate(`/shopify?shop=${encodeURIComponent(shopParam)}`, { replace: true });
      } catch (error) {
        console.error('Error in redirect handler:', error);
        setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
        setSuccess(false);
        toast.error('فشل في معالجة إعادة التوجيه');
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [location, navigate]);

  const handleRetry = () => {
    // Get the shop from the URL or from localStorage
    const params = new URLSearchParams(location.search);
    const shopParam = params.get('shop') || shopifyConnectionManager.getLastUrlShop() || '';
    
    // Redirect to Shopify connection page
    navigate(`/shopify?shop=${encodeURIComponent(shopParam)}`, { replace: true });
  };

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
            <Button onClick={handleRetry}>
              إعادة المحاولة
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ShopifyRedirect;
