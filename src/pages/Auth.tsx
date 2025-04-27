
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get URL parameters
        const url = new URL(window.location.href);
        const shop = url.searchParams.get("shop");
        const hmac = url.searchParams.get("hmac");
        const code = url.searchParams.get("code");
        const timestamp = url.searchParams.get("timestamp");

        console.log("Auth page parameters:", { shop, hmac, code, timestamp });

        // If we don't have a shop parameter, we redirect to the dashboard
        if (!shop) {
          console.error("Missing shop parameter in auth flow");
          setError("Missing shop parameter in auth flow");
          navigate("/dashboard");
          return;
        }

        // Store temp shop info in case we need it later
        localStorage.setItem('shopify_temp_store', shop);
        
        // We now need to make a server-side request to complete the authentication
        // The server will redirect back to the dashboard with the authenticated session
        // Since we're using Shopify App Bridge in a browser environment, 
        // we'll do a full page redirect to the auth endpoint
        
        // Construct the auth URL with all query parameters
        const authParams = new URLSearchParams(window.location.search);
        window.location.href = `/auth?${authParams.toString()}`;
        
      } catch (err) {
        console.error("Auth error:", err);
        setError("Authentication error occurred");
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <div className="mb-6 text-red-600">{error}</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p>Please wait while we authenticate your Shopify store...</p>
      </div>
    </div>
  );
};

export default Auth;
