import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { parseShopifyParams } from '@/utils/shopify-helpers';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShopifyAutoAccountCreatorProps {
  onComplete?: (success: boolean) => void;
}

const ShopifyAutoAccountCreator: React.FC<ShopifyAutoAccountCreatorProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('جاري فحص معلومات Shopify...');

  useEffect(() => {
    processShopifyAutoAccount();
  }, []);

  const processShopifyAutoAccount = async () => {
    try {
      setIsProcessing(true);
      console.log('🚀 Starting Shopify auto account creation process');

      // Parse Shopify parameters from URL
      const { shopDomain, isShopifyRequest } = parseShopifyParams();
      
      if (!shopDomain || !isShopifyRequest) {
        console.log('❌ No valid Shopify parameters found');
        onComplete?.(false);
        return;
      }

      console.log(`🔍 Processing shop: ${shopDomain}`);
      setStatus(`جاري ربط متجر ${shopDomain}...`);

      // Try to get access token from stored store data
      let accessToken = null;
      try {
        // Try to get access token from database
        const { data: storeData } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shopDomain)
          .single();
        
        if (storeData?.access_token) {
          accessToken = storeData.access_token;
          console.log(`🔑 Found access token for store: ${shopDomain}`);
        } else {
          console.log(`⚠️ No access token found for store: ${shopDomain}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not retrieve access token: ${error}`);
      }

      setStatus('جاري إنشاء/ربط الحساب...');

      // Call auto account creation function
      const { data: autoAccountResult, error: autoAccountError } = await supabase.functions.invoke('auto-account-creation', {
        body: {
          shop: shopDomain,
          access_token: accessToken
        }
      });

      if (autoAccountError) {
        console.error('❌ Auto account creation failed:', autoAccountError);
        throw new Error('فشل في إنشاء/ربط الحساب');
      }

      if (!autoAccountResult?.success) {
        console.error('❌ Auto account creation failed:', autoAccountResult?.error);
        throw new Error(autoAccountResult?.error || 'فشل في إنشاء/ربط الحساب');
      }

      console.log('✅ Auto account creation successful:', autoAccountResult);
      
      // Update connection manager
      simpleShopifyConnectionManager.setActiveStore(shopDomain);
      
      setStatus('تم بنجاح! جاري إعادة التوجيه...');
      
      // Show success message
      if (autoAccountResult.is_new_user) {
        toast.success('تم إنشاء حساب جديد وربط المتجر بنجاح');
      } else {
        toast.success('تم ربط المتجر بحسابك الموجود بنجاح');
      }

      // Wait a moment then redirect
      setTimeout(() => {
        onComplete?.(true);
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Shopify auto account creation failed:', error);
      setStatus('حدث خطأ أثناء المعالجة');
      toast.error(error.message || 'حدث خطأ أثناء ربط الحساب');
      
      setTimeout(() => {
        onComplete?.(false);
        navigate('/login');
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center p-8 bg-card rounded-lg shadow-elegant max-w-md w-full mx-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
        <h2 className="text-xl font-semibold mb-4">
          ربط المتجر تلقائياً
        </h2>
        <p className="text-muted-foreground mb-6">
          {status}
        </p>
        <div className="text-sm text-muted-foreground">
          يرجى الانتظار...
        </div>
      </div>
    </div>
  );
};

export default ShopifyAutoAccountCreator;