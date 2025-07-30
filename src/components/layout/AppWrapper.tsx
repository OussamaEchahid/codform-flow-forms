import React from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import NoShopifyConnection from '@/components/layout/NoShopifyConnection';
import UnifiedStoreManager from '@/utils/unified-store-manager';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const { user, shop, isShopifyAuthenticated } = useAuth();
  
  // التحقق من وجود متجر صحيح
  const activeStore = UnifiedStoreManager.getActiveStore();
  const storeFromAuth = shop;
  const connectedStore = storeFromAuth || activeStore;
  
  // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
  const isValidStore = connectedStore && 
                      connectedStore !== 'en' && 
                      connectedStore !== 'ar' && 
                      connectedStore.includes('.myshopify.com');

  console.log('🔒 AppWrapper - Store validation:', {
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