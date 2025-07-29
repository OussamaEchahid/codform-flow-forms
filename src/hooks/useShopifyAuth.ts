import { useState, useEffect } from 'react';

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
    const activeStore = localStorage.getItem('current_shopify_store') || 
                      localStorage.getItem('shopify_store');
    const userEmail = localStorage.getItem('shopify_user_email');
    
    const isAuthenticated = !!activeStore;
    
    setAuthState({
      isAuthenticated,
      activeStore,
      userEmail,
      loading: false
    });
    
    console.log('🔐 Shopify Auth State Updated:', {
      isAuthenticated,
      activeStore,
      userEmail
    });
  };

  useEffect(() => {
    updateAuthState();
    
    // مراقبة تغييرات localStorage
    const handleStorageChange = () => {
      updateAuthState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // تحديث دوري كل ثانية
    const interval = setInterval(updateAuthState, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
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