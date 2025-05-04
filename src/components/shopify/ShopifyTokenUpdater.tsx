import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useAuth } from '@/lib/auth';

const SUPABASE_PROJECT_ID = 'nhqrngdzuatdnfkihtud';

// Changed to named export to match import in ShopifyStores.tsx
export const ShopifyTokenUpdater = () => {
  const [accessToken, setAccessToken] = useState('');
  const [shop, setShop] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const { setShop: setAuthShop } = useAuth();

  const handleUpdateToken = useCallback(async () => {
    if (!accessToken || !shop) {
      toast.error('توكن الوصول واسم المتجر مطلوبان');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateResult(null);

      // Construct the Edge Function URL manually to avoid type issues
      const edgeFunctionUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/update-shopify-token`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          shopDomain: shop,
          forceActivate: true, // Always force activate to ensure is_active=true
          tokenType: accessToken.startsWith('shpat_') ? 'admin' : 'offline',
        }),
      });

      const result = await response.json();
      setUpdateResult(result);

      console.log('Token update result:', result);
      
      if (result.success) {
        // Update local connection state
        shopifyConnectionManager.addOrUpdateStore(shop, true, true);
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Also update auth context if available
        if (setAuthShop) {
          setAuthShop(shop);
        }
        
        // Clear any recovery/failsafe states
        localStorage.removeItem('shopify_recovery_mode');
        localStorage.removeItem('shopify_failsafe');
        
        toast.success('تم تحديث رمز الوصول بنجاح');
      } else {
        toast.error(`فشل في تحديث رمز الوصول: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error('حدث خطأ أثناء تحديث رمز الوصول');
    } finally {
      setIsUpdating(false);
    }
  }, [accessToken, shop, setAuthShop]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-right">تحديث رمز الوصول</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="shop">متجر Shopify</Label>
          <Input 
            id="shop" 
            value={shop} 
            onChange={e => setShop(e.target.value)} 
            placeholder="your-store.myshopify.com"
            className="mt-1 text-right dir-rtl"
          />
        </div>
        
        <div>
          <Label htmlFor="accessToken">رمز الوصول (Access Token)</Label>
          <Input 
            id="accessToken" 
            value={accessToken} 
            onChange={e => setAccessToken(e.target.value)} 
            placeholder="shpat_..."
            className="mt-1 text-right dir-rtl"
          />
        </div>
        
        <Button 
          onClick={handleUpdateToken} 
          disabled={isUpdating || !accessToken || !shop}
          className="w-full"
        >
          {isUpdating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          تحديث رمز الوصول
        </Button>
      </div>
      
      {updateResult && (
        <div className="mt-6 p-4 border rounded bg-gray-50 overflow-auto max-h-96">
          <pre className="text-xs whitespace-pre-wrap text-right dir-rtl">
            {JSON.stringify(updateResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Also adding default export for backward compatibility
export default ShopifyTokenUpdater;
