import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Store } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { useI18n } from '@/lib/i18n';

const Navbar = () => {
  const { isShopifyAuthenticated, shopifyUserEmail, shop: currentStore, signOut } = useAuth();
  const { language, setLanguage } = useI18n();

  // Use localStorage fallback for store detection
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const emailFromStorage = localStorage.getItem('shopify_user_email');
  const activeStore = currentStore || storeFromStorage;
  const activeEmail = shopifyUserEmail || emailFromStorage;
  
  // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
  const isValidStore = activeStore && 
                      activeStore !== 'en' && 
                      activeStore !== 'ar' && 
                      activeStore.includes('.myshopify.com');
  
  const hasConnection = !!isValidStore;

  console.log('🔍 Navbar - Auth state:', { 
    currentStore, 
    storeFromStorage,
    activeStore,
    isValidStore,
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
    <nav className="bg-white shadow" dir="ltr">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary">CODMagnet</Link>
          <div className="flex items-center space-x-4 gap-4">
            <div className="flex items-center gap-2">
              <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')}>EN</Button>
              <Button variant={language === 'ar' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('ar')}>AR</Button>
            </div>
            <Button asChild>
              <Link to="/dashboard">{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</Link>
            </Button>
            
            {/* عرض معلومات المستخدم والمتجر - تحسين جديد */}
            {hasConnection && isValidStore ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 rounded-lg px-3 py-2 hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {isValidStore ? activeStore.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">
                          {isValidStore ? activeStore.replace('.myshopify.com', '') : 'متجر غير معروف'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          متصل ونشط
                        </p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex flex-col space-y-2 p-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {isValidStore ? activeStore.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">
                          {isValidStore ? activeStore.replace('.myshopify.com', '') : 'متجر غير معروف'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Store className="inline w-3 h-3 mr-1" />
                          {isValidStore ? activeStore : 'غير متصل'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/my-stores" className="w-full">
                      <Store className="mr-2 h-4 w-4" />
                      متاجري
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleDisconnect} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    قطع الاتصال
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/shopify">{language === 'ar' ? 'ربط متجر' : 'Connect Store'}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;