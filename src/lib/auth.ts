
import React, { useContext } from 'react';
import UnifiedStoreManager from '@/utils/unified-store-manager';

// تحديث واجهة السياق لدعم النظام المبسط
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

// هوك للوصول إلى سياق المصادقة مع النظام المبسط
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // استخدام النظام الموحد كمصدر للحقيقة
  const activeStore = UnifiedStoreManager.getActiveStore();
  const isConnected = UnifiedStoreManager.isConnected();
  
  // إذا كان المدير المبسط يقول أن هناك اتصال، استخدم هذه المعلومات
  if (isConnected && activeStore) {
    return {
      ...context,
      shopifyConnected: true,
      shop: activeStore,
      shops: [activeStore], // قائمة مبسطة تحتوي على المتجر النشط فقط
      loading: false
    };
  }
  
  // تحقق من localStorage كمصدر احتياطي (المفتاح الموحد)
  const localStorage_shop = localStorage.getItem('active_shopify_store');
  const localStorage_connected = localStorage.getItem('shopify_connected') === 'true';
  
  if (localStorage_shop && localStorage_connected) {
    return {
      ...context,
      shopifyConnected: true,
      shop: localStorage_shop,
      shops: [localStorage_shop],
      loading: false
    };
  }

  // إذا لم يكن هناك اتصال، استخدم السياق كما هو
  return {
    ...context,
    shopifyConnected: false,
    shop: null,
    shops: null,
    loading: context.loading !== undefined ? context.loading : false
  };
};
