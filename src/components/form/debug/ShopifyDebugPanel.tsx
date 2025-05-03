
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShieldOff, ToggleRight, Trash2, RefreshCcw, Store } from 'lucide-react';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';
import { toast } from 'sonner';

const ShopifyDebugPanel = () => {
  const [connectionData, setConnectionData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergencyDisabled, setIsEmergencyDisabled] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Load data on mount and auto-enable emergency mode
  useEffect(() => {
    loadConnectionData();
    checkEmergencyMode();
    
    // Automatically enable emergency mode when the debug panel is shown
    // This helps prevent infinite loops
    if (!ShopifyConnectionManager.isEmergencyDisabled()) {
      console.log("Auto-enabling emergency mode for safety");
      ShopifyConnectionManager.toggleEmergencyDisable(true);
      setIsEmergencyDisabled(true);
    }
    
    // Load any existing temporary store
    const tempStore = ShopifyConnectionManager.getCurrentStoreTarget();
    if (tempStore) {
      setShopDomain(tempStore);
    }
  }, []);

  const loadConnectionData = () => {
    setIsLoading(true);
    try {
      const data = {
        shopConnected: localStorage.getItem('shopify_connected') || 'null',
        shop: localStorage.getItem('shopify_shop') || 'null',
        shopifyStore: localStorage.getItem('shopify_store') || 'null',
        tempStore: localStorage.getItem('shopify_temp_store') || 'null',
        lastCheckTime: localStorage.getItem('shopify_last_check_time') || 'null',
        lastConnectTime: localStorage.getItem('shopify_last_connect_time') || 'null',
        connectAttempts: localStorage.getItem('shopify_connect_attempts') || '0',
        throttleUntil: localStorage.getItem('shopify_throttle_until') || 'null',
        lastConnectAttempt: localStorage.getItem('shopify_last_connect_attempt') || 'null',
        sessionId: sessionStorage.getItem('shopify_session_id') || 'null',
        emergencyDisabled: localStorage.getItem('emergency_disable_shopify_checks') || 'false',
      };
      setConnectionData(data);
    } catch (err) {
      console.error('Error loading debug data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmergencyMode = () => {
    const isDisabled = ShopifyConnectionManager.isEmergencyDisabled();
    setIsEmergencyDisabled(isDisabled);
  };

  const clearConnectionData = () => {
    try {
      // Clear all Shopify related data
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_shop');
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_last_check_time');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_connect_attempts');
      localStorage.removeItem('shopify_throttle_until');
      localStorage.removeItem('shopify_last_connect_attempt');
      localStorage.removeItem('shopify_temp_store');
      sessionStorage.removeItem('shopify_session_id');
      
      toast.success('Cleared all Shopify connection data');
      loadConnectionData();
      setShopDomain('');
    } catch (err) {
      console.error('Failed to clear data', err);
      toast.error('Failed to clear data');
    }
  };

  const toggleEmergencyMode = () => {
    const newValue = ShopifyConnectionManager.toggleEmergencyDisable();
    setIsEmergencyDisabled(newValue);
    toast.success(newValue ? 
      'Emergency mode activated - all Shopify checks disabled' : 
      'Emergency mode deactivated - Shopify checks enabled'
    );
    loadConnectionData();
  };
  
  const handleConnectToStore = () => {
    if (!shopDomain) {
      toast.error('Please enter a shop domain');
      return;
    }
    
    try {
      // Save the store domain as the temporary target
      ShopifyConnectionManager.setTempStore(shopDomain);
      setRedirecting(true);
      toast.success(`Connecting to ${shopDomain}...`);
      
      // Use short timeout to ensure the UI updates before redirecting
      setTimeout(() => {
        // Redirect to the auth endpoint with the shop parameter
        const clientUrl = window.location.origin;
        const redirectUrl = `/auth?shop=${encodeURIComponent(shopDomain)}&timestamp=${Date.now()}&client=${encodeURIComponent(clientUrl)}`;
        window.location.href = redirectUrl;
      }, 500);
    } catch (err) {
      console.error('Failed to initiate connection', err);
      toast.error('Failed to connect to shop');
      setRedirecting(false);
    }
  };

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          Shopify Connection Manager
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadConnectionData} 
            className="ml-2"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Connect to any Shopify store</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-2 bg-red-100 border border-red-200 rounded-md mb-2">
            <div className="flex justify-between items-center">
              <div className="font-medium text-red-800 flex items-center">
                <ShieldOff className="h-4 w-4 mr-2" />
                Emergency Mode: {isEmergencyDisabled ? 'ENABLED' : 'Disabled'}
              </div>
              <Button 
                variant={isEmergencyDisabled ? "default" : "destructive"} 
                size="sm" 
                onClick={toggleEmergencyMode}
              >
                <ToggleRight className="h-4 w-4 mr-1" />
                {isEmergencyDisabled ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
              </Button>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Emergency mode completely disables automatic Shopify connection checks that might be causing UI freezing or infinite refreshes
            </p>
          </div>
          
          <div className="p-4 bg-white border rounded-md">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <Store className="h-4 w-4 mr-2" />
              Connect to Shopify Store
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Domain
                </label>
                <Input
                  id="shopDomain"
                  placeholder="your-store.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Shopify store domain (e.g., your-store.myshopify.com)
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleConnectToStore}
                disabled={!shopDomain || redirecting}
              >
                {redirecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  'Connect to Store'
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(connectionData).map(([key, value]) => (
              <div key={key} className="bg-white p-2 rounded border">
                <span className="font-medium">{key}:</span> {value?.toString()}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4">
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={clearConnectionData}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Connection Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopifyDebugPanel;
