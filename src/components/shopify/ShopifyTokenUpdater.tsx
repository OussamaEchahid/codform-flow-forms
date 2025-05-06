
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { shopifyStores } from '@/lib/shopify/supabase-client';

export const ShopifyTokenUpdater: React.FC = () => {
  const [shop, setShop] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleUpdateToken = async () => {
    if (!shop.trim() || !accessToken.trim()) {
      toast.error('يرجى إدخال اسم المتجر ورمز الوصول');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let normalizedShop = shop.trim().toLowerCase();
      if (!normalizedShop.includes('.myshopify.com')) {
        normalizedShop = `${normalizedShop}.myshopify.com`;
      }

      // First, check if the store exists
      const { data: existingStores, error: queryError } = await shopifyStores()
        .select('*')
        .eq('shop', normalizedShop);

      if (queryError) {
        throw queryError;
      }

      if (existingStores && existingStores.length > 0) {
        // Update existing store
        const { error: updateError } = await shopifyStores()
          .update({ 
            access_token: accessToken,
            updated_at: new Date().toISOString()
          })
          .eq('shop', normalizedShop);

        if (updateError) {
          throw updateError;
        }

        toast.success('تم تحديث رمز الوصول بنجاح');
      } else {
        // Insert new store
        const { error: insertError } = await shopifyStores()
          .insert({ 
            shop: normalizedShop,
            access_token: accessToken,
            is_active: true,
            token_type: 'offline'
          });

        if (insertError) {
          throw insertError;
        }

        toast.success('تم إضافة المتجر ورمز الوصول بنجاح');
      }

      // Clear form after successful update
      setAccessToken('');
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error('فشل تحديث رمز الوصول');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shopDomain">نطاق المتجر</Label>
        <Input
          id="shopDomain"
          placeholder="your-store.myshopify.com"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          disabled={isSubmitting}
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accessToken">رمز الوصول (Access Token)</Label>
        <Input
          id="accessToken"
          placeholder="shpat_..."
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          disabled={isSubmitting}
          dir="ltr"
        />
        <p className="text-xs text-gray-500">
          أدخل رمز وصول المتجر الذي تريد إضافته أو تحديثه
        </p>
      </div>
      <Button 
        onClick={handleUpdateToken} 
        disabled={isSubmitting || !shop.trim() || !accessToken.trim()}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري التحديث...
          </>
        ) : (
          'تحديث رمز الوصول'
        )}
      </Button>
    </div>
  );
};
