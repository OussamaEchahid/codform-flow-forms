
import { ReactNode } from 'react';
import { AuthContext } from '@/lib/auth';
import AuthProvider from './AuthProvider';  // استيراد AuthProvider

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};
