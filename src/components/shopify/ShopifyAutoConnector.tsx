import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { supabase } from '@/integrations/supabase/client';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { useI18n } from '@/lib/i18n';

interface ShopifyAutoConnectorProps {
  onConnected?: (shop: string) => void;
}

const ShopifyAutoConnector: React.FC<ShopifyAutoConnectorProps> = ({ onConnected }) => {
  const { language, t } = useI18n();
  const [detectedShop, setDetectedShop] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const detectShop = () => {
      try {
        const path = window.location.pathname || '';
        if (path.startsWith('/oauth/google-callback')) {
          console.log('⏭️ ShopifyAutoConnector: skipping on Google OAuth callback page to avoid URL cleaning.');
          return; // Do not touch URL or show dialog on OAuth callback
        }
      } catch {}

      const urlParams = new URLSearchParams(window.location.search);
      const shopParam = urlParams.get('shop');
      const hmacParam = urlParams.get('hmac');
      const codeParam = urlParams.get('code');
      const hostParam = urlParams.get('host');
      
      console.log('🔍 ShopifyAutoConnector - URL parameters:', {
        shopParam, hmacParam, codeParam, hostParam
      });

      let detectedShopDomain = null;

      // الأولوية الأولى: shop parameter
      if (shopParam && !codeParam) {
        let normalizedShop = shopParam.trim().toLowerCase();
        if (!normalizedShop.includes('.myshopify.com')) {
          normalizedShop = `${normalizedShop}.myshopify.com`;
        }
        detectedShopDomain = normalizedShop;
        console.log('🔍 Shop detected from shop param:', detectedShopDomain);
      }
      // الأولوية الثانية: استخراج المتجر من host parameter
      else if (hostParam && !codeParam) {
        try {
          // host parameter يحتوي على base64 encoded domain
          const decodedHost = atob(hostParam);
          console.log('🔍 Decoded host:', decodedHost);
          
          // استخراج domain من decoded host
          const hostParts = decodedHost.split('/');
          if (hostParts.length > 0) {
            let shopDomain = hostParts[0];
            if (shopDomain.includes('.myshopify.com')) {
              detectedShopDomain = shopDomain;
              console.log('🔍 Shop detected from host param:', detectedShopDomain);
            }
          }
        } catch (error) {
          console.error('❌ Error decoding host parameter:', error);
        }
      }

      // إذا لم يتم اكتشاف أي متجر، فحص UnifiedStoreManager
      if (!detectedShopDomain) {
        const currentActiveStore = UnifiedStoreManager.getActiveStore();
        if (currentActiveStore) {
          console.log('✅ Using existing active store from UnifiedStoreManager:', currentActiveStore);
          // تنظيف URL بدون إظهار النافذة
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          return;
        }
        
        console.log('⚠️ No shop detected from URL parameters or UnifiedStoreManager');
        return;
      }
      
      // فحص إذا كان هذا المتجر هو النشط حالياً
      const currentActiveStore = UnifiedStoreManager.getActiveStore();
      console.log('🔍 Current active store from UnifiedStoreManager:', currentActiveStore);
      
      if (currentActiveStore === detectedShopDomain) {
        console.log('✅ Shop already active, skipping dialog');
        // تنظيف URL بدون إظهار النافذة
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        return;
      }
      
      // إظهار النافذة للمتاجر الجديدة فقط
      console.log('🔄 New store detected, showing connection dialog');
      setDetectedShop(detectedShopDomain);
      setShowDialog(true);
      
      // تنظيف URL بعد الاكتشاف
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    };

    detectShop();
  }, [onConnected]);

  const handleConnect = async () => {
    if (!detectedShop) return;
    
    setIsConnecting(true);
    setConnectionStatus('pending');
    
    try {
      console.log('🔗 Starting connection process for:', detectedShop);
      
      // 1. حفظ/تفعيل المتجر في قاعدة البيانات
      const { data: existing } = await shopifyStores()
        .select('*')
        .eq('shop', detectedShop)
        .maybeSingle();

      if (existing) {
        await shopifyStores()
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('shop', detectedShop);
        console.log('✅ Store activated:', detectedShop);
      } else {
        await shopifyStores()
          .upsert({
            shop: detectedShop,
            is_active: true,
            access_token: null,
            scope: null,
            token_type: 'Bearer',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'shop' });
        console.log('✅ Store saved:', detectedShop);
      }

      // 2. بدء عملية المصادقة مع Shopify
      console.log('🚀 Starting Shopify OAuth...');
      
      // الحصول على user_id الحالي
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      console.log(`🔗 Auto-connecting with user ID: ${userId}`);
      
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop: detectedShop,
          userId: userId 
        }
      });

      if (error) {
        throw new Error(`Auth error: ${error.message}`);
      }

      if (data?.redirect || data?.authUrl) {
        const authUrl = data.redirect || data.authUrl;
        console.log('🔄 Redirecting to Shopify auth:', authUrl);
        
        // تحديد المتجر الجديد كنشط قبل إعادة التوجيه باستخدام UnifiedStoreManager
        const success = UnifiedStoreManager.setActiveStore(detectedShop);
        console.log('✅ Store set in UnifiedStoreManager:', success);
        
        // إعادة توجيه مباشرة
        window.location.href = authUrl;
      } else {
        throw new Error('No auth URL received');
      }
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setConnectionStatus('error');
      toast({
        title: "فشل الاتصال",
        description: `لم يتم الاتصال بـ ${detectedShop}`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancel = () => {
    console.log('🚫 User cancelled connection dialog');
    setShowDialog(false);
    setDetectedShop(null);
    // تنظيف URL بعد الإلغاء
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  if (!showDialog || !detectedShop) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            {language === 'ar' ? 'اتصال جديد بمتجر Shopify' : 'New Shopify Store Connection'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'تم اكتشاف متجر. هل تريد الاتصال به؟' : 'A store was detected. Do you want to connect to it?'}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <Store className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{language === 'ar' ? 'المتجر المكتشف:' : 'Detected store:'}</strong><br />
            <code className="text-sm">{detectedShop}</code>
          </AlertDescription>
        </Alert>

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === 'ar' ? 'فشل في الاتصال. يرجى المحاولة مرة أخرى.' : 'Connection failed. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConnecting}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'اتصال الآن' : 'Connect now'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopifyAutoConnector;