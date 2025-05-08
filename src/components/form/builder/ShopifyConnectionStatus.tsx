
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Store, Globe, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const ShopifyConnectionStatus = () => {
  const { language } = useI18n();
  const { isConnected, shopDomain, isLoading, isValidating, error, reload } = useShopifyConnection();
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkConnection = async () => {
    await reload();
    setLastChecked(new Date().toLocaleString());
  };

  const progressValue = isConnected ? 100 : error ? 30 : 60;

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className={`bg-gradient-to-r ${isConnected ? 'from-green-50 to-emerald-50' : error ? 'from-red-50 to-orange-50' : 'from-blue-50 to-indigo-50'}`}>
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
            disabled={isValidating}
            className="border-gray-300"
          >
            {isValidating ? (
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
                
                {isLoading || isValidating ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
                  </Badge>
                ) : isConnected ? (
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
                
                {isConnected && (
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
          
          {isConnected && shopDomain && (
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
