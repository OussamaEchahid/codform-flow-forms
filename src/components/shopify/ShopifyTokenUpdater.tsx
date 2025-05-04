
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useAuth } from '@/lib/auth';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const ShopifyTokenUpdater: React.FC = () => {
  const { shop, setShop } = useAuth();
  const [accessToken, setAccessToken] = useState('');
  const [shopDomain, setShopDomain] = useState(shop || '');
  const [forceActivate, setForceActivate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [rawResponseText, setRawResponseText] = useState<string>('');
  const [edgeFunctionUrl, setEdgeFunctionUrl] = useState<string>('');
  
  // Clear any previous token errors on mount and set edge function URL
  useEffect(() => {
    localStorage.removeItem('shopify_token_error');
    
    // Use the Supabase URL from the client for the edge function
    const url = supabase.functions.url('update-shopify-token');
    setEdgeFunctionUrl(url);
    console.log("Edge function URL set to:", url);
  }, []);
  
  const validateToken = (token: string) => {
    // Check if token has the expected format
    if (token.startsWith('shpat_')) {
      setIsTokenValid(true);
      return true;
    } else {
      setIsTokenValid(false);
      return false;
    }
  };
  
  const handleAccessTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setAccessToken(newToken);
    
    if (newToken.length > 5) {
      validateToken(newToken);
    } else {
      setIsTokenValid(null);
    }
  };
  
  const handleUpdateToken = async () => {
    if (!shopDomain.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
      return;
    }
    
    if (!accessToken.trim()) {
      toast.error('يرجى إدخال رمز الوصول');
      return;
    }
    
    // Force validate token
    if (!validateToken(accessToken)) {
      toast.error('رمز الوصول غير صالح. يجب أن يبدأ بـ shpat_');
      return;
    }
    
    // Clean shop domain
    let cleanedDomain = shopDomain.trim().toLowerCase();
    if (!cleanedDomain.includes('myshopify.com')) {
      cleanedDomain = `${cleanedDomain}.myshopify.com`;
    }
    
    setIsLoading(true);
    setDebugInfo(null);
    setRawResponseText('');
    
    try {
      console.log(`Attempting to update token for shop: ${cleanedDomain}`);
      console.log(`Token type: ${accessToken.startsWith('shpat_') ? 'admin' : 'offline'}`);
      
      if (!edgeFunctionUrl) {
        // If we don't have the edge function URL from Supabase client, fall back to constructing it
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nhqrngdzuatdnfkihtud.supabase.co';
        setEdgeFunctionUrl(`${supabaseUrl}/functions/v1/update-shopify-token`);
        console.log("Edge function URL set via fallback to:", `${supabaseUrl}/functions/v1/update-shopify-token`);
      }

      // Use the Supabase functions client first
      try {
        console.log("Trying to use Supabase Functions client");
        const { data, error } = await supabase.functions.invoke('update-shopify-token', {
          body: {
            shopDomain: cleanedDomain,
            accessToken: accessToken.trim(),
            forceActivate,
            tokenType: accessToken.startsWith('shpat_') ? 'admin' : 'offline'
          }
        });
        
        if (error) {
          console.error("Error invoking function via Supabase client:", error);
          throw error;
        }
        
        console.log("Successfully invoked function via Supabase client, result:", data);
        
        if (!data.success) {
          throw new Error(data.error || 'Unknown error from edge function');
        }
        
        handleSuccessResponse(data, cleanedDomain);
        return;
      } catch (supabaseClientError) {
        console.warn("Failed to use Supabase client directly, falling back to fetch API:", supabaseClientError);
        // Continue with fetch fallback below
      }
      
      // Fallback to fetch API if Supabase client fails
      const fullUrl = edgeFunctionUrl;
      console.log(`Calling Edge Function at: ${fullUrl}`);
      
      // Add a unique timestamp to prevent caching issues
      const cacheBusterUrl = `${fullUrl}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
      console.log(`Adding cache busting parameters: ${cacheBusterUrl}`);
      
      // Call edge function to update token with detailed error handling
      const response = await fetch(cacheBusterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA'}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': `token-update-${Date.now()}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          shopDomain: cleanedDomain,
          accessToken: accessToken.trim(),
          forceActivate,
          tokenType: accessToken.startsWith('shpat_') ? 'admin' : 'offline'
        }),
        cache: 'no-store'
      });
      
      // Always capture the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      setRawResponseText(responseText);
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed JSON result:', result);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        setDebugInfo({
          error: 'Failed to parse response as JSON',
          rawResponse: responseText.substring(0, 1000), // First 1000 chars
          parseErrorMessage: parseError instanceof Error ? parseError.message : String(parseError),
          statusCode: response.status,
          responseHeaders: Object.fromEntries([...response.headers.entries()]),
          timestamp: new Date().toISOString(),
          edgeFunctionUrl: fullUrl
        });
        throw new Error(`Received non-JSON response with status ${response.status}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'حدث خطأ غير معروف');
      }
      
      handleSuccessResponse(result, cleanedDomain);
      
    } catch (error) {
      console.error('Error updating token:', error);
      
      let errorMessage = 'فشل تحديث الرمز';
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Save debug info for troubleshooting
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        accessTokenPrefix: accessToken.substring(0, 6) + '...',
        tokenType: accessToken.startsWith('shpat_') ? 'admin' : 'offline',
        rawResponse: rawResponseText || 'No raw response captured',
        edgeFunctionUrl: edgeFunctionUrl
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to handle successful responses
  const handleSuccessResponse = (result: any, cleanedDomain: string) => {
    toast.success('تم تحديث رمز الوصول بنجاح');
    
    setDebugInfo({
      success: true,
      result,
      tokenType: result.tokenType || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // Update local state
    if (forceActivate) {
      // Clear any token errors
      localStorage.removeItem('shopify_token_error');
      localStorage.removeItem('shopify_failsafe');
      
      // Update connection manager
      shopifyConnectionManager.clearAllStores();
      shopifyConnectionManager.addOrUpdateStore(cleanedDomain, true);
      
      // Update local storage with explicit token type
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_token_type', accessToken.startsWith('shpat_') ? 'admin' : 'offline');
      
      // Update context
      if (setShop) {
        setShop(cleanedDomain);
      }
      
      // Force page reload to apply changes
      setTimeout(() => {
        window.location.href = '/dashboard?token_updated=true&token_type=' + 
          (accessToken.startsWith('shpat_') ? 'admin' : 'offline');
      }, 1500);
    } else {
      // Just refresh stores list
      shopifyConnectionManager.addOrUpdateStore(cleanedDomain, false);
    }
  };
  
  return (
    <Card className="border rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 pb-4">
        <CardTitle className="text-xl">تحديث رمز وصول متجر Shopify</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {accessToken && isTokenValid === false && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              تحذير: الرمز الذي أدخلته لا يبدو أنه رمز API للمشرف، حيث يجب أن يبدأ بـ "shpat_"
            </AlertDescription>
          </Alert>
        )}
        
        {accessToken && isTokenValid === true && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              رمز API المشرف صحيح الشكل
            </AlertDescription>
          </Alert>
        )}
        
        {debugInfo && debugInfo.error && debugInfo.error.includes("Missing Supabase environment variables") && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>خطأ في متغيرات البيئة</AlertTitle>
            <AlertDescription className="mt-2">
              هناك مشكلة في الوصول إلى متغيرات البيئة الخاصة بـ Supabase. 
              يرجى التأكد من أن متغيرات البيئة تم تعيينها بشكل صحيح في وظيفة Edge Function.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="shopDomain">نطاق المتجر</Label>
          <Input
            id="shopDomain"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            placeholder="متجرك.myshopify.com"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accessToken">رمز الوصول (Admin API Access Token)</Label>
          <Input
            id="accessToken"
            value={accessToken}
            onChange={handleAccessTokenChange}
            placeholder="shpat_..."
            className={`w-full ${isTokenValid === false ? 'border-red-300' : isTokenValid === true ? 'border-green-300' : ''}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            يجب أن يبدأ الرمز بـ "shpat_" كما هو موضح في لوحة تحكم Shopify
          </p>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
          <Checkbox 
            id="force-activate" 
            checked={forceActivate} 
            onCheckedChange={(checked) => setForceActivate(!!checked)}
          />
          <Label htmlFor="force-activate" className="mr-2">
            تعيين كمتجر نشط وإعادة تحميل التطبيق
          </Label>
        </div>
        
        {(debugInfo || rawResponseText) && (
          <div className="mt-4 p-3 text-xs bg-gray-100 rounded-md overflow-auto max-h-64">
            <p className="font-medium mb-1">معلومات التصحيح:</p>
            
            {edgeFunctionUrl && (
              <div className="mt-2 mb-2">
                <p className="font-medium">Edge Function URL:</p>
                <code className="bg-gray-200 p-1 rounded text-xs block break-all">{edgeFunctionUrl}</code>
              </div>
            )}
            
            {rawResponseText && (
              <>
                <p className="font-medium mt-2 mb-1">Raw Response:</p>
                <div className="bg-red-100 p-2 rounded border border-red-200 overflow-x-auto whitespace-pre">
                  {rawResponseText ? rawResponseText.substring(0, 1000) : 'No raw response'}
                  {rawResponseText && rawResponseText.length > 1000 ? '... (truncated)' : ''}
                </div>
              </>
            )}
            
            <pre dir="ltr" className="mt-2">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50 border-t">
        <Button 
          onClick={handleUpdateToken} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              جاري التحديث...
            </>
          ) : 'تحديث رمز الوصول'}
        </Button>
      </CardFooter>
    </Card>
  );
};
