
import { createContext, useContext } from 'react';

export interface AuthContextType {
  user: any;
  shopifyConnected: boolean;
  shop?: string;
  refreshShopifyConnection?: () => void;
  isTokenVerified?: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  shopifyConnected: false,
  shop: undefined,
  isTokenVerified: false
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
