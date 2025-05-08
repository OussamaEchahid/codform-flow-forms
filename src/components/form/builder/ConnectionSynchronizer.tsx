
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ConnectionSynchronizerProps {
  onConnectionChange?: (isConnected: boolean, shopId: string | null) => void;
}

const ConnectionSynchronizer: React.FC<ConnectionSynchronizerProps> = ({ 
  onConnectionChange 
}) => {
  const { shop, shopifyConnected } = useAuth();
  const shopify = useShopify();
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: !!shop && shopifyConnected,
    shopId: shop || localStorage.getItem('shopify_store')
  });

  // On mount, validate and synchronize connection status
  useEffect(() => {
    const validateConnection = async () => {
      console.log("ConnectionSynchronizer: Validating connection state");
      
      // Get the active shop ID from various sources
      const shopFromAuth = shop;
      const shopFromLocalStorage = localStorage.getItem('shopify_store');
      const shopFromConnectionManager = shopifyConnectionManager.getActiveStore();
      const isConnectedFromAuth = shopifyConnected;
      const isConnectedFromLocalStorage = localStorage.getItem('shopify_connected') === 'true';
      
      console.log("Connection sources:", {
        shopFromAuth,
        shopFromLocalStorage,
        shopFromConnectionManager, 
        isConnectedFromAuth, 
        isConnectedFromLocalStorage
      });
      
      // If we have inconsistent state
      if ((shopFromAuth || shopFromLocalStorage || shopFromConnectionManager) && 
          (!isConnectedFromAuth && !isConnectedFromLocalStorage)) {
            
        console.log("Connection state inconsistent - fixing...");
        // We have a shop ID but connection state is false - fix this
        const shopToUse = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
        
        if (shopToUse) {
          console.log("Setting active store to:", shopToUse);
          shopifyConnectionManager.setActiveStore(shopToUse);
          
          // Update localStorage directly for immediate effect
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_store', shopToUse);
          
          // Update our state
          setConnectionStatus({
            isConnected: true,
            shopId: shopToUse
          });
          
          if (onConnectionChange) {
            onConnectionChange(true, shopToUse);
          }
          
          return;
        }
      }
      
      // If we have a valid shop ID from any source, ensure it's consistent across all sources
      if (shopFromAuth || shopFromLocalStorage || shopFromConnectionManager) {
        const shopToUse = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
        
        if (shopToUse !== shopFromAuth || shopToUse !== shopFromLocalStorage || shopToUse !== shopFromConnectionManager) {
          console.log("Synchronizing shop ID across all sources to:", shopToUse);
          shopifyConnectionManager.setActiveStore(shopToUse);
          localStorage.setItem('shopify_store', shopToUse);
          
          // Update our state
          setConnectionStatus({
            isConnected: true,
            shopId: shopToUse
          });
          
          if (onConnectionChange) {
            onConnectionChange(true, shopToUse);
          }
        }
      }
      
      // If everything seems good, just pass the current state
      setConnectionStatus({
        isConnected: !!shop && shopifyConnected,
        shopId: shop || shopFromLocalStorage || shopFromConnectionManager
      });
      
      if (onConnectionChange) {
        onConnectionChange(
          !!shop && shopifyConnected, 
          shop || shopFromLocalStorage || shopFromConnectionManager
        );
      }
    };
    
    validateConnection();
  }, [shop, shopifyConnected, onConnectionChange]);
  
  // Function to retry connection verification
  const verifyConnection = async () => {
    setIsSyncing(true);
    
    try {
      // Force connection manager to validate state
      const isValid = shopifyConnectionManager.validateConnectionState();
      console.log("Connection validation result:", isValid);
      
      // Test connection with the API
      const testResult = await shopify.testConnection(true);
      console.log("API connection test result:", testResult);
      
      if (testResult) {
        const shopId = shop || localStorage.getItem('shopify_store') || shopifyConnectionManager.getActiveStore();
        
        setConnectionStatus({
          isConnected: true,
          shopId
        });
        
        if (onConnectionChange) {
          onConnectionChange(true, shopId);
        }
        
        toast.success("Connection verified successfully");
      } else {
        toast.error("Connection verification failed - please reconnect your Shopify store");
      }
    } catch (error) {
      console.error("Connection verification error:", error);
      toast.error("Error verifying connection");
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="hidden">
      {/* This is a utility component that doesn't render anything visible */}
      {/* Only rendered for debugging purposes during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-muted rounded-md">
          <p className="text-xs mb-1">Debug: Connection Synchronizer</p>
          <p className="text-xs">Status: {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}</p>
          <p className="text-xs">Shop ID: {connectionStatus.shopId || 'None'}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={verifyConnection} 
            disabled={isSyncing}
            className="mt-1 h-6 text-xs"
          >
            {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
            <span className="ml-1">Verify</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConnectionSynchronizer;
