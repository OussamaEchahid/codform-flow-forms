
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';

interface RootLayoutProps {
  children?: ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = () => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;
