
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
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';

const ShopifyConnection = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
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
        
        // Update localStorage
        localStorage.setItem('shopify_store', store.shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Test token validity
        if (store.access_token && store.access_token !== 'placeholder_token') {
          const isValid = await testToken(store.shop, store.access_token);
          setIsConnected(isValid);
          
          if (!isValid) {
            setConnectionError('رمز الوصول غير صالح - يرجى إعادة الاتصال');
            localStorage.setItem('shopify_connected', 'false');
          }
        } else {
          setIsConnected(false);
          setConnectionError('رمز الوصول غير موجود - يرجى الاتصال');
          localStorage.setItem('shopify_connected', 'false');
        }
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

  // Test token validity
  const testToken = async (shop: string, token: string): Promise<boolean> => {
    try {
      if (!shop || !token || token === 'placeholder_token') {
        return false;
      }
      
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: token }
      });
      
      if (error) {
        console.error('❌ Error testing token:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('❌ Error testing token:', error);
      return false;
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

      // إنشاء state parameter للأمان
      const state = crypto.randomUUID();
      localStorage.setItem('shopify_oauth_state', state);
      localStorage.setItem('shopify_connecting_shop', normalizedShopDomain);

      // بناء OAuth URL - يشير مباشرة إلى Edge Function
      const scopes = 'write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content';
      const redirectUri = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-auth-callback';
      const clientId = '7e4608874bbcc38afa1953948da28407';
      
      const oauthUrl = `https://${normalizedShopDomain}/admin/oauth/authorize?` +
        `client_id=${clientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `grant_options[]=value`;

      console.log('🔗 OAuth URL:', oauthUrl);
      
      toast({
        title: "جاري التوجيه",
        description: "سيتم فتح نافذة Shopify للموافقة على الربط",
      });

      // التوجيه المباشر إلى OAuth
      setTimeout(() => {
        window.location.href = oauthUrl;
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

  // Reconnect store
  const reconnectStore = async () => {
    if (!connectedShop) {
      toast({
        title: "خطأ",
        description: "لا يوجد متجر متصل للإعادة الاتصال",
        variant: "destructive"
      });
      return;
    }
    
    setShopDomain(connectedShop);
    await connectStore();
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

  // Force reset connection state
  const forceReset = async () => {
    try {
      setIsResetting(true);
      
      // Clear all localStorage items
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');
      localStorage.removeItem('shopify_oauth_state');
      localStorage.removeItem('shopify_connecting_shop');
      
      // Reset state
      setIsConnected(false);
      setConnectedShop(null);
      setConnectionError(null);
      
      toast({
        title: "نجح",
        description: "تم إعادة تعيين الاتصال بنجاح",
      });
      
      // Refresh page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error during force reset:', error);
      toast({
        title: "خطأ",
        description: "فشل في إعادة تعيين الاتصال",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
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
          <Button variant="outline" onClick={reconnectStore} className="w-full">
            إعادة الاتصال
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
            أدخل نطاق متجرك مثل: your-store.myshopify.com
          </p>
        </div>
        
        {/* Emergency reset button */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            إذا كنت تواجه مشاكل مستمرة في الاتصال، يمكنك إعادة تعيين حالة الاتصال:
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-amber-300 bg-amber-50 hover:bg-amber-100"
            onClick={forceReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري إعادة التعيين...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                إعادة تعيين اتصال Shopify
              </>
            )}
          </Button>
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
