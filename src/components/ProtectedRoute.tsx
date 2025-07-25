import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '@/components/layout/AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, shopifyConnected, shop } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // إذا كان هناك متجر shopify متصل بدون مستخدم مصادق، وجه لصفحة ربط الحساب
  if (shop && shopifyConnected && !user) {
    return <Navigate to="/shopify-account-link" replace />;
  }

  // Redirect to login if not authenticated and no Shopify store
  if (!user && !shop) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;