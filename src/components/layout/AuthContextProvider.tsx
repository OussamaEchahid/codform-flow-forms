
import { ReactNode } from 'react';
import { AuthProvider, useAuth as useAuthHook } from '@/lib/auth';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const authProps = AuthProvider({ children });
  return (
    <authProps.Provider value={authProps.value}>
      {authProps.children}
    </authProps.Provider>
  );
};

export const useAuth = useAuthHook;
