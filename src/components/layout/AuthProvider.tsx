
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleShopifyAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const shopifyConnected = params.get("shopify_connected");
      const hmac = params.get("hmac");
      const timestamp = params.get("timestamp");

      if (shopifyConnected === "true") {
        setAuthState({
          shopifyConnected: true,
          shop: shop || undefined,
          user: { id: 'shopify-user' } // Add mock user to maintain compatibility
        });
        
        toast.success(shop ? `تم الاتصال بمتجر ${shop} بنجاح` : 'تم الاتصال بمتجر Shopify بنجاح');
        
        if (window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      // Allow direct access to dashboard
      if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard')) {
        setAuthChecked(true);
        return;
      }

      // Allow access to home page and auth routes
      if (location.pathname === '/' || location.pathname.startsWith('/auth') || location.pathname.startsWith('/shopify')) {
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
    };

    handleShopifyAuth();
  }, [location.pathname]);

  if (!authChecked) {
    return null;
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
