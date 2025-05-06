
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  ShoppingBag, 
  RefreshCcw, 
  Loader2, 
  ArrowLeft,
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price?: string;
  images?: string[];
}

interface DebugInfo {
  localStorage: {
    storedShop: string | null;
    isConnected: boolean | null;
  };
  timestamp: string;
  databaseQuery?: {
    success: boolean;
    hasData: boolean;
  };
  dbSync?: {
    attempted: boolean;
    success: boolean;
    error?: any;
  };
  storeData?: {
    shop: string;
    hasToken: boolean;
    isActive: boolean;
  };
  dbError?: string;
  tokenError?: string;
  error?: string;
}

const ShopifyProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false); 
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const navigate = useNavigate();
  
  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get active store from local storage
      const storedShop = localStorage.getItem('shopify_store');
      const isConnected = localStorage.getItem('shopify_connected') === 'true';
      
      // Collect debug info
      const debugData: DebugInfo = {
        localStorage: {
          storedShop,
          isConnected,
        },
        timestamp: new Date().toISOString()
      };
      
      if (!storedShop || !isConnected) {
        setIsConnected(false);
        setError('No Shopify store connected. Please connect to a Shopify store first.');
        setDebugInfo(debugData);
        setIsLoading(false);
        return false;
      }
      
      // Get token from database
      try {
        const { data, error } = await shopifySupabase
          .from('shopify_stores')
          .select('*')
          .eq('shop', storedShop)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        debugData.databaseQuery = { success: !error, hasData: data && data.length > 0 };
        
        if (error) {
          console.error('Error retrieving store information:', error);
          setIsConnected(false);
          setError('Could not retrieve store information from database.');
          debugData.dbError = error.message;
          setDebugInfo(debugData);
          setIsLoading(false);
          return false;
        }
        
        if (!data || data.length === 0) {
          console.error('Store not found in database:', storedShop);
          
          // Try to create or update the store record
          try {
            await shopifyConnectionService.syncStoreToDatabase(storedShop);
            debugData.dbSync = { attempted: true, success: true };
          } catch (syncError) {
            debugData.dbSync = { 
              attempted: true, 
              success: false, 
              error: syncError instanceof Error ? syncError.message : String(syncError) 
            };
          }
          
          setIsConnected(true); // Still allow connection based on localStorage
          setShop(storedShop);
          setDebugInfo(debugData);
          setIsLoading(false);
          return true;
        }
        
        // Store found in database
        debugData.storeData = { 
          shop: data[0].shop,
          hasToken: !!data[0].access_token,
          isActive: data[0].is_active
        };
        
        // Check if the token looks valid
        if (!data[0].access_token || data[0].access_token === 'placeholder_token') {
          debugData.tokenError = 'Access token missing or invalid';
          setTokenError(true);
        }
        
        setShop(storedShop);
        setIsConnected(true);
        setDebugInfo(debugData);
        setIsLoading(false);
        return true;
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Even if there's a database error, we'll still allow the connection based on localStorage
        setShop(storedShop);
        setIsConnected(true);
        debugData.dbError = dbError instanceof Error ? dbError.message : String(dbError);
        setDebugInfo(debugData);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setIsConnected(false);
      setError('Error checking Shopify connection status.');
      setDebugInfo({
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
        localStorage: {
          storedShop: localStorage.getItem('shopify_store'),
          isConnected: localStorage.getItem('shopify_connected') === 'true'
        }
      });
      setIsLoading(false);
      return false;
    }
  }, []);
  
  const fetchProducts = useCallback(async () => {
    const storedShop = shop || localStorage.getItem('shopify_store');
    
    if (!storedShop) {
      toast.error('No Shopify store connected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if token exists and is valid
      let accessToken;
      try {
        accessToken = await shopifyConnectionService.getAccessToken(storedShop);
        
        if (!accessToken || accessToken === 'placeholder_token') {
          setTokenError(true);
          throw new Error('Invalid or missing access token. Please reconnect your store.');
        }
      } catch (tokenError) {
        console.error('Error getting access token:', tokenError);
        setTokenError(true);
        throw new Error('Failed to get a valid access token. Please reconnect your Shopify store.');
      }
      
      console.log(`Fetching products for shop: ${storedShop}`);
      
      // Fetch products using the edge function
      const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
        body: { shop: storedShop, accessToken }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data || !data.success) {
        if (data?.error && data.error.includes('Invalid API key or access token')) {
          setTokenError(true);
          throw new Error('Invalid Shopify API token. Please reconnect your store.');
        }
        throw new Error(data?.message || 'Failed to fetch products');
      }
      
      if (!data.products) {
        throw new Error('Invalid response format from API');
      }
      
      setProducts(data.products);
      toast.success(`Loaded ${data.products.length} products from Shopify`);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [shop]);
  
  const handleReconnect = () => {
    setIsReconnecting(true);
    
    try {
      // Get the shop domain
      const shopDomain = shop || localStorage.getItem('shopify_store') || '';
      if (!shopDomain) {
        toast.error('No store to reconnect');
        setIsReconnecting(false);
        return;
      }
      
      // Force-clean existing connection
      shopifyConnectionService.completeConnectionReset();
      
      // Navigate to Shopify connection page with the shop parameter and force_update flag
      navigate(`/shopify?shop=${encodeURIComponent(shopDomain)}&force_update=true`);
    } catch (error) {
      console.error('Error during reconnect:', error);
      setIsReconnecting(false);
      toast.error('Failed to start reconnection process');
    }
  };
  
  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
  // Show diagnostic info
  const showDiagnostics = () => {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Diagnostic Information</CardTitle>
        </CardHeader>
        <CardContent className="max-h-60 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap bg-slate-100 p-2 rounded-md">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shopify Products</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Check your Shopify store connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center text-green-600">
              <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center">
                <ShoppingBag className="mr-1 h-3 w-3" />
                Connected
              </Badge>
              <span className="ml-2 font-medium">{shop}</span>
              
              {tokenError && (
                <Badge variant="outline" className="ml-3 bg-yellow-50 text-yellow-600 flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Invalid Token
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                Not Connected
              </Badge>
              {error && <span className="ml-2">{error}</span>}
            </div>
          )}
          
          {tokenError && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Your Shopify access token appears to be invalid or expired. 
                Please reconnect your store to continue using this feature.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={checkConnection} disabled={isLoading}>
            {isLoading && !isReconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>
          
          {tokenError ? (
            <Button 
              variant="destructive" 
              onClick={handleReconnect} 
              disabled={isReconnecting}
              className="w-full sm:w-auto"
            >
              {isReconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reconnect Store
            </Button>
          ) : (
            <Button 
              onClick={fetchProducts} 
              disabled={!isConnected || isLoading || tokenError}
              variant="default"
              className="w-full sm:w-auto"
            >
              {isLoading && !isReconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ShoppingBag className="mr-2 h-4 w-4" />
              Load Products
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="truncate">{product.title}</CardTitle>
              <CardDescription>{product.handle}</CardDescription>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 && (
                <div className="h-40 w-full overflow-hidden rounded mb-3">
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {product.price && (
                <div className="font-medium">${parseFloat(product.price).toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {products.length === 0 && !isLoading && isConnected && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p>Click "Load Products" to fetch products from your Shopify store.</p>
        </div>
      )}
      
      {/* Show diagnostic information */}
      {debugInfo && showDiagnostics()}
    </div>
  );
};

export default ShopifyProducts;
