
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
    const handleAuth = async () => {
      try {
        // Check for Shopify redirect parameters
        const params = new URLSearchParams(window.location.search);
        const shop = params.get("shop");
        const shopifyConnected = params.get("shopify_connected");
        const shopifySuccess = params.get("shopify_success");
        const hmac = params.get("hmac");
        const timestamp = params.get("timestamp");
        const authSuccess = params.get("auth_success");

        // Get saved Shopify data from localStorage
        const savedShop = localStorage.getItem('shopify_store');
        const savedConnected = localStorage.getItem('shopify_connected');
        const tempShop = localStorage.getItem('shopify_temp_store');

        // Log auth parameters for debugging
        console.log('Auth parameters:', { 
          shop, shopifyConnected, shopifySuccess, hmac, authSuccess,
          pathname: location.pathname,
          search: location.search
        });

        // Check if we have a shop in Supabase
        const { data: shopifyStore, error } = await supabase
          .rpc('get_user_shop')
          .single();

        if (shopifyStore) {
          console.log('Found Shopify store in database:', shopifyStore);
          setAuthState({
            shopifyConnected: true,
            shop: shopifyStore,
            user: { id: 'shopify-user' }
          });
          
          // Update localStorage
          localStorage.setItem('shopify_store', shopifyStore);
          localStorage.setItem('shopify_connected', 'true');
          
          setAuthChecked(true);
          return;
        }

        // Check for Shopify success parameters
        if (shopifySuccess === "true" && shop) {
          console.log('Shopify connection success:', shop);
          
          setAuthState({
            shopifyConnected: true,
            shop: shop,
            user: { id: 'shopify-user' }
          });
          
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          
          // Remove any temporary data
          localStorage.removeItem('shopify_temp_store');
          
          // Show success message if not already shown
          if (!toast.success) {
            toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
          }
          
          // Remove URL parameters if we're on dashboard
          if (location.pathname === '/dashboard' && window.history.replaceState) {
            window.history.replaceState({}, document.title, '/dashboard');
          }
        }
        // Check for new Shopify parameters from successful auth
        else if (shopifyConnected === "true" && shop) {
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
          if (authSuccess === "true" && !toast.success) {
            toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
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
          toast.error("لم تكتمل عملية مصادقة Shopify. الرجاء المحاولة مرة أخرى.");
          localStorage.removeItem('shopify_temp_store');
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setAuthChecked(true);
      }
    };

    handleAuth();
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
