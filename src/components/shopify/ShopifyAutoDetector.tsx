import React, { useEffect, useState } from 'react';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from '@/hooks/use-toast';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

interface ShopifyAutoDetectorProps {
  onShopDetected?: (shop: string) => void;
  onShopSaved?: (shop: string) => void;
}

const ShopifyAutoDetector: React.FC<ShopifyAutoDetectorProps> = ({
  onShopDetected,
  onShopSaved
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedShop, setDetectedShop] = useState<string | null>(null);

  useEffect(() => {
    const detectAndSaveShop = async () => {
      if (isProcessing) return;

      // فحص URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const shopParam = urlParams.get('shop');
      
      if (!shopParam) return;

      setIsProcessing(true);
      
      try {
        // تنظيف اسم المتجر
        let normalizedShop = shopParam.trim().toLowerCase();
        if (!normalizedShop.includes('.myshopify.com')) {
          normalizedShop = `${normalizedShop}.myshopify.com`;
        }

        console.log('🔍 Auto-detected shop from URL:', normalizedShop);
        setDetectedShop(normalizedShop);
        
        // إبلاغ المكون الأب
        onShopDetected?.(normalizedShop);

        // فحص إذا كان المتجر موجود مسبقاً
        const { data: existing, error: checkError } = await shopifyStores()
          .select('shop, is_active, access_token')
          .eq('shop', normalizedShop)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking existing shop:', checkError);
          throw checkError;
        }

        if (existing) {
          console.log('ℹ️ Shop already exists:', normalizedShop);
          
          // تفعيل المتجر الموجود
          const { error: updateError } = await shopifyStores()
            .update({ 
              is_active: true, 
              updated_at: new Date().toISOString() 
            })
            .eq('shop', normalizedShop);

          if (updateError) {
            console.error('❌ Error activating existing shop:', updateError);
          } else {
            console.log('✅ Existing shop activated:', normalizedShop);
            
            // تحديث connection manager
            shopifyConnectionManager.addOrUpdateStore(normalizedShop, true);
            
            // إبلاغ المكون الأب
            onShopSaved?.(normalizedShop);
            
            toast({
              title: "تم تفعيل المتجر",
              description: `تم تفعيل ${normalizedShop} بنجاح`,
            });
          }
        } else {
          console.log('💾 Saving new shop to database:', normalizedShop);
          
          // إضافة المتجر الجديد
          const { data: newShop, error: insertError } = await shopifyStores()
            .insert({
              shop: normalizedShop,
              is_active: true,
              access_token: null, // سيتم إضافته بعد OAuth إذا نجح
              scope: null,
              token_type: 'Bearer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error saving new shop:', insertError);
            throw insertError;
          }

          console.log('✅ New shop saved successfully:', newShop);
          
          // تحديث connection manager
          shopifyConnectionManager.addOrUpdateStore(normalizedShop, true);
          
          // إبلاغ المكون الأب
          onShopSaved?.(normalizedShop);
          
          toast({
            title: "تم حفظ المتجر",
            description: `تم حفظ ${normalizedShop} بنجاح في قائمة متاجرك`,
          });
        }

        // تنظيف URL من parameters
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

      } catch (error) {
        console.error('❌ Error in shop auto-detection:', error);
        toast({
          title: "خطأ في حفظ المتجر",
          description: "فشل في حفظ المتجر تلقائياً، يرجى المحاولة يدوياً",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // تأخير بسيط للتأكد من تحميل كل شيء
    const timer = setTimeout(detectAndSaveShop, 500);
    
    return () => clearTimeout(timer);
  }, []); // يتم تشغيله مرة واحدة فقط

  // هذا المكون لا يحتاج UI
  return null;
};

export default ShopifyAutoDetector;