import { ReactNode, useEffect } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");

      if (shop) {
        console.log("Shop parameter detected:", shop);
        return; // Don't redirect if we have a shop parameter
      }

      if (user && window.location.pathname === '/auth') {
        navigate('/dashboard');
        toast.success('تم تسجيل الدخول بنجاح');
      }
      
      if (!user && (window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/form-builder'))) {
        navigate('/auth');
        toast.error('يرجى تسجيل الدخول أولاً');
      }
    };

    handleAuth();
  }, [user, navigate]);

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
