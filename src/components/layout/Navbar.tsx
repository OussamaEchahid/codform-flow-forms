
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { user, shopifyConnected } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Define navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/forms', label: 'Forms' },
    { path: '/submissions', label: 'Submissions' },
    { path: '/shopify', label: 'Shopify' },
    { path: '/settings', label: 'Settings' }
  ];
  
  // Check if the path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex">
            <Link to="/" className="text-xl font-bold text-purple-600">
              CodForm
            </Link>
            
            <nav className="ml-10 hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div>
            {user ? (
              <div className="flex items-center">
                {shopifyConnected && (
                  <span className="mr-4 text-sm text-gray-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                    Shopify Connected
                  </span>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </Button>
              </div>
            ) : (
              <Button 
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
