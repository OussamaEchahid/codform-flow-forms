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
  
  // الصفحات التي لا تحتاج اتصال Shopify (الصفحات العامة)
  const publicRoutes = [
    '/',
    '/shopify',
    '/shopify-connect', 
    '/shopify-callback',
    '/shopify-redirect'
  ];
  
  // التحقق من أن المسار الحالي صفحة عامة
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  // إذا كانت صفحة عامة، عرض المحتوى مباشرة
  if (isPublicRoute) {
    console.log('🏠 AppWrapper - Public route detected:', location.pathname);
    return <>{children}</>;
  }
  
  // التحقق من وجود متجر صحيح
  const activeStore = UnifiedStoreManager.getActiveStore();
  const storeFromAuth = shop;
  const connectedStore = storeFromAuth || activeStore;
  
  // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
  const isValidStore = connectedStore && 
                      connectedStore !== 'en' && 
                      connectedStore !== 'ar' && 
                      connectedStore.includes('.myshopify.com');

  console.log('🔒 AppWrapper - Protected route check:', {
    route: location.pathname,
    user: !!user,
    isShopifyAuthenticated,
    activeStore,
    storeFromAuth,
    connectedStore,
    isValidStore
  });

  // إذا لم يكن هناك مستخدم مصادق عليه أو متجر صحيح، عرض صفحة عدم الاتصال
  if (!user && !isShopifyAuthenticated && !isValidStore) {
    return <NoShopifyConnection />;
  }

  // إذا كان هناك مستخدم مصادق عليه ولكن لا يوجد متجر صحيح، عرض صفحة عدم الاتصال
  if ((user || isShopifyAuthenticated) && !isValidStore) {
    return <NoShopifyConnection />;
  }

  // عرض التطبيق العادي
  return <>{children}</>;
};

export default AppWrapper;