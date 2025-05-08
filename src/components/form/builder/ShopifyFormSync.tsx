
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
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
  const [syncsCount, setSyncsCount] = useState<number>(0);

  useEffect(() => {
    // Check for last sync information in localStorage
    const storedSyncInfo = localStorage.getItem(`form_sync_${formId}`);
    if (storedSyncInfo) {
      try {
        const syncInfo = JSON.parse(storedSyncInfo);
        setLastSynced(syncInfo.lastSynced);
        setSyncsCount(syncInfo.count || 0);
        if (syncInfo.status) {
          setSyncStatus(syncInfo.status);
        }
      } catch (e) {
        console.error('Error parsing sync info:', e);
      }
    }
  }, [formId]);

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
        const newSyncsCount = syncsCount + 1;
        const currentTime = new Date().toLocaleString();
        
        // Save sync info to localStorage
        const syncInfo = {
          lastSynced: currentTime,
          count: newSyncsCount,
          status: 'success'
        };
        localStorage.setItem(`form_sync_${formId}`, JSON.stringify(syncInfo));
        
        setSyncStatus('success');
        setLastSynced(currentTime);
        setSyncsCount(newSyncsCount);
        toast.success(language === 'ar' ? 'تم مزامنة النموذج بنجاح' : 'Form synced successfully');
      } else {
        toast.error(data.message || (language === 'ar' ? 'حدث خطأ أثناء المزامنة' : 'Error during sync'));
        setSyncStatus('error');
        
        // Save error status
        localStorage.setItem(`form_sync_${formId}`, JSON.stringify({
          lastSynced: lastSynced,
          count: syncsCount,
          status: 'error'
        }));
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
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {language === 'ar' ? 'مزامنة Shopify' : 'Shopify Synchronization'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'مزامنة النموذج مع متجر Shopify الخاص بك'
                : 'Sync this form with your Shopify store'}
            </CardDescription>
          </div>
          
          {syncStatus === 'success' && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              {language === 'ar' ? 'تمت المزامنة' : 'Synced'}
            </Badge>
          )}
          
          {syncStatus === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 px-2 py-1">
              <AlertCircle className="h-3 w-3" />
              {language === 'ar' ? 'فشلت المزامنة' : 'Sync Failed'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                {shop ? (
                  <p className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {language === 'ar'
                      ? `متصل بـ: ${shop}`
                      : `Connected to: ${shop}`}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {language === 'ar'
                      ? 'لم يتم العثور على متجر متصل'
                      : 'No connected store found'}
                  </p>
                )}
                
                {lastSynced && (
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar'
                      ? `آخر مزامنة: ${lastSynced}`
                      : `Last synced: ${lastSynced}`}
                  </p>
                )}
                
                {syncsCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar'
                      ? `عدد مرات المزامنة: ${syncsCount}`
                      : `Sync count: ${syncsCount}`}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className={`text-sm font-medium ${syncStatus === 'success' ? 'text-green-600' : 'text-gray-500'}`}>
                  {syncStatus === 'success' ? (
                    language === 'ar' ? 'متزامن' : 'In sync'
                  ) : (
                    language === 'ar' ? 'غير متزامن' : 'Not synced'
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'يجب المزامنة بعد التغييرات'
                    : 'Sync needed after changes'}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSync}
            disabled={isSyncing || !shop || !formId}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : syncStatus === 'success' ? (
              <RefreshCw className="h-4 w-4 mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {language === 'ar' ? 'مزامنة النموذج' : 'Sync Form'}
          </Button>
          
          {syncStatus === 'success' && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {language === 'ar'
                      ? 'تم مزامنة النموذج بنجاح مع متجرك'
                      : 'Form successfully synced with your store'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {language === 'ar'
                      ? 'سيظهر النموذج الآن في صفحة الدفع في متجرك'
                      : 'Your form will now appear on your store checkout page'}
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

export default ShopifyFormSync;
