
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleAuth = () => {
      // Get URL parameters - important for Shopify redirects
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const hmac = params.get("hmac"); // Shopify HMAC parameter
      const timestamp = params.get("timestamp"); // Shopify timestamp parameter

      // If we have shop-related parameters, we're in a Shopify OAuth flow
      if (shop || hmac || timestamp) {
        console.log("Shopify auth parameters detected:", { shop, hmac, timestamp });
        
        // If we're on the root path with shop parameters, redirect to auth
        if (location.pathname === '/') {
          window.location.href = `/auth?${params.toString()}`;
          return;
        }
        
        // Don't interrupt the Shopify auth flow
        if (location.pathname.startsWith('/auth')) {
          console.log("In auth flow, not redirecting");
          return;
        }
      }

      // Regular app authentication logic
      if (user) {
        // User is logged in
        if (location.pathname === '/auth') {
          console.log("User logged in but on auth page, redirecting to dashboard");
          navigate('/dashboard');
          toast.success('تم تسجيل الدخول بنجاح');
        } else if (location.pathname === '/') {
          console.log("User logged in and on root, redirecting to dashboard");
          navigate('/dashboard');
          toast.success('تم التوجيه إلى لوحة التحكم');
        }
      } else {
        // User is not logged in
        if (location.pathname === '/dashboard' || location.pathname.startsWith('/form-builder')) {
          console.log("User not logged in but on protected page, redirecting to auth");
          navigate('/auth');
          toast.error('يرجى تسجيل الدخول أولاً');
        }
      }
      
      setAuthChecked(true);
    };

    handleAuth();
  }, [user, navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
