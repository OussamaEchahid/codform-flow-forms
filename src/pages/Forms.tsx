
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Loader2 } from 'lucide-react';
import { connectionLogger } from '@/lib/shopify/debug-logger';
import { toast } from 'sonner';

const Forms = () => {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isConnectionFixed, setIsConnectionFixed] = useState(false);
  
  useEffect(() => {
    const validateConnection = async () => {
      connectionLogger.info("Forms: Validating connection");
      
      // Check connection from multiple sources
      const shopFromAuth = shop;
      const shopFromLocalStorage = localStorage.getItem('shopify_store');
      const shopFromConnectionManager = shopifyConnectionManager.getActiveStore();
      
      const hasShopId = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
      
      connectionLogger.info("Connection validation results:", {
        shopFromAuth,
        shopFromLocalStorage,
        shopFromConnectionManager,
        hasShopId
      });
      
      // If we don't have a shop ID from any source, redirect to Shopify connect page
      if (!hasShopId) {
        connectionLogger.warn("No shop ID found, redirecting to Shopify connect page");
        toast.error('No Shopify store connection found. Please connect your store.');
        navigate('/shopify');
        return;
      }
      
      // Use the most reliable source as the primary shop ID
      const shopToUse = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
      
      // If we have inconsistent shop IDs, fix by using the most reliable source
      if ((shopFromAuth && shopFromLocalStorage && shopFromAuth !== shopFromLocalStorage) || 
          (shopFromLocalStorage && shopFromConnectionManager && shopFromLocalStorage !== shopFromConnectionManager) ||
          (shopFromAuth && shopFromConnectionManager && shopFromAuth !== shopFromConnectionManager)) {
        
        connectionLogger.warn("Inconsistent shop IDs found, fixing");
        
        // Update localStorage
        localStorage.setItem('shopify_store', shopToUse);
        localStorage.setItem('shopify_connected', 'true');
        
        // Update connection manager
        shopifyConnectionManager.setActiveStore(shopToUse);
        
        setIsConnectionFixed(true);
        toast.success('Shopify connection state synchronized');
      }
      
      // Make sure connection manager is in sync
      const isValid = shopifyConnectionManager.validateConnectionState();
      connectionLogger.info("Connection manager validation result:", isValid);
      
      // Only proceed if connection is valid
      if (!isValid) {
        connectionLogger.error("Connection validation failed");
        toast.error('Connection validation failed. Trying to reestablish connection...');
        
        // Try to fix by setting active store
        shopifyConnectionManager.setActiveStore(shopToUse);
        localStorage.setItem('shopify_store', shopToUse);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      setIsValidating(false);
    };
    
    validateConnection();
  }, [user, shop, navigate]);
  
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Validating Shopify connection...</p>
      </div>
    );
  }

  return <FormsPage refreshKey={isConnectionFixed ? 1 : 0} />;
};

export default Forms;
