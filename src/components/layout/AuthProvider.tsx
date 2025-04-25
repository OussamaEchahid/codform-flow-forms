
import { ReactNode } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
