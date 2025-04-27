
import { ReactNode, useEffect } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && window.location.pathname === '/auth') {
      navigate('/dashboard');
      toast.success('تم تسجيل الدخول بنجاح');
    }
    
    if (!user && (window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/form-builder'))) {
      navigate('/auth');
      toast.error('يرجى تسجيل الدخول أولاً');
    }

    if (user && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
