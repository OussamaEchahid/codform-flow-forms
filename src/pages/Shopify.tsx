
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

const Shopify = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check existing connection on page load
  useEffect(() => {
    const checkExistingConnection = async () => {
      setIsCheckingStatus(true);
      try {
        // Check if we have a connection in localStorage/connection manager
        const activeShop = shopifyConnectionManager.getActiveStore();
        
        if (activeShop) {
          console.log('Found active shop in connection manager:', activeShop);
          
          // Verify the connection with Supabase
          const { data, error } = await shopifyStores()
            .select('*')
            .eq('shop', activeShop)
            .order('updated_at', { ascending: false })
            .limit(1);
            
          if (error) {
            console.error('Error fetching store data:', error);
            setConnectionError('خطأ في التحقق من حالة الاتصال');
            setIsConnected(false);
          } else if (data && data.length > 0) {
            console.log('Found store data in database');
            setConnectedShop(activeShop);
            setIsConnected(true);
          } else {
            console.log('Store not found in database, clearing local state');
            shopifyConnectionManager.clearAllStores();
            setIsConnected(false);
          }
        } else {
          console.log('No active shop found in connection manager');
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionError('خطأ في التحقق من حالة الاتصال');
        setIsConnected(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    // Extract shop parameter from URL if present
    const urlParams = new URLSearchParams(location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShopDomain(shopParam);
    }

    checkExistingConnection();
  }, [location.search]);

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
      return;
    }
    
    // Clean up shop domain input
    let normalizedShopDomain = shopDomain.trim().toLowerCase();
    
    // Remove protocol if present
    if (normalizedShopDomain.startsWith('http://') || normalizedShopDomain.startsWith('https://')) {
      try {
        const url = new URL(normalizedShopDomain);
        normalizedShopDomain = url.hostname;
      } catch (e) {
        console.error('Invalid URL format', e);
      }
    }
    
    // Add myshopify.com domain if not present
    if (!normalizedShopDomain.includes('.myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    // Save last URL shop for potential recovery
    shopifyConnectionManager.saveLastUrlShop(normalizedShopDomain);
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Call Supabase Edge Function to start OAuth flow
      const { data, error } = await shopifySupabase.functions.invoke('shopify-auth', {
        body: { 
          shop: normalizedShopDomain,
          redirect_uri: 'https://your-redirect-uri.com'
        }
      });
      
      if (error) {
        throw new Error(`فشل في بدء عملية الاتصال: ${error.message}`);
      }
      
      if (!data || !data.redirect) {
        throw new Error('لم يتم استلام رابط إعادة التوجيه من الخادم');
      }
      
      console.log('Redirect URL received:', data.redirect);
      
      // Save the shop we're connecting to in localStorage for recovery if needed
      localStorage.setItem('shopify_temp_store', normalizedShopDomain);
      
      // Set up a small delay before redirect to ensure localStorage is updated
      setTimeout(() => {
        // Redirect to Shopify OAuth flow
        window.location.href = data.redirect;
      }, 500);
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء الاتصال');
      setIsConnecting(false);
      toast.error('فشل في الاتصال بالمتجر');
    }
  };
  
  const handleDisconnect = async () => {
    try {
      // Clear connection state
      shopifyConnectionManager.clearAllStores();
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      // Update state
      setIsConnected(false);
      setConnectedShop(null);
      
      toast.success('تم قطع الاتصال بنجاح');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('فشل في قطع الاتصال');
    }
  };
  
  const handleViewProducts = () => {
    navigate('/shopify-view');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>الاتصال بمتجر Shopify</CardTitle>
          <CardDescription>قم بربط متجرك لجلب المنتجات وإدارة النماذج</CardDescription>
        </CardHeader>
        
        {isCheckingStatus ? (
          <CardContent className="text-center py-6">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
            <p className="mt-4">جاري التحقق من حالة الاتصال...</p>
          </CardContent>
        ) : isConnected ? (
          <CardContent>
            <div className="p-4 bg-green-50 rounded-md border border-green-200 mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">متصل بنجاح</p>
                  <p className="text-sm text-green-700">المتجر: {connectedShop}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full" 
                variant="default" 
                onClick={handleViewProducts}
              >
                عرض منتجات المتجر
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={handleDisconnect}
              >
                قطع الاتصال
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            {connectionError && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />
                  <div className="text-sm text-red-700">{connectionError}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop">نطاق متجر Shopify</Label>
                <Input
                  id="shop"
                  placeholder="متجرك.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  disabled={isConnecting}
                />
                <p className="text-xs text-gray-500">
                  أدخل نطاق متجرك مثل: your-store.myshopify.com
                </p>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardFooter className="border-t p-4">
          {!isConnected ? (
            <Button 
              className="w-full" 
              onClick={handleConnect} 
              disabled={isConnecting || isCheckingStatus}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاتصال...
                </>
              ) : (
                'الاتصال بالمتجر'
              )}
            </Button>
          ) : (
            <div className="w-full text-center text-sm text-gray-500">
              للاتصال بمتجر مختلف، قم بقطع الاتصال أولاً
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Shopify;
