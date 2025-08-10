import { useState, useEffect } from 'react';
import UnifiedStoreManager from '@/utils/unified-store-manager';

interface ShopifyAuthState {
  isAuthenticated: boolean;
  activeStore: string | null;
  userEmail: string | null;
  loading: boolean;
}

export const useShopifyAuth = () => {
  const [authState, setAuthState] = useState<ShopifyAuthState>({
    isAuthenticated: false,
    activeStore: null,
    userEmail: null,
    loading: true
  });

  const updateAuthState = () => {
    const activeStore = UnifiedStoreManager.getActiveStore();
    const userEmail = localStorage.getItem('shopify_user_email');
    
    const isAuthenticated = !!activeStore;
    
    setAuthState({
      isAuthenticated,
      activeStore,
      userEmail,
      loading: false
    });
    
    console.log('🔐 Shopify Auth State Updated (unified):', {
      isAuthenticated,
      activeStore,
      userEmail
    });
  };

  useEffect(() => {
    updateAuthState();
    
    // الاستماع لتغييرات النظام الموحد
    const unsubscribe = UnifiedStoreManager.onStoreChange(() => updateAuthState());
    
    // مراقبة تغييرات localStorage عبر التبويبات
    const handleStorageChange = () => updateAuthState();
    window.addEventListener('storage', handleStorageChange);
    
    // تحديث دوري كاحتياط مع احترام خمول التبويب
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      updateAuthState();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

  const getUserIdentifier = () => {
    return authState.activeStore || authState.userEmail || null;
  };

  return {
    ...authState,
    getUserIdentifier,
    refreshAuth: updateAuthState
  };
};