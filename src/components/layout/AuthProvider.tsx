
import { ReactNode, useEffect } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // إذا كان المستخدم على صفحة المصادقة وهو مسجل الدخول بالفعل، أعد توجيهه إلى لوحة التحكم
    if (user && window.location.pathname === '/auth') {
      navigate('/dashboard');
      toast.success('تم تسجيل الدخول بنجاح');
    }
    
    // إذا كان المستخدم على صفحة لوحة التحكم أو بناء النماذج وهو غير مسجل الدخول، أعد توجيهه إلى صفحة المصادقة
    if (!user && (window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/form-builder'))) {
      navigate('/auth');
      toast.error('يرجى تسجيل الدخول أولاً');
    }
  }, [user, navigate]);

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
