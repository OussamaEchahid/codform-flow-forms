
import { ReactNode } from 'react';
import { useAuth as useAuthHook } from '@/lib/auth';
import { AuthContext } from '@/lib/auth';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  // Import the AuthProvider component and use it correctly
  // AuthProvider is not a component that returns a provider, but rather a hook that returns auth context value
  const authProps = useAuthHook();

  return (
    <AuthContext.Provider value={authProps}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = useAuthHook;
