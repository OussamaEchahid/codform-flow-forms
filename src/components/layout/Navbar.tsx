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
            
            {/* عرض معلومات المستخدم والمتجر */}
            {hasConnection ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {activeEmail ? activeEmail.charAt(0).toUpperCase() : activeStore?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    {activeEmail && (
                      <p className="text-sm font-medium leading-none">{activeEmail}</p>
                    )}
                    {activeStore && (
                      <p className="text-xs leading-none text-muted-foreground">
                        <Store className="inline w-3 h-3 mr-1" />
                        {activeStore}
                      </p>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      الإعدادات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-stores" className="w-full">
                      <Store className="mr-2 h-4 w-4" />
                      متاجري
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    قطع الاتصال
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/shopify">ربط متجر</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;