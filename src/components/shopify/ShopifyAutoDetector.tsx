import React, { useEffect, useState } from 'react';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { supabase } from '@/integrations/supabase/client';
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
    console.log('🚀 ShopifyAutoDetector mounted!');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', window.location.search);
    
    const detectAndSaveShop = async () => {
      if (isProcessing) return;

      // فحص URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const shopParam = urlParams.get('shop');
      
      console.log('🔍 URL Parameters check:', {
        shopParam,
        allParams: Object.fromEntries(urlParams.entries()),
        href: window.location.href
      });
      
      if (!shopParam) {
        console.log('❌ No shop parameter found in URL');
        return;
      }

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

        // استخدام edge function للحفظ المضمون
        console.log('💾 Calling save-detected-shop function...');
        
        try {
          const { data, error } = await supabase.functions.invoke('save-detected-shop', {
            body: { shop: normalizedShop }
          });

          if (error) {
            console.error('❌ Edge function error:', error);
            throw error;
          }

          if (!data || !data.success) {
            console.error('❌ Edge function failed:', data);
            throw new Error(data?.error || 'فشل في حفظ المتجر');
          }

          console.log('✅ Shop saved via edge function:', data);
          
          // تحديث connection manager
          shopifyConnectionManager.addOrUpdateStore(normalizedShop, true);
          
          // إبلاغ المكون الأب
          onShopSaved?.(normalizedShop);
          
          toast({
            title: data.action === 'created' ? "تم حفظ المتجر" : "تم تفعيل المتجر",
            description: `${normalizedShop} - ${data.message}`,
          });

        } catch (edgeFunctionError) {
          console.error('❌ Edge function failed, trying direct database:', edgeFunctionError);
          
          // Fallback: المحاولة المباشرة مع قاعدة البيانات
          try {
            const { data: existing, error: checkError } = await shopifyStores()
              .select('shop, is_active')
              .eq('shop', normalizedShop)
              .maybeSingle();

            if (!checkError && existing) {
              await shopifyStores()
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .eq('shop', normalizedShop);
            } else if (!checkError) {
              await shopifyStores()
                .insert({
                  shop: normalizedShop,
                  is_active: true,
                  access_token: null,
                  scope: null,
                  token_type: 'Bearer'
                });
            }
            
            shopifyConnectionManager.addOrUpdateStore(normalizedShop, true);
            onShopSaved?.(normalizedShop);
            
            toast({
              title: "تم حفظ المتجر",
              description: `تم حفظ ${normalizedShop} بنجاح`,
            });
          } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            throw fallbackError;
          }
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

    // تشغيل فوري
    console.log('🎯 Starting detectAndSaveShop...');
    detectAndSaveShop();
    
  }, []); // يتم تشغيله مرة واحدة فقط

  // هذا المكون لا يحتاج UI
  return null;
};

export default ShopifyAutoDetector;