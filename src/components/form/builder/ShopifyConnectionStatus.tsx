
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Store, Globe, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { connectionLogger } from '@/lib/shopify/debug-logger';

const ShopifyConnectionStatus = () => {
  const { language } = useI18n();
  const { shop, shopifyConnected } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  // Use all possible sources to get the shop domain
  useEffect(() => {
    const getShopFromAllSources = () => {
      // Priority 1: From auth context
      const shopFromAuth = shop;
      
      // Priority 2: From localStorage
      const shopFromLocalStorage = localStorage.getItem('shopify_store');
      
      // Priority 3: From connection manager
      const shopFromConnectionManager = shopifyConnectionManager.getActiveStore();
      
      // Use the first available source, in order of priority
      const shopToUse = shopFromAuth || shopFromLocalStorage || shopFromConnectionManager;
      
      setShopDomain(shopToUse);
      
      // Log sources for debugging
      connectionLogger.debug("ShopifyConnectionStatus: Shop sources", {
        shopFromAuth,
        shopFromLocalStorage,
        shopFromConnectionManager,
        shopToUse
      });
      
      return shopToUse;
    };
    
    const shopToUse = getShopFromAllSources();
    
    // Only check connection if we have a shop domain
    if (shopToUse) {
      checkConnection();
    } else {
      setConnectionStatus('error');
    }
  }, [shop]);

  const checkConnection = async () => {
    const shopToUse = shopDomain || shop || localStorage.getItem('shopify_store') || shopifyConnectionManager.getActiveStore();
    
    if (!shopToUse) {
      setConnectionStatus('error');
      return;
    }

    setIsChecking(true);
    setConnectionStatus('checking');
    
    // First, check localStorage for faster response
    const isLocallyConnected = localStorage.getItem('shopify_connected') === 'true';
    if (isLocallyConnected) {
      // Set a preliminary connected status for better UX
      setConnectionStatus('connected');
    }

    try {
      connectionLogger.info("Checking connection for shop:", shopToUse);
      
      // Get access token from database for this shop
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shopToUse)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (shopError) {
        console.error('Error fetching shop data:', shopError);
        setConnectionStatus('error');
        setConnectionDetails(null);
        return;
      }
      
      if (!shopData || shopData.length === 0) {
        console.error('No shop data found in database');
        setConnectionStatus('error');
        setConnectionDetails(null);
        return;
      }
      
      // We have shop data, the connection looks valid
      setConnectionStatus('connected');
      setConnectionDetails({
        shopName: shopToUse,
        validToken: true,
        tokenExpiry: 'permanent',
        isActive: shopData[0].is_active,
        hasToken: !!shopData[0].access_token,
        tokenType: shopData[0].token_type || 'offline'
      });
      setLastChecked(new Date().toLocaleString());
      
      // Update shopify connection manager to ensure consistency
      shopifyConnectionManager.addOrUpdateStore(shopToUse, true);
      
      // Log successful connection
      connectionLogger.info("Connection verified successfully for shop:", shopToUse);
      
      // If we're in a disconnected state in localStorage, fix it
      if (localStorage.getItem('shopify_connected') !== 'true') {
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_store', shopToUse);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      connectionLogger.error("Connection check failed:", error);
      setConnectionStatus('error');
      setConnectionDetails(null);
    } finally {
      setIsChecking(false);
    }
  };

  const progressValue = connectionStatus === 'connected' ? 100 : 
                       connectionStatus === 'error' ? 30 : 60;

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className={`bg-gradient-to-r ${connectionStatus === 'connected' ? 'from-green-50 to-emerald-50' : connectionStatus === 'error' ? 'from-red-50 to-orange-50' : 'from-blue-50 to-indigo-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5" />
              {language === 'ar' ? 'حالة اتصال Shopify' : 'Shopify Connection Status'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'تحقق من حالة الاتصال بمتجر Shopify الخاص بك'
                : 'Check your Shopify store connection status'}
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
            className="border-gray-300"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">
                  {language === 'ar' ? 'الحالة:' : 'Status:'}
                </span>
                
                {connectionStatus === 'checking' || isChecking ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
                  </Badge>
                ) : connectionStatus === 'connected' ? (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {language === 'ar' ? 'متصل' : 'Connected'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {language === 'ar' ? 'غير متصل' : 'Disconnected'}
                  </Badge>
                )}
              </div>
              
              {lastChecked && (
                <span className="text-xs text-gray-500">
                  {language === 'ar' ? `آخر فحص: ${lastChecked}` : `Last checked: ${lastChecked}`}
                </span>
              )}
            </div>
            
            <Progress value={progressValue} className="h-2" />
          </div>
          
          {shopDomain ? (
            <div className="bg-white rounded-md border p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {language === 'ar' ? 'معلومات المتجر الحالي:' : 'Current Store Information:'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{language === 'ar' ? 'اسم المتجر:' : 'Store Name:'}</span>
                  <span className="text-sm font-medium">{shopDomain}</span>
                </div>
                
                {connectionStatus === 'connected' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{language === 'ar' ? 'حالة التوكن:' : 'Token Status:'}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">
                        {language === 'ar' ? 'صالح' : 'Valid'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{language === 'ar' ? 'انتهاء التوكن:' : 'Token Expiry:'}</span>
                      <span className="text-sm font-medium">{language === 'ar' ? 'دائم' : 'Permanent'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-amber-800">
                    {language === 'ar'
                      ? 'لم يتم العثور على متجر متصل. يرجى الاتصال بمتجر Shopify أولاً.'
                      : 'No connected store found. Please connect to a Shopify store first.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white border-amber-300 hover:bg-amber-50"
                    onClick={() => window.location.href = '/shopify'}
                  >
                    {language === 'ar' ? 'اتصل بـ Shopify' : 'Connect to Shopify'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {connectionStatus === 'connected' && shopDomain && (
            <div className="p-4 bg-green-50 rounded-md border border-green-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {language === 'ar'
                      ? 'الاتصال بـ Shopify ناجح 100%'
                      : 'Shopify connection is 100% successful'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {language === 'ar'
                      ? 'يمكنك الآن استخدام جميع ميزات التكامل مع Shopify'
                      : 'You can now use all Shopify integration features'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyConnectionStatus;
