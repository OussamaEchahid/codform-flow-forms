
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AppSidebar = () => {
  const navItems = [
    { title: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
    { title: 'النماذج', path: '/forms', icon: FileText },
    { title: 'الطلبات', path: '/orders', icon: ShoppingCart },
    { title: 'صفحات الهبوط', path: '/landing-pages', icon: ImageIcon },
    { title: 'العروض السريعة', path: '/upsells', icon: Gift },
    { title: 'عروض الكمية', path: '/quantity-offers', icon: BarChart },
    { title: 'الإعدادات', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="min-h-screen w-64 bg-[#1E2127] text-white">
      <div className="p-4">
        <div className="mb-6">
          <span className="text-2xl font-bold text-[#FF6B00]">COD</span>
          <span className="text-2xl font-bold text-white">FORM</span>
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
                        ? 'bg-[#2A2E36] text-white'
                        : 'text-gray-400 hover:bg-[#2A2E36] hover:text-white'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
