
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
  const [accessToken, setAccessToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'placeholder' | 'unknown'>('unknown');
  const navigate = useNavigate();

  // Check existing connection on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Check connection status - single source of truth
  const checkConnectionStatus = async () => {
    setIsCheckingStatus(true);
    setConnectionError(null);
    
    try {
      // Check local storage first for quick UI feedback
      const storedShop = localStorage.getItem('shopify_store');
      const storedConnected = localStorage.getItem('shopify_connected') === 'true';
      
      if (!storedShop) {
        setIsConnected(false);
        setIsCheckingStatus(false);
        return;
      }
      
      // Verify against database
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', storedShop)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching store data:', error);
        setConnectionError('خطأ في التحقق من حالة الاتصال');
        setIsConnected(false);
        setIsCheckingStatus(false);
        return;
      }
      
      if (data && data.length > 0) {
        const token = data[0].access_token || '';
        setConnectedShop(storedShop);
        
        // Check if token is valid
        if (!token) {
          setTokenStatus('invalid');
          setIsConnected(storedConnected); // Still consider connected but with invalid token
        } else if (token === 'placeholder_token') {
          setTokenStatus('placeholder');
          setIsConnected(storedConnected); // Still consider connected but with placeholder token
        } else {
          // Test token validity
          const isValid = await testToken(storedShop, token);
          setTokenStatus(isValid ? 'valid' : 'invalid');
          setIsConnected(isValid);
        }
      } else {
        // No store found in database
        setIsConnected(false);
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
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
        console.error('Error testing token:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error testing token:', error);
      return false;
    }
  };

  // Connect to Shopify store
  const connectStore = async () => {
    if (!shopDomain.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
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
        console.error('Invalid URL format', error);
      }
    }
    
    // Add myshopify.com if missing
    if (!normalizedShopDomain.includes('.myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    // Save for recovery
    localStorage.setItem('shopify_last_url_shop', normalizedShopDomain);
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Initiate OAuth flow
      const { data, error } = await shopifySupabase.functions.invoke('shopify-auth', {
        body: { shop: normalizedShopDomain }
      });
      
      if (error) {
        throw new Error(`فشل في بدء عملية الاتصال: ${error.message}`);
      }
      
      if (!data || !data.redirect) {
        throw new Error('لم يتم استلام رابط إعادة التوجيه');
      }
      
      // Store connecting shop temporarily
      localStorage.setItem('shopify_temp_store', normalizedShopDomain);
      
      // Redirect to Shopify OAuth
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 500);
    } catch (error) {
      console.error('Error connecting store:', error);
      setConnectionError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      setIsConnecting(false);
      toast.error('فشل في الاتصال بالمتجر');
    }
  };

  // Update token manually
  const updateToken = async () => {
    if (!connectedShop || !accessToken.trim()) {
      toast.error('يرجى إدخال رمز الوصول');
      return;
    }
    
    setIsUpdatingToken(true);
    
    try {
      // Update token in database
      const { error } = await shopifyStores()
        .update({ access_token: accessToken })
        .eq('shop', connectedShop);
        
      if (error) {
        throw error;
      }
      
      // Test token validity
      const isValid = await testToken(connectedShop, accessToken);
      
      if (isValid) {
        toast.success('تم تحديث رمز الوصول بنجاح');
        setTokenStatus('valid');
        setIsConnected(true);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        toast.error('رمز الوصول غير صالح');
        setTokenStatus('invalid');
      }
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error('فشل في تحديث رمز الوصول');
    } finally {
      setIsUpdatingToken(false);
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
          .update({ is_active: false })
          .eq('shop', connectedShop);
      }
      
      // Clear local storage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem('shopify_active_store');
      localStorage.removeItem('shopify_connected_stores');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('shopify_recovery_mode');
      
      setIsConnected(false);
      setConnectedShop(null);
      setTokenStatus('unknown');
      
      toast.success('تم قطع الاتصال بنجاح');
    } catch (error) {
      console.error('Error disconnecting store:', error);
      toast.error('فشل في قطع الاتصال');
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
          
          {(tokenStatus === 'placeholder' || tokenStatus === 'invalid') && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {tokenStatus === 'placeholder' 
                  ? 'تم استخدام رمز مؤقت. يرجى تحديث رمز الوصول أدناه.' 
                  : 'رمز الوصول غير صالح. يرجى تحديثه أدناه.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Token update form */}
          <div className="space-y-4 mb-4">
            <Label htmlFor="accessToken">تحديث رمز الوصول</Label>
            <Input
              id="accessToken"
              placeholder="أدخل رمز وصول API الإدارة..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              يمكنك الحصول على رمز API من لوحة تحكم متجرك: إعدادات {'>'} التطبيقات {'>'} تطوير التطبيقات {'>'} رمز وصول API.
            </p>
            <Button 
              onClick={updateToken} 
              disabled={isUpdatingToken || !accessToken}
              className="w-full"
            >
              {isUpdatingToken ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              تحديث رمز الوصول
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={goToDashboard} className="w-full">
            الذهاب إلى لوحة التحكم
          </Button>
          <Button variant="outline" onClick={disconnectStore} className="w-full">
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
