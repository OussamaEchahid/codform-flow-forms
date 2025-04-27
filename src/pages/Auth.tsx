
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get URL parameters
        const url = new URL(window.location.href);
        let shop = url.searchParams.get("shop");
        const hmac = url.searchParams.get("hmac");
        const code = url.searchParams.get("code");
        const timestamp = url.searchParams.get("timestamp");

        // Store debug information
        setDebugInfo({ 
          originalShop: shop, 
          hmac, 
          code, 
          timestamp, 
          url: window.location.href,
          pathname: window.location.pathname,
          fullUrl: window.location.href 
        });
        console.log("Auth page loaded with parameters:", { 
          shop, 
          hmac, 
          code, 
          timestamp, 
          url: window.location.href,
          pathname: window.location.pathname 
        });

        // Clean up the shop parameter if it contains full protocol
        if (shop) {
          try {
            // If it starts with http:// or https://, take only the domain name
            if (shop.startsWith('http')) {
              const shopUrl = new URL(shop);
              shop = shopUrl.hostname;
              console.log("Cleaned shop parameter:", shop);
            }
            
            // Make sure the shop ends with myshopify.com
            if (!shop.endsWith('myshopify.com')) {
              if (!shop.includes('.')) {
                shop = `${shop}.myshopify.com`;
                console.log("Added myshopify.com to shop:", shop);
              }
            }
          } catch (e) {
            console.error("Error cleaning shop URL:", e);
          }
        }

        // If we don't have a shop parameter, redirect user to dashboard
        if (!shop) {
          console.error("Missing shop parameter in auth flow");
          setError("معلمة المتجر مفقودة في عملية المصادقة");
          navigate("/dashboard");
          return;
        }

        // Store temporary shop information for use if auth flow is interrupted
        localStorage.setItem('shopify_temp_store', shop);
        
        // Now make a direct request to the server-side auth endpoint
        console.log("Redirecting to server auth endpoint with shop:", shop);
        
        // Build auth URL with all query parameters
        const authParams = new URLSearchParams();
        authParams.set("shop", shop);
        if (hmac) authParams.set("hmac", hmac);
        if (code) authParams.set("code", code);
        if (timestamp) authParams.set("timestamp", timestamp);
        
        // Use window.location.replace to ensure a full page reload to the server route
        // This is crucial for Remix server-side auth handling
        const serverAuthUrl = `/auth?${authParams.toString()}`;
        console.log("Server auth URL:", window.location.origin + serverAuthUrl);
        
        // Explicitly doing a full browser navigation, not a React Router navigation
        window.location.replace(serverAuthUrl);
      } catch (err) {
        console.error("Auth error:", err);
        setError("حدث خطأ أثناء المصادقة");
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">خطأ في المصادقة</h1>
          <div className="mb-6 text-red-600">{error}</div>
          <div className="mb-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">معالجة المصادقة</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p>الرجاء الانتظار بينما نقوم بمصادقة متجر Shopify الخاص بك...</p>
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default Auth;
