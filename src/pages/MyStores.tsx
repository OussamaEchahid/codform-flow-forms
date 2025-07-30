import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Store as StoreIcon, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Power,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import AppSidebar from '@/components/layout/AppSidebar';

const MyStores = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  
  // استخدام UnifiedStoreManager كمصدر وحيد للحقيقة  
  const [activeStore, setActiveStore] = useState<string | null>(() => {
    // تحديد الحالة الأولية مباشرة من UnifiedStoreManager
    const initialStore = UnifiedStoreManager.getActiveStore();
    console.log('🎯 MyStores INITIAL - Active store:', initialStore);
    console.log('🎯 MyStores INITIAL - Is connected:', UnifiedStoreManager.isConnected());
    return initialStore;
  });
  const [loading, setLoading] = useState(false);
  
  // إضافة useEffect لمراقبة الحالة
  useEffect(() => {
    console.log('🔍 MyStores - Current state:', { activeStore, loading });
  }, [activeStore, loading]);
  
  useEffect(() => {
    console.log('🔄 MyStores useEffect - Current active store:', activeStore);
    
    // إضافة listener للتغييرات
    const handleStoreChange = (store: string | null) => {
      console.log('🔄 MyStores - Store changed to:', store);
      setActiveStore(store);
    };

    // ربط الـ listener
    const unsubscribe = UnifiedStoreManager.onStoreChange(handleStoreChange);

    // تحديث فوري للتأكد
    const currentStore = UnifiedStoreManager.getActiveStore();
    if (currentStore !== activeStore) {
      console.log('🔄 MyStores - Syncing store state:', currentStore);
      setActiveStore(currentStore);
    }

    return unsubscribe;
  }, [activeStore]);

  const handleConnectStore = async (shopDomain: string) => {
    try {
      console.log(`🔗 Connecting to store: ${shopDomain}`);
      
      // استخدام الدالة الموجودة لربط المتجر
      const authUrl = `${window.location.origin}/api/shopify-auth?shop=${shopDomain}`;
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      toast({
        title: "فشل الاتصال",
        description: `لم يتم الاتصال بـ ${shopDomain}`,
        variant: "destructive"
      });
    }
  };

  const handleSwitchStore = async (shopDomain: string) => {
    try {
      console.log(`🔄 Switching to store: ${shopDomain}`);
      
      // استخدام UnifiedStoreManager للتبديل
      UnifiedStoreManager.switchStore(shopDomain, true);
      
      toast({
        title: "جاري التبديل...",
        description: `جاري التبديل إلى ${shopDomain}`,
      });
      
    } catch (error) {
      console.error('❌ خطأ في التبديل:', error);
      toast({
        title: "خطأ في التبديل",
        description: "فشل في التبديل إلى المتجر",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectAll = () => {
    try {
      // استخدام UnifiedStoreManager لقطع الاتصال
      UnifiedStoreManager.clearActiveStore();
      
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال من جميع المتاجر",
      });
      
      // تحديث الحالة المحلية
      setActiveStore(null);
      
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const showDebugInfo = () => {
    const diagnosticInfo = UnifiedStoreManager.getDiagnosticInfo();
    console.log('🐛 Debug Info:', { 
      activeStore,
      diagnosticInfo
    });
    
    toast({
      title: "معلومات التصحيح",
      description: `تم طباعة المعلومات في وحدة التحكم. المتجر النشط: ${activeStore || 'لا يوجد'}`,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان والعودة */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى لوحة التحكم
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'متاجري' : 'My Stores'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إدارة متاجر Shopify المرتبطة بحسابك' 
                : 'Manage your connected Shopify stores'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل المتاجر...</p>
            </div>
          ) : (
            <>
              {/* الحالة الحالية */}
              <div className="mb-6">
                {activeStore ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 flex items-center justify-between">
                      <span>
                        <strong>✅ متصل بـ:</strong> {activeStore}
                        <br />
                        <small className="text-green-600">الاتصال نشط ويعمل بشكل صحيح</small>
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={showDebugInfo}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          تصحيح
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDisconnectAll}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Power className="h-3 w-3 mr-1" />
                          قطع الاتصال
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>❌ لا يوجد اتصال نشط.</strong> يرجى ربط متجر Shopify جديد.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* عرض المتجر النشط */}
              {activeStore && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <Card className="transition-all border-green-500 bg-green-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <StoreIcon className="h-5 w-5 text-blue-600" />
                        <Badge variant="default" className="bg-green-600">
                          نشط
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{activeStore}</CardTitle>
                      <CardDescription>
                        متصل ونشط الآن
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button variant="outline" disabled className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          متصل حالياً
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* إضافة متجر جديد */}
              {!activeStore && (
                <div className="text-center py-12">
                  <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">لا توجد متاجر مضافة بعد</p>
                  <Button 
                    onClick={() => navigate('/shopify')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    ربط متجر Shopify
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStores;