import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();

  // عرض شاشة التحميل أثناء فحص المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // التحقق من المصادقة بطريقة مبسطة
  if (requireAuth && !user) {
    // فحص إذا كان هناك معاملات Shopify في URL للتوجيه للربط التلقائي
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const autoConnect = urlParams.get('auto_connect');
    
    console.log('🔐 ProtectedRoute - No user found, checking for Shopify params:', {
      shop: shopParam,
      auto_connect: autoConnect,
      currentPath: window.location.pathname
    });
    
    // إذا كان هناك معاملات Shopify ولسنا في صفحة الربط التلقائي، وجه للربط التلقائي
    if ((shopParam || autoConnect) && !window.location.pathname.includes('/shopify-auto-connect')) {
      console.log('🔗 Redirecting to shopify-auto-connect');
      return <Navigate to={`/shopify-auto-connect${window.location.search}`} replace />;
    }
    
    // في جميع الحالات الأخرى، وجه لصفحة المصادقة
    console.log('🔐 Redirecting to auth page');
    return <Navigate to="/auth" replace />;
  }

  // عرض المحتوى المحمي
  return <>{children}</>;
};

export default ProtectedRoute;