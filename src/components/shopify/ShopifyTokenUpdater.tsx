
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export const ShopifyTokenUpdater: React.FC = () => {
  const { shop, setShop } = useAuth();
  const [accessToken, setAccessToken] = useState('');
  const [shopDomain, setShopDomain] = useState(shop || '');
  const [forceActivate, setForceActivate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const handleUpdateToken = async () => {
    if (!shopDomain.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
      return;
    }
    
    if (!accessToken.trim()) {
      toast.error('يرجى إدخال رمز الوصول');
      return;
    }
    
    // Clean shop domain
    let cleanedDomain = shopDomain.trim().toLowerCase();
    if (!cleanedDomain.includes('myshopify.com')) {
      cleanedDomain = `${cleanedDomain}.myshopify.com`;
    }
    
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log(`Attempting to update token for shop: ${cleanedDomain}`);
      
      // Use direct URL to avoid any route resolution issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      const fullUrl = `${supabaseUrl}/functions/v1/update-shopify-token`;
      console.log(`Calling Edge Function at: ${fullUrl}`);
      
      // Call edge function to update token with detailed error handling
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          shopDomain: cleanedDomain,
          accessToken: accessToken.trim(),
          forceActivate
        })
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        // We received a non-JSON response, which is an error
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        setDebugInfo({
          error: 'Non-JSON response received',
          statusCode: response.status,
          contentType,
          textResponsePreview: textResponse.substring(0, 500)
        });
        throw new Error(`Received non-JSON response with status ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('Update token result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'حدث خطأ غير معروف');
      }
      
      toast.success('تم تحديث رمز الوصول بنجاح');
      
      setDebugInfo({
        success: true,
        result,
        tokenType: result.tokenType || 'unknown'
      });
      
      // Update local state
      if (forceActivate) {
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.addOrUpdateStore(cleanedDomain, true);
        
        // Update local storage
        localStorage.setItem('shopify_store', cleanedDomain);
        localStorage.setItem('shopify_connected', 'true');
        
        // Update context
        if (setShop) {
          setShop(cleanedDomain);
        }
        
        // Force page reload to apply changes
        setTimeout(() => {
          window.location.href = '/dashboard?token_updated=true';
        }, 1500);
      } else {
        // Just refresh stores list
        shopifyConnectionManager.addOrUpdateStore(cleanedDomain, false);
      }
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
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 pb-4">
        <CardTitle className="text-xl">تحديث رمز وصول متجر Shopify</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
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
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="shpat_..."
            className="w-full"
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
        
        {debugInfo && (
          <div className="mt-4 p-3 text-xs bg-gray-100 rounded-md overflow-auto max-h-64">
            <p className="font-medium mb-1">معلومات التصحيح:</p>
            <pre dir="ltr">
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
