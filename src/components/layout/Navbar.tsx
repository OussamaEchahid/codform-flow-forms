import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

const Navbar = () => {
  const { user, signOut } = useAuth();

  console.log('🔍 Navbar - User state:', { user: !!user, userEmail: user?.email });

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">CODMagnet</Link>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link to="/dashboard">لوحة التحكم</Link>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      الإعدادات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;