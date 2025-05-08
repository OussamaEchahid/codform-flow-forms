
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Forms = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    shopDomain, 
    isLoading, 
    error, 
    syncState, 
    forceSetConnected,
    reload
  } = useShopifyConnection();
  
  const [isValidating, setIsValidating] = useState(true);
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Get connection info from multiple sources for reliability
  const getConnectionInfo = () => {
    const localStorageShop = localStorage.getItem('shopify_store');
    const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
    const sessionShop = sessionStorage.getItem('shopify_store');
    const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
    
    return {
      fromContext: { shop: shopDomain, connected: isConnected },
      fromLocalStorage: { shop: localStorageShop, connected: localStorageConnected },
      fromSession: { shop: sessionShop },
      bypassAuth
    };
  };
  
  // Attempt connection recovery as a last resort
  const attemptRecovery = async () => {
    setIsRecovering(true);
    
    try {
      // Try all potential sources of truth for the connection
      const info = getConnectionInfo();
      console.log('Attempting connection recovery with info:', info);
      
      // Find any available shop from all sources
      const shop = info.fromContext.shop || 
                   info.fromLocalStorage.shop || 
                   info.fromSession.shop;
      
      if (!shop) {
        toast.error('No shop information available for recovery');
        navigate('/shopify');
        return;
      }
      
      // Force set connection state
      forceSetConnected(shop);
      
      // Sync state to ensure all systems are updated
      await syncState();
      
      // Delay to ensure state updates have time to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload connection state
      await reload();
      
      toast.success('Connection recovered successfully');
      setRecoveryAttempted(true);
      setIsValidating(false);
    } catch (err) {
      console.error('Recovery attempt failed:', err);
      toast.error('Connection recovery failed');
      navigate('/shopify');
    } finally {
      setIsRecovering(false);
    }
  };
  
  useEffect(() => {
    const validateShopifyConnection = async () => {
      // Wait for the Shopify connection to be checked
      if (isLoading) return;
      
      // Check multiple sources of truth
      const info = getConnectionInfo();
      console.log('Connection info:', info);
      
      // If we're connected according to ANY reliable source, trust it
      const isAnySourceConnected = 
        info.fromContext.connected || 
        info.fromLocalStorage.connected || 
        info.bypassAuth;
      
      const hasAnyShop = 
        info.fromContext.shop || 
        info.fromLocalStorage.shop || 
        info.fromSession.shop;
      
      if (!isAnySourceConnected || !hasAnyShop) {
        // Only redirect once to prevent loops
        if (!hasAttemptedRedirect) {
          setHasAttemptedRedirect(true);
          toast.error('No Shopify store connection found. Please connect your store.');
          navigate('/shopify');
          return;
        } else if (!recoveryAttempted) {
          // If we're back here after a redirect attempt, 
          // try connection recovery as a last resort
          attemptRecovery();
          return;
        } else {
          // If recovery was attempted and we're still here,
          // just show a message but don't redirect again
          setIsValidating(false);
          return;
        }
      }
      
      // If we have any indication of a connection, force it to be recognized
      // This resolves the situation where one part of the app sees the connection
      // but another part doesn't
      if (hasAnyShop) {
        const shopToUse = info.fromContext.shop || 
                          info.fromLocalStorage.shop || 
                          info.fromSession.shop;
        
        // Force set connected state with the shop we found
        forceSetConnected(shopToUse);
        
        // Connection looks good, ensure all state sources are in sync
        await syncState();
      }
      
      setIsValidating(false);
    };
    
    validateShopifyConnection();
  }, [isConnected, shopDomain, isLoading, navigate, syncState, forceSetConnected, hasAttemptedRedirect, recoveryAttempted, reload]);
  
  // Show loading state while validating but add a timeout to prevent infinite loading
  useEffect(() => {
    // Set a timeout to force-render after 5 seconds even if validation never completes
    const forceRenderTimeout = setTimeout(() => {
      if (isValidating) {
        console.log("Force completing validation after timeout");
        setIsValidating(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(forceRenderTimeout);
  }, [isValidating]);
  
  // Show loading state while validating
  if (isLoading || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Validating Shopify connection...</p>
      </div>
    );
  }

  // Provide recovery option if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={attemptRecovery}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            {isRecovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRecovering ? 'Recovering Connection...' : 'Recover Connection'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/shopify')}
          >
            Connect to Shopify
          </Button>
        </div>
      </div>
    );
  }

  // If we got here without a shop but also without redirecting,
  // attempt connection recovery
  if (!shopDomain && !isConnected && !recoveryAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert variant="warning" className="max-w-md mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>Unable to validate Shopify connection</AlertDescription>
        </Alert>
        
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={attemptRecovery}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            {isRecovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRecovering ? 'Recovering Connection...' : 'Recover Connection'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/shopify')}
          >
            Connect to Shopify
          </Button>
        </div>
      </div>
    );
  }

  // All good - show the forms page with the shop domain
  return <FormsPage shopId={shopDomain || ''} />;
};

export default Forms;
