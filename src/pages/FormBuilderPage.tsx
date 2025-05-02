
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ShopifyConnectionManager } from '@/components/shopify/ShopifyConnectionManager';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms, getFormById, clearFormCache } = useFormTemplates();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // تحديد أي مكون يجب إظهاره بناءً على وجود formId
  const showEditor = !!formId && formId !== 'new';
  
  console.log("FormBuilderPage: formId =", formId, "showEditor =", showEditor, "user =", user, "shopifyConnected =", shopifyConnected);

  // التحقق من حالة المصادقة عند التحميل
  useEffect(() => {
    const checkAuth = () => {
      console.log("FormBuilderPage: Checking auth status, user:", user, "shopifyConnected:", shopifyConnected);
      
      // استعادة حالة المصادقة من sessionStorage إذا لزم الأمر
      const savedAuthState = sessionStorage.getItem('auth_state');
      if (savedAuthState) {
        try {
          const parsedState = JSON.parse(savedAuthState);
          
          // استخدم الحالة المحفوظة فقط إذا كانت حديثة (أقل من 10 دقائق)
          const stateAge = Date.now() - parsedState.timestamp;
          if (stateAge < 10 * 60 * 1000) {
            console.log("FormBuilderPage: Restoring saved auth state");
            
            // استعادة حالة اتصال shopify
            if (parsedState.shopify_store && !localStorage.getItem('shopify_store')) {
              localStorage.setItem('shopify_store', parsedState.shopify_store);
            }
            
            if (parsedState.shopify_connected && !localStorage.getItem('shopify_connected')) {
              localStorage.setItem('shopify_connected', parsedState.shopify_connected);
            }
          }
        } catch (error) {
          console.error("Error parsing saved auth state:", error);
        }
      }
      
      // إذا لم يكن المستخدم مصادقًا وغير متصل بـ Shopify، التوجيه إلى صفحة النماذج
      if (!user && !shopifyConnected) {
        console.log("FormBuilderPage: User not authenticated and not connected to Shopify, navigating to forms");
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أو الاتصال بـ Shopify للوصول إلى منشئ النماذج' : 'Please login or connect to Shopify to access form builder');
        navigate('/forms', { replace: true });
        return false;
      }
      
      return true;
    };
    
    const isAuthenticated = checkAuth();
    setAuthChecked(true);
    
    if (isAuthenticated) {
      const init = async () => {
        console.log("FormBuilderPage: Initializing with formId:", formId);
        
        // دائمًا محاولة تحديث اتصال Shopify
        if (refreshShopifyConnection) {
          console.log("FormBuilderPage: Refreshing Shopify connection");
          refreshShopifyConnection();
        }
        
        // مسح ذاكرة التخزين المؤقت للنموذج لضمان البيانات الجديدة
        if (clearFormCache) {
          console.log("FormBuilderPage: Clearing form cache");
          await clearFormCache();
        }
        
        // في حالة وضع المحرر، التحقق من وجود النموذج
        if (formId && formId !== 'new') {
          try {
            console.log("FormBuilderPage: Validating form:", formId);
            const form = await getFormById(formId);
            if (!form) {
              console.error("FormBuilderPage: Form not found");
              setFormError(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
              setTimeout(() => navigate('/forms', { replace: true }), 2000);
            } else {
              console.log("FormBuilderPage: Form validation successful:", form.id);
              setFormError(null);
            }
          } catch (err) {
            console.error("FormBuilderPage: Error validating form:", err);
            setFormError(language === 'ar' ? 'خطأ في التحقق من النموذج' : 'Error validating form');
          }
        } else {
          // في وضع لوحة التحكم أو نموذج جديد، جلب قائمة النماذج
          fetchForms();
        }
        
        // تعيين الصفحة على أنها جاهزة
        setPageReady(true);
      };
      
      init();
    }
  }, [formId, user, shopifyConnected, getFormById, navigate, language, fetchForms, refreshShopifyConnection, clearFormCache]);

  // إظهار حالة التحميل أثناء التحقق من المصادقة
  if (!authChecked) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }
  
  // المستخدم غير مصادق وغير متصل بـ Shopify
  if (!user && !shopifyConnected) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium mb-2">
            {language === 'ar' ? 'يرجى تسجيل الدخول أو الاتصال بـ Shopify للوصول إلى منشئ النماذج' : 'Please login or connect to Shopify to access the form builder'}
          </h3>
          <Button 
            onClick={() => navigate('/shopify')}
            className="mt-4 mb-2 bg-[#9b87f5] hover:bg-[#8a74e8] w-full"
          >
            {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
          </Button>
          <Button 
            onClick={() => navigate('/forms')}
            variant="outline"
            className="w-full"
          >
            {language === 'ar' ? 'العودة إلى النماذج' : 'Return to Forms'}
          </Button>
        </div>
      </div>
    );
  }

  if (!pageReady) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB] justify-center items-center">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium mb-2 text-red-600">
            {language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error Loading Form'}
          </h3>
          <p className="text-gray-700 mb-4">
            {formError}
          </p>
          <Button 
            onClick={() => navigate('/forms', { replace: true })}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            {language === 'ar' ? 'العودة إلى النماذج' : 'Return to Forms'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* تحذير اتصال Shopify - إظهار على شاشة المحرر فقط */}
      {showEditor && !shopifyConnected && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Alert className="bg-yellow-100 text-yellow-800 shadow-lg p-6 text-center m-4 border-yellow-300">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6" /> 
              <h2 className="text-xl font-bold">{language === 'ar' 
                ? 'تنبيه: الاتصال بـ Shopify مطلوب' 
                : 'Alert: Shopify Connection Required'}</h2>
            </div>
            <AlertDescription className="mb-4 text-lg">
              {language === 'ar' 
                ? 'يجب الاتصال بـ Shopify لاستخدام ميزات التكامل. يرجى النقر على الزر أدناه للاتصال.' 
                : 'Connecting to Shopify is required to use integration features. Please click the button below to connect.'}
            </AlertDescription>
            
            {/* استخدام مكون ShopifyConnectionManager الجديد */}
            <ShopifyConnectionManager variant="button" />
          </Alert>
        </div>
      )}
      
      <div className="flex-1">
        {formId === 'new' ? (
          <FormBuilderEditor key="new-form" formId="new" />
        ) : showEditor ? (
          <FormBuilderEditor key={formId} formId={formId} />
        ) : (
          <FormBuilderDashboard />
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
