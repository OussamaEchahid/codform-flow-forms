
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShieldOff, ToggleRight, Trash2, RefreshCcw } from 'lucide-react';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';
import { toast } from 'sonner';

const ShopifyDebugPanel = () => {
  const [connectionData, setConnectionData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergencyDisabled, setIsEmergencyDisabled] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadConnectionData();
    checkEmergencyMode();
  }, []);

  const loadConnectionData = () => {
    setIsLoading(true);
    try {
      const data = {
        shopConnected: localStorage.getItem('shopify_connected') || 'null',
        shop: localStorage.getItem('shopify_shop') || 'null',
        shopifyStore: localStorage.getItem('shopify_store') || 'null',
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
      sessionStorage.removeItem('shopify_session_id');
      
      toast.success('Cleared all Shopify connection data');
      loadConnectionData();
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

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          Shopify Debug Panel
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadConnectionData} 
            className="ml-2"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Troubleshooting information for Shopify connection</CardDescription>
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
