import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

interface ShopifyAutoConnectorProps {
  onConnected?: (shop: string) => void;
}

const ShopifyAutoConnector: React.FC<ShopifyAutoConnectorProps> = ({ onConnected }) => {
  const [detectedShop, setDetectedShop] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const detectShop = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shopParam = urlParams.get('shop');
      const hmacParam = urlParams.get('hmac');
      const codeParam = urlParams.get('code');
      const hostParam = urlParams.get('host');
      
      console.log('🔍 ShopifyAutoConnector - URL parameters:', {
        shopParam, hmacParam, codeParam, hostParam
      });
      
      // فقط إذا كان هناك shop parameter ولا يوجد code (ليس callback)
      if (shopParam && !codeParam) {
        let normalizedShop = shopParam.trim().toLowerCase();
        if (!normalizedShop.includes('.myshopify.com')) {
          normalizedShop = `${normalizedShop}.myshopify.com`;
        }
        
        console.log('🔍 Shop detected:', normalizedShop);
        
        // فحص إذا كان هذا المتجر هو النشط حالياً من connection manager
        const currentActiveStore = shopifyConnectionManager.getActiveStore();
        console.log('🔍 Current active store from connection manager:', currentActiveStore);
        
        if (currentActiveStore === normalizedShop) {
          console.log('✅ Shop already active, skipping dialog');
          // تنظيف URL بدون إظهار النافذة
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          return;
        }
        
        // فحص إذا كان المتجر موجود في قائمة المتاجر المحفوظة
        const allStores = shopifyConnectionManager.getAllStores();
        const existingStore = allStores.find(store => store.shop === normalizedShop || store.domain === normalizedShop);
        
        if (existingStore) {
          console.log('🔄 Store exists, showing connection dialog');
        }
        
        // إظهار النافذة للمتاجر الجديدة أو الموجودة
        setDetectedShop(normalizedShop);
        setShowDialog(true);
        
        // تنظيف URL بعد الاكتشاف
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
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
          .insert({
            shop: detectedShop,
            is_active: true,
            access_token: null,
            scope: null,
            token_type: 'Bearer'
          });
        console.log('✅ Store saved:', detectedShop);
      }

      // 2. بدء عملية المصادقة مع Shopify
      console.log('🚀 Starting Shopify OAuth...');
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { shop: detectedShop }
      });

      if (error) {
        throw new Error(`Auth error: ${error.message}`);
      }

      if (data?.redirect || data?.authUrl) {
        const authUrl = data.redirect || data.authUrl;
        console.log('🔄 Redirecting to Shopify auth:', authUrl);
        
        // تحديد المتجر الجديد كنشط قبل إعادة التوجيه
        shopifyConnectionManager.setActiveStore(detectedShop);
        
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
    setShowDialog(false);
    setDetectedShop(null);
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
            اتصال جديد بمتجر Shopify
          </DialogTitle>
          <DialogDescription>
            تم اكتشاف متجر. هل تريد الاتصال به؟
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <Store className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>المتجر المكتشف:</strong><br />
            <code className="text-sm">{detectedShop}</code>
          </AlertDescription>
        </Alert>

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              فشل في الاتصال. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConnecting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الاتصال...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                اتصال الآن
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopifyAutoConnector;