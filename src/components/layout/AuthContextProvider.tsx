
import { ReactNode } from 'react';
import AuthProvider from './AuthProvider';
import { I18nProvider } from '@/lib/i18n';

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </AuthProvider>
  );
};

export default AuthContextProvider;
