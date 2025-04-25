
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-codform-purple">
              <span>COD</span>
              <span className="text-codform-dark-purple">FORM</span>
            </div>
          </div>
          
          {isMobile ? (
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
              
              {isMenuOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white shadow-md z-50 p-4 border-t border-gray-100 animate-fade-in">
                  <ul className="space-y-4">
                    <li>
                      <a 
                        href="#features" 
                        className="text-gray-700 hover:text-codform-purple block py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        المميزات
                      </a>
                    </li>
                    <li>
                      <a 
                        href="#templates" 
                        className="text-gray-700 hover:text-codform-purple block py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        القوالب
                      </a>
                    </li>
                    <li>
                      <a 
                        href="#pricing" 
                        className="text-gray-700 hover:text-codform-purple block py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        الأسعار
                      </a>
                    </li>
                    <li>
                      <Button className="w-full">تسجيل الدخول</Button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <a href="#features" className="text-gray-700 hover:text-codform-purple">المميزات</a>
              <a href="#templates" className="text-gray-700 hover:text-codform-purple">القوالب</a>
              <a href="#pricing" className="text-gray-700 hover:text-codform-purple">الأسعار</a>
              <Button>تسجيل الدخول</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
