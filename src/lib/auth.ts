
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
export const useAuth = () => useContext(AuthContext);
