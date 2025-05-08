
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

const ShopifyConnectionStatus = () => {
  const { language } = useI18n();
  const { shop } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkConnection = async () => {
    if (!shop) {
      setConnectionStatus('error');
      return;
    }

    setIsChecking(true);
    setConnectionStatus('checking');

    try {
      // Call the Supabase edge function to test the Shopify connection
      const { data, error } = await supabase.functions.invoke('shopify-test-connection', {
        body: JSON.stringify({ shop })
      });

      if (error) {
        console.error('Error testing Shopify connection:', error);
        setConnectionStatus('error');
        setConnectionDetails(null);
        return;
      }

      if (data && data.success) {
        setConnectionStatus('connected');
        setConnectionDetails(data.details || {
          shopName: shop,
          validToken: true,
          tokenExpiry: 'permanent'
        });
        setLastChecked(new Date().toLocaleString());
        toast.success(language === 'ar' ? 'الاتصال بـ Shopify ناجح' : 'Shopify connection successful');
      } else {
        setConnectionStatus('error');
        setConnectionDetails(null);
        toast.error(data?.message || (language === 'ar' ? 'فشل الاتصال بـ Shopify' : 'Shopify connection failed'));
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('error');
      setConnectionDetails(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, [shop]);

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
          
          {shop ? (
            <div className="bg-white rounded-md border p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {language === 'ar' ? 'معلومات المتجر الحالي:' : 'Current Store Information:'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{language === 'ar' ? 'اسم المتجر:' : 'Store Name:'}</span>
                  <span className="text-sm font-medium">{shop}</span>
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
          
          {connectionStatus === 'connected' && shop && (
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
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                      <li>{language === 'ar' ? 'مزامنة النماذج' : 'Form synchronization'}</li>
                      <li>{language === 'ar' ? 'جلب الطلبات' : 'Order fetching'}</li>
                      <li>{language === 'ar' ? 'مزامنة المنتجات' : 'Product synchronization'}</li>
                    </ul>
                  </div>
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
