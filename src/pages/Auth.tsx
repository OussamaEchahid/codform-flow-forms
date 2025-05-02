
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [debug, setDebug] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [attempts, setAttempts] = useState<number>(0);
  
  useEffect(() => {
    const processAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      let shop = searchParams.get('shop');
      const force = searchParams.get('force') === 'true';
      const client = searchParams.get('client') || window.location.origin;
      const state = searchParams.get('state');
      const returnUrl = searchParams.get('return') || '/dashboard';
      
      // Log diagnostic info
      const debugInfo = {
        shop,
        force,
        client,
        state,
        returnUrl,
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        origin: window.location.origin,
        authParams: Object.fromEntries(searchParams.entries()),
        referrer: document.referrer || "none",
        userAgent: navigator.userAgent,
        localStorage: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected'),
          shopify_last_connect_time: localStorage.getItem('shopify_last_connect_time'),
        },
        sessionStorage: {
          shopify_auth_state: sessionStorage.getItem('shopify_auth_state'),
        },
        attempts: attempts + 1,
      };
      
      setDebug(debugInfo);
      console.log("Auth page loaded with params:", debugInfo);
      
      // تحقق من أن لدينا معلمة متجر
      if (!shop) {
        if (localStorage.getItem('shopify_store')) {
          // استخدم المتجر المخزن إذا كان متاحًا
          shop = localStorage.getItem('shopify_store');
          console.log("Using shop from localStorage:", shop);
        } else {
          setError("لم يتم توفير معلمة متجر Shopify. يرجى العودة واتباع الخطوات الصحيحة لتثبيت التطبيق.");
          setIsProcessing(false);
          return;
        }
      }
      
      // Clean Shopify store URL if it contains a protocol
      if (shop) {
        if (shop.startsWith('http')) {
          try {
            const url = new URL(shop);
            shop = url.hostname;
            console.log("Cleaned shop URL:", shop);
          } catch (e) {
            console.error("Error cleaning shop URL:", e);
          }
        }
        
        // Ensure the address ends with myshopify.com
        if (!shop.endsWith('myshopify.com')) {
          if (!shop.includes('.')) {
            shop = `${shop}.myshopify.com`;
            console.log("Added myshopify.com suffix:", shop);
          }
        }
        
        // Save store in localStorage
        try {
          localStorage.setItem('shopify_temp_store', shop);
          localStorage.setItem('shopify_store', shop);
          console.log("Saved shop in localStorage:", shop);
        } catch (e) {
          console.error("Error saving shop:", e);
        }
        
        // Redirect to ShopifyRedirect with the cleaned parameter
        let redirectUrl;
        
        if (force) {
          // Use direct Shopify auth endpoint for forced reconnection
          redirectUrl = `/shopify-redirect?shop=${encodeURIComponent(shop)}&client=${encodeURIComponent(client)}&force=true&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
        } else {
          // Use standard Shopify authentication endpoint
          redirectUrl = `/shopify-redirect?shop=${encodeURIComponent(shop)}&client=${encodeURIComponent(client)}&return=${encodeURIComponent(returnUrl)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
        }
        
        console.log("Redirecting to:", redirectUrl);
        setAttempts(prev => prev + 1);
        
        // Add delay to prevent redirect loops
        setTimeout(() => {
          navigate(redirectUrl);
        }, 1000); 
      } else {
        // If there's no shop parameter, show error
        setError("لم يتم توفير معلمة متجر Shopify. يرجى العودة واتباع الخطوات الصحيحة لتثبيت التطبيق.");
        setIsProcessing(false);
      }
    };
    
    processAuth();
  }, [location, navigate, attempts]);
  
  // Improved with better error handling
  const handleBackToShopify = () => {
    navigate('/shopify');
  };
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleRetry = () => {
    setIsProcessing(true);
    setAttempts(prev => prev + 1);
  };
  
  // If there's an error, show error message and navigation buttons
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">خطأ في المصادقة</h1>
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full"
              onClick={handleBackToShopify}
            >
              العودة إلى صفحة الاتصال بـ Shopify
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
            >
              العودة إلى لوحة التحكم
            </Button>
            
            <Button
              variant="secondary" 
              onClick={handleRetry}
              className="w-full"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
            <p className="font-bold mb-2">معلومات التصحيح:</p>
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">جاري المصادقة...</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p className="mb-4">يرجى الانتظار بينما نقوم بمصادقة متجر Shopify الخاص بك...</p>
        <p className="text-sm text-gray-600 mb-4">سيتم إعادة توجيهك تلقائياً خلال ثوان...</p>
        
        {attempts > 1 && (
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
            >
              العودة إلى لوحة التحكم
            </Button>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
          <p className="font-bold mb-2">معلومات التصحيح:</p>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default Auth;
