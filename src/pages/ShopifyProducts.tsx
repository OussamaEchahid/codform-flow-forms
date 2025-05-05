
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ShopifyProductsList from '@/components/shopify/ShopifyProductsList';
import AppSidebar from '@/components/layout/AppSidebar';

const ShopifyProducts = () => {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const {
    isConnected,
    isLoading,
    tokenError,
    loadProducts,
    products,
    shop,
    testConnection
  } = useShopify();

  useEffect(() => {
    // Initial page load
    const init = async () => {
      setIsPageLoading(true);
      try {
        // Test connection on page load
        await testConnection();
        
        // Load products if connected
        if (isConnected) {
          await loadProducts();
        }
      } catch (error) {
        console.error("Error initializing products page:", error);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    init();
  }, [isConnected, testConnection, loadProducts]);

  const handleLoadProducts = async () => {
    try {
      await loadProducts();
      toast.success("Products loaded successfully");
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection(true);
      if (result) {
        toast.success(`Connected to Shopify store: ${shop}`);
      } else {
        toast.error("Connection failed");
      }
    } catch (error) {
      toast.error("Connection test failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Shopify Products</h1>
            <p className="text-muted-foreground mt-2">
              This page allows you to view and test your Shopify products integration
            </p>
          </header>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                
                {shop && (
                  <div>
                    <span className="font-medium">Store:</span> {shop}
                  </div>
                )}
                
                {tokenError && (
                  <div className="text-red-500">
                    There is a problem with your Shopify connection. Please reconnect.
                  </div>
                )}
                
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleTestConnection} variant="secondary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                  </Button>
                  
                  <Button onClick={handleLoadProducts} disabled={!isConnected || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Load Products
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              {isPageLoading || isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ShopifyProductsList products={products} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShopifyProducts;
