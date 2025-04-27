
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Settings, LayoutGrid } from 'lucide-react';

const AppSidebar = () => {
  const location = useLocation();

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
    <aside className="w-64 bg-white border-l min-h-screen p-4">
      <nav>
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
    </aside>
  );
};

export default AppSidebar;
