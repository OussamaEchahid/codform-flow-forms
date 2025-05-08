
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Loader2 } from 'lucide-react';

const Forms = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  
  useEffect(() => {
    const validateConnection = async () => {
      console.log("Forms: Validating connection");
      
      // Check connection from multiple sources
      const shopFromAuth = shop;
      const shopFromLocalStorage = localStorage.getItem('shopify_store');
      const shopFromConnectionManager = shopifyConnectionManager.getActiveStore();
      
      const hasShopId = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
      
      console.log("Connection validation results:", {
        shopFromAuth,
        shopFromLocalStorage,
        shopFromConnectionManager,
        hasShopId
      });
      
      // If we don't have a shop ID from any source, redirect to Shopify connect page
      if (!hasShopId) {
        console.log("No shop ID found, redirecting to Shopify connect page");
        navigate('/shopify');
        return;
      }
      
      // If we have inconsistent shop IDs, fix by using the most reliable source
      if (shopFromAuth && shopFromLocalStorage && shopFromAuth !== shopFromLocalStorage) {
        console.log("Inconsistent shop IDs found, fixing");
        localStorage.setItem('shopify_store', shopFromAuth);
      }
      
      // Make sure connection manager is in sync
      const isValid = shopifyConnectionManager.validateConnectionState();
      console.log("Connection manager validation result:", isValid);
      
      setIsValidating(false);
    };
    
    validateConnection();
  }, [user, shop, navigate]);
  
  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <FormsPage />;
};

export default Forms;
