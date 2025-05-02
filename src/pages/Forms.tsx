
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormsPage from './FormsPage';

// This is a redirect component to ensure we use the newer FormsPage.tsx
const Forms = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectComplete, setRedirectComplete] = useState(false);

  useEffect(() => {
    // Instead of redirecting, we'll just render FormsPage directly
    setRedirectComplete(true);
    
    // Clean up any old redirect logic
    const cleanUp = () => {
      const currentPath = window.location.pathname;
      // Only navigate if we're at the old path
      if (currentPath === '/Forms' || currentPath === '/Forms/') {
        navigate('/forms', { replace: true });
      }
    };
    
    // Run cleanup with a small delay to avoid navigation loops
    setTimeout(cleanUp, 0);
  }, [navigate]);

  // Instead of redirecting, we'll just render FormsPage directly
  if (redirectComplete) {
    return <FormsPage />;
  }

  // Show loading while setting up
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full mb-4"></div>
        <p className="text-purple-600">Loading forms...</p>
      </div>
    </div>
  );
};

export default Forms;
