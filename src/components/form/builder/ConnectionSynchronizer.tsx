
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { connectionLogger } from '@/lib/shopify/debug-logger';
import { supabase } from '@/integrations/supabase/client';

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
      connectionLogger.info("ConnectionSynchronizer: Validating connection state");
      
      try {
        // Get the active shop ID from various sources
        const shopFromAuth = shop;
        const shopFromLocalStorage = localStorage.getItem('shopify_store');
        const shopFromConnectionManager = shopifyConnectionManager.getActiveStore();
        const isConnectedFromAuth = shopifyConnected;
        const isConnectedFromLocalStorage = localStorage.getItem('shopify_connected') === 'true';
        
        connectionLogger.info("Connection sources:", {
          shopFromAuth,
          shopFromLocalStorage,
          shopFromConnectionManager, 
          isConnectedFromAuth, 
          isConnectedFromLocalStorage
        });
        
        // If we have inconsistent state
        if ((shopFromAuth || shopFromLocalStorage || shopFromConnectionManager) && 
            (!isConnectedFromAuth && !isConnectedFromLocalStorage)) {
              
          connectionLogger.info("Connection state inconsistent - fixing...");
          // We have a shop ID but connection state is false - fix this
          const shopToUse = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
          
          if (shopToUse) {
            connectionLogger.info("Setting active store to:", shopToUse);
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
            connectionLogger.info("Synchronizing shop ID across all sources to:", shopToUse);
            shopifyConnectionManager.setActiveStore(shopToUse);
            localStorage.setItem('shopify_store', shopToUse);
            localStorage.setItem('shopify_connected', 'true');
            
            // Update our state
            setConnectionStatus({
              isConnected: true,
              shopId: shopToUse
            });
            
            if (onConnectionChange) {
              onConnectionChange(true, shopToUse);
            }
          }
          
          // Verify against database to ensure we have a valid connection
          const { data, error } = await supabase
            .from('shopify_stores')
            .select('*')
            .eq('shop', shopToUse)
            .eq('is_active', true)
            .limit(1);
            
          if (error) {
            connectionLogger.error("Error checking database for shop:", error);
          } else if (!data || data.length === 0) {
            connectionLogger.warn("Shop not found in database or not active:", shopToUse);
            // Create a diagnostic info dump for debugging
            const diagnosticInfo = {
              localStorage: {
                storedShop: localStorage.getItem('shopify_store'),
                isConnected: localStorage.getItem('shopify_connected') === 'true'
              },
              timestamp: new Date().toISOString(),
              databaseQuery: {
                success: !error,
                hasData: data && data.length > 0
              },
              storeData: data && data.length > 0 ? {
                shop: data[0].shop,
                hasToken: !!data[0].access_token,
                isActive: data[0].is_active,
                isPlaceholderToken: data[0].access_token === 'placeholder_token'
              } : null
            };
            connectionLogger.info("Connection diagnostic info:", diagnosticInfo);
          } else {
            // We have confirmed the shop exists in the database and is active
            connectionLogger.info("Shop confirmed in database:", data[0].shop);
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
      } catch (error) {
        connectionLogger.error("Error in validateConnection:", error);
      }
    };
    
    validateConnection();
  }, [shop, shopifyConnected, onConnectionChange]);
  
  // Function to retry connection verification
  const verifyConnection = async () => {
    setIsSyncing(true);
    
    try {
      // First check if we have a shop in the database regardless of authentication state
      const shopToCheck = connectionStatus.shopId || 
                          shop || 
                          localStorage.getItem('shopify_store') || 
                          shopifyConnectionManager.getActiveStore();
                          
      if (!shopToCheck) {
        toast.error("No shop ID available to verify connection");
        return;
      }
      
      // Check database for this shop
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shopToCheck)
        .limit(1);
        
      if (error) {
        connectionLogger.error("Database query error:", error);
        toast.error("Error verifying connection with database");
        return;
      }
      
      if (!data || data.length === 0) {
        connectionLogger.warn("Shop not found in database:", shopToCheck);
        toast.error("Store not found in database. Please reconnect to Shopify");
        return;
      }
      
      // We have the shop in the database, enforce connection state
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_store', shopToCheck);
      shopifyConnectionManager.setActiveStore(shopToCheck);
      
      // Force connection manager to validate state
      const isValid = shopifyConnectionManager.validateConnectionState();
      connectionLogger.info("Connection validation result:", isValid);
      
      // Create diagnostic info for debugging
      const diagnosticInfo = {
        localStorage: {
          storedShop: localStorage.getItem('shopify_store'),
          isConnected: localStorage.getItem('shopify_connected') === 'true'
        },
        timestamp: new Date().toISOString(),
        databaseQuery: {
          success: !error,
          hasData: data && data.length > 0
        },
        storeData: data && data.length > 0 ? {
          shop: data[0].shop,
          hasToken: !!data[0].access_token,
          isActive: data[0].is_active,
          isPlaceholderToken: data[0].access_token === 'placeholder_token'
        } : null
      };
      
      // Log the diagnostic info
      console.log("Connection diagnostic info:", diagnosticInfo);
      connectionLogger.info("Connection diagnostic info:", diagnosticInfo);
      
      // Update state with new connection status
      setConnectionStatus({
        isConnected: true,
        shopId: shopToCheck
      });
      
      if (onConnectionChange) {
        onConnectionChange(true, shopToCheck);
      }
      
      toast.success("Connection verified successfully");
    } catch (error) {
      console.error("Connection verification error:", error);
      connectionLogger.error("Connection verification error:", error);
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
