
import { createContext, useContext } from 'react';

// Define Auth context type - Simplified
export interface AuthContextType {
  user: any | null;
  shopifyConnected: boolean;
  shop?: string;
  refreshShopifyConnection?: () => Promise<boolean>;
  forceReconnect?: () => void;
  isTokenVerified?: boolean;
  lastConnectionTime?: string;
}

// Create Auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  shopifyConnected: false
});

// Hook for using Auth context
export const useAuth = () => useContext(AuthContext);
