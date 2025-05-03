
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, RefreshCw, Bug, InfoIcon } from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';

const ShopifyDebugger: React.FC = () => {
  const [showDebugger, setShowDebugger] = useState(false);
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [sessionStorageData, setSessionStorageData] = useState<Record<string, any>>({});
  const { isConnected, shop, connectionStatus, refreshConnection } = useShopify();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get all Shopify-related data from local and session storage
  const collectStorageData = () => {
    const shopifyLocalData: Record<string, any> = {};
    const shopifySessionData: Record<string, any> = {};
    
    // Collect from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('shopify')) {
        let value = localStorage.getItem(key);
        try {
          // Try to parse JSON if possible
          shopifyLocalData[key] = JSON.parse(value || '');
        } catch (e) {
          shopifyLocalData[key] = value;
        }
      }
    }
    
    // Collect from sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('shopify')) {
        let value = sessionStorage.getItem(key);
        try {
          // Try to parse JSON if possible
          shopifySessionData[key] = JSON.parse(value || '');
        } catch (e) {
          shopifySessionData[key] = value;
        }
      }
    }
    
    setLocalStorageData(shopifyLocalData);
    setSessionStorageData(shopifySessionData);
  };
  
  useEffect(() => {
    // Only collect data if debugger is shown
    if (showDebugger) {
      collectStorageData();
    }
  }, [showDebugger]);
  
  const handleClearStorage = () => {
    if (window.confirm('Are you sure you want to clear all Shopify connection data? This will reset your connection.')) {
      // Clear all Shopify-related data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes('shopify')) {
          localStorage.removeItem(key);
        }
      }
      
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.includes('shopify')) {
          sessionStorage.removeItem(key);
        }
      }
      
      // Update the displayed data
      collectStorageData();
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshConnection();
    } catch (error) {
      console.error('Error refreshing connection:', error);
    } finally {
      setIsRefreshing(false);
      collectStorageData();
    }
  };
  
  if (!showDebugger) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowDebugger(true)}
          variant="outline"
          className="flex items-center gap-1"
          size="sm"
        >
          <Bug className="h-3 w-3" />
          Shopify Debug
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Shopify Connection Debug</CardTitle>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugger(false)}
            >
              Close
            </Button>
          </div>
          <CardDescription>Diagnose connection issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-80 overflow-y-auto pb-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">Connection Status:</h3>
              <Badge variant={isConnected ? "success" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">Shop:</h3>
              <span className="text-sm truncate max-w-[200px]">{shop || 'Not set'}</span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">Cache Status:</h3>
              <Badge variant={connectionStatus ? "success" : "destructive"}>
                {connectionStatus ? "Valid" : "Invalid"}
              </Badge>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="local-storage">
              <AccordionTrigger className="text-sm font-medium">
                Local Storage Data
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-xs space-y-1">
                  {Object.entries(localStorageData).length > 0 ? (
                    Object.entries(localStorageData).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="font-semibold">{key}:</span>
                        <span className="whitespace-normal break-all">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p>No Shopify data in localStorage</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="session-storage">
              <AccordionTrigger className="text-sm font-medium">
                Session Storage Data
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-xs space-y-1">
                  {Object.entries(sessionStorageData).length > 0 ? (
                    Object.entries(sessionStorageData).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="font-semibold">{key}:</span>
                        <span className="whitespace-normal break-all">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p>No Shopify data in sessionStorage</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="throttling">
              <AccordionTrigger className="text-sm font-medium">
                Connection Attempts
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Recent attempts:</span>
                    <Badge variant="outline">{ShopifyConnectionManager.getAttemptCount()}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Last attempt:</span>
                    <span>
                      {ShopifyConnectionManager.getLastAttemptTime() > 0 
                        ? new Date(ShopifyConnectionManager.getLastAttemptTime()).toLocaleTimeString() 
                        : 'Never'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Is throttled:</span>
                    <Badge variant={ShopifyConnectionManager.shouldThrottle() ? "destructive" : "outline"}>
                      {ShopifyConnectionManager.shouldThrottle() ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  {ShopifyConnectionManager.shouldThrottle() && (
                    <div className="flex justify-between items-center">
                      <span>Wait time:</span>
                      <span>{Math.ceil(ShopifyConnectionManager.getTimeToWait() / 1000)} seconds</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="pt-2 gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={collectStorageData}
            className="text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Data
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="text-xs flex items-center gap-1"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-current rounded-full border-t-transparent mr-1" />
                Checking...
              </>
            ) : (
              <>
                <InfoIcon className="h-3 w-3" />
                Check Connection
              </>
            )}
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleClearStorage}
            className="text-xs flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyDebugger;
