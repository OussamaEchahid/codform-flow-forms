
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Logout = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Clear authentication data
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_reconnect_attempts');
    
    // Show success message
    toast.success('تم تسجيل الخروج بنجاح');
    
    // Redirect to home page
    navigate('/', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">جاري تسجيل الخروج...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default Logout;
