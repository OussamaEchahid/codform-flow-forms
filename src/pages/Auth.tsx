
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
        const state = url.searchParams.get("state");
        const host = url.searchParams.get("host");

        // Store debug information
        setDebugInfo({ 
          originalShop: shop, 
          hmac, 
          code, 
          timestamp,
          state,
          host,
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          origin: window.location.origin,
          fullUrl: window.location.href,
          fullPath: window.location.href,
          referrer: document.referrer || "none"
        });
        
        console.log("Auth page loaded with parameters:", { 
          shop, 
          hmac, 
          code, 
          timestamp, 
          state,
          host,
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          referrer: document.referrer || "none"
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

        // If we don't have a shop parameter, try to extract from pathname
        if (!shop && window.location.pathname.includes('/auth/')) {
          const pathParts = window.location.pathname.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'auth' && i+1 < pathParts.length) {
              const possibleShop = pathParts[i+1];
              if (possibleShop && possibleShop.includes('.')) {
                shop = possibleShop;
                console.log("Extracted shop from path:", shop);
                break;
              }
            }
          }
        }

        // If we still don't have a shop parameter, check if we have it in localStorage
        if (!shop) {
          const tempShop = localStorage.getItem('shopify_temp_store');
          if (tempShop) {
            shop = tempShop;
            console.log("Retrieved shop from localStorage:", shop);
          }
        }

        // If we still don't have a shop parameter, redirect user to dashboard
        if (!shop) {
          console.error("Missing shop parameter in auth flow");
          setError("معلمة المتجر مفقودة في عملية المصادقة");
          setIsLoading(false);
          return;
        }

        // Store temporary shop information for use if auth flow is interrupted
        localStorage.setItem('shopify_temp_store', shop);
        
        // Now construct the direct Shopify OAuth URL instead of using our server
        // This is to bypass any potential issues with our server auth endpoint
        let shopifyAuthUrl;
        
        if (code && hmac) {
          // We're in the second step of OAuth, redirect directly to server auth endpoint
          console.log("OAuth callback detected, redirecting to server auth endpoint");
          const authParams = new URLSearchParams();
          authParams.set("shop", shop);
          if (hmac) authParams.set("hmac", hmac);
          if (code) authParams.set("code", code);
          if (timestamp) authParams.set("timestamp", timestamp);
          if (state) authParams.set("state", state);
          if (host) authParams.set("host", host);
          
          // Use absolute URL to ensure proper handling
          const serverAuthUrl = `${window.location.origin}/auth?${authParams.toString()}`;
          console.log("Redirecting to server auth URL:", serverAuthUrl);
          window.location.href = serverAuthUrl;
        } else {
          // We're in the first step of OAuth, direct to server auth endpoint
          console.log("Starting OAuth flow for shop:", shop);
          const authParams = new URLSearchParams();
          authParams.set("shop", shop);
          
          // Use absolute URL to ensure proper handling
          const serverAuthUrl = `${window.location.origin}/auth?${authParams.toString()}`;
          console.log("Redirecting to server auth URL:", serverAuthUrl);
          window.location.href = serverAuthUrl;
        }
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
