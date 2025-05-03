
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Processing authentication request...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shop = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        
        console.log("Shopify callback received with params:", { 
          shop, 
          code: code ? 'present' : 'missing', 
          hmac: hmac ? 'present' : 'missing',
          state
        });
        
        // Save debug info for troubleshooting
        const debugData = {
          params: {
            shop,
            code: code ? 'present' : 'missing',
            hmac: hmac ? 'present' : 'missing',
            state
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          tempStore: localStorage.getItem('shopify_temp_store'),
          currentStoreTarget: ShopifyConnectionManager.getCurrentStoreTarget()
        };
        
        setDebugInfo(debugData);
        
        if (!shop || !code || !hmac) {
          setStatus('error');
          setError("Authentication parameters missing");
          return;
        }
        
        // Call our Supabase Edge Function to complete OAuth
        setMessage("Verifying authentication with Shopify...");
        const callbackUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${location.search.substring(1)}&client=${encodeURIComponent(window.location.origin)}`;
        
        console.log("Calling callback function:", callbackUrl);
        
        const response = await fetch(callbackUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Callback error response:", errorText);
          
          setStatus('error');
          setError(`Failed to complete authentication: ${response.status} ${response.statusText}`);
          return;
        }
        
        const result = await response.json();
        console.log("Callback result:", result);
        
        if (result.success) {
          setStatus('success');
          setMessage(`Successfully connected to shop ${shop}! Redirecting...`);
          
          // Store shop information clearly
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_last_connect_time', Date.now().toString());
          
          // Remove temporary data
          ShopifyConnectionManager.clearTempStore();
          
          // Reset connection attempts
          ShopifyConnectionManager.resetAttempts();
          
          // Disable emergency mode if it was enabled
          if (ShopifyConnectionManager.isEmergencyDisabled()) {
            ShopifyConnectionManager.toggleEmergencyDisable(false);
          }
          
          // Add delay before redirecting
          setTimeout(() => {
            // Show success message to user
            toast.success(`Successfully connected to shop ${shop}`);
            
            // Redirect with additional parameters to update connection state on dashboard entry
            navigate('/dashboard', { 
              replace: true, 
              state: { 
                shopify_success: true, 
                shop, 
                connected: true,
                timestamp: Date.now()
              } 
            });
          }, 1500);
        } else {
          setStatus('error');
          setError(result.error || "Connection failed for an unknown reason");
        }
      } catch (error) {
        console.error("Error processing callback:", error);
        setStatus('error');
        setError(error instanceof Error ? error.message : "An error occurred during authentication");
      }
    };
    
    handleCallback();
  }, [location.search, navigate]);
  
  const handleRetry = () => {
    // Clear any existing connection data
    ShopifyConnectionManager.clearConnectionData();
    
    // Redirect to shopify connection page
    window.location.href = '/shopify';
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Display debug information to help with troubleshooting
  const getDebugDisplay = () => {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs text-left overflow-auto max-h-60">
        <h4 className="font-bold mb-2">Debug Information:</h4>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        <h4 className="font-bold mb-2 mt-2">LocalStorage:</h4>
        <pre>{JSON.stringify({
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected'),
          shopify_temp_store: localStorage.getItem('shopify_temp_store'),
          shopify_last_connect_time: localStorage.getItem('shopify_last_connect_time'),
          emergency_disabled: ShopifyConnectionManager.isEmergencyDisabled()
        }, null, 2)}</pre>
      </div>
    );
  };
  
  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' && "Connecting to Shopify"}
          {status === 'success' && "Connection Successful!"}
          {status === 'error' && "Connection Error"}
        </h1>
        
        <div className="mb-6">
          {status === 'loading' && (
            <Loader className="w-16 h-16 mx-auto text-purple-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
          )}
        </div>
        
        <p className="mb-6 text-lg">{message}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 text-right">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          {status === 'error' && (
            <>
              <Button onClick={handleRetry} className="w-full bg-purple-600 hover:bg-purple-700">
                Try Again
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}
          
          {status === 'loading' && (
            <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 ml-2" />
              Cancel
            </Button>
          )}
        </div>
        
        {/* Show debug info */}
        {(status === 'error' || process.env.NODE_ENV === 'development') && getDebugDisplay()}
      </div>
    </div>
  );
}
