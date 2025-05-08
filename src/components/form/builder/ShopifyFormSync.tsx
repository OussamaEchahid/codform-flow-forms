
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyFormSyncProps {
  formId: string;
}

const ShopifyFormSync: React.FC<ShopifyFormSyncProps> = ({ formId }) => {
  const { language } = useI18n();
  const { shop } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const handleSync = async () => {
    if (!formId || !shop) {
      toast.error(language === 'ar' ? 'يجب حفظ النموذج أولاً' : 'Please save the form first');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      // Call the Supabase edge function to sync the form with Shopify
      const { data, error } = await supabase.functions.invoke('shopify-sync-form', {
        body: JSON.stringify({
          formId: formId,
          shop: shop
        })
      });

      if (error) {
        console.error('Error syncing form with Shopify:', error);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form');
        setSyncStatus('error');
        setIsSyncing(false);
        return;
      }

      if (data.success) {
        toast.success(language === 'ar' ? 'تم مزامنة النموذج بنجاح' : 'Form synced successfully');
        setSyncStatus('success');
        setLastSynced(new Date().toLocaleString());
      } else {
        toast.error(data.message || (language === 'ar' ? 'حدث خطأ أثناء المزامنة' : 'Error during sync'));
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Error syncing form:', error);
      toast.error(language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {language === 'ar' ? 'مزامنة Shopify' : 'Shopify Synchronization'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'مزامنة النموذج مع متجر Shopify الخاص بك'
                : 'Sync this form with your Shopify store'}
            </CardDescription>
          </div>
          
          {syncStatus === 'success' && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'تمت المزامنة' : 'Synced'}
            </Badge>
          )}
          
          {syncStatus === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'فشلت المزامنة' : 'Sync Failed'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            {shop ? (
              <p>
                {language === 'ar'
                  ? `متصل بـ: ${shop}`
                  : `Connected to: ${shop}`}
              </p>
            ) : (
              <p className="text-amber-600">
                {language === 'ar'
                  ? 'لم يتم العثور على متجر متصل'
                  : 'No connected store found'}
              </p>
            )}
            
            {lastSynced && (
              <p className="text-gray-500 mt-1">
                {language === 'ar'
                  ? `آخر مزامنة: ${lastSynced}`
                  : `Last synced: ${lastSynced}`}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleSync}
            disabled={isSyncing || !shop || !formId}
            className="w-full"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {language === 'ar' ? 'مزامنة النموذج' : 'Sync Form'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyFormSync;
