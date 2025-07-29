import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // إضافة خيار لتطبيق المصادقة الصارمة
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading, shopifyConnected, shop, session } = useAuth();

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

  // فرض المصادقة الصارمة
  if (requireAuth) {
    // التحقق من صحة الجلسة
    if (!session || !user) {
      return <Navigate to="/auth" replace />;
    }

    // التحقق من انتهاء الجلسة (24 ساعة من آخر تفاعل)
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (now > expiresAt) {
        // انتهت صلاحية الجلسة
        return <Navigate to="/auth?expired=true" replace />;
      }
    }
  }

  // في حالة وجود متجر Shopify متصل بدون مستخدم مصادق
  if (shop && shopifyConnected && !user && requireAuth) {
    return <Navigate to="/shopify-account-link" replace />;
  }

  // في حالة عدم وجود مصادقة أو متجر
  if (!user && !shop && requireAuth) {
    return <Navigate to="/auth" replace />;
  }

  // عرض المحتوى المحمي
  return <>{children}</>;
};

export default ProtectedRoute;