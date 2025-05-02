
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a redirect component to ensure we use the newer FormsPage.tsx
const Forms = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Redirect to the new FormsPage with a small delay to ensure
    // proper navigation and avoid any race conditions
    const timer = setTimeout(() => {
      navigate('/forms', { replace: true });
      setIsRedirecting(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      {isRedirecting ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full mb-4"></div>
          <p className="text-purple-600">Redirecting to forms page...</p>
        </div>
      ) : null}
    </div>
  );
};

export default Forms;
