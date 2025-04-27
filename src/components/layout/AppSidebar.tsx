
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Settings, LayoutGrid, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { 
      name: 'لوحة التحكم', 
      path: '/dashboard', 
      icon: Home 
    },
    { 
      name: 'النماذج', 
      path: '/forms', 
      icon: LayoutGrid 
    },
    { 
      name: 'الطلبات', 
      path: '/orders', 
      icon: ShoppingCart 
    },
    { 
      name: 'الإعدادات', 
      path: '/settings', 
      icon: Settings 
    }
  ];

  return (
    <aside className="w-64 bg-white border-l min-h-screen p-4 flex flex-col">
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`
                  flex items-center p-3 rounded-lg transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                <item.icon className="ml-3" size={20} />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* زر تسجيل الخروج في أسفل الشريط الجانبي */}
      <div className="mt-auto pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={signOut}
        >
          <LogOut className="ml-2" size={18} />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
