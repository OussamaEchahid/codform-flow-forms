import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
const Navbar = () => {
  return <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">CODMagnet</Link>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link to="/dashboard">لوحة التحكم</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;