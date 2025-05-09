
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Upload, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';
import { useShopifySettings } from '@/lib/shopify/ShopifySettingsProvider';

interface ShopifyLandingPageSyncProps {
  pageId: string;
  pageSlug: string;
  isPublished: boolean;
  productId?: string;
}

const ShopifyLandingPageSync: React.FC<ShopifyLandingPageSyncProps> = ({ 
  pageId,
  pageSlug,
  isPublished,
  productId: initialProductId 
}) => {
  const { shop, isConnected, isNetworkError, testConnection, refreshConnection } = useShopify();
  const { settings } = useShopifySettings();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncsCount, setSyncsCount] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId || null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [networkErrors, setNetworkErrors] = useState(0);
  
  // Derived state - switch to emergency mode after too many network errors
  const isEmergencyMode = networkErrors >= 2 || isNetworkError || syncAttempts >= 3 || settings.fallbackModeOnly;
  
  useEffect(() => {
    if (isNetworkError) {
      setNetworkErrors(prev => prev + 1);
    }
  }, [isNetworkError]);

  useEffect(() => {
    // Load saved sync information from localStorage
    const storedSyncInfo = localStorage.getItem(`page_sync_${pageId}`);
    if (storedSyncInfo) {
      try {
        const syncInfo = JSON.parse(storedSyncInfo);
        setLastSynced(syncInfo.lastSynced);
        setSyncsCount(syncInfo.count || 0);
        setSyncStatus(syncInfo.status || 'idle');
        
        if (syncInfo.productId) {
          setSelectedProductId(syncInfo.productId);
        }
      } catch (e) {
        console.error('Error parsing sync info:', e);
      }
    }
    
    // Load products if we're connected to Shopify
    if (shop && isConnected) {
      loadProducts();
    }
  }, [pageId, shop, isConnected]);

  const loadProducts = async () => {
    if (!shop) return;
    
    setIsLoadingProducts(true);
    try {
      const { data, error } = await fetch(`/api/shopify-products?shop=${shop}&timestamp=${Date.now()}`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
          return res.json();
        });

      if (error) {
        throw new Error(error.message || 'Error fetching products');
      }

      if (data && Array.isArray(data.products)) {
        setAvailableProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSync = async () => {
    if (!pageId || !pageSlug) {
      toast.error('Missing page information');
      return;
    }
    
    if (!shop) {
      toast.error('Not connected to a Shopify store');
      return;
    }
    
    if (!selectedProductId) {
      toast.error('Please select a product first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setErrorDetails(null);
    setSyncAttempts(prev => prev + 1);

    try {
      // Check for network issues and use emergency mode if needed
      let useEmergencyMode = isEmergencyMode;
      
      if (!useEmergencyMode) {
        try {
          // First verify connection - but with a short timeout
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 3000));
          const connectionPromise = testConnection();
          
          // Use race to implement timeout
          const connectionValid = await Promise.race([connectionPromise, timeoutPromise]);
          
          if (!connectionValid) {
            console.warn('Connection test timed out or failed, switching to emergency mode');
            useEmergencyMode = true;
            setNetworkErrors(prev => prev + 1);
          }
        } catch (e) {
          console.error('Error in connection test:', e);
          useEmergencyMode = true;
          setNetworkErrors(prev => prev + 1);
        }
      }

      // Get access token for the current shop - will be used by the edge function
      let accessToken = '';
      try {
        const tokenResponse = await fetch(`/api/shopify-token?shop=${shop}`);
        if (!tokenResponse.ok) {
          throw new Error(`Failed to get token: ${tokenResponse.status}`);
        }
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.accessToken;
        
        if (!accessToken) {
          throw new Error('No access token returned');
        }
      } catch (tokenError) {
        console.error('Error getting access token:', tokenError);
        toast.error('Failed to get access token');
        setIsSyncing(false);
        setSyncStatus('error');
        setErrorDetails('Failed to retrieve access token');
        return;
      }
      
      // Generate a unique request ID for tracking
      const requestId = `sync_${Math.random().toString(36).substring(2, 10)}`;
      
      try {
        // Call the Supabase edge function to sync with Shopify
        const response = await fetch(`https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/shopify-publish-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg'}`,
          },
          body: JSON.stringify({
            pageId,
            pageSlug,
            productId: selectedProductId,
            shop,
            accessToken,
            requestId,
            timestamp: Date.now(),
            // Pass ShopifySettings values to the function
            fallbackOnly: useEmergencyMode || settings.fallbackModeOnly,
            debugMode: settings.debugMode,
            ignoreMetaobjectErrors: useEmergencyMode || settings.ignoreMetaobjectErrors,
            bypassConnectionCheck: useEmergencyMode, // Skip connection validation in emergency mode
            forceMetaobjectCreation: false,
            maxRetries: useEmergencyMode ? 5 : 3 // More retries in emergency mode
          })
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          console.error('Error response from publish function:', data);
          throw new Error(data?.message || `Error: ${response.status}`);
        }
        
        if (!data) {
          throw new Error('Empty response from server');
        }

        if (data.success) {
          const newSyncsCount = syncsCount + 1;
          const currentTime = new Date().toLocaleString();
          
          // Save sync info to localStorage
          const syncInfo = {
            lastSynced: currentTime,
            count: newSyncsCount,
            status: data.fallbackSuccess || data.productUpdateSuccess ? 
              (data.metaobjectCreated ? 'success' : 'partial') : 'error',
            productId: selectedProductId
          };
          localStorage.setItem(`page_sync_${pageId}`, JSON.stringify(syncInfo));
          
          // Update state
          setSyncStatus(syncInfo.status);
          setLastSynced(currentTime);
          setSyncsCount(newSyncsCount);
          
          // Show appropriate toast message
          if (data.metaobjectCreated) {
            toast.success('Page published successfully to Shopify');
          } else if (data.fallbackSuccess || data.productUpdateSuccess) {
            toast.success('Page published with fallback method');
          } else {
            toast.warning('Page published with limited functionality');
          }
        } else if (data.retryWithFallback && syncAttempts < 3) {
          // Auto-retry with fallback mode
          console.log('Retrying with fallback mode enabled');
          
          // Increment network errors count to trigger emergency mode
          setNetworkErrors(prev => prev + 2); // Ensure emergency mode is triggered
          
          // Small delay before retry
          setTimeout(() => handleSync(), 1000);
          return;
        } else {
          setSyncStatus('error');
          setErrorDetails(data.message || 'Unknown error');
          
          // Save error status
          localStorage.setItem(`page_sync_${pageId}`, JSON.stringify({
            lastSynced: lastSynced,
            count: syncsCount,
            status: 'error',
            productId: selectedProductId
          }));
          
          toast.error(data.message || 'Error publishing page');
        }
      } catch (error) {
        console.error('Network error during page publishing:', error);
        setSyncStatus('error');
        setErrorDetails(`Network error: ${error.message}`);
        
        // Network errors trigger emergency mode
        setNetworkErrors(prev => prev + 1);
        
        // Save error info
        localStorage.setItem(`page_sync_${pageId}`, JSON.stringify({
          lastSynced: lastSynced,
          count: syncsCount,
          status: 'error',
          productId: selectedProductId
        }));
        
        toast.error('Network error during publishing');
      }
    } catch (error) {
      console.error('Error in sync process:', error);
      setSyncStatus('error');
      setErrorDetails(`Error: ${error.message}`);
      toast.error('Unexpected error during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await refreshConnection();
      if (success) {
        toast.success('Successfully reconnected to Shopify');
        await loadProducts();
        
        // Reset error counters after successful reconnection
        setNetworkErrors(0);
        setSyncAttempts(0);
      } else {
        toast.error('Failed to reconnect');
        setNetworkErrors(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      toast.error('Error during reconnection');
      setNetworkErrors(prev => prev + 1);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Shopify Integration
            </CardTitle>
            <CardDescription>
              Publish this landing page to your Shopify store
            </CardDescription>
          </div>
          
          {syncStatus === 'success' && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              Synced
            </Badge>
          )}
          
          {syncStatus === 'partial' && (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              Partial Sync
            </Badge>
          )}
          
          {syncStatus === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 px-2 py-1">
              <AlertCircle className="h-3 w-3" />
              Sync Failed
            </Badge>
          )}
          
          {isEmergencyMode && (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1 px-2 py-1 ml-2">
              <AlertCircle className="h-3 w-3" />
              Fallback Mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              {shop ? (
                <p className="flex items-center gap-2 font-medium">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  Connected to: {shop}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  No connected store found
                </p>
              )}
              
              <p className="text-sm mt-1">
                <span className={isPublished ? "text-green-600" : "text-amber-600"}>
                  {isPublished 
                    ? '✓ Page is published' 
                    : '⚠️ Page not published'}
                </span>
              </p>
              
              {lastSynced && (
                <p className="text-sm text-gray-500 mt-1">
                  Last synced: {lastSynced}
                </p>
              )}
              
              {syncsCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Sync count: {syncsCount}
                </p>
              )}
              
              {isEmergencyMode && (
                <p className="text-xs text-amber-600 mt-1">
                  <span className="font-medium">Network issues detected:</span> Using fallback connection mode
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end">
              <div className={`text-sm font-medium ${
                syncStatus === 'success' 
                  ? 'text-green-600' 
                  : syncStatus === 'partial'
                    ? 'text-amber-600'
                    : 'text-gray-500'
              }`}>
                {syncStatus === 'success' 
                  ? 'In sync'
                  : syncStatus === 'partial'
                    ? 'Partially synced'
                    : 'Not synced'}
              </div>
              <p className="text-xs text-gray-500">
                Sync needed after changes
              </p>
            </div>
          </div>
        </div>

        {/* Product selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Product to Link</label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(e.target.value || null)}
            disabled={isLoadingProducts || isSyncing}
          >
            <option value="">-- Select a product --</option>
            {availableProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          {isLoadingProducts && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading products...
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleSync}
            disabled={isSyncing || !shop || !pageId || !selectedProductId || isReconnecting}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : syncStatus === 'success' ? (
              <RefreshCw className="h-4 w-4 mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Publishing...' : 'Publish to Shopify'}
          </Button>
          
          <Button
            onClick={handleReconnect}
            disabled={isReconnecting || isSyncing}
            variant="outline"
            className="w-full"
          >
            {isReconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Connection
          </Button>
        </div>
        
        {syncStatus === 'success' && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Page successfully published to your store
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Your landing page is now linked to the selected product
                </p>
              </div>
            </div>
          </div>
        )}
        
        {syncStatus === 'partial' && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Page published with fallback method
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Due to network issues, we used an alternative method to publish your page
                </p>
              </div>
            </div>
          </div>
        )}
        
        {syncStatus === 'error' && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error publishing page
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {errorDetails || 'Please ensure you are connected to your Shopify store and try again.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isEmergencyMode && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Network Issues Detected
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Using emergency fallback mode due to network connectivity issues. We'll use simplified methods to ensure your page gets published.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopifyLandingPageSync;
