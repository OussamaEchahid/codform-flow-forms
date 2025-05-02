
import { createContext, useContext } from 'react';

// Interface to define what's available in the auth context
export interface AuthContextType {
  user: any;
  shopifyConnected: boolean;
  shop?: string;
  refreshShopifyConnection?: () => void;
  isTokenVerified: boolean;
  forceReconnect?: () => void;
  lastConnectionTime?: string;
}

// Create a context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  shopifyConnected: false,
  shop: undefined,
  isTokenVerified: false,
  lastConnectionTime: undefined
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
