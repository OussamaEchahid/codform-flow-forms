
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Navbar from './Navbar';

const Layout = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
