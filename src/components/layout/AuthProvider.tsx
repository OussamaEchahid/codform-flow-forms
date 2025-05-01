
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/lib/auth';

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
          try {
            const { data: shopifyStore, error } = await supabase
              .from('shopify_stores')
              .select('access_token, updated_at')
              .eq('shop', shopToUse)
              .single();
              
            if (shopifyStore && shopifyStore.access_token) {
              console.log('Found valid Shopify token in database for:', shopToUse);
              tokenValid = true;
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
          } catch (error) {
            console.error('Error checking shop token:', error);
          }
        }

        // Check for Shopify success parameters if database check failed
        if (shopifySuccess === "true" && shop) {
          console.log('Shopify connection success from URL parameters:', shop);
          
          // Double check with database again to make sure
          try {
            const { data: shopifyStoreCheck } = await supabase
              .from('shopify_stores')
              .select('access_token')
              .eq('shop', shop)
              .single();
              
            if (!shopifyStoreCheck || !shopifyStoreCheck.access_token) {
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
            }
          } catch (checkError) {
            console.error('Error double-checking token:', checkError);
            // Continue with local storage data anyway
          }
          
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
        }
        // Check for new Shopify parameters from successful auth
        else if (shopifyConnected === "true" && shop) {
          console.log('New Shopify connection detected from URL parameters:', shop);
          
          // Double check with database to ensure token exists
          try {
            const { data: shopifyStoreCheck } = await supabase
              .from('shopify_stores')
              .select('access_token')
              .eq('shop', shop)
              .single();
              
            if (!shopifyStoreCheck || !shopifyStoreCheck.access_token) {
              console.log('Token not found in database despite connected parameter');
              
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
            }
          } catch (checkError) {
            console.error('Error double-checking token:', checkError);
            // Continue with URL parameters anyway
          }
          
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
            toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
          }
          
          // Remove URL parameters if we're on dashboard
          if (location.pathname === '/dashboard' && window.history.replaceState) {
            window.history.replaceState({}, document.title, '/dashboard');
          }
        } 
        // Restore previous connection state from localStorage if available
        else if (savedConnected === 'true' && savedShop && !tokenValid) {
          console.log('Restoring saved Shopify connection from localStorage:', savedShop);
          
          // Double check with database again if we have a valid token
          try {
            const { data: shopifyStore } = await supabase
              .from('shopify_stores')
              .select('access_token')
              .eq('shop', savedShop)
              .single();
              
            if (shopifyStore && shopifyStore.access_token) {
              console.log('Confirmed token exists for saved shop:', savedShop);
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
            }
          } catch (error) {
            console.error('Error checking saved shop token:', error);
            // Clear potentially invalid data
            localStorage.removeItem('shopify_store');
            localStorage.removeItem('shopify_connected');
            
            // Update state to not connected
            setAuthState({
              shopifyConnected: false,
              shop: undefined,
              user: undefined
            });
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
        if (tempShop && location.pathname === '/dashboard' && !authState.shopifyConnected) {
          console.log('Temporary store data exists, but auth didn\'t complete:', tempShop);
          
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
  
  // Context object with refresh function
  const authContextValue = {
    ...authState,
    refreshShopifyConnection: async () => {
      console.log("Refreshing Shopify connection state");
      
      // Clear local storage state
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      setAuthState({
        shopifyConnected: false,
        shop: undefined,
        user: undefined
      });
      
      setIsTokenVerified(false);
    },
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
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};
