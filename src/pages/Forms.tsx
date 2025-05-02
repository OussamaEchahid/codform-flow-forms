
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a redirect component to ensure we use the newer FormsPage.tsx
const Forms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new FormsPage
    navigate('/forms', { replace: true });
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
    </div>
  );
};

export default Forms;
