
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';
import { useAuth } from '@/lib/auth';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Processing authentication request...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [shop, setShop] = useState<string | null>(null);
  const { refreshShopifyConnection } = useAuth();
  
  // Detect repeated redirect attempts
  useEffect(() => {
    const attempts = parseInt(sessionStorage.getItem('shopify_redirect_attempts') || '0', 10);
    sessionStorage.setItem('shopify_redirect_attempts', (attempts + 1).toString());
    
    if (attempts > 5) {
      setStatus('error');
      setError("Too many redirect attempts detected. Please try connecting from the dashboard again.");
      return;
    }
  }, []);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        const timestamp = Date.now();
        
        setShop(shopParam);
        
        console.log("Shopify callback received with params:", { 
          shop: shopParam, 
          code: code ? 'present' : 'missing', 
          hmac: hmac ? 'present' : 'missing',
          state
        });
        
        // Save debug info
        setDebugInfo({
          params: {
            shop: shopParam,
            code: code ? 'present' : 'missing',
            hmac: hmac ? 'present' : 'missing',
            state
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          localStorage: {
            shopify_temp_store: localStorage.getItem('shopify_temp_store'),
            shopify_store: localStorage.getItem('shopify_store'),
            shopify_connected: localStorage.getItem('shopify_connected')
          }
        });
        
        // Check for required parameters
        if (!shopParam || !code || !hmac) {
          setStatus('error');
          setError("Authentication parameters missing");
          return;
        }
        
        // Reset connection attempt counter
        localStorage.setItem('shopify_connection_attempts', '0');
        
        // Call our Supabase Edge Function to complete OAuth
        setMessage("Verifying authentication with Shopify...");
        
        try {
          const callbackUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${location.search.substring(1)}&client=${encodeURIComponent(window.location.origin)}&t=${timestamp}`;
          console.log("Calling callback function:", callbackUrl);
          
          const response = await fetch(callbackUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Callback error response:", errorText);
            throw new Error(`Failed to complete authentication: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            // Store shop information clearly
            localStorage.setItem('shopify_store', shopParam);
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connect_time', timestamp.toString());
            
            // Remove temporary data
            ShopifyConnectionManager.clearTempStore();
            
            // Reset connection attempts
            ShopifyConnectionManager.resetAttempts();
            
            // Disable emergency mode if it was enabled
            if (ShopifyConnectionManager.isEmergencyDisabled()) {
              ShopifyConnectionManager.toggleEmergencyDisable(false);
            }
            
            // Set success status
            setStatus('success');
            setMessage(`Successfully connected to shop ${shopParam}! Redirecting...`);
            
            // Refresh auth connection if available
            if (refreshShopifyConnection) {
              try {
                await refreshShopifyConnection();
              } catch (refreshError) {
                console.error("Error refreshing connection:", refreshError);
                // Non-critical error, continue with flow
              }
            }
            
            // Add delay before redirecting
            setTimeout(() => {
              // Show success message to user
              toast.success(`Successfully connected to shop ${shopParam}`);
              
              // Redirect with additional parameters to update connection state on dashboard entry
              navigate('/dashboard', { 
                replace: true, 
                state: { 
                  shopify_success: true, 
                  shop: shopParam, 
                  connected: true,
                  timestamp: Date.now()
                } 
              });
            }, 1500);
          } else {
            setStatus('error');
            setError(result.error || "Connection failed for an unknown reason");
          }
        } catch (error: any) {
          console.error("Error processing callback:", error);
          
          // Fallback to direct connection if API fails
          try {
            // Still store the connection information directly
            localStorage.setItem('shopify_store', shopParam);
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connect_time', timestamp.toString());
            localStorage.removeItem('shopify_temp_store');
            
            setStatus('success');
            setMessage(`Connected to shop ${shopParam} using fallback method. Redirecting...`);
            
            setTimeout(() => {
              toast.success(`Connected to shop ${shopParam} (fallback method)`);
              navigate('/dashboard', { replace: true });
            }, 1500);
          } catch (fallbackError) {
            setStatus('error');
            setError(`Authentication failed: ${error.message || "Unknown error"}`);
          }
        }
      } catch (error: any) {
        console.error("Error in callback handling:", error);
        setStatus('error');
        setError(error?.message || "An error occurred during authentication");
      }
    };
    
    handleCallback();
  }, [location.search, navigate, refreshShopifyConnection]);
  
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
    <div className="flex min-h-screen justify-center items-center bg-gray-50">
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 text-left">
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
              <ArrowLeft className="h-4 w-4 mr-2" />
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
