
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Loader2, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const ShopifyConnection = () => {
  // Context now has the disconnect method included
  const { isConnected, shopDomain, isLoading, error, reload, disconnect } = useShopifyConnection();
  const [shopInput, setShopInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize shop input with current shop domain
  useEffect(() => {
    if (shopDomain) {
      setShopInput(shopDomain);
    }
  }, [shopDomain]);

  // Clean shop domain
  const normalizeShopDomain = (domain: string): string => {
    let normalizedDomain = domain.trim().toLowerCase();
    
    // Remove protocol if present
    if (normalizedDomain.startsWith('http://') || normalizedDomain.startsWith('https://')) {
      try {
        const url = new URL(normalizedDomain);
        normalizedDomain = url.hostname;
      } catch (error) {
        console.error('Invalid URL format', error);
      }
    }
    
    // Add myshopify.com if missing
    if (!normalizedDomain.includes('.myshopify.com')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    }
    
    return normalizedDomain;
  };

  // Connect to Shopify store
  const connectStore = async () => {
    if (!shopInput.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
      return;
    }
    
    const normalizedShopDomain = normalizeShopDomain(shopInput);
    
    // Save for recovery
    localStorage.setItem('shopify_last_url_shop', normalizedShopDomain);
    
    setIsConnecting(true);
    setLocalError(null);
    
    try {
      // Initiate OAuth flow
      const { data, error } = await shopifySupabase.functions.invoke('shopify-auth', {
        body: { shop: normalizedShopDomain, clean: true }
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
      window.location.href = data.redirect;
    } catch (error) {
      console.error('Error connecting store:', error);
      setLocalError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      setIsConnecting(false);
      toast.error('فشل في الاتصال بالمتجر');
    }
  };

  // Reconnect store
  const reconnectStore = async () => {
    if (!shopDomain) {
      toast.error('لا يوجد متجر متصل للإعادة الاتصال');
      return;
    }
    
    setShopInput(shopDomain);
    await connectStore();
  };

  // Force reset connection state
  const forceReset = async () => {
    try {
      setIsResetting(true);
      
      // Disconnect properly
      await disconnect();
      
      // Clear any temporary state
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      
      toast.success('تم إعادة تعيين الاتصال بنجاح');
      
      // Force browser reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Error during force reset:', error);
      toast.error('فشل في إعادة تعيين الاتصال');
    } finally {
      setIsResetting(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Render loading state
  if (isLoading) {
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
                <p className="text-sm text-green-700">المتجر: {shopDomain}</p>
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
          <Button variant="destructive" onClick={disconnect} className="w-full">
            قطع الاتصال
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render connect state with error if exists
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          الاتصال بمتجر Shopify
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(error || localError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || localError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <Label htmlFor="shopDomain">نطاق متجر Shopify</Label>
          <Input
            id="shopDomain"
            placeholder="متجرك.myshopify.com"
            value={shopInput}
            onChange={(e) => setShopInput(e.target.value)}
            disabled={isConnecting}
          />
          <p className="text-xs text-muted-foreground">
            أدخل نطاق متجرك مثل: your-store.myshopify.com
          </p>
        </div>
        
        {/* Emergency reset button */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            إذا كنت تواجه مشاكل مستمرة في الاتصال، يمكنك إعادة تعيين حالة الاتصال بالكامل:
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
