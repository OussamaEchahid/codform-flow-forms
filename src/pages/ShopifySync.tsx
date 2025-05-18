
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Store, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ShopifySync: React.FC = () => {
  const { language } = useI18n();
  const { user, shopifyConnected, shop } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [forms, setForms] = useState<any[]>([]);
  const [formCount, setFormCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const formId = queryParams.get('formId');
  const shopId = shop || localStorage.getItem('shopify_store');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // 1. Check if we have a valid shop
        if (!shopId) {
          toast.error(language === 'ar' ? 'لم يتم العثور على متجر' : 'No shop found');
          navigate('/shopify-connect');
          return;
        }
        
        // 2. Get form count for this shop
        const { data: formsData, error: formsError } = await supabase
          .from('forms')
          .select('*')
          .eq('shop_id', shopId);
          
        if (formsError) {
          console.error("Error fetching forms:", formsError);
        } else {
          setForms(formsData || []);
          setFormCount(formsData?.length || 0);
        }
        
        // 3. Get product settings count
        const { data: productsData, error: productsError } = await supabase
          .from('shopify_product_settings')
          .select('*')
          .eq('shop_id', shopId);
          
        if (productsError) {
          console.error("Error fetching product settings:", productsError);
        } else {
          setProductCount(productsData?.length || 0);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [shopId, navigate]);

  const handleSyncForms = async () => {
    if (!shopId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على متجر' : 'No shop found');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      // For each form, sync with the shop
      for (const form of forms) {
        // Call the shopify-sync-form function
        const { data, error } = await supabase.functions.invoke('shopify-sync-form', {
          body: {
            formId: form.id,
            shop: shopId
          }
        });
        
        if (error) {
          console.error(`Error syncing form ${form.id}:`, error);
          toast.error(language === 'ar' 
            ? `فشل مزامنة النموذج ${form.title}`
            : `Failed to sync form ${form.title}`);
        } else {
          console.log(`Form ${form.id} synced successfully:`, data);
        }
      }
      
      setSyncStatus('success');
      toast.success(language === 'ar' 
        ? 'تم مزامنة جميع النماذج بنجاح'
        : 'All forms synced successfully');
    } catch (error) {
      console.error("Error syncing forms:", error);
      setSyncStatus('error');
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء مزامنة النماذج'
        : 'Error syncing forms');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'ar' ? 'مزامنة Shopify' : 'Shopify Sync'}
        </h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'ar' ? 'إحصائيات المتجر' : 'Store Statistics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {language === 'ar' ? 'المتجر:' : 'Shop:'}
                      </span>
                      <span className="font-medium">{shopId || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {language === 'ar' ? 'عدد النماذج:' : 'Form Count:'}
                      </span>
                      <span className="font-medium">{formCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {language === 'ar' ? 'عدد المنتجات المرتبطة:' : 'Associated Products:'}
                      </span>
                      <span className="font-medium">{productCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'ar' ? 'مزامنة النماذج' : 'Form Synchronization'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar'
                      ? 'مزامنة النماذج الخاصة بك مع متجرك في Shopify'
                      : 'Sync your forms with your Shopify store'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    {language === 'ar'
                      ? 'سيؤدي هذا إلى مزامنة جميع النماذج الخاصة بك مع متجر Shopify الخاص بك. يمكنك بعد ذلك تعيين النماذج لمنتجات محددة.'
                      : 'This will sync all your forms with your Shopify store. You can then assign forms to specific products.'}
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    onClick={handleSyncForms} 
                    disabled={isSyncing || forms.length === 0}
                    className="w-full"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                      </>
                    ) : syncStatus === 'success' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'تمت المزامنة' : 'Synced'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'مزامنة النماذج' : 'Sync Forms'}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {forms.length === 0 && (
              <Alert variant="warning" className="mb-6">
                <AlertDescription>
                  {language === 'ar'
                    ? 'لم يتم العثور على نماذج لهذا المتجر. قم بإنشاء نماذج أولاً ثم قم بالمزامنة.'
                    : 'No forms found for this shop. Create forms first then sync them.'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => navigate('/forms')}
              >
                {language === 'ar' ? 'العودة إلى النماذج' : 'Back to Forms'}
              </Button>
              
              <Button
                onClick={() => navigate('/shopify-products')}
              >
                {language === 'ar' ? 'إدارة منتجات Shopify' : 'Manage Shopify Products'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopifySync;
