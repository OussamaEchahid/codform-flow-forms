
import { createContext, useContext } from 'react';

type AuthContextType = {
  shopifyConnected: boolean;
  shop?: string;
};

export const AuthContext = createContext<AuthContextType>({
  shopifyConnected: false
});

export const useAuth = () => {
  return useContext(AuthContext);
};
