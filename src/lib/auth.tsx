
import { createContext, useContext } from 'react';

// تعريف نوع سياق المصادقة - مبسط
export interface AuthContextType {
  user: any | null;
  shopifyConnected: boolean;
  shop?: string;
  refreshShopifyConnection?: () => Promise<boolean>; // تعديل هذا لإرجاع وعد من نوع boolean
  forceReconnect?: () => void;
  isTokenVerified?: boolean;
  lastConnectionTime?: string;
}

// إنشاء سياق المصادقة مع قيم افتراضية
export const AuthContext = createContext<AuthContextType>({
  user: null,
  shopifyConnected: false
});

// شيفرة الاستخدام للسياق المصادقة
export const useAuth = () => useContext(AuthContext);
