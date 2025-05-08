
import React, { useEffect } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const Forms = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();

  useEffect(() => {
    // If no user or shop, redirect to Shopify connect page
    if (!shop) {
      navigate('/shopify');
    }
  }, [user, shop, navigate]);

  return <FormsPage />;
};

export default Forms;
