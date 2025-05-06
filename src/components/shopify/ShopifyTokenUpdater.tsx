
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

export const ShopifyTokenUpdater: React.FC = () => {
  const [shop, setShop] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [makeActive, setMakeActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop.trim() || !accessToken.trim()) {
      toast.error('يرجى إدخال اسم المتجر ورمز الوصول');
      return;
    }
    
    // Clean shop domain to ensure it includes myshopify.com
    let shopDomain = shop.trim().toLowerCase();
    if (!shopDomain.includes('myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    
    setIsUpdating(true);
    
    try {
      // Call the update-shopify-token edge function to update the token
      const { data, error } = await shopifySupabase.functions.invoke('update-shopify-token', {
        body: {
          shop: shopDomain,
          accessToken: accessToken.trim(),
          makeActive
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.success) {
        toast.success('تم تحديث رمز الوصول بنجاح');
        // Clear form
        setAccessToken('');
      } else {
        throw new Error(data?.error || 'فشل تحديث رمز الوصول');
      }
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error(`فشل تحديث رمز الوصول: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shop-domain">متجر Shopify</Label>
        <Input
          id="shop-domain"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          placeholder="your-store.myshopify.com"
          className="text-left dir-ltr"
        />
        <p className="text-xs text-muted-foreground">
          أدخل اسم متجرك في Shopify، على سبيل المثال: your-store.myshopify.com
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="access-token">رمز الوصول</Label>
        <Input
          id="access-token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="shpat_..."
          className="text-left font-mono dir-ltr"
          type="password"
        />
        <p className="text-xs text-muted-foreground">
          أدخل رمز الوصول الجديد من متجر Shopify الخاص بك
        </p>
      </div>
      
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Switch
          id="make-active"
          checked={makeActive}
          onCheckedChange={setMakeActive}
        />
        <Label htmlFor="make-active">تعيين كمتجر نشط</Label>
      </div>
      
      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? 'جاري التحديث...' : 'تحديث رمز الوصول'}
      </Button>
    </form>
  );
};
