
import { createContext, useContext } from 'react';

export interface AuthContextType {
  user: any;
  shopifyConnected: boolean;
  shop?: string;
  refreshShopifyConnection?: () => Promise<boolean>;
  isTokenVerified?: boolean;
  forceReconnect?: () => boolean | void;
  lastConnectionTime?: string;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  shopifyConnected: false,
  shop: undefined,
});

export const useAuth = () => useContext(AuthContext);
