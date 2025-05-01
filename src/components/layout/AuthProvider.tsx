
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthContextType } from '@/lib/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);

  // Function to verify connection with Supabase
  const verifyShopifyConnection = async (shopDomain: string) => {
    if (!shopDomain) return false;

    try {
      console.log(`Verifying connection for shop: ${shopDomain}`);
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shopDomain)
        .maybeSingle();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('No store data or access token found');
        return false;
      }
      
      console.log('Valid token found for shop:', shopDomain);
      return true;
    } catch (err) {
      console.error('Error verifying connection:', err);
      return false;
    }
  };

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
          search: location.search,
          savedShop,
          savedConnected,
          tempShop
        });

        // Check if we have a valid token in Supabase for the shop
        let tokenValid = false;
        let shopToUse = shop || savedShop || tempShop;
        
        if (shopToUse) {
          tokenValid = await verifyShopifyConnection(shopToUse);
          
          if (tokenValid) {
            console.log('Found valid Shopify token in database for:', shopToUse);
            setIsTokenVerified(true);
            
            // Set connection state
            setAuthState({
              shopifyConnected: true,
              shop: shopToUse,
              user: { id: 'shopify-user' }
            });
            
            // Update localStorage to match database state
            localStorage.setItem('shopify_store', shopToUse);
            localStorage.setItem('shopify_connected', 'true');
            
            // Clear any temporary data
            localStorage.removeItem('shopify_temp_store');
            
            // Show toast only in certain cases
            if (shopifySuccess === "true" || authSuccess === "true") {
              toast.success(`تم الاتصال بمتجر ${shopToUse} بنجاح`);
            }
            
            setAuthChecked(true);
            return;
          } else {
            console.log('No valid token found in database for shop:', shopToUse);
            // If we have local storage data but no valid token, clear local storage
            if (savedShop === shopToUse && savedConnected === 'true') {
              console.log('Clearing invalid local storage data');
              localStorage.removeItem('shopify_store');
              localStorage.removeItem('shopify_connected');
            }
          }
        }

        // Check for Shopify success parameters if database check failed
        if ((shopifySuccess === "true" || shopifyConnected === "true") && shop) {
          console.log('Shopify connection success from URL parameters:', shop);
          
          // Double check with database again to make sure
          const isValid = await verifyShopifyConnection(shop);
              
          if (!isValid) {
            console.log('Token not found in database despite success parameter');
            
            // If on dashboard page, show warning
            if (location.pathname === '/dashboard') {
              toast.error('لم يتم العثور على رمز الوصول في قاعدة البيانات. يرجى إعادة الاتصال.');
              setAuthState({
                shopifyConnected: false,
                shop: undefined,
                user: undefined
              });
              setAuthChecked(true);
              return;
            }
          } else {
            console.log('Verified token exists in database');
            setIsTokenVerified(true);
            
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
            toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
            
            // Remove URL parameters if we're on dashboard
            if (location.pathname === '/dashboard' && window.history.replaceState) {
              window.history.replaceState({}, document.title, '/dashboard');
            }
            
            setAuthChecked(true);
            return;
          }
        }
        // Restore previous connection state from localStorage if available
        else if (savedConnected === 'true' && savedShop && !tokenValid) {
          console.log('Restoring saved Shopify connection from localStorage:', savedShop);
          
          // Double check with database again if we have a valid token
          const isValid = await verifyShopifyConnection(savedShop);
              
          if (isValid) {
            console.log('Confirmed token exists for saved shop:', savedShop);
            setIsTokenVerified(true);
            
            setAuthState({
              shopifyConnected: true,
              shop: savedShop,
              user: { id: 'shopify-user' }
            });
          } else {
            console.log('No token found for saved shop, clearing localStorage');
            localStorage.removeItem('shopify_store');
            localStorage.removeItem('shopify_connected');
            
            // Update state to not connected
            setAuthState({
              shopifyConnected: false,
              shop: undefined,
              user: undefined
            });
            
            if (location.pathname === '/forms' || location.pathname === '/dashboard') {
              toast.error('انتهت صلاحية الاتصال بـ Shopify. يرجى إعادة الاتصال.');
            }
          }
        } else {
          // If no connection information found, set state to not connected
          setAuthState({
            shopifyConnected: false,
            shop: undefined,
            user: undefined
          });
        }
        
        // If we have temporary store info but auth didn't complete
        if (tempShop && (location.pathname === '/dashboard' || location.pathname === '/forms') && !authState.shopifyConnected) {
          console.log('Temporary store data exists, but auth didn\'t complete:', tempShop);
          
          // Show message to user
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
  
  // Function to refresh connection status
  const refreshShopifyConnection = () => {
    console.log("Refreshing Shopify connection state");
    
    // Clear local storage state
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    
    // Reset auth state
    setAuthState({
      shopifyConnected: false,
      shop: undefined,
      user: undefined
    });
    
    setIsTokenVerified(false);
  };
  
  // Context object with refresh function
  const authContextValue: AuthContextType = {
    ...authState,
    refreshShopifyConnection,
    isTokenVerified
  };

  // Show loading state until auth is checked
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
