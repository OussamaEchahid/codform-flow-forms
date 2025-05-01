
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// تعريف الترجمات
const translations = {
  ar: {
    shopifyConnectionIssue: 'مشكلة في الاتصال بـ Shopify',
    pleaseConnect: 'يرجى الاتصال بمتجر Shopify للوصول إلى قسم النماذج',
    connectToShopifyNow: 'الاتصال بـ Shopify الآن',
    verifyingConnection: 'جاري التحقق من الاتصال...',
    loading: 'جاري التحميل...'
  },
  en: {
    shopifyConnectionIssue: 'Shopify Connection Issue',
    pleaseConnect: 'Please connect to Shopify to access forms',
    connectToShopifyNow: 'Connect to Shopify Now',
    verifyingConnection: 'Verifying connection...',
    loading: 'Loading...'
  }
};

const Forms = () => {
  const { shopifyConnected, shop, isTokenVerified, refreshShopifyConnection, forceReconnect } = useAuth();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // تحديد اللغة الافتراضية
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  // دالة ترجمة
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };
  
  // Verify connection directly with Supabase
  useEffect(() => {
    const verifyConnection = async () => {
      console.log('Forms: Verifying Shopify connection with shop:', shop);
      setIsVerifying(true);
      
      try {
        if (shop) {
          // Verify token exists in database
          const { data: storeData, error: storeError } = await supabase
            .from('shopify_stores')
            .select('access_token, updated_at')
            .eq('shop', shop)
            .maybeSingle();
          
          if (storeError || !storeData || !storeData.access_token) {
            console.error('Forms: No valid token found in database', { storeError });
            setConnectionVerified(false);
            
            // Clear invalid connection data
            if (refreshShopifyConnection) {
              refreshShopifyConnection();
            }
          } else {
            console.log('Forms: Valid token found in database');
            setConnectionVerified(true);
            
            // إضافة تحديث التخزين المحلي هنا للتأكيد على صحة الاتصال
            localStorage.setItem('shopify_store', shop);
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connect_time', Date.now().toString());
          }
        } else {
          console.log('Forms: No shop parameter provided');
          setConnectionVerified(false);
        }
      } catch (error) {
        console.error('Forms: Error verifying connection:', error);
        setConnectionVerified(false);
      } finally {
        setIsVerifying(false);
        setIsPageReady(true);
      }
    };
    
    verifyConnection();
  }, [shop, refreshShopifyConnection]);

  // Loading state
  if (!isPageReady || isVerifying) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Check if user is connected to Shopify
  if (!connectionVerified || !shopifyConnected || !shop) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
            <div className="bg-red-50 text-red-800 p-6 rounded-lg mb-6 w-full">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('shopifyConnectionIssue')}
              </h3>
              <p className="mb-4">
                {t('pleaseConnect')}
              </p>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => navigate('/shopify?reconnect=form&ts=' + Date.now())}
              >
                {t('connectToShopifyNow')}
              </Button>
              
              {/* إضافة زر إعادة اتصال إجباري إذا كان الدالة متاحة */}
              {forceReconnect && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={forceReconnect}
                >
                  إعادة اتصال إجباري
                </Button>
              )}
              
              {/* إضافة معلومات التصحيح في وضع التطوير */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-left">
                  <p className="font-bold">Debug Info:</p>
                  <pre>{JSON.stringify({
                    shopifyConnected,
                    shop,
                    isTokenVerified,
                    connectionVerified,
                    localStorage: {
                      shopify_store: localStorage.getItem('shopify_store'),
                      shopify_connected: localStorage.getItem('shopify_connected'),
                      shopify_last_connect_time: localStorage.getItem('shopify_last_connect_time')
                    }
                  }, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1">
        {/* Show Shopify connection status component if needed */}
        {!isTokenVerified && <ShopifyConnectionStatus />}
        
        {/* Always show the form builder dashboard */}
        <FormBuilderDashboard />
      </div>
    </div>
  );
};

export default Forms;
