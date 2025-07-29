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
            
            {hasConnection && activeStore ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback>
                      <Store className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="flex flex-col items-start">
                    <span className="font-medium">{activeStore}</span>
                    {activeEmail && <span className="text-xs text-muted-foreground">{activeEmail}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-stores" className="flex items-center">
                      <Store className="h-4 w-4 mr-2" />
                      متاجري
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      الإعدادات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDisconnect} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    قطع الاتصال
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline">
                <Link to="/shopify">ربط متجر Shopify</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;