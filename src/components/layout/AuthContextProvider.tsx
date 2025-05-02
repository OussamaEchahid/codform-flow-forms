
import { ReactNode } from 'react';
import AuthProvider from './AuthProvider';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default AuthContextProvider;
