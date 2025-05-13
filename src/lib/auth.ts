
import React, { useContext } from 'react';

// تحديث واجهة السياق لدعم المتاجر المتعددة
export interface AuthContextType {
  shopifyConnected: boolean;
  shop?: string | null;
  user?: any;
  shops: string[] | null;
  setShop?: (shop: string) => void;
  loading?: boolean;
  signIn?: (email: string, password: string) => Promise<void>;
  signOut?: () => Promise<void>;
}

// القيمة الافتراضية للسياق
export const AuthContext = React.createContext<AuthContextType>({
  shopifyConnected: false,
  shop: null,
  user: undefined,
  shops: null
});

// هوك للوصول إلى سياق المصادقة
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Fallback check if context is missing information
  const activeStore = localStorage.getItem('shopify_store');
  const isConnected = localStorage.getItem('shopify_connected') === 'true';
  
  // If context says not connected but localStorage says yes,
  // use localStorage as source of truth
  if (!context.shopifyConnected && isConnected && activeStore) {
    return {
      ...context,
      shopifyConnected: true,
      shop: activeStore,
      shops: context.shops || [activeStore]
    };
  }
  
  return context;
};
