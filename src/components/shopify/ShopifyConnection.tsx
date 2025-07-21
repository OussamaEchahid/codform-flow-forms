
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Loader2, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { shopifySupabase, shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ShopifyConnection = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check existing connection on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Check connection status
  const checkConnectionStatus = async () => {
    setIsCheckingStatus(true);
    setConnectionError(null);
    
    try {
      console.log('🔍 Checking connection status...');
      
      // Check database for active stores
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('❌ Error fetching store data:', error);
        setConnectionError('خطأ في التحقق من حالة الاتصال');
        setIsConnected(false);
        setIsCheckingStatus(false);
        return;
      }
      
      if (data && data.length > 0) {
        const store = data[0];
        console.log('✅ Found active store:', store.shop);
        setConnectedShop(store.shop);
        setIsConnected(true);
        
        // Update localStorage
        localStorage.setItem('shopify_store', store.shop);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        console.log('ℹ️ No active stores found');
        setIsConnected(false);
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
      }
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
      setConnectionError('حدث خطأ أثناء التحقق من حالة الاتصال');
      setIsConnected(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Connect to Shopify store via OAuth
  const connectStore = async () => {
    if (!shopDomain.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نطاق المتجر",
        variant: "destructive"
      });
      return;
    }
    
    // Clean shop domain
    let normalizedShopDomain = shopDomain.trim().toLowerCase();
    
    // Remove protocol if present
    if (normalizedShopDomain.startsWith('http://') || normalizedShopDomain.startsWith('https://')) {
      try {
        const url = new URL(normalizedShopDomain);
        normalizedShopDomain = url.hostname;
      } catch (error) {
        console.error('❌ Invalid URL format', error);
      }
    }
    
    // Add myshopify.com if missing
    if (!normalizedShopDomain.includes('.myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log(`🚀 Starting OAuth flow for ${normalizedShopDomain}`);

      // تنظيف localStorage قبل الاتصال الجديد
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');

      // Call the shopify-auth edge function
      const { data, error } = await shopifySupabase.functions.invoke('shopify-auth', {
        body: { shop: normalizedShopDomain }
      });

      if (error) {
        console.error('❌ Auth function error:', error);
        throw new Error(`خطأ في بدء المصادقة: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Auth function failed:', data);
        throw new Error(data?.error || 'فشل في بدء المصادقة');
      }

      console.log('✅ Auth function success:', data);
      
      toast({
        title: "جاري التوجيه",
        description: "سيتم فتح نافذة Shopify للموافقة على الربط",
      });

      // Redirect to the OAuth URL
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error in OAuth flow:', error);
      setConnectionError(error instanceof Error ? error.message : 'خطأ في بدء الاتصال');
      setIsConnecting(false);
      toast({
        title: "خطأ",
        description: "فشل في بدء عملية الربط",
        variant: "destructive"
      });
    }
  };

  // Disconnect store
  const disconnectStore = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في قطع الاتصال؟')) {
      return;
    }
    
    try {
      // Update database
      if (connectedShop) {
        await shopifyStores()
          .update({ 
            is_active: false,
            access_token: null
          })
          .eq('shop', connectedShop);
      }
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');
      
      setIsConnected(false);
      setConnectedShop(null);
      
      toast({
        title: "نجح",
        description: "تم قطع الاتصال بنجاح",
      });
    } catch (error) {
      console.error('❌ Error disconnecting store:', error);
      toast({
        title: "خطأ",
        description: "فشل في قطع الاتصال",
        variant: "destructive"
      });
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Render loading state
  if (isCheckingStatus) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-4">جاري التحقق من حالة الاتصال...</p>
        </CardContent>
      </Card>
    );
  }

  // Render connected state
  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            متجر Shopify متصل
          </CardTitle>
        </CardHeader>
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={goToDashboard} className="w-full">
            الذهاب إلى لوحة التحكم
          </Button>
          <Button variant="destructive" onClick={disconnectStore} className="w-full">
            قطع الاتصال
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render connect state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          الاتصال بمتجر Shopify
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <Label htmlFor="shopDomain">نطاق متجر Shopify</Label>
          <Input
            id="shopDomain"
            placeholder="متجرك.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            disabled={isConnecting}
          />
          <p className="text-xs text-muted-foreground">
            أدخل نطاق متجرك مثل: bestform-app.myshopify.com
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={connectStore} 
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري الاتصال...
            </>
          ) : (
            'الاتصال بالمتجر'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopifyConnection;
