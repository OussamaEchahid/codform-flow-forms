
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Settings,
  BarChart,
  Gift,
  ImageIcon,
  Globe,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// تعريف الترجمات
const translations = {
  ar: {
    dashboard: 'لوحة التحكم',
    forms: 'النماذج',
    orders: 'الطلبات',
    landingPages: 'صفحات الهبوط',
    quickOffers: 'العروض السريعة',
    quantityOffers: 'عروض الكمية',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    logoutSuccess: 'تم تسجيل الخروج بنجاح',
    logoutError: 'حدث خطأ أثناء تسجيل الخروج'
  },
  en: {
    dashboard: 'Dashboard',
    forms: 'Forms',
    orders: 'Orders',
    landingPages: 'Landing Pages',
    quickOffers: 'Quick Offers',
    quantityOffers: 'Quantity Offers',
    settings: 'Settings',
    logout: 'Logout',
    logoutSuccess: 'Logged out successfully',
    logoutError: 'Error logging out'
  }
};

const AppSidebar = () => {
  const navigate = useNavigate();
  // تحديد اللغة الافتراضية
  const [language, setLanguage] = React.useState<'ar' | 'en'>('ar');

  // دالة ترجمة
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const handleLogout = async () => {
    try {
      // مسح بيانات المصادقة
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_reconnect_attempts');
      
      toast.success(t('logoutSuccess'));
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(t('logoutError'));
    }
  };

  const navItems = [
    { title: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { title: t('forms'), path: '/forms', icon: FileText },
    { title: t('orders'), path: '/orders', icon: ShoppingCart },
    { title: t('landingPages'), path: '/landing-pages', icon: ImageIcon },
    { title: t('quickOffers'), path: '/upsells', icon: Gift },
    { title: t('quantityOffers'), path: '/quantity-offers', icon: BarChart },
    { title: t('settings'), path: '/settings', icon: Settings },
  ];

  return (
    <aside className="min-h-screen w-64 bg-[#1E2127] text-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-2xl font-bold text-[#9b87f5]">COD</span>
            <span className="text-2xl font-bold text-white">FORM</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setLanguage('en')} 
                className={language === 'en' ? 'bg-muted' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('ar')} 
                className={language === 'ar' ? 'bg-muted' : ''}
              >
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-[#2A2E36] text-[#9b87f5]'
                        : 'text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
            
            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-400 hover:bg-[#2A2E36] hover:text-[#9b87f5]"
              >
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
