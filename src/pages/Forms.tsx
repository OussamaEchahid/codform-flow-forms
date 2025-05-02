
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Plus } from 'lucide-react';

const Forms = () => {
  const { user, shopifyConnected, shop, isTokenVerified, refreshShopifyConnection, forceReconnect, lastConnectionTime } = useAuth();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState('initial'); // 'initial', 'verifying', 'completed'
  
  // استخدام hook الترجمة
  const { t, language } = useI18n();
  
  // إضافة دالة إنشاء نموذج جديد
  const handleCreateNewForm = useCallback(() => {
    console.log("Navigating to new form page");
    navigate('/form-builder/new');
  }, [navigate]);
  
  // منع دورات التحقق المتكررة عن طريق تتبع الحالة
  useEffect(() => {
    console.log('Forms: Component mounted with initial state');
    console.log('Forms: Auth status -', { user, shopifyConnected, shop });
    
    // تنظيف البيانات المؤقتة لـ Shopify
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // تعيين علامة تحميل الصفحة بعد فترة قصيرة
    const timer = setTimeout(() => {
      if (loadingState === 'initial') {
        setLoadingState('verifying');
        console.log('Forms: Starting verification process');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [user, shopifyConnected, shop]);
  
  // التحقق من الاتصال مرة واحدة فقط عند بدء التشغيل
  useEffect(() => {
    // منع التنفيذ المتكرر
    if (loadingState !== 'verifying') {
      return;
    }
    
    const verifyStoreOnce = async () => {
      console.log('Forms: Performing ONE-TIME verification');
      setIsVerifying(true);
      setErrorState(null);
      
      try {
        console.log('Forms: Verifying Shopify connection with shop:', shop);
        
        // تخطي التحقق إذا لم تكن هناك متجر
        if (!shop) {
          console.log("Forms: No shop parameter provided - continuing to form list");
          setConnectionVerified(false);
          setIsVerifying(false);
          setIsPageReady(true);
          setLoadingState('completed');
          return;
        }
        
        // التحقق من وجود رمز وصول في قاعدة البيانات
        const { data: storeData, error: storeError } = await supabase
          .from('shopify_stores')
          .select('access_token, updated_at')
          .eq('shop', shop)
          .maybeSingle();
        
        if (storeError) {
          console.error('Forms: Database query error:', storeError);
          setErrorState("db_error");
        } else if (!storeData || !storeData.access_token) {
          console.log('Forms: No valid token found in database');
          setErrorState("no_token");
        } else {
          console.log('Forms: Valid token found in database');
          setConnectionVerified(true);
          
          // تحديث localStorage لتأكيد اتصال صالح
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        }
        
      } catch (error) {
        console.error('Forms: Error verifying connection:', error);
        setErrorState("connection_error");
      } finally {
        // إنهاء عملية التحقق
        setIsVerifying(false);
        setIsPageReady(true);
        setLoadingState('completed');
      }
    };
    
    verifyStoreOnce();
  }, [shop, loadingState]);
  
  // معالجة إعادة الاتصال
  const handleReconnect = () => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    // مسح بيانات الاتصال بالكامل
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    
    // إجبار المتصفح على تحديث حالة الاتصال
    setTimeout(() => {
      window.location.href = `/shopify?reconnect=form&ts=${Date.now()}`;
    }, 500);
  };
  
  // معالجة إعادة الاتصال القسري
  const handleForceReconnect = () => {
    if (!forceReconnect || isRedirecting) return;
    
    setIsRedirecting(true);
    forceReconnect();
    
    // إعادة تعيين حالة إعادة التوجيه بعد مهلة
    setTimeout(() => {
      setIsRedirecting(false);
    }, 3000);
  };
  
  // إظهار حالة التحميل
  if (loadingState !== 'completed' || isVerifying) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  // Authentication status debugging info in console
  console.log("Forms page authentication status:", {
    user: !!user,
    userDetails: user,
    shopifyConnected,
    connectionVerified,
    shop,
    errorState
  });
  
  // إظهار شاشة مشكلة الاتصال - only if no user AND no Shopify connection
  if ((!user && !shopifyConnected) || (!connectionVerified && !user && errorState === "no_token")) {
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
              <div className="space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isRedirecting}
                  onClick={handleReconnect}
                >
                  {isRedirecting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
                    </div>
                  ) : (
                    t('connectToShopifyNow')
                  )}
                </Button>
                
                {forceReconnect && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    disabled={isRedirecting}
                    onClick={handleForceReconnect}
                  >
                    {isRedirecting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                        {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('forceReconnect')}
                      </div>
                    )}
                  </Button>
                )}
              </div>
              
              {errorState && (
                <div className="mt-4 p-3 bg-red-100 rounded-md text-xs text-red-800">
                  <p>Error type: {errorState}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-2 py-1 bg-red-200 rounded text-xs"
                  >
                    Refresh page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // إضافة زر إنشاء نموذج جديد في أعلى الصفحة
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1">
        {!isTokenVerified && shopifyConnected && <ShopifyConnectionStatus />}
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'النماذج' : 'Forms'}
            </h1>
            
            {/* زر إنشاء نموذج جديد */}
            <Button 
              onClick={handleCreateNewForm} 
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </div>
          
          <FormBuilderDashboard key="form-dashboard" />
        </div>
      </div>
    </div>
  );
};

export default Forms;
