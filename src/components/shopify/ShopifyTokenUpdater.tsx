
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { tokenValidationCache } from '@/lib/shopify/ShopifyConnectionProvider'; // Import the exported cache
import { toast } from 'sonner';
import { clearShopifyCache } from '@/hooks/useShopify';

export const ShopifyTokenUpdater = () => {
  const [shopDomain, setShopDomain] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPlaceholderToken, setHasPlaceholderToken] = useState<boolean>(false);
  const [updateAttempt, setUpdateAttempt] = useState<number>(0); // Track update attempts
  const { shopDomain: connectedShop, syncState, reload, testConnection } = useShopifyConnection();
  
  // Load the current shop when the component mounts
  useEffect(() => {
    const loadCurrentShop = async () => {
      try {
        // Use the shop from the connection provider
        if (connectedShop) {
          setShopDomain(connectedShop);
          await checkForPlaceholderToken(connectedShop);
        } else {
          // If no connected shop, try to get from localStorage
          const storedShop = localStorage.getItem('shopify_store');
          if (storedShop) {
            setShopDomain(storedShop);
            await checkForPlaceholderToken(storedShop);
          }
        }
      } catch (err) {
        console.error('Error loading current shop:', err);
      }
    };
    
    loadCurrentShop();
  }, [connectedShop]);
  
  // Check if the shop is using a placeholder token
  const checkForPlaceholderToken = async (shop: string) => {
    try {
      const { data, error } = await shopifySupabase
        .from('shopify_stores')
        .select('access_token, token_type')
        .eq('shop', shop)
        .single();
      
      if (error) {
        console.error('Error checking token:', error);
        return;
      }
      
      // Check for placeholder token
      if (data.access_token === 'placeholder_token') {
        setHasPlaceholderToken(true);
        setError('هذا المتجر يستخدم حاليًا قيمة مؤقتة (placeholder). يرجى إدخال رمز وصول حقيقي.');
      } else {
        setHasPlaceholderToken(false);
      }
    } catch (err) {
      console.error('Error checking for placeholder token:', err);
    }
  };

  // Emergency reset function
  const performEmergencyReset = () => {
    // Clear all Shopify-related localStorage items
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_token');
    localStorage.removeItem('shopify_failsafe');
    localStorage.removeItem('pending_form_syncs');
    localStorage.removeItem('shopify_recovery_mode');
    localStorage.removeItem('shopify_last_url_shop');
    
    // Clear all caches
    if (tokenValidationCache) {
      tokenValidationCache.clear();
    }
    clearShopifyCache();
    
    // Reset state
    setIsSuccess(false);
    setError(null);
    
    toast.success("تم إعادة تعيين حالة الاتصال، سيتم إعادة تحميل الصفحة");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain || !accessToken) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);
    setUpdateAttempt(prev => prev + 1); // Increment attempt counter
    const currentAttempt = updateAttempt + 1;
    
    try {
      // Generate a unique request ID for tracking
      const requestId = `token_update_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[${requestId}] Starting token update for ${shopDomain} (attempt ${currentAttempt})`);
      
      // Check that token is not placeholder
      if (accessToken === 'placeholder_token') {
        throw new Error('لا يمكن استخدام "placeholder_token" كرمز وصول حقيقي');
      }
      
      // Clear all caches before update
      if (tokenValidationCache) {
        console.log(`[${requestId}] Clearing token validation cache before update`);
        tokenValidationCache.clear();
      }
      clearShopifyCache();
      
      // Call the update-shopify-token Edge Function
      const { data, error } = await shopifySupabase.functions.invoke('update-shopify-token', {
        body: {
          shop: shopDomain,
          token: accessToken,
          requestId
        }
      });
      
      if (error) {
        console.error(`[${requestId}] Edge function error:`, error);
        throw new Error(`خطأ في استدعاء الدالة: ${error.message || "خطأ غير معروف"}`);
      }
      
      if (!data?.success) {
        console.error(`[${requestId}] Update failed:`, data?.error);
        throw new Error(data?.error || 'فشل تحديث رمز الوصول');
      }
      
      console.log(`[${requestId}] Token updated successfully, syncing state`);
      
      // Clear all caches again for fresh start
      if (tokenValidationCache) {
        console.log(`[${requestId}] Clearing token validation cache after update`);
        tokenValidationCache.clear();
      }
      clearShopifyCache();
      
      // Reset localStorage values to trigger fresh state
      localStorage.removeItem('shopify_connected');
      
      // Sync the connection state to reflect the changes - with retry mechanism
      await syncState();
      
      // Wait a moment to allow state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try the API-based test connection first
      try {
        console.log(`[${requestId}] Testing connection via API route`);
        const apiResponse = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shopDomain)}&force=true`);
        
        if (!apiResponse.ok) {
          console.error(`[${requestId}] API connection test failed:`, await apiResponse.text());
        } else {
          const apiResult = await apiResponse.json();
          console.log(`[${requestId}] API connection test result:`, apiResult);
        }
      } catch (apiError) {
        console.error(`[${requestId}] Error using API test:`, apiError);
        // Continue even if API test fails - will try direct test next
      }
      
      // Reload the connection state
      console.log(`[${requestId}] Reloading connection state`);
      await reload();
      
      // Wait a bit before testing connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test the connection after update with multiple retries if needed
      let isConnected = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!isConnected && retryCount < maxRetries) {
        console.log(`[${requestId}] Testing connection (attempt ${retryCount + 1}/${maxRetries})`);
        isConnected = await testConnection(true);
        
        if (!isConnected && retryCount < maxRetries - 1) {
          console.log(`[${requestId}] Connection test failed, waiting before retry`);
          // Wait between retries with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          retryCount++;
        } else {
          break;
        }
      }
      
      if (!isConnected) {
        console.error(`[${requestId}] All connection tests failed after token update`);
        throw new Error('تم تحديث الرمز، لكن اختبار الاتصال فشل. يرجى التحقق من الرمز وإعادة المحاولة أو استخدام زر إعادة تعيين الحالة أدناه.');
      }
      
      console.log(`[${requestId}] Connection verified successfully after token update`);
      setIsSuccess(true);
      setHasPlaceholderToken(false);
      toast.success("تم تحديث رمز وصول Shopify بنجاح.");
      
      // Clear the token field
      setAccessToken('');
    } catch (err) {
      console.error('Error updating token:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الرمز');
      
      toast.error("فشل التحديث: " + (err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الرمز'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasPlaceholderToken && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تم اكتشاف رمز مؤقت</AlertTitle>
          <AlertDescription>
            هذا المتجر يستخدم حاليًا رمزًا وهميًا ("placeholder_token"). يجب عليك إدخال رمز وصول حقيقي من Shopify لكي تعمل واجهة API بشكل صحيح.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isSuccess && (
        <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">تم التحديث بنجاح</AlertTitle>
          <AlertDescription className="text-green-700">
            تم تحديث رمز وصول Shopify بنجاح. يجب أن تعمل واجهة API الآن بشكل صحيح.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-domain">نطاق المتجر</Label>
          <Input
            id="shop-domain"
            placeholder="متجرك.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="access-token">رمز الوصول</Label>
          <Input
            id="access-token"
            placeholder="رمز وصول Shopify الخاص بك"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            required
            type="password"
          />
          <p className="text-sm text-gray-500">
            يمكنك الحصول على رمز الوصول من إعدادات تطبيق Shopify الخاص بك، في قسم "API credentials".
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isLoading || !shopDomain || !accessToken}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                تحديث رمز الوصول
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={performEmergencyReset}
            disabled={isLoading}
          >
            إعادة تعيين حالة الاتصال
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>أين أجد رمز الوصول؟</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>انتقل إلى حساب شريك Shopify الخاص بك</li>
          <li>اذهب إلى Apps &gt; اختر التطبيق المخصص الخاص بك</li>
          <li>انتقل إلى علامة التبويب "API credentials"</li>
          <li>استخدم Admin API access token الخاص بك</li>
        </ul>
      </div>
    </div>
  );
};
