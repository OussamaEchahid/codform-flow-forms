
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  ShoppingBag, 
  RefreshCcw, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price?: string;
  images?: string[];
}

const ShopifyProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get active store from local storage
      const storedShop = localStorage.getItem('shopify_store');
      const isConnected = localStorage.getItem('shopify_connected') === 'true';
      
      if (!storedShop || !isConnected) {
        setIsConnected(false);
        setError('No Shopify store connected. Please connect to a Shopify store first.');
        setIsLoading(false);
        return false;
      }
      
      // Get token from database
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', storedShop)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) {
        console.error('Error retrieving store information:', error);
        setIsConnected(false);
        setError('Could not retrieve store information from database.');
        setIsLoading(false);
        return false;
      }
      
      setShop(storedShop);
      setIsConnected(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error checking connection:', err);
      setIsConnected(false);
      setError('Error checking Shopify connection status.');
      setIsLoading(false);
      return false;
    }
  }, []);
  
  const fetchProducts = useCallback(async () => {
    if (!shop) {
      toast.error('No Shopify store connected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get access token
      const accessToken = await shopifyConnectionService.getAccessToken(shop);
      
      // Fetch products
      const { data, error } = await supabase.functions.invoke('shopify-products', {
        body: { shop, accessToken }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data || !data.products) {
        throw new Error('Invalid response format from API');
      }
      
      setProducts(data.products);
      toast.success(`Loaded ${data.products.length} products from Shopify`);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error fetching products from Shopify: ' + (err instanceof Error ? err.message : String(err)));
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [shop]);
  
  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={checkConnection} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>
          
          <Button onClick={fetchProducts} disabled={!isConnected || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShoppingBag className="mr-2 h-4 w-4" />
            Load Products
          </Button>
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
    </div>
  );
};

export default ShopifyProducts;
