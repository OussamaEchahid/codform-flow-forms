
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCw, Bug, Code } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Debug panel for Shopify connection troubleshooting
 * This component helps diagnose connection issues
 */
const ShopifyDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<Record<string, any>>({});
  const { isConnected, shop, refreshConnection, verifyShopifyConnection } = useShopify();
  
  // Fetch connection info
  useEffect(() => {
    if (isExpanded) {
      updateConnectionInfo();
    }
  }, [isExpanded, isConnected, shop]);
  
  // Update connection info
  const updateConnectionInfo = () => {
    const info: Record<string, any> = {};
    
    // Get all shopify related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('shopify_')) {
        try {
          const value = localStorage.getItem(key);
          info[key] = value;
        } catch (e) {
          info[key] = 'Error reading value';
        }
      }
    });
    
    // Add hook state info
    info['hook_isConnected'] = isConnected;
    info['hook_shop'] = shop;
    
    setConnectionInfo(info);
  };
  
  // Clear all Shopify connection data
  const handleClearAll = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('shopify_')) {
          localStorage.removeItem(key);
        }
      });
      
      toast.success('All Shopify connection data cleared');
      updateConnectionInfo();
      
      // Reload page to reset all states
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      toast.error('Error clearing data: ' + (e instanceof Error ? e.message : String(e)));
    }
  };
  
  // Force refresh connection
  const handleForceRefresh = async () => {
    try {
      await verifyShopifyConnection();
      toast.success('Connection verification completed');
      updateConnectionInfo();
    } catch (e) {
      toast.error('Verification error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };
  
  return (
    <div className="mt-4 border border-gray-200 rounded-md">
      <div 
        className="p-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Bug className="h-4 w-4" />
          <span>Shopify Connection Debugger</span>
        </div>
        <button className="text-xs text-gray-500">
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-3 text-xs">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={updateConnectionInfo}
              className="text-xs h-7 px-2"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Refresh Info
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleForceRefresh}
              className="text-xs h-7 px-2"
            >
              <Code className="h-3 w-3 mr-1" />
              Verify Connection
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClearAll}
              className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All Data
            </Button>
          </div>
          
          <div className="mt-2 p-2 bg-gray-50 text-gray-800 font-mono text-xs overflow-x-auto">
            {Object.entries(connectionInfo).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-1">
                <span className="font-medium">{key}:</span>
                <span className="break-all">{String(value).substring(0, 100)}</span>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 italic mt-2">
            Note: Use Clear All if you're experiencing connection issues. This will reset all connection state.
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyDebugPanel;
