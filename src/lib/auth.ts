
import React, { useContext } from 'react';

// تحديث واجهة السياق لدعم المتاجر المتعددة
export interface AuthContextType {
  shopifyConnected: boolean;
  shop?: string;
  user?: any;
  shops: string[];
  setShop?: (shop: string | undefined) => void;
}

// القيمة الافتراضية للسياق
export const AuthContext = React.createContext<AuthContextType>({
  shopifyConnected: false,
  shop: undefined,
  user: undefined,
  shops: []
});

// هوك للوصول إلى سياق المصادقة
export const useAuth = () => useContext(AuthContext);
