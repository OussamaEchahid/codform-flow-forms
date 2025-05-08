
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ShopifyConnectionStatus = () => {
  const { language } = useI18n();
  const { shop } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

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
        return;
      }

      if (data && data.success) {
        setConnectionStatus('connected');
        toast.success(language === 'ar' ? 'الاتصال بـ Shopify ناجح' : 'Shopify connection successful');
      } else {
        setConnectionStatus('error');
        toast.error(data?.message || (language === 'ar' ? 'فشل الاتصال بـ Shopify' : 'Shopify connection failed'));
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, [shop]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {language === 'ar' ? 'حالة اتصال Shopify' : 'Shopify Connection Status'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'تحقق من حالة الاتصال بمتجر Shopify الخاص بك'
                : 'Check your Shopify store connection status'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
          
          {shop ? (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">
                {language === 'ar' ? 'المتجر الحالي:' : 'Current Store:'}
              </p>
              <p className="text-sm font-mono">{shop}</p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-md">
              <p className="text-sm text-amber-800">
                {language === 'ar'
                  ? 'لم يتم العثور على متجر متصل. يرجى الاتصال بمتجر Shopify أولاً.'
                  : 'No connected store found. Please connect to a Shopify store first.'}
              </p>
              <Button
                size="sm"
                variant="link"
                className="p-0 mt-1"
                onClick={() => window.location.href = '/shopify'}
              >
                {language === 'ar' ? 'اتصل بـ Shopify' : 'Connect to Shopify'}
              </Button>
            </div>
          )}
          
          {connectionStatus === 'connected' && shop && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  {language === 'ar'
                    ? 'الاتصال بـ Shopify ناجح 100%'
                    : 'Shopify connection is 100% successful'}
                </p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {language === 'ar'
                  ? 'يمكنك الآن استخدام جميع ميزات التكامل مع Shopify'
                  : 'You can now use all Shopify integration features'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyConnectionStatus;
