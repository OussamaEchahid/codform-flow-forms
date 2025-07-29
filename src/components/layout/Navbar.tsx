import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Store } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

const Navbar = () => {
  const { isShopifyAuthenticated, shopifyUserEmail, shop: currentStore, signOut } = useAuth();

  // Use localStorage fallback for store detection
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const emailFromStorage = localStorage.getItem('shopify_user_email');
  const activeStore = currentStore || storeFromStorage;
  const activeEmail = shopifyUserEmail || emailFromStorage;
  const hasConnection = !!activeStore;

  console.log('🔍 Navbar - Auth state:', { 
    currentStore, 
    storeFromStorage,
    activeStore,
    shopifyUserEmail, 
    emailFromStorage,
    activeEmail,
    isShopifyAuthenticated,
    hasConnection
  });

  const handleDisconnect = async () => {
    localStorage.removeItem('current_shopify_store');
    localStorage.removeItem('shopify_user_email');
    localStorage.removeItem('shopify_connected');
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">CODMagnet</Link>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link to="/dashboard">لوحة التحكم</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;