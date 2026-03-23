import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import NoShopifyConnection from '@/components/layout/NoShopifyConnection';
import UnifiedStoreManager from '@/utils/unified-store-manager';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const { user, shop, isShopifyAuthenticated } = useAuth();
  const location = useLocation();
  
  // وضع المسؤول - يسمح بالدخول بدون اتصال Shopify
  const isAdminMode = localStorage.getItem('admin_bypass') === 'true';
  
  // الصفحات التي لا تحتاج اتصال Shopify (الصفحات العامة)
  const publicRoutes = [
    '/',
    '/shopify',
    '/shopify-connect',
    '/shopify-callback',
    '/shopify-redirect',
    '/oauth/google-callback',
    '/privacy',
    '/terms',
    '/support'
  ];
  
  // التحقق من أن المسار الحالي صفحة عامة
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  // إذا كانت صفحة عامة، عرض المحتوى مباشرة
  if (isPublicRoute) {
    console.log('🏠 AppWrapper - Public route detected:', location.pathname);
    return <>{children}</>;
  }
  
  // السماح بالدخول إذا كان وضع المسؤول مفعل أو متصل بـ Shopify
  console.log('🔒 AppWrapper - Protected route check:', {
    route: location.pathname,
    user: !!user,
    isShopifyAuthenticated,
    isAdminMode,
  });

  if (!isShopifyAuthenticated && !isAdminMode) {
    return <NoShopifyConnection />;
  }

  return <>{children}</>;
};

export default AppWrapper;