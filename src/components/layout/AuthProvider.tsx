
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleShopifyAuth = async () => {
      // Check for Shopify redirect parameters
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const shopifyConnected = params.get("shopify_connected");
      const hmac = params.get("hmac");
      const timestamp = params.get("timestamp");
      const authSuccess = params.get("auth_success");

      // Retrieve Shopify store data from localStorage
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');
      // Temporary store data (during auth)
      const tempShop = localStorage.getItem('shopify_temp_store');

      console.log('Auth parameters:', { 
        shop, shopifyConnected, hmac, authSuccess,
        savedShop, savedConnected, tempShop,
        pathname: location.pathname,
        search: location.search
      });

      // If we have a shop parameter and authorization code in URL, let the auth flow proceed
      if ((shop || tempShop) && (hmac || location.pathname.startsWith('/auth'))) {
        // User is in auth process, let it continue
        console.log('In auth process, not interfering...');
        setAuthChecked(true);
        return;
      }

      // Check for new Shopify parameters from successful auth
      if (shopifyConnected === "true" && shop) {
        console.log('New Shopify connection detected:', shop);
        
        // Update auth state and save to localStorage
        setAuthState({
          shopifyConnected: true,
          shop: shop,
          user: { id: 'shopify-user' }
        });
        
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Remove any temporary data
        localStorage.removeItem('shopify_temp_store');
        
        // Show success message
        if (authSuccess === "true") {
          toast.success(`Connected to store ${shop} successfully`);
        }
        
        // Remove URL parameters if we're on dashboard
        if (location.pathname === '/dashboard' && window.history.replaceState) {
          window.history.replaceState({}, document.title, '/dashboard');
        }
      } 
      // Restore previous connection state from localStorage if available
      else if (savedConnected === 'true' && savedShop) {
        console.log('Restoring saved Shopify connection:', savedShop);
        
        setAuthState({
          shopifyConnected: true,
          shop: savedShop,
          user: { id: 'shopify-user' }
        });
      }
      // If we have temporary store info but auth didn't complete
      else if (tempShop && location.pathname === '/dashboard') {
        console.log('Temp store data exists, but auth didn\'t complete:', tempShop);
        
        // If on dashboard, show message to user
        toast.error("Shopify authentication was not completed. Please try again.");
        localStorage.removeItem('shopify_temp_store');
      }

      // Allow access to dashboard in any case (with or without auth)
      setAuthChecked(true);
    };

    handleShopifyAuth();
  }, [location.pathname, location.search, navigate]);

  // Show loading state until auth is checked
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
