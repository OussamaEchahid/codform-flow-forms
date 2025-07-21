import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, Settings, BarChart, Gift, ImageIcon, Globe, LogOut, RefreshCcw, ShoppingBag, ChevronDown, ListOrdered, AlertTriangle, Layers, Users, Shield, Crown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate, useLocation } from 'react-router-dom';
const AppSidebar = () => {
  const {
    t,
    language,
    setLanguage
  } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // State for collapsible menus
  const [isOrdersOpen, setIsOrdersOpen] = useState(location.pathname.startsWith('/orders'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(location.pathname.startsWith('/settings'));
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('logoutSuccess'));
      navigate('/auth');
    } catch (error) {
      toast.error(t('logoutError'));
    }
  };

  // Main navigation items (excluding settings as it has submenu)
  const mainNavItems = [{
    title: t('dashboard'),
    path: '/dashboard',
    icon: LayoutDashboard
  }, {
    title: t('forms'),
    path: '/forms',
    icon: FileText
  }, {
    title: t('landingPages'),
    path: '/landing-pages',
    icon: ImageIcon
  }];

  // Orders submenu items
  const ordersSubItems = [{
    title: language === 'ar' ? 'قائمة الطلبات' : 'Orders List',
    path: '/orders/list',
    icon: ListOrdered
  }, {
    title: language === 'ar' ? 'الطلبات المتروكة' : 'Abandoned Orders',
    path: '/orders/abandoned',
    icon: AlertTriangle
  }, {
    title: language === 'ar' ? 'قنوات الطلبات' : 'Orders Channels',
    path: '/orders/channels',
    icon: Layers
  }];

  // Settings submenu items
  const settingsSubItems = [{
    title: t('orderSettings'),
    path: '/settings/orders',
    icon: Users
  }, {
    title: t('generalSettings'),
    path: '/settings/general',
    icon: Settings
  }, {
    title: t('spamSettings'),
    path: '/settings/spam',
    icon: Shield
  }, {
    title: t('plansSettings'),
    path: '/settings/plans',
    icon: Crown
  }];
  return <aside className="min-h-screen w-64 bg-[#1E2127] text-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-2xl font-bold text-[#9b87f5]">COD</span>
            <span className="text-2xl font-bold text-white">Magnet</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-muted' : ''}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ar')} className={language === 'ar' ? 'bg-muted' : ''}>
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav>
          <ul className="space-y-2">
            {/* Dashboard */}
            <li>
              <NavLink to="/dashboard" className={({
              isActive
            }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                <LayoutDashboard size={20} />
                <span>{t('dashboard')}</span>
              </NavLink>
            </li>
            
            {/* Forms */}
            <li>
              <NavLink to="/forms" className={({
              isActive
            }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                <FileText size={20} />
                <span>{t('forms')}</span>
              </NavLink>
            </li>
            
            {/* Orders Menu - Positioned right after Forms */}
            <li>
              <Collapsible open={isOrdersOpen} onOpenChange={setIsOrdersOpen} className="w-full">
                <CollapsibleTrigger asChild>
                  <div className={cn('flex items-center justify-between w-full cursor-pointer px-4 py-2 rounded-lg transition-colors', location.pathname === '/orders' || location.pathname.startsWith('/orders/') ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={20} />
                      <span>{t('orders')}</span>
                    </div>
                    <ChevronDown size={16} className={cn('transition-transform duration-200', isOrdersOpen && 'transform rotate-180')} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pl-6 ml-2 border-l border-[#2A2E36]">
                    {ordersSubItems.map(subItem => <NavLink key={subItem.path} to={subItem.path} className={({
                    isActive
                  }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors mb-1', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                        <subItem.icon size={16} />
                        <span className="text-sm">{subItem.title}</span>
                      </NavLink>)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            {/* Quantity Offers - positioned after Orders */}
            <li>
              <NavLink to="/quantity-offers" className={({
              isActive
            }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                <Package size={20} />
                <span>{t('quantityOffers')}</span>
              </NavLink>
            </li>
            
            {/* Other navigation items before Settings */}
            {mainNavItems.slice(2).map(item => <li key={item.path}>
                <NavLink to={item.path} className={({
              isActive
            }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              </li>)}
            
            {/* Settings Menu with Submenu */}
            <li>
              <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="w-full">
                <CollapsibleTrigger asChild>
                  <div className={cn('flex items-center justify-between w-full cursor-pointer px-4 py-2 rounded-lg transition-colors', location.pathname === '/settings' || location.pathname.startsWith('/settings/') ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                    <div className="flex items-center gap-3">
                      <Settings size={20} />
                      <span>{t('settings')}</span>
                    </div>
                    <ChevronDown size={16} className={cn('transition-transform duration-200', isSettingsOpen && 'transform rotate-180')} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pl-6 ml-2 border-l border-[#2A2E36]">
                    {settingsSubItems.map(subItem => <NavLink key={subItem.path} to={subItem.path} className={({
                    isActive
                  }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors mb-1', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                        <subItem.icon size={16} />
                        <span className="text-sm">{subItem.title}</span>
                      </NavLink>)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            {/* My Stores */}
            <li>
              <NavLink to="/my-stores" className={({
              isActive
            }) => cn('flex items-center gap-3 px-4 py-2 rounded-lg transition-colors', isActive ? 'bg-[#2A2E36] text-[#9b87f5]' : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]')}>
                <ShoppingBag size={20} />
                <span>{language === 'ar' ? 'متاجري' : 'My Stores'}</span>
              </NavLink>
            </li>
            
            <li>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]">
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>;
};
export default AppSidebar;