
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري التوجيه...");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");
    const hmac = params.get("hmac");
    const code = params.get("code");
    const timestamp = params.get("timestamp");
    
    // Update debug info
    setDebug({ 
      shop, 
      hmac, 
      code, 
      timestamp, 
      url: window.location.href,
      fullPath: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname
    });
    console.log("ShopifyRedirect parameters:", { 
      shop, 
      hmac, 
      code, 
      timestamp, 
      url: window.location.href,
      fullPath: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname
    });
    
    // Check for shop parameter
    if (!shop) {
      // If we don't have a shop parameter, check for previously stored shop
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');
      
      console.log("Stored data:", { savedShop, savedConnected });
      
      if (savedShop && savedConnected === 'true') {
        // If we have stored shop data, redirect to dashboard directly
        console.log("Using stored shop data for redirect...");
        navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}`);
        return;
      }
      
      // If we don't have a shop parameter or stored data, show error
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
      return;
    }
    
    // Clean shop domain if necessary
    let cleanedShop = shop;
    if (shop.startsWith('http')) {
      try {
        const shopUrl = new URL(shop);
        cleanedShop = shopUrl.hostname;
        console.log("Cleaned shop URL:", cleanedShop);
      } catch (e) {
        console.error("Error cleaning shop URL:", e);
      }
    }
    
    // Make sure it ends with myshopify.com
    if (!cleanedShop.endsWith('myshopify.com') && !cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
      console.log("Added myshopify.com to shop:", cleanedShop);
    }
    
    // Update redirect status
    setStatus(`جاري توجيهك للمصادقة مع متجر ${cleanedShop}...`);
    
    // Store shop info in localStorage temporarily for use if auth flow is interrupted
    try {
      localStorage.setItem('shopify_temp_store', cleanedShop);
      console.log("Temp shop info saved:", cleanedShop);
    } catch (e) {
      console.error("Error saving temp data:", e);
    }
    
    // If we have auth parameters (hmac or code), continue auth flow
    if (hmac || code) {
      console.log("Auth parameters found, redirecting to auth path...");
      // Create new params with cleaned shop
      const newParams = new URLSearchParams();
      newParams.set("shop", cleanedShop);
      if (hmac) newParams.set("hmac", hmac);
      if (code) newParams.set("code", code);
      if (timestamp) newParams.set("timestamp", timestamp);
      
      // Redirect to auth path with absolute URL to avoid navigation issues
      const authUrl = `/auth?${newParams.toString()}`;
      console.log("Full auth URL:", window.location.origin + authUrl);
      window.location.href = authUrl;
    } else {
      console.log("Starting new auth flow for shop:", cleanedShop);
      // If we only have shop parameter, start auth from scratch
      const authUrl = `/auth?shop=${encodeURIComponent(cleanedShop)}`;
      console.log("Full auth URL:", window.location.origin + authUrl);
      window.location.href = authUrl;
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
            {/* Debug information */}
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              العودة إلى لوحة التحكم
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
            <p className="mb-4">سيتم توجيهك تلقائيًا خلال لحظات...</p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopifyRedirect;
