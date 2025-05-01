
import { ReactNode } from 'react';
import { useAuth as useAuthHook } from '@/lib/auth';
import { AuthProvider } from '@/components/layout/AuthProvider';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const authProps = AuthProvider({ children });
  return (
    <authProps.Provider value={authProps.value}>
      {authProps.children}
    </authProps.Provider>
  );
};

export const useAuth = useAuthHook;
